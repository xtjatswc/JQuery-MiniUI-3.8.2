define(['wd-lib', 'miniui-wd', 'domReady!'], function (wdlib, mini) {
    /**
     * IMPORT: 开发的时候为true，发布的时候改为false
     * @type {boolean}
     */
    var DEBUG = true;

    var $ = mini.jQuery,
        topWin = mini.getTopWindow(),
        topMini = topWin.mini;

    /**
     * NOTE: 递归触发父页面相关事件。鼠标相关的事件可触发下拉框，菜单等控件自动隐藏
     *       接下去考虑添加 键盘 相关的事件（？？）：用于方便快捷键操作
     */
    ['mousedown', 'click'].forEach(function (event) {
        $(document).on(event, function (e) {
            var p = window;

            try {
                while (p = mini.getParentWin(p, true)) {
                    var $ = p.jQuery;
                    $(p.document).trigger(event, [document]);
                }
            } catch (ex) {
            }
        });
    });

    window.onerror = function (msg, url, l, c, e) {
        showMessageBox(getCurrentView(), 'error', '错误', msg, ['ok']);
    };

    $(window).trigger('load');

    /**
     * 禁用右键处理函数
     * @param e
     * @return {boolean}
     */
    function disableContextMenuHandler(e) {
        return false;
    }

    /**
     * 热键实现
     * 代码实现参考：jquery.hotkeys
     * https://github.com/tzuryby/jquery.hotkeys
     */
    var bindHotKey = (function (jQuery) {

        var hotkeys = {
            version: "0.8+",

            specialKeys: {
                8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
                20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
                37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
                96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
                104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111: "/",
                112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
                120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 188: ",", 190: ".",
                191: "/", 224: "meta"
            },

            shiftNums: {
                "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
                "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
                ".": ">", "/": "?", "\\": "|"
            }
        };

        return function (hotkey, fn) {
            //use namespace as keys so it works with event delegation as well
            //will also allow removing listeners of a specific key combination
            //and support data objects
            var keys = (hotkey || '').toLowerCase().split(' ');

            keys = jQuery.map(keys, function (key) {
                return key.split('.');
            });

            //no need to modify handler if no keys specified
            //Added keys[0].substring(0, 12) to work with jQuery ui 1.9.0
            //Added accordion, tabs and menu, then jquery ui can use keys.

            if (keys.length === 1 && (keys[0] === '' ||
                keys[0].substring(0, 12) === 'autocomplete' ||
                keys[0].substring(0, 9) === 'accordion' ||
                keys[0].substring(0, 4) === 'tabs' ||
                keys[0].substring(0, 4) === 'menu')) {
                return;
            }

            var handler = function (event) {
                // 允许焦点在内容可编辑区域触发事件
                // Don't fire in text-accepting inputs that we didn't directly bind to
                // important to note that $.fn.prop is only available on jquery 1.6+
                // if (this !== event.target && (/textarea|select/i.test(event.target.nodeName) ||
                //     event.target.type === 'text' || $(event.target).prop('contenteditable') == 'true' )) {
                //     return;
                // }

                // Keypress represents characters, not special keys
                var special = event.type !== 'keypress' && hotkeys.specialKeys[event.which],
                    character = String.fromCharCode(event.which).toLowerCase(),
                    key, modif = '', possible = {};

                // check combinations (alt|ctrl|shift+anything)
                if (event.altKey && special !== 'alt') {
                    modif += 'alt_';
                }

                if (event.ctrlKey && special !== 'ctrl') {
                    modif += 'ctrl_';
                }

                // TODO: Need to make sure this works consistently across platforms
                if (event.metaKey && !event.ctrlKey && special !== 'meta') {
                    modif += 'meta_';
                }

                if (event.shiftKey && special !== 'shift') {
                    modif += 'shift_';
                }

                if (special) {
                    possible[modif + special] = true;

                } else {
                    possible[modif + character] = true;
                    possible[modif + hotkeys.shiftNums[character]] = true;

                    // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
                    if (modif === 'shift_') {
                        possible[hotkeys.shiftNums[character]] = true;
                    }
                }

                for (var i = 0, l = keys.length; i < l; i++) {
                    if (possible[keys[i]]) {
                        return fn.apply(this, arguments);
                    }
                }
            };

            jQuery(document).bind('keydown', handler);

            // document.addEventListener('keydown', function (e) {
            //     console.log(e);
            // }, false);
        }

    })($);

    /**
     * mini 扩展
     * 这部分内容的扩展和View相关，View依赖miniui-wd
     * 所以这部分代码不放到miniui-wd下
     */
    (function (mini, $) {

        // 相关UI常量
        mini.WdDataGrid.HeaderAlign = 'center';
        mini.WdDataGrid.TextAlign = 'left';
        mini.WdDataGrid.NumberAlign = 'right';
        mini.WdDataGrid.EnumAlign = 'center';
        mini.WdLayout.DefaultWidthWest = 230;


        /**
         * Panel 获取内容View对象
         */
        function getView() {
            var window = this.getContentWindow();

            return window && window.view;
        }

        mini.Panel.prototype.getView = getView;
        mini.Window.prototype.getView = getView;


        /**
         * 加载iframe（Tabs，Panel）时的遮罩处理
         * @param options
         */
        function frameLoadMask(options) {
            if (options == undefined) {
                options = {};
            }

            if (typeof options == 'string')
                options = {html: options};

            if (!options.backStyle) {
                options.backStyle = 'background:#fdfdfd;opacity:1';
            }

            this.constructor.superclass.mask.call(this, options);
        }

        mini.wdExtend(mini.WdPanel, {
            mask: frameLoadMask
        });
        mini.wdExtend(mini.WdTabs, {
            mask: frameLoadMask
        });


        /**
         * mini.createIFrame hack
         */
        var oCreateIFrame = mini.createIFrame;
        mini.createIFrame = function (url, onIFrameLoad, cache, method, params) {

            var args = [].slice.call(arguments);

            args[1] = function (_iframe) {

                var _this = this,
                    _args = arguments;
                var win = _iframe.contentWindow;

                // 跨域检测
                try {
                    var viewReady = win.viewReady;
                } catch (e) {
                }

                if (Function.isFunction(viewReady)) {
                    win.viewReady(function (view) {
                        onIFrameLoad.apply(_this, _args);
                    });
                } else {
                    return onIFrameLoad.apply(_this, _args);
                }
            };

            return oCreateIFrame.apply(this, args);
        }

    })(mini, $);

    /**
     * 获取当前窗口对象
     * @return {View|*}
     */
    function getCurrentView() {
        return window.view;
    }

    /**
     * 获取查询参数
     * @param name
     * @return {Array|{index: number, input: string}|string}
     */
    function getSearchParameter(name) {

        var search = window.location.search;
        var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');

        var r = search.substr(1).match(reg);

        return r && window.decodeURIComponent(r[2]);
    }

    /**
     * 解析窗口参数
     * @return {{}}
     */
    function parseParameters() {
        var r = getSearchParameter('parameter');

        if (r) {
            return window.JSON.parse(
                window.decodeURIComponent(r)
            );
        }

        return {};
    }

    /**
     * 关闭当前窗口，用于作为子窗口的情况
     * @param 返回给父窗口的结果 result
     * @return {*}
     */
    function innerClose(result) {
        if (window.CloseOwnerWindow)
            return window.CloseOwnerWindow(mini.clone({result: result}));
        else
            window.close();
    }

    /**
     * 创建View方法
     * @param view
     * @param method
     * @return {(function(this:T))|*}
     */
    function createMethod(view, method, name) {
        // 重写方法处理
        if (name == 'ready') {
            override(name, method);

            return;
        }

        if (name in view) {
            console.warn('method "' + name + '" already exists.');
        }

        if (name.endsWith('WithWaiting')) {
            return view.withWaiting(method.bind(view));
        } else {
            return method.bind(view);
        }
    }

    function createProperty(view, property, name) {
        if (name in view) {
            console.warn('property "' + name + '" already exists.');
        }

        return property;
    }

    /**
     * 创建View成员
     * @param view
     * @param members
     */
    function createMembers(view, members) {
        var newMembers = {};

        for (var m in members) {
            var member = members[m];

            if (m in newMembers) {
                throw new Error(
                    'duplicate ' + (Function.isFunction(member) ? 'method' : 'property') + ' "' + m + '".');
            }

            if (members.hasOwnProperty(m) && Function.isFunction(member)) {
                var method = createMethod(view, member, m);

                method && (newMembers[m] = method);
            } else {
                var property = createProperty(view, member, m);

                (property !== undefined) && (newMembers[m] = property);
            }
        }

        mini.copyTo(view, newMembers);
    }

    /**
     * HACK IMPORTANT
     * 下面这段代码摘自 miniui 自动parse的逻辑
     * 每次更新miniui的时候需要更新该逻辑
     * 对应当前版本的 miniui 源码范围：7736-7752
     */
    function miniParse() {
        //mini.parse();
        var docEl = document.documentElement;
        if ((isIE6 || isIE7) &&
            (mini.getStyle(document.body, "overflow") == "hidden" || (docEl && mini.getStyle(docEl, "overflow") == "hidden"))
        ) {
            jQuery(document.body).css("overflow", "visible");
            if (docEl) jQuery(docEl).css("overflow", "visible");

        }


        mini.__LastWindowWidth = document.documentElement.clientWidth;
        mini.__LastWindowHeight = document.documentElement.clientHeight;

        mini.isReady = true;
        mini.parse(null, mini_layoutOnParse);
        mini._FireBindEvents();
    }

    /**
     * 解析页面
     * @param view
     */
    function parse(view) {
        wdlib.delay(function () {
            /**
             * 自适应：查看顶部 $(window).trigger('load');
             */
            //mini.on(window, 'resize', mini_onresize);

            miniParse();

            this.__ready = true;

            this.ready();

            //mini.unmask();
            Function.isFunction(window.__viewReady) && window.__viewReady(this);

            this.focus();
        }, null, view);
    }

    /**
     * 页面准备
     * @param view
     */
    function prepare(view) {
        view.debug ? view.enableContextMenu() : view.disableContextMenu();
    }

    /**
     * 提示消息
     * @param state
     * @param msg
     */
    function showTip(state, msg) {
        topMini.showTips({
            content: msg,
            state: state,
            x: 'center',
            y: 'center',
            timeout: 5000
        });
    }

    /**
     * 消息框
     */
    function showMessageBox(view, state, title, msg, actions, editor) {

        try {
            setViewBlocked(true);

            return topMini.wdShowMessageBox(state, title, msg, actions, editor).close(function () {
                setViewBlocked(false);
                view && view.focus();
            });
        } catch (e) {
            setViewBlocked(false);
            view && view.focus();
        }
    }

    /**
     * 打开对话框
     * @param view 当前窗口
     * @param opts
     * @param {Object} winParam 窗口参数-可选
     */
    function open(view, opts, winParam) {
        var loadPromise = $.Deferred(),
            destroyPromise = $.Deferred();

        var onload = opts.onload,
            ondestroy = opts.ondestroy;

        if (winParam) {
            wdlib.appendQueryString(opts.url,
                'parameter=' + encodeURIComponent(window.JSON.stringify(winParam)));
        }

        var closingCb = null;

        opts.onload = function () {
            var ret;

            if (Function.isFunction(onload)) {
                ret = onload.apply(this, arguments);
            }

            loadPromise.resolve(this.getContentWindow());

            return ret;
        };
        opts.ondestroy = function (data) {
            var ret;

            if (Function.isFunction(ondestroy)) {
                ret = ondestroy.apply(this, arguments);
            }

            if (ret !== false) {

                var iframeEl = this.getIFrameEl();

                if (Function.isFunction(closingCb)) {
                    ret = closingCb.call(iframeEl.contentWindow, data === 'close' ? undefined : data.result);
                }
            }

            if (ret !== false) {
                destroyPromise.resolve({
                    data: data,
                    iframe: iframeEl,
                    win: iframeEl.contentWindow
                });
            }

            return ret;
        };

        var holder = {
            load: function (cb) {
                loadPromise.then(function (win) {
                    cb.call(win);
                });

                return holder;
            },

            viewReady: function (cb) {
                view.delay(function () {
                    loadPromise.then(function (win) {
                        if (Function.isFunction(win.viewReady)) {
                            win.viewReady(cb);
                        }
                    });
                });

                return holder;
            },

            close: function (cb) {
                destroyPromise.then(function (data) {
                    if (data.data === 'close') {
                        cb.call(data.win);
                    } else {
                        cb.call(data.win, data.data.result);
                    }
                });

                return holder;
            },

            closing: function (cb) {
                closingCb = cb;

                return holder;
            }
        };

        mini.open(opts);

        return holder;
    }

    /**
     * promptText
     * @param view 当前窗口
     * @param label
     * @param title
     * @param multi
     * @return {*}
     */
    function promptText(view, label, title, multi) {
        return promptEditor(view, title, {
            type: multi ? 'wd-textarea' : 'wd-textbox',
            width: '100%',
            label: label,
            labelField: true,
            labelPosition: 'top'
        });
    }

    /**
     * promptEditor
     * @param view 当前窗口
     * @param title
     * @param editor
     * @return {{}}
     */
    function promptEditor(view, title, editor) {
        var holder = null;

        for (var p in editor) {
            if (p.toLowerCase().indexOf('on') == 0) {
                var fn = editor[p];

                if (Function.isFunction(fn)) {
                    editor[p] = function () {
                        return fn.apply(holder, arguments);
                    }
                }
            }
        }

        return holder = showMessageBox(
            view,
            null,
            title || '请输入',
            null,
            ['ok', 'cancel'],
            topMini.create(editor));
    }

    /**
     * 打印url
     * @param url
     * @param opt
     */
    function printUrl(url, opt) {
        var sp = url.split('?'),
            path = sp[0],
            qs = sp[1] || '';

        opt = opt || {};

        if (!path.endsWith('.xml')) {
            path += '.xml';
        }
        var xmlurl = /^(http|https)/.test(path) ?
            path + '?' + qs :
            'http://' + window.location.host + path + '?' + qs;

        var printOpt = {xmlurl: xmlurl};

        if (opt.postData) {
            printOpt.jsonbody = JSON.stringify(opt.postData);

            delete opt.postData;
        }

        mini.copyTo(printOpt, opt);

        window.top.CPRINTER.LODOPPRINTURL(printOpt);
    }

    function printHtml(opt) {
        window.top.CPRINTER.LODOPPRINT(opt);
    }

    /**
     * 重写
     */
    function override(name, fn) {
        var m = View.prototype[name];

        if (!Function.isFunction(m)) {
            throw new Error('method "' + name + '" is not a function.');
        }

        View.prototype[name] = m.delegate(fn);
    }

    /**
     * 设置界面阻塞状态
     * @param blocked 是否阻塞（模态）
     */
    function setViewBlocked(blocked) {
        window.blocked = blocked;
    }

    /**
     * 界面当前是否处于阻塞状态
     * @return {boolean}
     */
    function isViewBlocked() {
        return window.blocked === true;
    }

    /**
     * 视图构造器
     * @param components
     * @param members
     * @param debug
     * @constructor
     */
    function View(components, members, debug) {

        this.debug = (debug === undefined ? DEBUG : debug);

        createMembers(this, members);

        components.apply(this, [mini.options, this]);

        parse(this);

        prepare(this);

        window.view = this;
    }

    /**
     * ready 回调
     */
    View.prototype.ready = function () {
        //...
    };

    /**
     * 取页面参数（入参，有别于查询参数）
     *
     * @param {String} name - 参数名.
     */
    View.prototype.getParameter = function (name) {
        return this.getParameters()[name];
    };

    /**
     * 取页面参数（入参，有别于查询参数）
     *
     * @param {String} name - 参数名.
     */
    View.prototype.getParameters = (function () {
        var params;

        return function () {
            return params || (params = parseParameters());
        }
    })();

    /**
     * 获取页面查询参数
     *
     * @param {String} name 参数名 .
     * @returns {String}
     */
    View.prototype.getSearchParameter = function (name) {
        return this.getSearchParameters()[name];
    };

    /**
     * 获取页面所有查询参数
     *
     * @param {String} name 参数名 .
     * @returns {String}
     */
    View.prototype.getSearchParameters = (function () {
        var params;

        return function () {
            return params || (params = wdlib.getUrlParams());
        }
    })();

    /**
     * 延迟
     * @param fn
     * @param args
     * @param ctx
     * @param sec
     */
    View.prototype.delay = function (fn, args, ctx, sec) {
        wdlib.delay(fn, args, ctx || this, sec);
    };

    /**
     * 获取控件
     *
     * @param {String} id 控件id .
     */
    View.prototype.c = function (id) {
        return this.mini.get(id);
    };

    /**
     * Promise all
     */
    View.prototype.all = function () {
        return $.when.apply($, arguments);
    };

    /**
     * 关闭当前窗口，用于作为子窗口的情况
     * @param result 返回给父窗口的结果
     * @return {*}
     */
    View.prototype.close = function (result) {
        return innerClose(result);
    };

    /**
     * 打开对话框
     * @param opts
     * @param {Object} winParam 窗口参数-可选
     */
    View.prototype.open = function (opts, winParam) {
        if (String.isString(opts)) {
            opts = {url: opts};
        }

        var view = this;

        if (opts.showModal !== false) {
            /**
             * 模态方式下需要阻塞窗口
             */
            try {
                setViewBlocked(true);

                return open(view, opts, winParam).close(function () {
                    setViewBlocked(false);
                    view.focus();
                });
            } catch (e) {
                setViewBlocked(false);
                view.focus();
            }
        } else {
            return open(view, opts, winParam).close(function () {
                view.focus();
            });
        }
    };

    /**
     * 表单控件回车导航
     * @param formId
     * @param showPopup 下拉框是否自动弹出
     * @param withParents 是否考虑父元素的可见性
     * @param onEnterEnd 回车结束事件
     * @param 表单配置
     * @return {WdForm}
     */
    View.prototype.bindFormEnterKey = function (formId, showPopup, withParents, onEnterEnd, formOpts) {
        return this.mini.bindFormEnterKey(formId, showPopup, withParents, onEnterEnd, formOpts);
    };

    /**
     * 绑定事件
     * @param target
     * @param events
     * @param selector
     * @param data
     * @param handler
     * @return {*|jQuery}
     */
    View.prototype.on = function (target, events, selector, data, handler) {
        return $(target).on(events, selector, data, handler);
    };

    /**
     * success tip
     * @param msg
     */
    View.prototype.showSuccessTip = function (msg) {
        showTip('success', msg);
    };

    /**
     * info tip
     * @param msg
     */
    View.prototype.showInfoTip = function (msg) {
        showTip('info', msg);
    };

    /**
     * warning tip
     * @param msg
     */
    View.prototype.showWarningTip = function (msg) {
        showTip('warning', msg);
    };

    /**
     * error tip
     * @param msg
     */
    View.prototype.showErrorTip = function (msg) {
        showTip('danger', msg);
    };

    /**
     * 消息框
     * @param msg
     * @param title
     */
    View.prototype.showInfo = function (msg, title) {
        return this.showMessageBox(msg, title || '提示', 'info', ['ok']);
    };

    /**
     * 警告框
     * @param msg
     * @param title
     */
    View.prototype.showWarning = function (msg, title) {
        return this.showMessageBox(msg, title || '警告', 'warning', ['ok']);
    };

    /**
     * 错误提示框
     * @param msg
     * @param title
     */
    View.prototype.showError = function (msg, title) {
        return this.showMessageBox(msg, title || '错误', 'error', ['ok']);
    };

    /**
     * 加载框
     * @param msg
     * @param title
     */
    View.prototype.showLoading = function (msg, title, actions) {
        if (!String.isString(title)) {
            actions = title;
            title = null;
        }

        return this.showMessageBox(msg, title || '加载中...', 'waiting', actions || []);
    };

    /**
     * 消息框
     * @param msg
     * @param title
     * @param state
     * @param actions
     * @return {{}}
     */
    View.prototype.showMessageBox = function (msg, title, state, actions) {
        if (typeof title !== 'string') {
            title = '消息';
            state = 'info';
            actions = ['ok'];
        } else if (typeof state !== 'string') {
            state = 'info';
            actions = ['ok'];
        } else if (!actions) {
            actions = ['ok'];
        }

        return showMessageBox(this, state, title, msg, actions);
    };

    /**
     * confirm
     * @param msg
     * @param title
     * @return {{}};
     */
    View.prototype.confirm = function (msg, title) {
        return this.showMessageBox(msg, title || '确认', 'question', ['ok', {
            action: 'cancel',
            text: '取消',
            autoFocus: true
        }]);
    };

    /**
     * prompt
     * @param label
     * @param title
     * @param editor
     * @return {*}
     */
    View.prototype.prompt = function (label, title, editor) {
        if (typeof title === 'object') {
            editor = title;
            title = label;

            return promptEditor(this, title, editor);
        } else {
            var multi = editor;

            return promptText(this, label, title, multi);
        }
    };

    /**
     * waiting-处理-取消waiting
     * @param fn
     * @param msg
     */
    View.prototype.withWaiting = function (fn, msg) {
        var view = this;

        return mini.withWaiting(fn, msg, function () {
            setViewBlocked(true);
        }, function () {
            setViewBlocked(false);
            view.focus();
        });
    };

    /**
     * 附加一系列需要waiting支持的方法到当前view对象
     * @param fns
     * @param ctx
     * @param msg
     */
    View.prototype.addWithWaiting = function (name, fn, msg) {
        if (name in this) {
            throw new Error('property "' + name + '" already exists.');
        }

        this[name] = createMethod(this, this.withWaiting(fn, msg), name);
    };

    /**
     * 监控方法
     * @param fn
     */
    View.prototype.withMonitor = function (fn) {
        var method = this[fn];

        if (!method) {
            throw new Error('View method "' + fn + '" is not found.');
        }

        if (!Function.isFunction(method)) {
            throw new Error('View method "' + fn + '" is not a function.');
        }

        this[fn] = method.withMonitor(fn, this);
    };

    /**
     * 禁用右键
     */
    View.prototype.disableContextMenu = function () {
        $(document).bind('contextmenu', disableContextMenuHandler);
    };

    /**
     * 启用右键
     */
    View.prototype.enableContextMenu = function () {
        $(document).unbind('contextmenu', disableContextMenuHandler);
    };

    /**
     *
     */
    View.prototype.log = function () {
        if (this.debug) {
            console.log.apply(console, arguments);
        }
    };

    /**
     * 打印
     * @param url
     * @param opt
     *      opt.title
     *      opt.orient //0--默认 1---纵(正)  //2---横向打印， //3---纵(正)向打印，宽度固定，高度按打印内容的高度自适应；
     *      opt.pagew //纸张宽度 单位0.1mm
     *      opt.pageh //纸张高度
     *      opt.pagetype //pagew =0  pageh=0 时有效 :'A4'
     *      opt.printer //指定打印机名称   -1 默认打印机
     *      opt.top //Y偏移
     *      opt.left //X偏移
     *      opt.width //内容宽度
     *      opt.height //内容高度
     */
    View.prototype.print = function (url, opt) {
        if (String.isString(url)) {
            return printUrl(url, opt);
        } else {
            return printHtml(url);
        }
    };

    /**
     * 重新加载
     */
    View.prototype.reload = function () {
        window.location.reload();
    };

    /**
     * focus
     */
    View.prototype.focus = function () {
        window.focus();
    };

    /**
     * 热键
     * @param hotkey
     * @param fn
     * @param {Boolean} preventDefault 是否取消默认操作，如果未指定，那么是否取消默认操作视fn的返回值（true/false）
     * @param thisArg 回调上下文
     * @param {Array} args 回调参数
     */
    View.prototype.hotkey = function (hotkey, fn, preventDefault, thisArg, args) {
        var view = this;

        if (!Boolean.isBoolean(preventDefault)) {
            args = thisArg;
            thisArg = preventDefault;
        }

        bindHotKey(hotkey.replace(/\+/g, '_'), function (e) {
            if (isViewBlocked()) {
                return false;
            }

            view.focus();

            var possiblyPrevent = fn.apply(thisArg || view, args);

            if (Boolean.isBoolean(preventDefault)) {
                return !preventDefault;
            } else if (Boolean.isBoolean(possiblyPrevent)) {
                return !possiblyPrevent;
            } else {
                return false;
            }
        });
    };

    /**
     * 附加功能
     * @param plugin
     */
    View.add = function (plugin) {
        var proto = View.prototype;

        $.each(plugin, function (prop, value) {
            if (prop in proto) {
                throw new Error('member "' + prop + '" already exists in View\'s prototype');
            }

            proto[prop] = value;
        });

        return View;
    };

    /**
     * 重写
     */
    View.override = function (methods) {
        for (var m in methods) {
            override(m, methods[m]);
        }

        return View;
    };

    /**
     *
     * @type {mini}
     */
    View.prototype.mini = mini;

    /**
     *
     * @type {*}
     */
    View.prototype.$ = $;

    /**
     * lib path TODO
     * @type {string}
     */
    View.prototype.libPath = 'http://' + (window.coreHost || window.top.location.host) + '/wdhis-core-web/static/js/lib/';

    /**
     * mini path
     * @type {string}
     */
    View.prototype.miniPath = View.prototype.libPath + 'miniui/';

    return View;
});
