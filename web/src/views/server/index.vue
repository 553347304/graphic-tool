<script setup lang="ts">
import KonekoMenu from "@/koneko/vue/navigation/koneko-menu.vue";

import router from "@/stores/router.ts";
import {useCounterStore} from "@/stores/counter.ts";
import {ref, watch} from "vue";
import {type RouteRecordRaw, useRoute} from "vue-router";
import KonekoBreadcrumbItem from "@/koneko/vue/navigation/koneko-breadcrumb-item.vue";
import KonekoBreadcrumb from "@/koneko/vue/navigation/koneko-breadcrumb.vue";
import MenuNode from "@/views/components/menu-node.vue";

const route = useRoute();
const store = useCounterStore();

const menuList = router.options.routes[1]?.children as RouteRecordRaw[];
const menuIndex = ref(String(route.name));
watch(() => route.name, (item) => {
  menuIndex.value = String(item);
  router.push({name: menuIndex.value});
}, {immediate: true});

</script>

<template>
  <div class="app-layout">
    <aside>
      <koneko-menu v-model="menuIndex" v-model:width="store.server.menu.width">
        <template #header>
          <div class="logo">
            <div class="icon"><img :src="store.server.menu.logo.icon" alt=""></div>
            <span class="title">{{ store.server.menu.logo.title }}</span>
          </div>
        </template>
        <menu-node v-for="item in menuList" :item="item"></menu-node>
      </koneko-menu>
    </aside>
    <div class="app-main">
      <header>
        <koneko-breadcrumb>
          <koneko-breadcrumb-item v-for="item in route.matched" @click="router.push({name: item.name})">{{ item.meta.name }}</koneko-breadcrumb-item>
        </koneko-breadcrumb>
      </header>
      <main><router-view/></main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--koneko-background-color);

  aside {
    border-right: var(--koneko-border);
    box-sizing: border-box;

    .koneko-menu {
      height: 100%;

      .logo {
        display: flex;
        align-items: center;
        cursor: pointer;

        .icon {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          margin-right: 8px;
        }
        .title {
          color: var(--koneko-color-primary);
          font-size: 18px;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }

      }
    }
  }

  .app-main {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    width: 100%;
    height: 100%;

    header {
      padding: 0 20px;
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    main {
      min-width: 0;
      min-height: 0;
      margin: 0 20px 20px 20px;
      flex: 1;
    }
  }
}
</style>