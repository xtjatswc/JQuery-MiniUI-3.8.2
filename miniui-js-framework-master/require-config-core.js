/**
 * 这个文件用于给各项目（包括核心项目）引用（继承）
 * 因此这里的配置属于所有项目的默认配置，以及每个项目都能引用的模块
 * by shao 2018-02-12
 */

/**
 * 用于注册View的ready回调，
 * 支持多次注册，如果已经ready，那么立即调用注册的所有回调函数，
 * 注册的函数会放到一个名为__viewReady全局函数对象下，多次注册，该对象类似一个函数链
 *
 * @param cb
 */
window.viewReady = function (cb) {
    if (window.view && window.view.__ready) {
        cb(window.view);
    } else {
        var __oViewReady = window.__viewReady;

        window.__viewReady = function (view) {
            if (typeof __oViewReady === 'function') {
                __oViewReady(view);
            } else {
                delete window.__viewReady;
            }

            cb(view);
        };
    }
};

var requirejs = (function () {
    if (typeof (process) != 'undefined') {
        window.noderequire = require;
        delete window.require;
        delete window.exports;
        delete window.module;
    }

    function extend(target, src) {
        for (p in src) {
            var toStr = Object.prototype.toString,
                t = target[p], s = src[p];

            if (s === undefined)
                continue;

            if (toStr.call(t) === '[object Object]' && toStr.call(s) === '[object Object]') {
                target[p] = extend(t, s);
            } else {
                target[p] = s;
            }
        }

        return target;
    }

    var mainRoot = 'http://' + (window.coreHost || window.top.location.host) + '/wdhis-core-web/static/js/',
        mainLib = mainRoot + 'lib/',
        mainWdLib = mainRoot + 'lib-wd/',
        v = function (v) {
            // 如果要统一更改版本，请修改这个变量对应的版本号
            var base_v = '0.1';

            return base_v + '.' + v;
        };

    var base = {
        baseUrl: (window.jsRoot || ''),
        waitSeconds: 0, // disable timeout
        paths: {
            /**
             * NOTE: jquery 依赖3.1.1版本，不要轻易修改，否则miniui控件容易出现样式问题
             *       比如combobox下来时列对齐问题，原因是jquery获取元素尺寸时各个版本的实现不一致
             */
            'jquery': mainLib + 'jquery/jquery-3.1.1',
            'domReady': mainLib + 'require-domReady/2.0.1/domReady.js?v=' + v(1),
            'miniui': mainLib + 'miniui/miniui.js?v=' + v(1),
            'swfupload': mainLib + 'miniui/swfupload/swfupload.js?v=' + v(1),
            'dexie': mainLib + 'dexie.js?v=' + v(1), // IndexedDB 包装库
            'localforage': mainLib + 'localforage.js?v=' + v(1), // localstorage 替代库
            'nativelib': mainWdLib + 'nativelib.js?v=' + v(1),
            'printlib': mainWdLib + 'printlib.js?v=' + v(1),
            'print': mainLib + 'printThis.js?v=' + v(1),
            'layui': mainLib + 'layui/layui',
            'base': mainWdLib + 'base.js?v=' + v(1),
            'wd-lib': mainWdLib + 'wd-lib.js?v=' + v(10),
            'miniui-wd': mainWdLib + 'miniui-wd.js?v=' + v(20),
            'View': mainWdLib + 'View.js?v=' + v(25),
            'ViewWithSystemInfo': mainWdLib + 'ViewWithSystemInfo.js?v=' + v(4),
            'ViewWithPrint': mainWdLib + 'ViewWithPrint.js?v=' + v(1),
            'ViewWithMainInterface': mainWdLib + 'ViewWithMainInterface.js?v=' + v(2),
            'Service': mainWdLib + 'Service.js?v=' + v(4),
            'Cache': mainWdLib + 'Cache.js?v=' + v(1),
            'SystemInfoService': mainRoot + 'service/SystemInfoService.js?v=' + v(5)
        },
        map: {
            '*': {
                'css': mainLib + 'require-css/0.1.8/css.js?v=' + v(1)// RequireJS加载样式文件插件
            }
        },
        shim: {
            'jquery': {
                exports: 'jQuery'
            },
            'miniui': {
                deps: [
                    'jquery',
                    'css!' + mainLib + 'miniui/themes/default/miniui.css?v=' + v(1),
                    // 'css!' + mainLib + 'miniui/themes/default/medium-mode.css?v=' + v(1),
                    // 'css!' + mainLib + 'miniui/themes/default/large-mode.css?v=' + v(1),
                    'css!' + mainLib + 'miniui/themes/default/medium-mode-wd.css?v=' + v(5),
                    'css!' + mainLib + 'miniui/themes/blue2010/skin.css?v=' + v(1),
                    // NOTE: 原先miniui-wd.css这个文件放在miniui-wd的依赖下，会导致miniui-wd.css先于miniui基础样式文件加载的问题
                    'css!' + mainWdLib + 'miniui-wd.css?v=' + v(6),
                    'css!' + mainLib + 'miniui/themes/icons.css?v=' + v(2)
                ],
                exports: 'mini'
            },
            'layui': {
                deps: [
                    'css!' + mainLib + 'layui/css/layui.css'
                ],
                exports: 'layui'
            },
            'print': {
                deps: [
                    'jquery'
                ],
                exports: 'jQuery'
            },
            'miniui-wd': {
                deps: [
                    'miniui',
                    // 'css!' + mainWdLib + 'miniui-wd.css?v=' + v(5) // 放到 miniui 的 deps 下，避免异步加载影响样式层叠
                ],
                exports: 'mini'
            },
            'base': {
                deps: [
                    'jquery'
                ]
            }
        }
    };

    return extend(base, requirejs || {});
})();