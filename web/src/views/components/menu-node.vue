<script setup lang="ts" generic="T">
import KonekoMenuSub from "@/koneko/vue/navigation/koneko-menu-sub.vue";
import KonekoMenuItem from "@/koneko/vue/navigation/koneko-menu-item.vue";
import type {RouteRecordRaw} from "vue-router";
import router from "@/stores/router.ts";
const props = withDefaults(defineProps<{
  item: RouteRecordRaw
  depth?: number
}>(), {
  depth: 0,
});
</script>
<template>
  <koneko-menu-sub :value="item.name as string" v-if="item.children">
    <template #icon><i :class="item.meta?.icon"/></template>
    <template #title>{{item.meta?.name}}</template>
    <MenuNode v-for="child in item.children" :key="child.name" :item="child" :depth="depth + 1"/>
  </koneko-menu-sub>
  <koneko-menu-item :value="item.name as string" @click="router.push({name: item.name})" v-else>
    <template #icon><i :class="item.meta?.icon"/></template>
    <span class="title">{{item.meta?.name}}</span>
  </koneko-menu-item>
</template>

<style scoped lang="scss">
</style>