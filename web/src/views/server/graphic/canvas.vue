<script lang="ts" setup>
import {ref, onMounted, computed, watch, nextTick} from 'vue'
import {koneko} from "@/koneko/koneko.ts";
import KonekoInput from "@/koneko/vue/base/koneko-input.vue";
import KonekoButton from "@/koneko/vue/base/koneko-button.vue";
import KonekoSelect from "@/koneko/vue/base/koneko-select.vue";
import KonekoSelectItem from "@/koneko/vue/base/koneko-select-item.vue";
import KonekoIcon from "@/koneko/vue/icon/koneko-icon.vue";
import {Api, useApi} from "@/stores/api.ts";
import KonekoCard from "@/koneko/vue/display/koneko-card.vue";
import KonekoOption from "@/koneko/vue/base/koneko-option.vue";
import KonekoModal from "@/koneko/vue/feedback/koneko-modal.vue";
import KonekoTooltip from "@/koneko/vue/feedback/koneko-tooltip.vue";
import {useCounterStore} from "@/stores/counter.ts";
import KonekoFormItem from "@/koneko/vue/base/koneko-form-item.vue";
import KonekoUnitTitle from "@/koneko/vue/unit/koneko-unit-title.vue";

const store = useCounterStore();
const canvasPreviewRef = ref<HTMLCanvasElement>()
const canvasOverlayRef = ref<HTMLCanvasElement>()
const canvasPanel = ref<HTMLDivElement>();

const previewRef = ref<HTMLElement | null>()

const hasImage = ref(false);
const data = {
  device: {
    items: ref<koneko.ui.type.Option[]>([]),
  },
  mouse: ref({
    raw: { x: 0, y: 0 },
    client: { x: 0, y: 0 },
    hex: "",
    color: {} as koneko.graphics.Rgba,
  }),
  draw: ref({
    color: {
      box: 'rgba(255,114,200, 255)',
      axis: 'rgba(255, 255, 255, 0.7)',
    },
    down: false,
    x: 0,
    y: 0,
    box: "",
    blob: new Blob(),
    preview: "",
  }),
  color: {
    index: ref("hex"),
    items: ref<{pt: string, hex: string, rgb: string}[]>([]),
  },
}
const method = {
  getPreviewContext: () => canvasPreviewRef.value?.getContext('2d', { willReadFrequently: true }),
  getOverlayContext: () => canvasOverlayRef.value?.getContext('2d'),
  normalize: (clientX: number, clientY: number) => {
    if (!canvasPreviewRef.value) return;

    const rect = canvasPreviewRef.value.getBoundingClientRect();

    const visualX = clientX - rect.left;
    const visualY = clientY - rect.top;

    const scaleX = canvasPreviewRef.value.width / rect.width;
    const scaleY = canvasPreviewRef.value.height / rect.height;

    const rawX = Math.floor(visualX * scaleX);
    const rawY = Math.floor(visualY * scaleY);

    data.mouse.value.client = { x: clientX, y: clientY };
    data.mouse.value.raw = { x: rawX, y: rawY };

    // console.log(data.mouse.value.raw, data.mouse.value.client);
  },

  canvas: {
    clear: () => {
      if (!canvasOverlayRef.value) return;
      const overlayContext = canvasOverlayRef.value.getContext('2d');
      if (!overlayContext) return;
      overlayContext.clearRect(0, 0, canvasOverlayRef.value.width, canvasOverlayRef.value.height);
    },
    load: async(blob: Blob) => {
      hasImage.value = true;
      await nextTick();

      const img = new Image()
      img.src = URL.createObjectURL(blob);
      img.onload = () => {

        if (canvasPreviewRef.value) {
          canvasPreviewRef.value.width = img.width;
          canvasPreviewRef.value.height = img.height;

          const previewContext = canvasPreviewRef.value.getContext('2d');
          if (previewContext) {
            previewContext.clearRect(0, 0, canvasPreviewRef.value.width, canvasPreviewRef.value.height);
            previewContext.drawImage(img, 0, 0);
          }

        }

        if (canvasOverlayRef.value) {
          canvasOverlayRef.value.width = img.width;
          canvasOverlayRef.value.height = img.height;
        }

        URL.revokeObjectURL(img.src);
      };
    },
    rect: () => {
      const texture2D = method.getPreviewContext();
      if (!texture2D) return;

      const startX = data.draw.value.x;
      const startY = data.draw.value.y;
      const currentX = data.mouse.value.raw.x;
      const currentY = data.mouse.value.raw.y;

      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      if (width < 1 || height < 1) return;

      const imageData = texture2D.getImageData(x, y, width, height);

      const canvas = document.createElement("canvas");
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const canvasContext = canvas.getContext("2d");
      if (canvasContext) {
        canvasContext.putImageData(imageData, 0, 0);
      }
      canvas.toBlob((blob) => {
        if (!blob) return;
        if (data.draw.value.preview.startsWith('blob:')) URL.revokeObjectURL(data.draw.value.preview);
        data.draw.value.blob = blob;
        data.draw.value.preview = URL.createObjectURL(blob);
        data.draw.value.box = `${x},${y},${x + width},${y + height}`;
        koneko.ui.method.setclipboard(data.draw.value.box);
      }, "image/png");
    },
  },
};

const on = {
  image: {
    save: async () => {
      await koneko.ui.method.download("preview.png", data.draw.value.blob);
    },
  },
  color: {
    add: () => {
      data.color.items.value.push({
        hex: data.mouse.value.hex,
        rgb: `${data.mouse.value.color.r},${data.mouse.value.color.g},${data.mouse.value.color.b}`,
        pt: `${data.mouse.value.raw.x},${data.mouse.value.raw.y}`,
      });

      setTimeout(() => {
        koneko.ui.method.scroll(document.querySelector(".color_list"));
      }, 10);

    },
  },
  dropdown: {
    show: ref(false),
    items: computed(() => [
      {
        label: `复制 ${data.mouse.value.raw.x},${data.mouse.value.raw.y}`, click: () => {
          koneko.ui.method.setclipboard(`${data.mouse.value.raw.x},${data.mouse.value.raw.y}`);
          on.dropdown.show.value = false;
        }
      },
      {
        label: `复制 ${data.mouse.value.hex}`, click: () => {
          koneko.ui.method.setclipboard(`${data.mouse.value.hex}`);
          on.dropdown.show.value = false;
        }
      },
      {
        label: `复制 ${data.mouse.value.color.r},${data.mouse.value.color.g},${data.mouse.value.color.b}`, click: () => {
          koneko.ui.method.setclipboard(`${data.mouse.value.color.r},${data.mouse.value.color.g},${data.mouse.value.color.b}`);
          on.dropdown.show.value = false;
        }
      },
      {
        label: `加入列表`, click: () => {
          on.color.add();
          on.dropdown.show.value = false;
        },
      },
      {
        label: `保存图片`, click: () => {
          on.image.save();
          on.dropdown.show.value = false;
        },
      },
    ]),
  },
  menu: {
    fullScreen: ref(false),
    showSetting: ref(false),
    search: async () => {
      const resposne = await useApi.get<Api.ResponseList<koneko.ui.type.Option>>("/api/search", {type: store.server.graphic.canvas.device.type});
      if (Api.Response(resposne, true)) data.device.items.value = resposne.data.list;
    },
    items: [
      {
        icon: "iconfont icon-camera", desc: "截图", click: async () => {
          const response = await useApi.raw("/api/screenshot", {type: store.server.graphic.canvas.device.type, target: store.server.graphic.canvas.device.target});
          if (response.size === 0) {
            koneko.ui.message.error("截图失败");
            return;
          }
          method.canvas.load(response);
        },
      },
      {
        icon: "iconfont icon-duqu", desc: "上传", click: () => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.style.display = "none";
          input.onchange = () => {
            if (input.files && input.files[0]) {
              const file = input.files[0];
              method.canvas.load(file);
            }
          };
          input.click();
        },
      },
      {
        icon: "iconfont icon-xuanzhuan-2", desc: "顺时针旋转90°", click: () => {

          const ctx = canvasPreviewRef.value?.getContext('2d');
          if (!ctx || !canvasPreviewRef.value) return;

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvasPreviewRef.value.width;
          tempCanvas.height = canvasPreviewRef.value.height;
          tempCanvas.getContext('2d')?.drawImage(canvasPreviewRef.value, 0, 0);

          const oldWidth = canvasPreviewRef.value.width;
          const oldHeight = canvasPreviewRef.value.height;

          canvasPreviewRef.value.width = oldHeight;
          canvasPreviewRef.value.height = oldWidth;

          if (canvasOverlayRef.value) {
            canvasOverlayRef.value.width = oldHeight;
            canvasOverlayRef.value.height = oldWidth;
          }

          ctx.clearRect(0, 0, canvasPreviewRef.value.width, canvasPreviewRef.value.height);
          ctx.translate(canvasPreviewRef.value.width / 2, canvasPreviewRef.value.height / 2);
          ctx.rotate(90 * Math.PI / 180);
          ctx.drawImage(tempCanvas, -oldWidth / 2, -oldHeight / 2);

          ctx.setTransform(1, 0, 0, 1, 0, 0);
        },
      },
      {
        icon: "iconfont icon-quanping", desc: "全屏", click: () => {
          on.menu.fullScreen.value = !on.menu.fullScreen.value
        }
      },
      {
        icon: "iconfont icon-shezhi1", desc: "设备配置", click: () => {
          on.menu.showSetting.value = true;
        }
      },
    ],
  },
}

onMounted(() => {
  if (!canvasOverlayRef.value) return;

  canvasOverlayRef.value.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    method.normalize(e.clientX, e.clientY);
    on.dropdown.show.value = true;
  });
  canvasOverlayRef.value.addEventListener('mousemove', (e) => {
    on.dropdown.show.value = false;
    method.canvas.clear();

    method.normalize(e.clientX, e.clientY);

    if (!canvasPreviewRef.value || !canvasOverlayRef.value || !canvasPanel.value) return;

    const raw = {x: data.mouse.value.raw.x, y: data.mouse.value.raw.y};

    if (raw.x < 0 || raw.y < 0 || raw.x >= canvasPreviewRef.value.width || raw.y >= canvasPreviewRef.value.height) {
      canvasPanel.value.style.display = "none";
      return;
    }

    const texture2D = method.getPreviewContext();
    if (!texture2D) return;

    const size = { width: 15, height: 15 };
    const scale = { width: 10, height: 10 };
    const center = { x: Math.floor(size.width / 2), y: Math.floor(size.height / 2) };
    const index = (center.y * size.width + center.x) * 4;

    const pt = texture2D.getImageData(raw.x - Math.floor(size.width / 2), raw.y - Math.floor(size.height / 2), size.width, size.height).data;

    data.mouse.value.color = {r: pt[index], g: pt[index + 1], b: pt[index + 2], a: pt[index + 3]} as koneko.graphics.Rgba;
    data.mouse.value.hex = koneko.graphics.color.RgbaToHex(data.mouse.value.color).slice(0, -2);

    const imageData = new ImageData(new Uint8ClampedArray(pt), size.width, size.height);

    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = size.width;
    sourceCanvas.height = size.height;
    sourceCanvas.getContext("2d")?.putImageData(imageData, 0, 0);

    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = size.width * scale.width;
    previewCanvas.height = size.height * scale.height;
    const previewContext = previewCanvas.getContext("2d");

    if (previewContext) {
      previewContext.imageSmoothingEnabled = false; // 像素化

      previewContext.drawImage(sourceCanvas, 0, 0, size.width * scale.width, size.height * scale.height);

      // preview grid
      {
        previewContext.beginPath();
        previewContext.strokeStyle = "rgba(255, 255, 255, 0.2)";
        previewContext.lineWidth = 1;
        for (let i = 0; i <= size.width; i++) {
          const x = i * scale.width;
          previewContext.moveTo(x, 0);
          previewContext.lineTo(x, previewCanvas.height);
        }
        for (let i = 0; i <= size.height; i++) {
          const y = i * scale.height;
          previewContext.moveTo(0, y);
          previewContext.lineTo(previewCanvas.width, y);
        }
        previewContext.stroke();
        const centerX = Math.floor(size.width / 2) * scale.width;
        const centerY = Math.floor(size.height / 2) * scale.height;
        previewContext.strokeStyle = data.draw.value.color.box;
        previewContext.lineWidth = 2;
        previewContext.strokeRect(centerX, centerY, scale.width, scale.height);
      }

      // preview info
      {
        previewContext.fillStyle = "rgba(0,0,0,0.6)";
        previewContext.fillRect(0, previewCanvas.height - 20, previewCanvas.width, 20);
        previewContext.fillStyle = "white";
        previewContext.textBaseline = "top";
        previewContext.font = "12px monospace";
        previewContext.fillText(`x:${data.mouse.value.raw.x}, y:${data.mouse.value.raw.y} ${data.mouse.value.hex}`, 5, previewCanvas.height - 15);
      }

      canvasPanel.value.innerHTML = "";
      canvasPanel.value.appendChild(previewCanvas);
      canvasPanel.value.style.left = `${data.mouse.value.client.x + 20}px`;
      canvasPanel.value.style.top = `${data.mouse.value.client.y + 20}px`;
      canvasPanel.value.style.display = "block";
    }


    // grid axis
    const overlayContext = method.getOverlayContext();
    if (overlayContext) {
      overlayContext.save();
      const mouseX = Math.round(data.mouse.value.raw.x) + 0.5;
      const mouseY = Math.round(data.mouse.value.raw.y) + 0.5;

      overlayContext.setLineDash([5, 5]);
      overlayContext.strokeStyle = data.draw.value.color.axis;
      overlayContext.lineWidth = 1;

      overlayContext.beginPath();

      overlayContext.moveTo(0, mouseY);
      overlayContext.lineTo(canvasOverlayRef.value.width, mouseY);
      overlayContext.moveTo(mouseX, 0);
      overlayContext.lineTo(mouseX, canvasOverlayRef.value.height);

      overlayContext.stroke();

      overlayContext.restore();
    }


    if (data.draw.value.down) {
      const overlayContext = method.getOverlayContext();
      if (overlayContext) {
        overlayContext.strokeStyle = data.draw.value.color.box;
        overlayContext.lineWidth = 2;
        overlayContext.strokeRect(data.draw.value.x, data.draw.value.y, data.mouse.value.raw.x - data.draw.value.x, data.mouse.value.raw.y - data.draw.value.y);
      }
    }
  });
  canvasOverlayRef.value.addEventListener('mouseleave', (e: MouseEvent) => {
    if (canvasPanel.value) canvasPanel.value.style.display = "none";
    data.draw.value.down = false;
    method.canvas.clear();
  })
  canvasOverlayRef.value.addEventListener('mousedown', (e) => {
    method.normalize(e.clientX, e.clientY);
    data.draw.value.down = true;
    data.draw.value.x = data.mouse.value.raw.x;
    data.draw.value.y = data.mouse.value.raw.y;
  });
  canvasOverlayRef.value.addEventListener('mouseup', () => {
    if (data.draw.value.down) {
      data.draw.value.down = false;
      method.canvas.rect();
    }
  })
  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowUp':    useApi.post("/api/key", {x: 0, y: -1}); break
      case 'ArrowDown':  useApi.post("/api/key", {x: 0, y: 1}); break
      case 'ArrowLeft':  useApi.post("/api/key", {x: -1, y: 0}); break
      case 'ArrowRight': useApi.post("/api/key", {x: 1, y: 0}); break
      case 'Enter': { on.color.add(); return; }
    }
  })
});

watch(() => store.server.graphic.canvas.device.target, (value) => {
  document.title = `koneko - ${value}`;
}, {immediate: true});
</script>

<template>
  <koneko-card class="layout" :id="on.menu.fullScreen.value ? 'koneko-full-screen' : null">
    <div class="menu">
      <koneko-tooltip v-for="item in on.menu.items" class="item" @click="item.click()" placement="right">
        <div class="icon"><i :class="item.icon"/></div>
        <template #content>
          {{item.desc}}
        </template>
      </koneko-tooltip>

    </div>


    <div class="canvas" ref="previewRef">
      <canvas ref="canvasPreviewRef" v-show="hasImage"/>
      <canvas ref="canvasOverlayRef" class="overlay" v-show="hasImage"/>

      <div v-if="!hasImage" class="doc-layer">
        <koneko-unit-title title="文档"/>
        <h4>android: 使用前自己设置好adb环境变量</h4>
        <h4>鼠标左键: 选框并复制区域</h4>
        <h4>鼠标右键: 选框并复制区域并弹出操作列表</h4>
        <h4>↑↓←→: 移动1像素</h4>
        <h4>enter: 加入color列表</h4>
        <h4>图片保存位置: screenshot/index</h4>
      </div>
    </div>

    <div class="graphics koneko--size-small">
      <div class="image_content">
        <img class="preview" :src="data.draw.value.preview" alt="">
        <div class="operation">
          <koneko-button class="operation_button" type="primary" @click="on.image.save()">保存</koneko-button>
          <koneko-input class="rect" v-model="data.draw.value.box"/>
        </div>
      </div>

      <div class="color_content">
        <div class="operation">
          <koneko-button class="operation_button" type="primary" @click="data.color.items.value = []">清空</koneko-button>
          <koneko-select class="operation_select" v-model="data.color.index.value" hidden-icon>
            <koneko-select-item v-for="item in ['hex', 'rgb']" :label="item" :value="item"/>
          </koneko-select>
        </div>
        <div class="color_list">
          <div class="item" v-for="(item, index) in data.color.items.value"  >
            <div class="box" :style="{'background-color': item.hex}"/>
            <koneko-input class="hex" v-if="data.color.index.value === 'hex'" v-model="item.hex"/>
            <koneko-input class="rgb" v-if="data.color.index.value === 'rgb'" v-model="item.rgb"/>
            <koneko-input class="point"  v-model="item.pt"  style="width: 80px;"/>
            <koneko-icon class="icon" @click="data.color.items.value.splice(index, 1)"><i class="iconfont icon-shanchu"/></koneko-icon>
          </div>
        </div>
      </div>

    </div>


    <teleport to="body">
      <div class="popup_color" ref="canvasPanel"/>
    </teleport>
    <teleport to="body">
      <ul class="popup_dropdown koneko-ul" :style="{left: `${data.mouse.value.client.x}px`, top: `${data.mouse.value.client.y}px`}"
          v-if="on.dropdown.show.value"
      ><koneko-option v-for="item in on.dropdown.items.value" @click="item.click()">{{item.label}}</koneko-option></ul>
    </teleport>

    <koneko-modal class="popup_device_config" v-model="on.menu.showSetting.value">
      <template #title>配置</template>

      <koneko-form-item label="环境">
        <div class="search">
          <koneko-select v-model="store.server.graphic.canvas.device.type">
            <koneko-select-item v-for="item in store.server.graphic.canvas.device.options" :value="item.value" :label="item.label"/>
          </koneko-select>
          <koneko-button type="primary" @click="on.menu.search()">搜索</koneko-button>
        </div>
      </koneko-form-item>

      <koneko-form-item label="目标">
        <koneko-input class="target" v-model="store.server.graphic.canvas.device.target"/>
      </koneko-form-item>

      <ul class="device_list">
        <koneko-option v-for="item in data.device.items.value" @click="store.server.graphic.canvas.device.target = item.value as string">{{item.label}}</koneko-option>
      </ul>
    </koneko-modal>
  </koneko-card>
</template>

<style scoped lang="scss">
.popup_color {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  border: 1px solid #000;
  line-height: 0;
}
.popup_dropdown {
  position: fixed;
  z-index: 10000;
  margin: 0;
  padding: 4px 0;
  background-color: var(--koneko-background-color);

  > * {
    padding: 0 8px;
  }
  border: var(--koneko-border);
}
.popup_device_config {
  .search {
    display: flex;
    align-items: center;
    width: 100%;

    .koneko-select {
      margin-right: 8px;
    }
  }

  .device_list {
    margin: 0;
    padding: 0;
    list-style: none;
    height: 280px;
    overflow: auto;

    :not(:last-child) {
      margin-bottom: 4px;
    }
  }
}

.layout {
  display: flex;
  overflow: hidden;

  width: 100%;
  height: 100%;

  .menu {
    .item {
      display: flex;
      align-items: center;
      margin-right: 8px;

      &:not(&:last-child) {
        margin-bottom: 4px;
      }

      .icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--koneko-fill-color);
        background-color: var(--koneko-fill-background-color);
        border-radius: var(--koneko-border-radius);
        cursor: pointer;
        transition: var(--koneko-transition-color);
        &:hover {
          color: var(--koneko-color-primary);
        }
      }


    }
  }

  .canvas {
    position: relative;
    display: block;
    line-height: 0;
    overflow: auto;

    .koneko-empty {
      width: 640px;
      height: 320px;
    }
    canvas {
      display: block;
    }
    .overlay {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 10;
    }
  }

  .graphics {
    --margin-right: 4px;
    --width: 240px;
    width: var(--width);
    margin-left: 16px;

    .image_content {
      display: flex;
      flex-direction: column;
      .preview {
        margin-bottom: 4px;
        width: var(--width);
        height: var(--width);
        object-fit: contain;
        border: var(--koneko-border);
        box-sizing: border-box;

        background-image: linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc),
        linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc);
        background-size: 16px 16px;
        background-position: 0 0, 8px 8px;

        &::before {
          content: "";
          display: block;
          width: 100%;
          height: 100%;
          background-color: transparent;
        }
      }
      .operation {
        display: flex;
        margin-bottom: var(--margin-right);
        .koneko-button {
          margin-right: var(--margin-right);
        }
      }
    }

    .color_content {
      .operation {
        display: flex;
        margin-bottom: var(--margin-right);
        .koneko-button {
          margin-right: var(--margin-right);
        }
      }
      .color_list {
        height: 280px;
        overflow-y: auto;

        .item {
          display: flex;

          :not(:last-child) {
            margin-bottom: 4px;
          }

          .box {
            width: 24px;
            height: 24px;
            margin-right: var(--margin-right);
            flex-shrink: 0;
            border: var(--koneko-border);
          }
          .hex, .rgb {
            width: 100px;
            margin-right: var(--margin-right);
          }
          .point {
            width: 80px;
            margin-right: var(--margin-right);
          }

          .icon {
            color: var(--koneko-fill-color);
            :hover {
              transition: all .3s;
              color: var(--koneko-color-primary);
            }
          }

        }
      }
    }
  }

}

.color-box {
  width: 20px;
  height: 20px;

  margin-bottom: 4px;
}
</style>
