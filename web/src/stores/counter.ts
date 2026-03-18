import {defineStore} from 'pinia'
import {koneko} from "@/koneko/koneko.ts";
import {ref} from "vue";

export const useCounterStore = defineStore('counter', () => {
    const meta = ref({
        logo: {icon: '/favicon.ico', title: 'Koneko Cabin'},
    });
    const theme = ref({
        value: 'light' as 'light' | 'dark',
        color: koneko.ui.manager.k_colors[0] as string,
        items: koneko.ui.manager.k_colors,
        switch: () => {
            theme.value.value = theme.value.value === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme.value.value);
        },
    });
    const server = ref({
        menu: {
            width: 200,
            logo: {icon: meta.value.logo.icon, title: meta.value.logo.title},
        },
        graphic: {
            canvas: {
                device: {
                    type: 0,
                    target: "127.0.0.1:5555",
                    options: [
                        {value: 0, label : 'android adb',},
                        {value: 1, label : 'windows hwnd',},
                        {value: 2, label : 'windows vmware'},
                    ],
                },
            },
        },
    });

    return {meta, theme, server}
});
