import '@/koneko/assets/style.css'

import './assets/main.css';
import './assets/iconfont.css';

import {createApp} from 'vue'
import {createPinia} from 'pinia'

import App from './App.vue'
import router from "./stores/router.ts";
import {useCounterStore} from "@/stores/counter.ts";
import {koneko} from "@/koneko/koneko.ts";


const pinia = createPinia();

koneko.ui.manager.usePersistent(useCounterStore(pinia),"koneko_counter", [
    'theme.value', 'theme.color',
    'server.menu.width',
    'server.graphic.canvas.device.type',
    'server.graphic.canvas.device.target',
], (state) => {
    const color = koneko.graphics.color.HexToRgba(state.theme.color);
    document.documentElement.style.setProperty("--koneko-color-primary-rgb", `${color.r},${color.g},${color.b}`);
    document.documentElement.setAttribute('koneko-theme', state.theme.value);
});


const app = createApp(App)
app.use(pinia)
app.use(router)

app.mount('#app');



