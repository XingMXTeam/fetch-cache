import { useRequest, useCreation } from 'ahooks';
import { useRef } from 'react';
import { Plugin } from 'ahooks/lib/useRequest/src/types'
import { del } from 'idb-keyval'

export const getEnvKey = (key: string) => {
    return `$$-${key}`
}

const getMenu = async () => {
    return []
}

/**
 * SWR：避免影响交互的关键事件
 * 保鲜时间，如果在这个时间段内，认为数据是最新的，不会重新发起请求
 */


export const createCacheAsyncPlugin = (options) => {
    const { adapter, getCacheKey, timeout } = options
    const justFirstTimeRef = useRef(false)
    const cacheKeys = useRef([])
    return useCreation(() => {
        const requestPlugin = (fetch) => {
            return {
                onRequest(server) {
                    if(justFirstTimeRef.current) {
                        return {}
                    }
                    justFirstTimeRef.current = true
                    const servicePromise = wrapLocalStorageCache(server, {
                        getCacheKey: (...payload) => {
                            const cacheKey = getEnvKey(getCacheKey(...payload))
                            cacheKeys.current.push(cacheKey)
                            return cacheKey
                        },
                        onUpdate: (res) => {
                            fetch.setState({ data: adapter(res)})
                        },
                        timeout
                    })().then(res => {
                        return adapter(res)
                    })
                    return {
                        servicePromise
                    }    
                }
            }
        }
        requestPlugin.onInit = () => {
            const cacheData = getLocalStorageCache(getEnvKey(getCacheKey()))
            return {
                data: adapter(cacheData?.s_d ?? cacheData) || undefined
            }
        }
        requestPlugin.clearCache = () => {
            return Promise.all(cacheKeys.current.map(key => del(key)))
        }
        return requestPlugin
    }, [])

}

const { data } = useRequest(getMenu, {
    retryCount: 5,
    manual: false
}, [
    createCacheAsyncPlugin({
        getCacheKey: () => 'layout-menu',
        timeout: 10000,
        adapter(_data) {
            if(!_data) {
                return undefined
            }
            return { menus: _data.menus || [] }
        }
    })
])



/**
 * 
 * @param {function} fn 
 * @param {function} getCacheKey 
 * @param {function} onUpdate 
 * @returns 
 */
export const wrapLocalStorageCache = (fn, getCacheKey, onUpdate) => {
    return (...args) => {
        let options: any = {}
        if(typeof getCacheKey === 'object') {
            options = getCacheKey
            getCacheKey = options.getCacheKey
            onUpdate = options.onUpdate
        }
        const cacheKey = typeof getCacheKey === 'function' ? getCacheKey(...args) : getCacheKey
        const cacheResult = getLocalStorageCache(cacheKey)
        const fetchUpdate = async () => {
            const result = await fn(...args)
            result !== undefined && setLocalStorageCache(cacheKey, {
                s_t: new Date().valueOf(),
                s_d: result
            })
            onUpdate?.(result)
            return result;
        }
        return (async () => {
            // 保鲜时间内
            if(!!cacheResult && options.timeout && !isTimeout(options.timeout, cacheResult)) {
                return cacheResult.s_d;
            }
            // 有数据，则延时请求
            if(!!cacheResult) {
                window.requestIdleCallback(() => {
                    fetchUpdate()
                })
                return cacheResult.s_d ?? cacheResult
            }
            // 如果没有数据，立即请求
            return await fetchUpdate()
        })()
    }
}

const getLocalStorageCache = (key) => {
    try  {
        return JSON.parse(localStorage.getItem(key)  as string)
    } catch(error) {
        return null
    }
}


const setLocalStorageCache = (cacheKey, data) => {
    localStorage.setItem(cacheKey, data)
}

const isTimeout = (time, data) => {
    if(!time) return true
    if(time === -1) return false
    if(!data.s_t) return true;
    return Date.now() - data.s_t > time;
}