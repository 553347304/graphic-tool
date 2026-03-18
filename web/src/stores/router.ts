import {createRouter, createWebHistory, type RouteMeta, type RouteRecordRaw} from 'vue-router'
import {koneko} from "@/koneko/koneko.ts";

declare module 'vue-router' {
  interface RouteMeta {
    name: string
    icon?: string
  }
}

const modules = import.meta.glob('../views/**/*.vue');
const route = (name: string, meta: RouteMeta): RouteRecordRaw => {
  const rawPath = name.split('/').filter(value => value !== '');
  const path = rawPath[rawPath.length - 1] as string;
  const component = `../views${name}.vue`;
  return {path: path, name: name, component: modules[component], meta: meta} as RouteRecordRaw;
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/", name: "/",
      component: () => import("@/views/index.vue"),
      children: [
        // {path: 'main', name: '/main', component: () => import('@/views/main.vue'), meta: {name: '主要', icon: "iconfont icon-shouye"},},
      ]
    },
    {
      path: "/server", name: "/server", component: () => import("@/views/server/index.vue"), meta: {name: '服务'},
      children: [
        {
          path: 'graphic', name: '/server/graphic', redirect: {name: "/server/graphic/canvas"},
          meta: {name: '图色', icon: "iconfont icon-icon_tuxinggongju-danshebeixiugai"},
          children: [
            route('/server/graphic/canvas', {name: '画布'}),
          ],
        },
        {
          path: 'system', name: '/server/system', redirect: {name: '/server/system/config'},
          meta: {name: '系统', icon: "iconfont icon-shezhi1"},
          children: [
            route('/server/system/config', {name: '配置'}),
            {
              path: 'preview', name: '/server/system/preview', redirect: {name: '/server/system/preview/base'},
              meta: {name: '组件'},
              children: [
                route('/server/system/preview/base', {name: '通用'}),
                route('/server/system/preview/display', {name: '展示'}),
                route('/server/system/preview/feedback', {name: '反馈'}),
                route('/server/system/preview/layout', {name: '布局'}),
                route('/server/system/preview/navigation', {name: '导航'}),
              ],
            },
          ],
        },
      ]
    },
  ]
})

export default router

router.beforeEach(async (to, from, next) => {
  koneko.ui.progress.start();
  next();
});

router.afterEach(() => {
  koneko.ui.progress.done();
});

