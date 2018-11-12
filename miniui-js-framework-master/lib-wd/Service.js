/**
 * @author shao
 *
 * 1.Service 和 Controller 对应关系及服务url生成规则
 * - 一个Service对应一个Conroller，一个服务方法对应一个Action方法；
 *
 * - Service有两个属性：root和path。
 *   root 一般代表服务寄宿的根路径（一般是站点根路径），
 *   path 代表该服务相对root的路径（一般一组相关的服务放在相同路径下）；
 *
 * - 服务默认的root通过Service.inherit方法的第二个参数指定，同时可在构造服务的时候由构造函数的第一个参数覆盖；
 *   path通过Service.inherit方法的第三个参数指定；
 *   如果缺省Service.inherit方法的第三个参数，那么第二个参数作为path，root取当前站点上下文路径（window.ctx）；
 *
 * - 服务定义中可指定一个可选的url属性，如果没有指定，那么url取自name属性；
 *
 * - 服务方法最终的url由服务的root，path，服务定义的url属性共同决定，具体规则如下：
 *   1.如果服务定义的url是个带协议的绝对路径，那么url就作为最终返回值；
 *   2.如果服务定义的url以/开头（代表相对root），那么最终url为：root + url；
 *   3.最后（代表相对path），最终url为：root + path + '/' + def.url；
 *
 * 2.服务定义说明
 *   name: 服务方法名-必填
 *   url: 和最终请求的url有关，生成url的具体策略参考 以上第1点
 *   cleanArgs: 是否清理请求数据：目前是删除请求参数中带下划线的参数，默认true
 *   syncable：是否支持同步，默认false。如果为true，服务有个同步版本的方法：name+Sync
 *   dataType：返回的数据类型，默认 json
 *   contentType：请求的内容类型，只在type为post时有效。默认策略：如果请求参数为复杂对象，则为application/json，否则application/x-www-form-urlencoded。
 *   type：请求方式，默认策略：如果方法名以get开头，则为get；否则post
 *   cacheable：是否支持缓存，默认false
 *   mock：默认false。true: mock模式，后台接口未提供的情况下，前端可做模拟请求。
 */
define(['jquery', 'wd-lib', 'Cache'], function ($, wdlib, Cache) {

    var rProtocolPrefix = /^(http|https)/,
        rJsonType = /^application\/json/,
        rUrl = /(\w+:)\/\/([^/:]+)(:\d*)?(.+)/;

    var localCache = Cache.create(true, 'Service'),
        memoryCache = Cache.create(false, 'Service');

    /**
     * 请求截获，缓存处理
     * +*：截获(+)所有请求(*)
     */
    $.ajaxTransport('+*', function (options, originalOptions, jqXHR) {

        var data = originalOptions.data;

        if (String.isString(data)) {
            data = paramStrToObj(data);
        }

        /**
         * cacheOptions包括：
         * cacheEnable: 请求是否应用了缓存
         * local: 缓存类型，是否本地缓存
         * cacheKey: 缓存键
         * expire: 缓存时效
         * liveTime: 缓存滞留时间
         * cached: 请求是否命中缓存。
         *
         * 注意：本地缓存的一系列方法都是异步的，所以 cached 只有通过内存缓存调用（同步）的时候才有效
         *
         * 整个截获请求的策略是：
         * 1. 判断是否应用了缓存策略，如果没有，则跳过；
         * 2. 否则，如果 expire < 0，表示清除缓存并跳过；
         * 3. 否则，如果是本地缓存，则进入处理本地缓存的逻辑：判断本地缓存是否命中，如果是，则返回缓存数据；否则，重新发送原始请求；
         * 4. 否则，如果 cached 为 true，表示命中内存缓存，返回对应的缓存数据；
         * 5. 否则，让原始的请求继续执行；
         */
        var cacheOptions = memoryCache.getCacheOptions(options.url, (data || {}));

        if (!cacheOptions.cacheEnable)
            return;

        // expire < 0: 手动清缓存
        if (cacheOptions.expire < 0) {
            (cacheOptions.local ? localCache : memoryCache).removeCacheData(cacheOptions.cacheKey);

            return;
        }

        if (cacheOptions.local) {
            return {
                send: function (requestHeaders, done) {
                    localCache.cacheHit(cacheOptions.cacheKey, cacheOptions.expire).then(function (hit) {
                        if (hit) {
                            localCache.getCacheData(cacheOptions.cacheKey).then(function (data) {
                                var responses = {};

                                responses[originalOptions.dataType] = data;

                                done(200, 'service cached', responses);
                            }).catch(function (e) {
                                done(0, 'service cache error');
                            });
                        } else {
                            sendOriginal();
                        }
                    }).catch(function (e) {
                        sendOriginal();
                    });

                    function sendOriginal() {
                        var urlParams = wdlib.getUrlParams(originalOptions.url);

                        delete urlParams[Cache.localCacheExpireKey];
                        delete urlParams[Cache.cacheLiveTimeKey];

                        originalOptions.url = wdlib.appendQueryString(
                            originalOptions.url.split('?')[0],
                            wdlib.toQueryString(urlParams)
                        );

                        $.ajax(originalOptions).then(function (data) {
                            var responses = {};

                            responses[originalOptions.dataType] = data;

                            localCache.setCacheData(cacheOptions.cacheKey, data, cacheOptions.liveTime);

                            done(200, 'local cache fallback', responses);
                        }).catch(function () {
                            done(0, 'local cache fallback error');
                        });
                    }
                },

                abort: function () {
                    done(0);
                }
            };
        } else if (cacheOptions.cached) {
            return {
                send: function (requestHeaders, done) {
                    var responses = {};

                    responses[originalOptions.dataType] = memoryCache.getCacheData(cacheOptions.cacheKey);

                    done(200, 'service cached', responses);
                },

                abort: function () {
                    done(0);
                }
            };
        } else {
            memoryCache.removeCacheData(cacheOptions.cacheKey);

            if (cacheOptions.expire >= 0) {
                jqXHR.done(function (data) {
                    memoryCache.setCacheData(cacheOptions.cacheKey, data, cacheOptions.liveTime);
                });
            }
        }
    });

    function json(obj) {
        return window.JSON.stringify(obj);
    }

    function parseJson(json) {
        return window.JSON.parse(json);
    }

    /**
     * 将请求的字符串参数（json或者url encode格式）转化成对象
     * @param param
     * @return {*}
     */
    function paramStrToObj(param) {
        if (param[0] === '{' || param[0] === '[') {
            return parseJson(param);
        } else {
            return wdlib.getParams(param);
        }
    }

    function getCacheArgs(cacheOpts, args) {
        args = args || {};

        args[cacheOpts.local ? Cache.localCacheExpireKey : Cache.memoryCacheExpireKey] = cacheOpts.expire;
        (cacheOpts.liveTime) && (args[Cache.cacheLiveTimeKey] = cacheOpts.liveTime);

        return args;
    }

    /**
     * 是否复杂对象：数组或多层嵌套对象，以及由两者组成的对象
     * @param obj
     * @return {boolean}
     */
    function isComplexObj(obj) {
        if (Array.isArray(obj))
            return true;

        if (!Object.isObject(obj))
            return false;

        for (var k in obj) {
            if (Object.isObject(obj[k]) || Array.isArray(obj[k])) {
                return true;
            }
        }

        return false;
    }

    /**
     * 判断url是否跨域
     * @param url
     * @return {boolean}
     */
    function isCors(url) {
        if (!rProtocolPrefix.test(url)) {
            return false;
        }

        var m = url.match(rUrl),
            _proto = m[1],
            _host = m[2] + m[3],
            _domain = (_proto + '//' + _host).toLowerCase();

        var l = window.location,
            proto = l.protocol,
            host = l.host,
            domain = (proto + '//' + host).toLowerCase();

        return _domain !== domain;
    }

    /**
     * 往后台传输的数据，清除带下划线的属性
     * @param data
     * @return {*}
     */
    function cleanData(data) {
        if (Object.isObject(data) || Array.isArray(data)) {
            return data.clean();
        }

        return data;
    }

    /**
     * 修复服务定义，主要是默认值的处理
     * @param def
     * @return {*}
     */
    function fixDef(def) {
        if (def.cleanArgs === undefined) {
            def.cleanArgs = true;
        }

        if (def.syncable === undefined) {
            def.syncable = false;
        }

        if (!def.dataType) {
            def.dataType = 'json';
        }

        if (!def.type && def.name.startsWith('get')) {
            def.type = 'get';
        } else if (!def.type) {
            def.type = 'post';
        }

        if (def.cacheable === undefined) {
            def.cacheable = false;
        }

        if (def.mock === undefined) {
            def.mock = false;
        }

        return def;
    }

    /**
     * 从服务（调用）参数中取得请求参数
     * @param args
     */
    function getDataFromArgs(args) {
        return args[0];
    }

    /**
     * 从（服务调用）参数中取得缓存参数
     * @param def
     * @param args
     */
    function getCacheOptsFromArgs(def, args) {
        if (!def.cacheable) {
            return undefined;
        }

        var cacheOpts;

        if (args.length == 1) {
            /**
             * 参数数量为1的时候，第1个参数有可能是缓存的expire参数，此时第一个参数必须是数字
             */
            cacheOpts = args[0];
        } else if (args.length > 1) {
            /**
             * 参数数量>1的时候，第2个参数是缓存参数
             */
            cacheOpts = args[1];
        }

        if (Number.isNumber(cacheOpts)) {
            cacheOpts = {
                expire: cacheOpts
            };
        }

        return cacheOpts;
    }

    /**
     * 获取ajax参数
     * @param def 服务定义
     * @param service 服务实例
     * @param data 请求数据
     * @param args 服务（调用）参数
     */
    function getAjaxOptions(def, service, data, args) {
        return {
            dataType: def.dataType,
            contentType: def.contentType
        };
    }

    /**
     * 获取服务的url
     * @param service
     * @param def
     * @param withProtocol 是否包含协议头的完全路径
     * @param data 参数
     * @return {*}
     */
    function getServiceUrl(service, def, withProtocol, data) {
        if (!Boolean.isBoolean(withProtocol)) {
            data = withProtocol;
            withProtocol = false;
        }

        var url, hasProtocol = rProtocolPrefix.test(def.url);

        if (hasProtocol) {
            url = def.url;
        } else if (def.url) {
            if (def.url[0] === '/') { // 绝对路径
                url = service.root + def.url;
            } else { // 相对路径
                url = service.root + service.path + '/' + def.url;
            }
        } else {
            url = service.root + service.path + '/' + def.name;
        }

        if (!hasProtocol && withProtocol) {
            url = window.location.origin + url;
        }

        if (data) {
            def.cleanArgs && (data = cleanData(data));

            var qs = wdlib.toQueryString($.extend(wdlib.getUrlParams(url), data), true);

            return wdlib.appendQueryString(url.split('?')[0], qs);
        } else {
            return url;
        }
    }

    /**
     * 创建错误对象
     * @param msg 错误消息
     * @param errorCode 错误代码
     * @param data 附加数据
     * @param orignal 原始错误
     * @return {Error}
     */
    function makeError(msg, errorCode, data, orignal) {
        var error = new Error(String.isString(data) ? msg + ' 详细信息：' + data : msg);
        error.errorCode = errorCode;
        error.data = data;
        error.original = orignal;

        return error;
    }

    /**
     * http success (2XX)
     * @param result
     * @return {*}
     */
    function httpSuccess(result) {

        var match = Object.isObject(result) &&
            ('status' in result);

        if (!match) {
            return result;
        }

        //{ status: 0/[!0], msg: '错误消息', body: { data:  } }
        var data = (result.body && result.body.data);

        if (result.status === 0) {
            return data;
        } else {
            throw makeError(result.msg, result.status, data);
        }
    }

    /**
     * http error
     * @param jqXHR
     * @param textStatus
     * @param errorThrown
     */
    function httpError(jqXHR, textStatus, errorThrown) {
        throw makeError(errorThrown);
    }

    /**
     * 发送 ajax请求
     * @param method
     * @param service
     * @param def
     * @param data
     * @param opts
     * @param cacheOpts
     * @return {*}
     */
    function doAjax(method, service, def, data, opts, cacheOpts) {

        //跨域需要服务端支持：
        //1.Access-Control-Allow-Origin: domain-允许跨域请求的域
        //2.Access-Control-Allow-Credentials: true-验证通过/false-验证不通过

        var cacheArgs;
        if (cacheOpts && Number.isNumber(cacheOpts.expire)) {
            cacheArgs = getCacheArgs(cacheOpts);
        }

        var url = getServiceUrl(service, def, cacheArgs),
            cors = isCors(url);

        var options = $.extend(opts, {
            method: method,
            url: url,
            data: data,
            crossDomain: cors,
            xhrFields: cors ? {withCredentials: true} : undefined
        });

        return $.ajax(options)
            .catch(httpError) // NOTE: 必须先捕获http错误
            .then(httpSuccess);
    }

    /**
     * ajax get
     * @param service
     * @param def
     * @param data
     * @param options
     * @param cacheOpts 缓存选项
     * @return {*}
     */
    function httpGet(service, def, data, options, cacheOpts) {
        return doAjax('GET', service, def, data, options, cacheOpts);
    }

    /**
     * ajax post
     * @param service
     * @param def
     * @param data
     * @param options
     * @param cacheOpts 缓存选项
     * @return {*}
     */
    function httpPost(service, def, data, options, cacheOpts) {
        if (!options.contentType) {
            options.contentType = isComplexObj(data) ?
                Service.CONTENT_TYPE_JSON : Service.CONTENT_TYPE_FORM_URLENCODED;
        }

        if (rJsonType.test(options.contentType) &&
            typeof data !== 'string' // 如果data为字符串，可认为data就是json格式，无需再次序列化，防止重复序列化导致转义
        ) {
            data = json(data);
        }

        return doAjax('POST', service, def, data, options, cacheOpts);
    }

    /**
     * mock
     * @param service
     * @param def
     * @param args
     * @return {*}
     */
    function doMock(service, def, args, async) {
        var data = getDataFromArgs(args),
            mock = def.mock;

        function _doMock(mock) {

            function delay(result, error) {
                wdlib.delay(function () {
                    if (error) {
                        deferred.reject(error);
                    } else {
                        deferred.resolve(result);
                    }
                }, null, mock.timeout || 0);
            }

            if (async) {
                var deferred = $.Deferred();

                if (mock.error) {
                    var error = mock.error;

                    delay(null, makeError(error.msg, error.code, error.data));
                } else {
                    delay(mock.result);
                }

                return deferred;
            } else {
                if (mock.error) {
                    var error = mock.error;

                    throw makeError(error.msg, error.code, error.data);
                } else {
                    return mock.result;
                }
            }
        }

        return _doMock(mock);
    }

    /**
     * 异步调用
     * @param service
     * @param def
     * @param args
     * @return {*}
     */
    function invokeAsync(service, def, args) {
        var data = getDataFromArgs(args),
            cacheOpts = getCacheOptsFromArgs(def, args),
            options = getAjaxOptions(def, service, data, args);

        if (def.cleanArgs) {
            data = cleanData(data);
        }

        if (def.type === 'get') {
            return httpGet(service, def, data, options, cacheOpts);
        } else {
            return httpPost(service, def, data, options, cacheOpts);
        }
    }

    /**
     * 同步调用
     * @param service
     * @param def
     * @param args
     * @return {*}
     */
    function invokeSync(service, def, args) {
        var data = getDataFromArgs(args),
            cacheOpts = getCacheOptsFromArgs(def, args),
            options = getAjaxOptions(def, service, data, args),
            returnData = null,
            error = null;

        if (def.cleanArgs) {
            data = cleanData(data);
        }

        options = $.extend(options, {
            async: false,

            success: function (result) {
                try {
                    returnData = httpSuccess(result);
                } catch (e) {
                    error = e;
                }
            },

            error: function (jqXHR, textStatus, errorThrown) {
                error = makeError(textStatus || '' + ' ' + errorThrown || '');
            }
        });

        doAjax(def.type, service, def, data, options, cacheOpts);

        if (error) {
            throw error;
        }

        return returnData;
    }

    /**
     * 服务调用
     * @param service 服务实例
     * @param def 服务定义
     * @param sync 是否同步调用
     * @param args 参数
     * @return {*}
     */
    function invoke(service, def, sync, args) {
        if (def.mock) {
            return doMock(service, def, args, !sync);
        }

        if (sync) {
            return invokeSync(service, def, args);
        } else {
            return invokeAsync(service, def, args);
        }
    }

    /**
     * 创建服务方法
     * @param service
     * @param serviceDefs
     */
    function makeServiceMethods(service, serviceDefs) {

        function method(def, sync) {
            var m = function () {
                return invoke(this, def, sync, arguments);
            };
            m.def = def;

            return m;
        }

        serviceDefs.forEach(function (def) {
            var name = def.name;

            if (!name) {
                throw new Error('service method name is required.');
            }

            def = fixDef(def);

            service[name] = method(def, false);

            if (def.syncable) {
                service[name + 'Sync'] = method(def, true);
            }
        });
    }

    /**
     * 创建服务类
     * @param serviceDefs
     * @param serviceRoot
     * @param servicePath
     * @return {InheritedService}
     */
    function makeServiceClass(serviceDefs, serviceRoot, servicePath) {

        serviceRoot || (serviceRoot = '');
        servicePath || (servicePath = '');

        function InheritedService(root) {
            /**
             * root 允许通过构造函数指定
             * 因为服务有可能部署在另外一台服务器上
             */
            this.root = (root || serviceRoot);
            this.path = servicePath;
        }

        var service = new Service();
        InheritedService.prototype = service;
        InheritedService.prototype.constructor = InheritedService;

        makeServiceMethods(service, serviceDefs);

        InheritedService.default = function () {
            return new InheritedService(serviceRoot);
        };

        InheritedService.CONTENT_TYPE_FORM_URLENCODED = Service.CONTENT_TYPE_FORM_URLENCODED;
        InheritedService.CONTENT_TYPE_JSON = Service.CONTENT_TYPE_JSON;

        return InheritedService;
    }

    /**
     * 服务基类
     * @constructor
     */
    var Service = function () {
    };

    /**
     * 获取服务url
     * @param method
     * @optional args
     * @optional cacheOpts 缓存参数
     * @optional cleanArgs
     * @optional withProtocol
     * @return {*}
     */
    Service.prototype.url = function (method, args, cacheOpts, cleanArgs, withProtocol) {
        var m = this[method];

        if (!m) {
            throw new Error('service method "' + method + '" is not found.');
        }

        /**
         * 参数处理，可如下调用：
         * url(method, expire, withProtocol)
         * url(method, args, cleanArgs, withProtocol)
         *
         * 其他情况都要指定完整参数
         */
        if (Number.isNumber(args)) {
            withProtocol = cacheOpts;
            cleanArgs = false;
            cacheOpts = {
                expire: args
            };
            args = null;
        } else if (Boolean.isBoolean(cacheOpts)) {
            withProtocol = cleanArgs;
            cleanArgs = cacheOpts;
            cacheOpts = null;
        }

        var def = m.def,
            cache = def.cacheable && cacheOpts && Number.isNumber(cacheOpts.expire);

        if (cache) {
            !args && (args = {});
            getCacheArgs(cacheOpts, args);
        }

        if ((cleanArgs === true) ||
            (cleanArgs === undefined && def.cleanArgs)) {
            args = cleanData(args);
        }

        return getServiceUrl(this, def, !!withProtocol, args);
    };

    /**
     * 清除缓存
     * @param method
     * @param args
     * @param local
     */
    Service.prototype.clearCache = function (method, args, local) {
        var url = this.url(method),
            cacheKey = memoryCache.generateCacheKey(url, args).key;

        return (local ? localCache : memoryCache).removeCacheData(cacheKey);
    };

    /**
     * 创建一个继承自Service的自定义服务
     *
     * @param serviceDefs 服务定义
     * @param serviceRoot 服务根路径，一般是服务部署站点的url（相对或者绝对，具体看是否跨域）
     * @param servicePath 服务路径，相对于服务根路径
     * @return {InheritedService}
     */
    Service.inherit = function (serviceDefs, serviceRoot, servicePath) {
        /**
         * root和path的默认值处理
         */
        if (servicePath == undefined) {
            servicePath = serviceRoot;
            serviceRoot = window.ctx || '';
        }

        return makeServiceClass(serviceDefs, serviceRoot, servicePath);
    };

    Service.CONTENT_TYPE_FORM_URLENCODED = 'application/x-www-form-urlencoded';
    Service.CONTENT_TYPE_JSON = 'application/json';

    return Service;
});
