#include "koneko/manager.hpp"

#include <nlohmann/json.hpp>
#include <opencv2/opencv.hpp>

using json = nlohmann::json;

koneko::logger::Logger l;

struct DeviceType { enum {AndroidAdb, WindowsHwnd, WindowsVmware,}; };
struct Option {
    std::string value;
    std::string label;
    NLOHMANN_DEFINE_TYPE_INTRUSIVE_WITH_DEFAULT(Option, value, label)
};

const int g_port = 15000;

#include <assets.h>
int main() {
    SetConsoleCP(CP_UTF8);
    SetConsoleOutputCP(CP_UTF8);
    std::locale::global(std::locale("en_US.UTF-8"));
    koneko::system::SetDpi(koneko::system::GetSelfPath());

    koneko::net::http::Router router;
    router.onerror([](const std::string &error) {
        l.Print({ koneko::logger::Level::Error, koneko::time::Now().DateTime(), "server", error });
    });
    router.Use([](const koneko::net::http::Request& req, koneko::net::http::Response& res) {
        // for (auto header : req.headers) printf(stdout, "%s: %s\n", header.first.c_str(), header.second.c_str());
        std::string path = req.path + (req.params.empty() ? "" : "?" + req.params.ToString());
        l.Print({ koneko::logger::Level::Debug, koneko::time::Now().DateTime(), "server", koneko::sprintf("%s\t%s\t%s\t%s", req.method.c_str(), req.get_addr().c_str(), path.c_str(), req.body.c_str()) });
    });
    router.Post("/api/key", [](const koneko::net::http::Request& req, koneko::net::http::Response& res) {
        json j =  json::parse(req.body);
        double px = j["x"];
        double py = j["y"];
        if (px == 0 && py == 0) return;
        POINT pos = {0, 0};
        if (GetCursorPos(&pos)) SetCursorPos(pos.x + px, pos.y + py);
        res.Success();
    });
    router.Get("/api/search", [](const koneko::net::http::Request& req, koneko::net::http::Response& res) {
        int type = std::stoi(req.params.Get("type"));

        std::vector<Option> options;
        if (type == DeviceType::AndroidAdb) {
            std::string shell = koneko::iconv::String(koneko::system::Shell("adb devices")).Trim();
            auto items = koneko::method::Split(shell, "\n");

            for (int i = 0; i < items.size(); ++i) {
                char addr[64];
                if (sscanf(items[i].c_str(), "%s\tdevice", addr) == 1) {
                    if (i == 0) continue;
                    options.push_back({std::string(addr), std::string(addr)});
                }
            }
        }
        if (type == DeviceType::WindowsHwnd) {
            auto windows = koneko::system::GetWindows();
            for (auto window : windows) {
                l.Info(window.ToString());
                options.push_back({koneko::sprintf("0x%08X", window.hwnd), window.ToString()});
            }
        }
        if (type == DeviceType::WindowsVmware) {
            std::string host = "127.0.0.1";
            auto shell = koneko::iconv::String(koneko::system::Shell("netstat -ano | findstr LISTENING")).Utf8().Trim();
            auto items = koneko::method::Split(shell, "\n");
            for (auto item : items) {
                char value[256] = {0};
                if (sscanf(item.c_str(), "%*s %s", value) == 1) {
                    std::string addr(value);
                    size_t pos = addr.rfind(':');

                    if (pos != std::string::npos) {
                        int port = std::stoi(addr.substr(pos + 1));
                        std::string response = koneko::net::ProbePort(host, port);
                        if (response.find("RFB ") != std::string::npos) {

                            std::string address = host + ":" + std::to_string(port);
                            if (std::none_of(options.begin(), options.end(), [&](const Option& opt){ return opt.value == address; }))
                                options.push_back({address, address});

                        }
                    }
                }
            }
        }

        res.Success("ok", json{{"list", options}}.dump());
    });
    router.Get("/api/screenshot", [](const koneko::net::http::Request& req, koneko::net::http::Response& res) {
        int type = std::stoi(req.params.Get("type"));
        std::string target = req.params.Get("target");

        koneko::os::Mkdir("screenshot/"+ std::to_string(type));
        std::string save = "screenshot/"+ std::to_string(type) + "/" + koneko::time::Now().FileNameTimestamp() + ".png";

        l.Info(koneko::sprintf("%d %s %s", type, target.c_str(), save.c_str()));

        cv::Mat mat = {};
        std::vector<Option> options;
        if (type == DeviceType::AndroidAdb) {
            auto data = koneko::system::Shell(koneko::sprintf("adb.exe -s %s exec-out screencap -p", target.c_str()));
            mat = cv::imdecode(data, cv::IMREAD_COLOR);
        }
        if (type == DeviceType::WindowsHwnd) {
            auto hwnd = std::stoull(target, nullptr, 16);
            auto bitmap = koneko::graphics::image::Screenshot((HWND)(uintptr_t)hwnd);
            if (!bitmap.bits.empty()) mat = cv::Mat(bitmap.height, bitmap.width, CV_8UC4, bitmap.bits.data()).clone();
        }
        if (type == DeviceType::WindowsVmware) {
            Vncviewer vncviewer;
            if (vncviewer.connect(target)) {
                auto bitmap = vncviewer.Screenshot();
                if (!bitmap.bits.empty()) mat = cv::Mat(bitmap.height, bitmap.width, CV_8UC4, bitmap.bits.data()).clone();
                vncviewer.close();
            }
        }

        if (mat.empty()) {
            res.Write("", "image/png", 200);
            return;
        }

        if (mat.channels() == 4) cv::cvtColor(mat, mat, cv::COLOR_RGBA2BGR);
        std::vector<uchar> buffer;
        cv::imencode(".png", mat, buffer, {cv::IMWRITE_PNG_COMPRESSION, 0});
        std::thread([&]() { cv::imwrite(save, mat); }).detach();
        res.Write(reinterpret_cast<const char*>(buffer.data()), static_cast<int>(buffer.size()), "image/png", 200);
    });
    router.Load([](const char* key) -> koneko::Byte { auto v = assets::get(key); return { v.data, v.size }; });

    std::thread([&]() {
        for (auto webview : std::vector<std::string> {
            "C:/Program Files/Google/Chrome/Application/chrome.exe",	"C:/Program Files (x86)/Google/Google/Chrome/Application/chrome.exe",
            "C:/Program Files/Microsoft/Edge/Application/msedge.exe",	"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
        }) {
            if (!koneko::os::Exist(webview)) continue;
            koneko::system::Launch(koneko::sprintf(R"("%s" --app=http://127.0.0.1:%d/server/graphic)", webview.c_str(), g_port)+" --window-size=1280,720 --user-data-dir=koneko/graphic");
            router.Close();
            return;
        }
        koneko::system::Launch("http://127.0.0.1:" + std::to_string(g_port));
    }).detach();
    router.Listen("::", g_port);

    return 0;
}
