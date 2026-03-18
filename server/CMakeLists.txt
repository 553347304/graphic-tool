cmake_minimum_required(VERSION 3.20)

project(server CXX C)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_BUILD_TYPE Release)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY_RELEASE ${CMAKE_BINARY_DIR}/../bin)

set(DIR "F:/utils")
include("${DIR}/script/koneko.cmake")

set(APP_NAME "graphic-tool")

add_compile_options(/utf-8)

file(GLOB ADD_EXECUTABLE
        ${DIR}/cpp/koneko/koneko.cpp
        ${DIR}/cpp/koneko/opencv.cpp
#        ${DIR}/packages/common/miniz.c
)
add_executable(${APP_NAME} WIN32 ${ADD_EXECUTABLE} main.cpp "${DIR}/script/rc/resource.rc")
target_include_directories(${APP_NAME} PRIVATE
        ${DIR}/cpp
        ${DIR}/packages/common
        ${DIR}/packages/opencv/include
        ${DIR}/packages/libvncserver/include
)
target_link_directories(${APP_NAME} PRIVATE
        ${DIR}/packages/opencv/libs/lib
        ${DIR}/packages/libvncserver/lib
)
target_link_libraries(${APP_NAME} PRIVATE
        opencv_world4100.lib
        vncclient.lib
)

target_precompile_headers(${APP_NAME} PRIVATE
        <string>
        <vector>
        <thread>
        <functional>

        <nlohmann/json.hpp>

)

koneko_set_minimize(${APP_NAME})
koneko_embed(${APP_NAME} ${CMAKE_CURRENT_SOURCE_DIR}/assets)