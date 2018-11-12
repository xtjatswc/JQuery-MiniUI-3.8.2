define(['jquery', 'wd-lib', 'localforage'], function ($, wdlib, localforage) {
    /**
     * IMPORT: 开发的时候为true，发布的时候改为false
     * @type {boolean}
     */
    var DEBUG = true;

    var localCacheExpireKey = 'l_cache_e',
        memoryCacheExpireKey = 'm_cache_e',
        cacheLiveTimeKey = 'cache_lt';

    localforage.config({
        driver: localforage.INDEXEDDB,
        name: 'app_cache',
        version: 1.0
    });

    function Cache() {
    }

    Cache.localCacheExpireKey = localCacheExpireKey;
    Cache.memoryCacheExpireKey = memoryCacheExpireKey;
    Cache.cacheLiveTimeKey = cacheLiveTimeKey;

    /**
     * 生成缓存键
     */
    var generateCacheKey = function (url, args) {
        var urlParams = wdlib.getUrlParams(url).clean();

        delete urlParams[localCacheExpireKey];
        delete urlParams[memoryCacheExpireKey];
        delete urlParams[cacheLiveTimeKey];

        var args = $.extend(urlParams, (args || {}).clean()),
            url = url.split('?')[0],
            qs = wdlib.toQueryString(args, true);

        var idUrl = wdlib.appendQueryString(url.toLowerCase(), qs);

        return {
            key: '[' + wdlib.md5(idUrl) + ']' + ':' + idUrl.substr(0, 256),
            idUrl: idUrl,
            url: url,
            args: args
        };
    };

    /**
     * 获取缓存信息
     * @param url
     * @param data
     * @return {{cacheEnable: (*|boolean), cached: boolean, cacheKey: null, expire: number}}
     */
    Cache.prototype.getCacheOptions = function (url, data) {
        var url_p = wdlib.getUrlParams(url),
            p_l_expire = url_p[localCacheExpireKey],
            p_m_expire = url_p[memoryCacheExpireKey];

        var local = !!p_l_expire,
            expire = Number(p_m_expire) || Number(p_l_expire),
            cacheEnable = Number.isNumber(expire) && !(expire !== expire),
            liveTime = cacheEnable ? Number(url_p[Cache.cacheLiveTimeKey]) : undefined,
            cacheKey = cacheEnable ? generateCacheKey(url, data).key : null;

        return {
            local: local,
            cacheEnable: cacheEnable,
            cacheKey: cacheKey,
            expire: expire,
            liveTime: liveTime,
            cached: !local ? (cacheEnable ? this.cacheHit(cacheKey, expire) : false) : undefined
        };
    };

    Cache.create = function (local, name, defaultLiveTime, debug) {
        if (local) {
            return new LocalCache(name, defaultLiveTime, debug);
        } else {
            return new MemoryCache(name, defaultLiveTime, debug);
        }
    };

    /**
     *
     * @param msg
     */
    Cache.prototype.log = function (msg) {
        this.debug && console.log(
            (this.local ? 'L' : this.memory ? 'M' : '') +
            '[' + this.name + '_cache] ' + msg);
    };

    Cache.prototype.logColor = function (msg, color) {
        this.debug && console.log(
            '%c' + (this.local ? 'L' : this.memory ? 'M' : '') +
            '[' + this.name + '_cache] ' + msg, 'color:' + (color || 'black'));
    };

    /**
     * 生成缓存键
     * @type {generateCacheKey}
     */
    Cache.prototype.generateCacheKey = generateCacheKey;

    function LocalCache(name, defaultLiveTime, debug) {
        this.local = true;
        this.name = name || 'global';
        this.defaultLiveTime = defaultLiveTime || (1000 * 60 * 10);
        this.debug = (debug === undefined ? DEBUG : debug);
        this.cacheInfoKey = this.name + '_cache_info';

        this.localStore = localforage.createInstance({
            name: this.name + '_cache'
        });

        this.startScanTimer();
    }

    LocalCache.prototype = new Cache();

    LocalCache.prototype.cacheHit = function (cacheKey, expire) {
        return this.localStore.getItem(this.cacheInfoKey).then(function (info) {
            var c = info[cacheKey];

            if (!c) {
                return false;
            }

            if (expire == undefined) {
                return true;
            }

            return (c.timestamp + expire) >= new Date().getTime();
        });
    };

    LocalCache.prototype.getCacheData = function (cacheKey) {
        return this.localStore.getItem(cacheKey).then(function (c) {
            return c && c.data;
        });
    };

    LocalCache.prototype.removeCacheData = function (cacheKey) {
        var _this = this;

        var removeInfo = function () {
                return _this.localStore.getItem(_this.cacheInfoKey).then(function (info) {
                    info = info || {};

                    delete info[cacheKey];

                    return info;
                }).then(function (cacheInfo) {
                    return _this.localStore.setItem(_this.cacheInfoKey, cacheInfo);
                });
            },
            removeData = function () {
                return _this.localStore.removeItem(cacheKey)
            };

        return removeInfo().then(removeData);
    };

    LocalCache.prototype.setCacheData = function (cacheKey, data, liveTime) {
        var cacheInfo = {
                timestamp: new Date().getTime(),
                liveTime: liveTime || this.defaultLiveTime
            },
            cacheData = {
                timestamp: cacheInfo.timestamp,
                liveTime: cacheInfo.liveTime,
                data: data
            };

        var _this = this;

        var setData = function () {
                return _this.localStore.setItem(cacheKey, cacheData);
            },
            setInfo = function () {
                return _this.localStore.getItem(_this.cacheInfoKey).then(function (info) {
                    info = info || {};

                    info[cacheKey] = cacheInfo;

                    return info;
                }).then(function (cacheInfo) {
                    return _this.localStore.setItem(_this.cacheInfoKey, cacheInfo);
                });
            },
            startScanTimer = function () {
                _this.startScanTimer();

                return data;
            };

        return setData().then(setInfo).then(startScanTimer);
    };

    LocalCache.prototype.startScanTimer = function () {
        var cache = this,
            defaultLiveTime = this.defaultLiveTime;

        if (this.scanTimer == null) {
            this.scanTimer = window.setTimeout(function () {
                cache.log('begin scan');

                scan().then(function (stop) {
                    cache.scanTimer = null;

                    if (!stop) {
                        cache.startScanTimer()
                    }
                }).catch(function () {
                    console.error('缓存刷新出错');
                });
            }, 3000);
        }

        function scan() {
            return cache.localStore.getItem(cache.cacheInfoKey).then(function (info) {
                var keys = Object.keys(info || {});

                if (keys.length) {
                    var promises = keys.map(function (key) {
                        var c = info[key],
                            liveTime = c.liveTime || defaultLiveTime,
                            timestamp = c.timestamp,
                            remainLiveTime = (timestamp + liveTime) - new Date().getTime();

                        if (remainLiveTime <= 0) {
                            return cache.removeCacheData(key).then(function () {
                                cache.logColor('cache "' + key + '" is invalid. removed. live time: ' + liveTime, 'orange');
                            }).catch(function () {
                                cache.logColor('cache "' + key + '" is invalid. removed fail.', 'red');
                            });
                        } else {
                            cache.logColor('cache "' + key + '" is valid. remain live time: ' + remainLiveTime, 'green');
                        }
                    });

                    return $.when.apply($, promises.filter(function (p) {
                        return !!p;
                    })).then(function () {
                        cache.log('scan complete');

                        return false;
                    });
                } else {
                    return true;
                }
            });
        }
    };

    function MemoryCache(name, defaultLiveTime, debug) {
        this.memory = true;
        this.name = name || 'global';
        this.defaultLiveTime = defaultLiveTime || (1000 * 60 * 10);
        this.debug = (debug === undefined ? DEBUG : debug);

        this.cachePool = {};

        this.startScanTimer();
    }

    MemoryCache.prototype = new Cache();

    /**
     * 缓存是否命中
     * @param cacheKey
     * @param expire
     */
    MemoryCache.prototype.cacheHit = function (cacheKey, expire) {
        var c = this.cachePool[cacheKey];

        if (!c) {
            return false;
        }

        // 未指定失效时间
        if (expire == undefined) {
            return true;
        }

        return (c.timestamp + expire) >= new Date().getTime();
    };

    MemoryCache.prototype.getCacheData = function (cacheKey) {
        var c = this.cachePool[cacheKey];

        return c && c.data;
    };

    MemoryCache.prototype.removeCacheData = function (cacheKey) {
        delete this.cachePool[cacheKey];
    };

    MemoryCache.prototype.setCacheData = function (cacheKey, cacheData, liveTime) {
        this.cachePool[cacheKey] = {
            timestamp: new Date().getTime(),
            liveTime: liveTime || this.defaultLiveTime,
            data: cacheData
        };

        this.startScanTimer();

        return cacheData;
    };

    MemoryCache.prototype.startScanTimer = function () {
        var cache = this,
            defaultLiveTime = this.defaultLiveTime;

        if (this.scanTimer == null) {
            this.scanTimer = window.setTimeout(function () {
                cache.log('begin scan');

                scan();

                cache.scanTimer = null;

                if (Object.keys(cache.cachePool).length > 0) {
                    cache.startScanTimer();
                }
            }, 3000);
        }

        function scan() {
            for (var key in cache.cachePool) {
                var c = cache.cachePool[key],
                    liveTime = c.liveTime || defaultLiveTime,
                    timestamp = c.timestamp,
                    remainLiveTime = (timestamp + liveTime) - new Date().getTime();

                if (remainLiveTime <= 0) {
                    cache.removeCacheData(key);

                    cache.logColor('cache "' + key + '" is invalid. removed. live time: ' + liveTime, 'orange');
                } else {
                    cache.logColor('cache "' + key + '" is valid. remain live time: ' + remainLiveTime, 'green');
                }
            }

            cache.log('scan complete');
        }
    };

    return Cache;
});