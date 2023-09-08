import { useRequest, useCreation } from 'ahooks';
import { useRef } from 'react';
// import { Plugin } from 'ahooks/lib/useRequest/src/types'
import { del } from 'idb-keyval'

export const getEnvKey = (key) => {
    return `$$-${key}`
}

/**
 * SWR：避免影响交互的关键事件
 * 保鲜时间，如果在这个时间段内，认为数据是最新的，不会重新发起请求
 */


export const CreateCacheAsyncPlugin = (options) => {
    const {adaptor, getCacheKey, timeout } = options
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
                            fetch.setState({ data: adaptor(res)})
                        },
                        timeout
                    })().then(res => {
                        return adaptor(res)
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
                data: adaptor(cacheData?.s_d ?? cacheData) || undefined
            }
        }
        requestPlugin.clearCache = () => {
            return Promise.all(cacheKeys.current.map(key => del(key)))
        }
        return requestPlugin
    }, [])

}



/**
 * 
 * @param {function} fn 
 * @param {function} getCacheKey 
 * @param {function} onUpdate 
 * @returns 
 */
export const wrapLocalStorageCache = (fn, getCacheKey, onUpdate) => {
    return (...args) => {
        let options = {}
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
                console.log('命中cache')
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
        return JSON.parse(localStorage.getItem(key))
    } catch(error) {
        return null
    }
}

const getMinutesTime = (minutes) => {
    return 1000 * 60 * minutes;
}


const setLocalStorageCache = (cacheKey, data) => {
    localStorage.setItem(cacheKey, JSON.stringify(data))
}

const isTimeout = (time, data) => {
    if(!time) return true
    if(time === -1) return false
    if(!data.s_t) return true;
    return Date.now() - data.s_t > time;
}

export const useFetch = ({
    fetch,
    timeout = 3,
    cacheKey,
    dataHandler,
    manual = false
}) => {
    return useRequest(
        fetch,
        {
            retryCount: 5,
            manual
        },
        [
            CreateCacheAsyncPlugin({
                getCacheKey: () => cacheKey,
                timeout: getMinutesTime(timeout),
                adaptor(_data) {
                    return dataHandler(_data)
                }
            })
        ]
    )
}
