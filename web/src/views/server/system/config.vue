<script setup lang="ts">
import KonekoCard from "@/koneko/vue/display/koneko-card.vue";
import KonekoColorPicker from "@/koneko/vue/base/koneko-color-picker.vue";
import {useCounterStore} from "@/stores/counter.ts";
import KonekoFormItem from "@/koneko/vue/base/koneko-form-item.vue";
import KonekoIcon from "@/koneko/vue/icon/koneko-icon.vue";

const store = useCounterStore();
</script>

<template>
  <koneko-card>
    <koneko-form-item label="主题色">
      <koneko-color-picker v-model="store.theme.color" :presets="store.theme.items"/>
      <koneko-icon><i class="iconfont icon-zhutiqiehuan" @click="store.theme.switch()"/></koneko-icon>
    </koneko-form-item>
  </koneko-card>
</template>

<style scoped lang="scss">
.view_base {
  overflow-y: auto;

  .koneko-tabs-item {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 32px;
      color: var(--koneko-text-color);

      .koneko-input-number {
        width: 240px;
      }

      .colors {
        display: flex;
        gap: 10px;
      }
    }
  }
}
</style>