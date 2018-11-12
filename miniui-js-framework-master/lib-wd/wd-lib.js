/**
 * @author shao
 *
 * 基础支持库
 */
define(['jquery'], function ($) {

    var rZeroTail = /(0+)$/gi;

    var wdlib = {
        /**
         * 组合字段
         *
         * @param data
         * @param combineFieldName 组合字段名
         * @param combineFields 要组合的字段
         * @param separator 分隔符 默认: ''
         */
        combineFields: function (data, combineFieldName, combineFields, separator) {
            separator = separator || '';

            data.forEach(function (d) {
                for (var i = 0; i < combineFields.length; i++) {
                    var f = d[combineFields[i]];

                    if (f) {
                        d[combineFieldName] ?
                            d[combineFieldName] += (separator + f) :
                            d[combineFieldName] = f;
                    }
                }
            });
        },

        /**
         * 延迟
         * @param fn
         * @param args
         * @param ctx
         * @param sec
         */
        delay: function (fn, args, ctx, sec) {
            if (typeof ctx === 'number') {
                sec = ctx;
                ctx = null;
            }

            window.setTimeout(function () {
                fn.apply(ctx, args || []);
            }, sec || 0);
        },

        /**
         * 解析查询参数
         * @param url
         * @return {{}}
         */
        getParams: function (qs) {
            var params = {};

            if (qs) {
                var us = qs.split('&');

                for (var i = 0, l = us.length; i < l; i++) {
                    var ps = us[i].split('=');

                    try {
                        params[ps[0]] = decodeURIComponent(ps[1]);
                    } catch (ex) {
                    }
                }
            }

            return params;
        },

        /**
         * 解析url查询参数
         * @param url
         * @return {*}
         */
        getUrlParams: function (url) {
            if (!url) {
                url = location.href;
            }

            if (url.indexOf('?') < 0) {
                return {};
            } else {
                return this.getParams(url.split('?')[1]);
            }
        },

        /**
         * 对象到查询参数
         * @param params
         * @param sort
         */
        toQueryString: function (params, sort) {
            var paramKeys = sort ? Object.keys(params).sort() : Object.keys(params);

            return paramKeys.reduce(function (_qs, p) {
                var v = params[p];

                if (Object.isObject(v) || Array.isArray(v)) {
                    v = window.JSON.stringify(v);
                }

                if (v != null) {
                    return _qs += (_qs ? '&' : '') + (p + '=' + v);
                } else {
                    return _qs;
                }
            }, '');
        },

        /**
         * url 附加查询参数
         * @param url
         * @param qs
         * @return {*}
         */
        appendQueryString: function (url, qs) {
            if (!qs) {
                return url;
            }

            var qp = url.indexOf('?');

            if (qp < 0) {
                return url + '?' + qs;
            } else if (qp == qs.length - 1) {
                return url + qs;
            } else {
                return url + '&' + qs;
            }
        },

        promiseIt: function (fn) {
            var promise = $.Deferred();

            this.delay(function () {
                try {
                    promise.resolve(Function.isFunction(fn) ? fn() : fn);
                } catch (e) {
                    promise.reject();
                }
            });

            return promise;
        },

        copyFun: function (fn) {
            return eval('(function(){ return ' + fn.toString() + '})()');
        },

        md5: (function () {
            /*
             * JavaScript MD5
             * https://github.com/blueimp/JavaScript-MD5
             *
             * Copyright 2011, Sebastian Tschan
             * https://blueimp.net
             *
             * Licensed under the MIT license:
             * https://opensource.org/licenses/MIT
             *
             * Based on
             * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
             * Digest Algorithm, as defined in RFC 1321.
             * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
             * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
             * Distributed under the BSD License
             * See http://pajhome.org.uk/crypt/md5 for more info.
             */

            /* global define */

            'use strict'

            /*
             * Add integers, wrapping at 2^32. This uses 16-bit operations internally
             * to work around bugs in some JS interpreters.
             */
            function safeAdd(x, y) {
                var lsw = (x & 0xffff) + (y & 0xffff)
                var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
                return (msw << 16) | (lsw & 0xffff)
            }

            /*
             * Bitwise rotate a 32-bit number to the left.
             */
            function bitRotateLeft(num, cnt) {
                return (num << cnt) | (num >>> (32 - cnt))
            }

            /*
             * These functions implement the four basic operations the algorithm uses.
             */
            function md5cmn(q, a, b, x, s, t) {
                return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
            }

            function md5ff(a, b, c, d, x, s, t) {
                return md5cmn((b & c) | (~b & d), a, b, x, s, t)
            }

            function md5gg(a, b, c, d, x, s, t) {
                return md5cmn((b & d) | (c & ~d), a, b, x, s, t)
            }

            function md5hh(a, b, c, d, x, s, t) {
                return md5cmn(b ^ c ^ d, a, b, x, s, t)
            }

            function md5ii(a, b, c, d, x, s, t) {
                return md5cmn(c ^ (b | ~d), a, b, x, s, t)
            }

            /*
             * Calculate the MD5 of an array of little-endian words, and a bit length.
             */
            function binlMD5(x, len) {
                /* append padding */
                x[len >> 5] |= 0x80 << (len % 32)
                x[((len + 64) >>> 9 << 4) + 14] = len

                var i
                var olda
                var oldb
                var oldc
                var oldd
                var a = 1732584193
                var b = -271733879
                var c = -1732584194
                var d = 271733878

                for (i = 0; i < x.length; i += 16) {
                    olda = a
                    oldb = b
                    oldc = c
                    oldd = d

                    a = md5ff(a, b, c, d, x[i], 7, -680876936)
                    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
                    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819)
                    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)
                    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897)
                    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426)
                    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341)
                    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983)
                    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416)
                    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417)
                    c = md5ff(c, d, a, b, x[i + 10], 17, -42063)
                    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)
                    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682)
                    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
                    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290)
                    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)

                    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510)
                    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632)
                    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713)
                    b = md5gg(b, c, d, a, x[i], 20, -373897302)
                    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691)
                    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
                    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335)
                    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848)
                    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438)
                    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
                    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961)
                    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501)
                    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467)
                    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784)
                    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473)
                    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)

                    a = md5hh(a, b, c, d, x[i + 5], 4, -378558)
                    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463)
                    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562)
                    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)
                    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060)
                    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353)
                    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632)
                    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)
                    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174)
                    d = md5hh(d, a, b, c, x[i], 11, -358537222)
                    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979)
                    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189)
                    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487)
                    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
                    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520)
                    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651)

                    a = md5ii(a, b, c, d, x[i], 6, -198630844)
                    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415)
                    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905)
                    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055)
                    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571)
                    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606)
                    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523)
                    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799)
                    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359)
                    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
                    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380)
                    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)
                    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070)
                    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
                    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259)
                    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551)

                    a = safeAdd(a, olda)
                    b = safeAdd(b, oldb)
                    c = safeAdd(c, oldc)
                    d = safeAdd(d, oldd)
                }
                return [a, b, c, d]
            }

            /*
             * Convert an array of little-endian words to a string
             */
            function binl2rstr(input) {
                var i
                var output = ''
                var length32 = input.length * 32
                for (i = 0; i < length32; i += 8) {
                    output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xff)
                }
                return output
            }

            /*
             * Convert a raw string to an array of little-endian words
             * Characters >255 have their high-byte silently ignored.
             */
            function rstr2binl(input) {
                var i
                var output = []
                output[(input.length >> 2) - 1] = undefined
                for (i = 0; i < output.length; i += 1) {
                    output[i] = 0
                }
                var length8 = input.length * 8
                for (i = 0; i < length8; i += 8) {
                    output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (i % 32)
                }
                return output
            }

            /*
             * Calculate the MD5 of a raw string
             */
            function rstrMD5(s) {
                return binl2rstr(binlMD5(rstr2binl(s), s.length * 8))
            }

            /*
             * Calculate the HMAC-MD5, of a key and some data (raw strings)
             */
            function rstrHMACMD5(key, data) {
                var i
                var bkey = rstr2binl(key)
                var ipad = []
                var opad = []
                var hash
                ipad[15] = opad[15] = undefined
                if (bkey.length > 16) {
                    bkey = binlMD5(bkey, key.length * 8)
                }
                for (i = 0; i < 16; i += 1) {
                    ipad[i] = bkey[i] ^ 0x36363636
                    opad[i] = bkey[i] ^ 0x5c5c5c5c
                }
                hash = binlMD5(ipad.concat(rstr2binl(data)), 512 + data.length * 8)
                return binl2rstr(binlMD5(opad.concat(hash), 512 + 128))
            }

            /*
             * Convert a raw string to a hex string
             */
            function rstr2hex(input) {
                var hexTab = '0123456789abcdef'
                var output = ''
                var x
                var i
                for (i = 0; i < input.length; i += 1) {
                    x = input.charCodeAt(i)
                    output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f)
                }
                return output
            }

            /*
             * Encode a string as utf-8
             */
            function str2rstrUTF8(input) {
                return unescape(encodeURIComponent(input))
            }

            /*
             * Take string arguments and return either raw or hex encoded strings
             */
            function rawMD5(s) {
                return rstrMD5(str2rstrUTF8(s))
            }

            function hexMD5(s) {
                return rstr2hex(rawMD5(s))
            }

            function rawHMACMD5(k, d) {
                return rstrHMACMD5(str2rstrUTF8(k), str2rstrUTF8(d))
            }

            function hexHMACMD5(k, d) {
                return rstr2hex(rawHMACMD5(k, d))
            }

            function md5(string, key, raw) {
                if (!key) {
                    if (!raw) {
                        return hexMD5(string)
                    }
                    return rawMD5(string)
                }
                if (!raw) {
                    return hexHMACMD5(key, string)
                }
                return rawHMACMD5(key, string)
            }

            return md5;
        })()
    };

    function defineProp(obj, props) {

        for (var p in props) {
            var prop = props[p];

            if ((prop === undefined) || obj.hasOwnProperty(p))
                continue;

            Object.defineProperty(obj, p, {
                enumerable: false,
                configurable: false,
                writable: false,
                value: prop
            });
        }
    }

    /**
     * Object 扩展
     */
    defineProp(Object.prototype, {
        /**
         * 获取属性，支持嵌套
         * @param prop
         * @return {*}
         */
        getProp: function (prop) {
            prop = String(prop);

            if (!prop) {
                return undefined;
            }

            prop = prop.split('.');

            var v = this;

            for (var i = 0; i < prop.length; i++) {
                if (v != null) {
                    v = v[prop[i]];
                } else {
                    return undefined;
                }
            }

            return v;
        },

        /**
         * 设置属性，支持嵌套
         * @param prop
         * @param value
         */
        setProp: function (prop, value) {
            prop = String(prop);

            if (!prop) {
                return;
            }

            prop = prop.split('.');

            var t = this;

            for (var i = 0; i < prop.length - 1; i++) {
                if (t == null) {
                    throw new Error('property "' + prop[i] + '" is null or undefined');
                } else {
                    t = t[prop[i]];
                }
            }

            t[prop[prop.length - 1]] = value;
        },

        /**
         * 绑定方法上下文
         * @param fnName
         */
        bindThis: function (fnName) {
            var fn = this[fnName];

            if (!fn) {
                throw new Error('function "' + fnName + '" is not found.');
            }

            if (!Function.isFunction(fn)) {
                throw new Error('property "' + fnName + '" is not a function.');
            }

            return fn.bind(this);
        }
    });

    /**
     * Date 扩展
     */
    defineProp(Date.prototype, {
        /**
         * 计算天数差
         * @param that
         * @return {number}
         */
        dayDiff: function (that) {
            var exp = new Date(that).getTime();
            var nowtime = new Date().getTime();
            var differDays = (exp - nowtime) / (24 * 60 * 60 * 1000);

            return differDays;
        },

        /**
         * 格式化
         * @param fmt
         * @return {*}
         */
        format: function (fmt) {
            var o = {
                "M+": this.getMonth() + 1, //月份
                "d+": this.getDate(), //日
                "h+": this.getHours(), //小时
                "m+": this.getMinutes(), //分
                "s+": this.getSeconds(), //秒
                "q+": Math.floor((this.getMonth() + 3) / 3), //季度
                "S": this.getMilliseconds() //毫秒
            };

            if (/(y+)/.test(fmt))
                fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));

            for (var k in o)
                if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));

            return fmt;
        },

        /**
         *
         * @return {*}
         */
        toJSON: function () {
            return this.format('yyyy-MM-dd hh:mm:ss');
        }
    });

    /**
     * Array 扩展
     */
    defineProp(Array.prototype, {
        /**
         * 摘自：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/find
         * @param predicate
         * @return {*}
         */
        find: function (predicate) {
            // 1. Let O be ? ToObject(this value).
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[1];

            // 5. Let k be 0.
            var k = 0;

            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return kValue.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return kValue;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return undefined.
            return undefined;
        },

        /**
         * 摘自：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/findIndex
         * @param evaluator
         * @param thisArg
         */
        findIndex: function (evaluator, thisArg) {
            'use strict';
            if (!this) {
                throw new TypeError('Array.prototype.some called on null or undefined');
            }

            if (typeof(evaluator) !== 'function') {
                if (typeof(evaluator) === 'string') {
                    // Attempt to convert it to a function
                    if (!(evaluator = eval(evaluator))) {
                        throw new TypeError();
                    }
                } else {
                    throw new TypeError();
                }
            }

            var i;
            if (thisArg === undefined) {  // Optimize for thisArg
                for (i in this) {
                    if (evaluator(this[i], i, this)) {
                        return i;
                    }
                }
                return -1;
            }
            for (i in this) {
                if (evaluator.call(thisArg, this[i], i, this)) {
                    return i;
                }
            }

            return -1;
        },

        /**
         * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
         * @param searchElement
         * @param fromIndex
         * @return {*}
         */
        indexOf: function (searchElement, fromIndex) {

            var k;

            // 1. Let O be the result of calling ToObject passing
            //    the this value as the argument.
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            var O = Object(this);

            // 2. Let lenValue be the result of calling the Get
            //    internal method of O with the argument "length".
            // 3. Let len be ToUint32(lenValue).
            var len = O.length >>> 0;

            // 4. If len is 0, return -1.
            if (len === 0) {
                return -1;
            }

            // 5. If argument fromIndex was passed let n be
            //    ToInteger(fromIndex); else let n be 0.
            var n = +fromIndex || 0;

            if (Math.abs(n) === Infinity) {
                n = 0;
            }

            // 6. If n >= len, return -1.
            if (n >= len) {
                return -1;
            }

            // 7. If n >= 0, then Let k be n.
            // 8. Else, n<0, Let k be len - abs(n).
            //    If k is less than 0, then let k be 0.
            k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

            // 9. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ToString(k).
                //   This is implicit for LHS operands of the in operator
                // b. Let kPresent be the result of calling the
                //    HasProperty internal method of O with argument Pk.
                //   This step can be combined with c
                // c. If kPresent is true, then
                //    i.  Let elementK be the result of calling the Get
                //        internal method of O with the argument ToString(k).
                //   ii.  Let same be the result of applying the
                //        Strict Equality Comparison Algorithm to
                //        searchElement and elementK.
                //  iii.  If same is true, return k.
                if (k in O && O[k] === searchElement) {
                    return k;
                }
                k++;
            }
            return -1;
        },

        /**
         * 分组
         * @param g
         * @param attachKey
         * @return {Array}
         */
        groupBy: function (g) {
            var groupKeys = {};

            return this.reduce(function (groups, item) {
                var _g = g(item),
                    key = typeof _g == 'object' ? _g._groupKey : _g,
                    group = typeof _g == 'object' ? (_g._group || _g) : item;

                if (key in groupKeys) {
                    groups[groupKeys[key]].detail.push(item);
                } else {
                    group._groupKey = key;
                    group.detail = [item];

                    groupKeys[key] = groups.length;
                    groups[groupKeys[key]] = group;
                }

                return groups;
            }, []);
        },

        /**
         * 数组转map
         * @param key
         */
        toMap: function (key) {
            var keyFn = Function.isFunction(key) ? key : function (item) {
                return item[key];
            };

            return this.reduce(function (map, item) {
                map[keyFn(item)] = item;

                return map;
            }, {});
        },

        /**
         * 求和
         */
        sum: function (fn) {
            fn = fn || function (item) {
                    return item;
                };

            return this.reduce(function (sum, item) {
                return sum += fn(item);
            }, 0);
        }
    });

    /**
     * String 扩展
     */
    defineProp(String.prototype, {
        startsWith: function (searchString, position) {
            return this.substr(position || 0, searchString.length) === searchString;
        },

        endsWith: function () {
            var toString = {}.toString;

            if (this == null) {
                throw TypeError();
            }
            var string = String(this);
            if (search && toString.call(search) == '[object RegExp]') {
                throw TypeError();
            }
            var stringLength = string.length;
            var searchString = String(search);
            var searchLength = searchString.length;
            var pos = stringLength;
            if (arguments.length > 1) {
                var position = arguments[1];
                if (position !== undefined) {
                    // `ToInteger`
                    pos = position ? Number(position) : 0;
                    if (pos != pos) { // better `isNaN`
                        pos = 0;
                    }
                }
            }
            var end = Math.min(Math.max(pos, 0), stringLength);
            var start = end - searchLength;
            if (start < 0) {
                return false;
            }
            var index = -1;
            while (++index < searchLength) {
                if (string.charCodeAt(start + index) != searchString.charCodeAt(index)) {
                    return false;
                }
            }
            return true;
        },

        /**
         * 返回字符串字节长度
         * @returns {Number}
         */
        byteLength: function () {
            return this.replace(/[^\x00-\xff]/g, 'aa').length;
        },

        /**
         * 字符串差值
         * 差值格式：${}
         * 调用示例：
         * 1.'hello, ${name}'.interpolate({name: 'aaaa'})
         * 2.'hello, ${a.name}'.interpolate({a: {name: 'aaaa'}})
         * 3.'hello, ${name}'.interpolate({name: function(){ return this._name; }, _name: 'aaaa'})
         */
        interpolate: function (ctx) {
            var re = /\$\{(.+?)\}/g, fields = [], m = null;

            while (m = re.exec(this)) {
                fields.push(m[1]);
            }

            var parts = this.split(/\$\{.+?\}/g);

            return fields.reduce(function (str, f, idx) {
                var p = ctx.getProp(f);

                if (Function.isFunction(p)) {
                    p = p.call(ctx);
                }

                return str += (p == null ? '' : p) + parts[idx + 1];
            }, parts[0]);
        }
    });

    /**
     * Number 扩展
     */
    defineProp(Number.prototype, {
        /**
         * 四舍五入
         * @param decimal 保留小数位数
         * @return {number}
         */
        round: function (decimal) {
            var str = this.toFixed(decimal);

            return Number(str.replace(rZeroTail, ''));
        }
    });

    /**
     * Function 扩展
     */
    defineProp(Function.prototype, {
        /**
         * 函数调用计时
         * @param name
         * @param thisArg
         * @return {Function}
         */
        withMonitor: function (name, thisArg) {
            var fn = this;

            return function () {
                console.time(name);

                var ret = fn.apply(thisArg, arguments);

                console.timeEnd(name);

                return ret;
            }
        },

        /**
         * 代理
         * @param fn 代理函数
         *        参数：
         *          original 原始函数
         *          args... 调用参数
         * @return {Function}
         */
        delegate: function (fn) {
            if (!Function.isFunction(fn)) {
                throw new Error('delegate function is not a function.');
            }

            var oFn = this;

            return function () {
                var _this = this;

                var original = function () {
                    return oFn.apply(_this, arguments);
                };

                var delegateArgs = [].slice.apply(arguments);
                delegateArgs.splice(0, 0, original);

                return fn.apply(_this, delegateArgs);
            }
        }
    });

    /**
     * 类型判断
     */
    (function () {
        function is(type) {
            return function (o) {
                return $.type(o) === type;
            }
        }

        defineProp(Object, {
            isObject: is('object')
        });
        defineProp(Array, {
            isArray: is('array')
        });
        defineProp(Function, {
            isFunction: is('function')
        });
        defineProp(Number, {
            isNumber: is('number')
        });
        defineProp(Boolean, {
            isBoolean: is('boolean')
        });
        defineProp(String, {
            isString: is('string')
        });
    })();

    /**
     * include, exclude, clean
     */
    (function () {

        function _(key, o) {
            return key[0] === '_';
        }

        function all(key, o) {
            return true;
        }

        function none(key, o) {
            return false;
        }

        function not(fn) {
            return function () {
                return !fn.apply(this, arguments);
            }
        }

        function grab(o, grabFn) {
            var copy = {};

            for (var k in o) {
                grabFn(k, o) && (copy[k] = o[k]);
                //!grabFn(k, o) && (delete o[k]);
            }

            return copy;
        }

        defineProp(Object.prototype, {
            /**
             * 去除对象里不需要的字段
             *
             * @param {Array|Function} exclude
             * 1.Function: 选择函数. 入参：key-属性名，o-对象，返回true代表要删除该属性
             * 2.Array: 需要删除的属性名数组
             * @return {Object}
             */
            exclude: function (exclude) {
                var grabFn = all;

                if (Function.isFunction(exclude)) {

                    grabFn = not(exclude);

                } else if (Array.isArray(exclude)) {

                    grabFn = function (key, o) {
                        return !(exclude.indexOf(key) >= 0);
                    };
                }

                return grab(this, grabFn);
            },

            /**
             * 选取对象属性
             *
             * @param {Array|Function} include
             * 1.Function: 选择函数. 入参：key-属性名，o-对象，返回true代表要需选取该属性
             * 2.Array: 需要选取的属性名数组
             * @return {Object}
             */
            include: function (include) {
                var exclude = none;

                if (Function.isFunction(include)) {
                    exclude = not(include);
                } else if (Array.isArray(include)) {
                    exclude = function (key, o) {
                        return !(include.indexOf(key) >= 0);
                    }
                }

                return this.exclude(exclude);
            },

            /**
             * 删除对象及其子对象所有下划线开头的属性
             * @return {Object}
             */
            clean: function () {
                var copy = this.exclude(_);

                for (var k in copy) {
                    var o = this[k];

                    if (Object.isObject(o) || Array.isArray(o)) {
                        copy[k] = o.clean();
                    }
                }

                return copy;
            }
        });

        defineProp(Array.prototype, {
            /**
             * 去除数组里所有对象不需要的字段
             *
             * @param {Array|Function} exclude 需要去除的属性
             * 1.Function: 选择函数. 入参：key-属性名，o-对象，返回true代表要删除该属性
             * 2.Array: 需要删除的属性名数组
             * @return {Object}
             */
            exclude: function (exclude) {
                for (var i = 0; i < this.length; i++) {
                    this[i] = this[i].exclude(exclude);
                }

                return this;
            },

            /**
             * 选取对象属性
             *
             * @param {Array|Function} include
             * 1.Function: 选择函数. 入参：key-属性名，o-对象，返回true代表要需选取该属性
             * 2.Array: 需要选取的属性名数组
             * @return {Object}
             */
            include: function (include) {
                for (var i = 0; i < this.length; i++) {
                    this[i] = this[i].include(include);
                }

                return this;
            },

            /**
             * 删除数组里所有对象及其子对象下划线开头的属性
             */
            clean: function () {
                for (var i = 0; i < this.length; i++) {
                    var o = this[i];

                    if (Object.isObject(o) || Array.isArray(o)) {
                        this[i] = o.clean();
                    }
                }

                return this;
            }
        });
    })();

    /**
     * jQuery hack
     */
    (function (jQuery) {
        /**
         * jQuery.param 摘自 jQuery-3.2.1
         *
         * 1.默认的序列化实现用“[]”来标识属性，这里采用“.”
         * 2.默认的实现会把null值序列化成空字符串，这里忽略null值
         * 3.忽略所有以下划线开头的属性
         * 4.日期格式化成：yyyy-MM-dd hh:mm:ss
         */

        var rbracket = /\[\]$/;

        function buildParams(prefix, obj, traditional, add) {
            var name;

            if (Array.isArray(obj)) {

                // Serialize array item.
                jQuery.each(obj, function (i, v) {
                    if (traditional || rbracket.test(prefix)) {

                        // Treat each array item as a scalar.
                        add(prefix, v);

                    } else {

                        // Item is non-scalar (array or object), encode its numeric index.
                        buildParams(
                            //prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
                            (typeof v === "object" && v != null ? prefix + "[" + i + "]" : prefix), // HACK
                            v,
                            traditional,
                            add
                        );
                    }
                });

            } else if (!traditional && jQuery.type(obj) === "object") {

                // Serialize object item.
                for (name in obj) {

                    buildParams(prefix + "." + name, obj[name], traditional, add);
                }

            } else {

                // Serialize scalar item.
                add(prefix, obj);
            }
        }

        // Serialize an array of form elements or a set of
        // key/values into a query string
        jQuery.param = function (a, traditional) {
            var prefix,
                s = [],
                add = function (key, valueOrFunction) {

                    // If value is a function, invoke it and use its return value
                    var value = jQuery.isFunction(valueOrFunction) ?
                        valueOrFunction() :
                        valueOrFunction;

                    if (value == null)
                        return;

                    if (value instanceof Date) {
                        value = value.format('yyyy-MM-dd hh:mm:ss');
                    }

                    s[s.length] = encodeURIComponent(key) + "=" +
                        encodeURIComponent(value == null ? "" : value);
                };

            // HCAK: 自动清理参数
            if (Object.isObject(a)) {
                a.clean();
            }

            // If an array was passed in, assume that it is an array of form elements.
            if (Array.isArray(a) || ( a.jquery && !jQuery.isPlainObject(a) )) {

                // Serialize the form elements
                jQuery.each(a, function () {
                    add(this.name, this.value);
                });

            } else {

                // If traditional, encode the "old" way (the way 1.3.2 or older
                // did it), otherwise encode params recursively.
                for (prefix in a) {
                    buildParams(prefix, a[prefix], traditional, add);
                }
            }

            // Return the resulting serialization
            return s.join("&");
        };
    })($);

    /**
     * 1.系统json反序列化方法重写
     * 2.jQuery json反序列化采用系统提供的方法
     *
     * 主要是针对时间的反序列化处理
     */
    (function () {
        var oParse = window.JSON.parse;
        var rDate1 = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2}(?:\.*\d*)?)Z*$/;
        var rDate2 = /^\/+Date\\((-?[0-9]+)\.*\\)\/+$/g;

        window.JSON.parse = function (json) {
            return oParse(json, function (key, value) {
                if (typeof value === 'string') {

                    rDate1.lastIndex = 0;
                    var a = rDate1.exec(value);
                    if (a) {
                        return new Date(a[1], a[2] - 1, a[3], a[4], a[5], a[6]);
                    }

                    rDate2.lastIndex = 0;
                    var a = rDate2.exec(value);
                    if (a) {
                        return new Date(parseInt(a[1]));
                    }
                }
                return value;
            });
        };

        $.ajaxSetup({
            converters: {
                'text json': window.JSON.parse
            }
        });
    })();

    return wdlib;

});