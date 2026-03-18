import axios, {type AxiosRequestConfig} from "axios";
import {koneko} from "@/koneko/koneko.ts";

const conn = axios.create({baseURL: "", timeout: 100000});
conn.interceptors.request.use((config) => {
    return config;
})
conn.interceptors.response.use((response) => {
    if (response.status !== 200) {
        console.log("请求错误", response.status)
        koneko.ui.message.error(response.statusText);
        return Promise.reject(response.statusText);
    }
    return response;
}, (err) => {
    koneko.ui.message.error(err.message);
    return Promise.reject(err.message)
});

class api {
    public get = async <T>(url: string, params?: any, config?: AxiosRequestConfig): Promise<Api.Response<T>> => {
        const response = await conn.get(url, {params, ...config})
        return response.data;
    }
    public post = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<Api.Response<T>> => {
        const response = await conn.post(url, data, config)
        return response.data;
    }
    public put = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<Api.Response<T>> => {
        const response = await conn.put(url, data, config)
        return response.data;
    }
    public delete = async <T>(url: string, config?: AxiosRequestConfig): Promise<Api.Response<T>> => {
        const response = await conn.delete(url, config)
        return response.data;
    }
    public raw = async (url: string, params?: any, config?: AxiosRequestConfig): Promise<Blob> => {
        const response = await conn.get(url, {params, ...config, responseType: 'blob'})
        return response.data;
    }
}

export const useApi = new api();

export namespace Api {
    export interface Response<T = any> {
        code: number
        message: string
        data: T
    }

    export interface ResponseList<T = any> {
        total: number
        list: T[]
    }

    export interface PageInfo {
        search: string
        page: number
        limit: number
        sort: string

        [key: string]: any
    }

    export interface BaseID {
        id?: number
        ids?: number[]
    }

    export const Response = (response: Response, is?: boolean): boolean => {
        if (response.code === 0) {
            if (is) koneko.ui.message.success(response.message);
            return true;
        }
        koneko.ui.message.error(response.message);
        return false;
    }
    export const ResponseList = <T>(): ResponseList<T> => ({total: 0, list: []})
    export const PageInfo = (): PageInfo => ({
        search: "",
        page: 1,
        limit: 20,
        sort: "",
    });
}





