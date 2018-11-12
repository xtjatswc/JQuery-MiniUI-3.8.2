/**
 * --miniui 类继承(mini.extend)原理：
 *   参数1：SuperClass 子类构造函数
 *   参数2：SubClass 父类构造函数
 *   参数3：overrides 子类（重写）成员
 *
 *   -将父类构造函数（SuperClass）原型对象（prototype）上的属性都拷贝到子类（SubClass）构造函数原型对象，这样就实现了: 继承
 *   -将第3个参数 overrides 上的所有属性拷贝到子类构造函数原型对象，这样就实现了: 覆盖或重写
 *   -将父类构造函数的原型对象设置到子类构造函数的superclass属性上，如果要访问父类的成员，就使用: SubClass.superclass.父类成员。
 *    例如在子类重写的方法里要调用父类方法(比如setValue)：SubClass.superclass.setValue.apply(this, arguments)
 *    特别的，SubClass.superclass.constructor 能够访问到父类构造函数，一般在子类构造函数中需要调用父类构造函数
 *
 *
 * --miniui控件注册(mini.regClass)：
 *   miniui每个控件都需要进行注册，这样在渲染的时候miniui才能识别
 *   参数1：控件构造函数
 *   参数2：控件类型（字符串）-控件名称的小写形式，如TextBox对应的type为：textbox
 *
 *   minniui 会通过指定的“类型”参数将控件构造函数注册到 mini.classes，
 *   如果控件有uiCls属性（miniui解析时必须用到这个属性），那么会通过指定的“uiCls”值（转为小写）将构造函数注册到 mini.uiClasses
 *   以上分别可用过mini.getClass 和 mini.getClassByUICls 获取到控件构造函数
 *   重复注册将不会替换
 *
 *
 * --miniui 控件渲染(mini._doParse)过程：
 *   1.检查dom元素的类样式（className属性），依次查找，直到找到一个有在mini.uiClasses注册过的构造函数
 *   2.调用构造函数
 *   3.调用 mini.applyTo: mini.applyTo.call(ui, el)，参数分别是第2步构造的控件对象和控件对应的dom元素
 *
 *   下面分别对第2步和第3步进行说明：
 *   第2步：由于控件都继承自基类 Control，Control 继承自顶层的一个Component类，
 *         所以在调用控件构造函数的时候都会依次调用Component和Control的构造函数，
 *         这两个基类的构造函数在构造控件的时候做了如下统一的处理：
 *        1.为控件对象分配一个唯一的id，对应的属性为uid
 *        2.以uid为标识将控件对象注册到全局对象，以id为标识（如没有id，则取uid）将控件对象注册到全局对象；
 *          分别可以通过mini.get(id) 和 mini.getbyUID(uid) 获取对应的控件
 *        3.调用控件的 _create 方法，此方法由各个控件进行重写，进行控件的html构造
 *        4.调用控件的 _initEvents 方法，此方法由各个控件进行重写，进行事件的绑定
 *   第3步：
 *        1.调用控件的 getAttrs 方法，传入对应的dom元素，这一步主要是解析在dom元素上的控件属性
 *        2.调用控件的 set方法，将第1步获取的属性作为参数，将属性设置到控件上
 *        3.调用控件的 _afterApply 方法，传入对应的dom元素，这个类似回调
 *
 *
 * --关于控件的el属性
 *   1.控件的el属性指的是承载控件的根级dom节点
 *   2.miniui对el属性的处理逻辑是这样的：
 *     -一般控件的el属性会在_create方法里进行初始化，基类Control的默认实现就是构造一个div：this.el = document.createElement("div");
 *     -在mini.applyTo里，当miniui发现控件的el属性和渲染时的dom不是同一个的时候，用el替换dom，然后再去渲染el下的所有子元素
 */
define([
    'jquery',
    'miniui',
    'wd-lib'
], function ($,
             mini,
             wdlib) {

    /**
     * miniui 全局变量
     * 关闭该调试标识，防止miniui alert错误消息
     * @type {boolean}
     */
    window.mini_debugger = false;

    var
        /**
         * 获取引入miniui的最顶级窗口
         */
        topWin = mini.getTopWindow(),
        topMini = topWin.mini
    ;

    /**
     * wd-控件事件扩展
     * 当要给控件扩展事件时，比如WdButton，就在EventsExt下增加一个属性：WdButton，命名方式最好是WD控件名称。
     * 然后定义一个_initWdEvents的属性，用于初始化事件
     *
     * 注意：控件的事件处理函数建议以 “__OnWd” 开头，以免和原生的属性冲突
     */
    var EventsExt = {
        WdButton: {
            _initWdEvents: function () {
                mini.on(this.el, 'mouseover', this.__OnWdMouseOver, this);
            },

            __OnWdMouseOver: function () {
                this.fire('mouseover');
            }
        }
    };

    /**
     *
     */
    var DataSourceMembers = function (SuperClass) {
        return {
            pageIndexField: 'pageIndex',
            pageSizeField: 'pageSize',
            sortFieldField: 'sortField',
            sortOrderField: 'sortOrder',
            totalField: 'total',
            dataField: 'list'
        };
    };

    /**
     * 表单控件成员
     */
    var InputEleMembers = function (SuperClass) {
        return {
            getAttrs: function (el) {
                var attrs = SuperClass.getAttrs.apply(this, arguments);

                // label处理
                attrs = processAttrsWithLabel.call(this, el, attrs);

                return attrs;
            },

            /**
             * 行内模式
             */
            inline: null,
            setInline: function (inline) {
                if (this.inline == inline) {
                    return;
                }

                this.inline = inline;

                if (inline) {
                    mini.setStyle(this.el, 'display:inline-block');
                } else {
                    mini.setStyle(this.el, 'display:block');
                }
            },
            getInline: function () {
                return this.inline;
            },

            /**
             * label宽度
             */
            labelWidth: null,
            setLabelWidth: function (width) {
                if (this.labelWidth == width) {
                    return;
                }

                this.labelWidth = width;

                var style = this.getLabelStyle() || '';

                this.setLabelStyle(style += ';width:' + width + 'px');
            },
            getLabelWidth: function () {
                return this.labelWidth;
            },

            /**
             * label文字对齐
             */
            labelAlign: null,
            setLabelAlign: function (align) {
                if (this.labelAlign == align) {
                    return;
                }

                this.labelAlign = align;

                var style = this.getLabelStyle() || '';

                this.setLabelStyle(style += ';text-align:' + align);
            },
            getLabelAlign: function () {
                return this.labelAlign;
            },

            /**
             * label位置
             */
            labelPosition: null,
            setLabelPosition: function (position) {
                if (this.labelPosition == position) {
                    return;
                }

                if (position == 'top') {
                    mini.addClass(this.el, 'mini-labelfield-top');
                }
            },
            getLabelPosition: function () {
                return this.labelPosition;
            },

            /**
             * 空值是否视为null
             */
            emptyAsNull: true,
            setEmptyAsNull: function (emptyAsNull) {
                this.emptyAsNull = emptyAsNull;
            },
            getEmptyAsNull: function () {
                return this.EmptyAsNull;
            },

            /**
             * setValue触发事件
             */
            fireChangeOnSetValue: false,
            setFireChangeOnSetValue: function (value) {
                this.fireChangeOnSetValue = value;
            },
            getFireChangeOnSetValue: function () {
                return this.fireChangeOnSetValue;
            },

            _emptyValue: function (value) {
                if (this.emptyAsNull && value === '') {
                    return null;
                }

                return value;
            },
            getValue: function () {
                if (!Function.isFunction(SuperClass.getValue))
                    return null;

                var value = SuperClass.getValue.apply(this, arguments);

                return this._emptyValue(value);
            },
            setValue: function (value) {

                if (value === undefined) {
                    value = null;
                }

                if (!Function.isFunction(SuperClass.setValue))
                    return;

                var oldValue = this.getValue(),
                    oText = this._textEl && this._textEl.value;

                var ret = SuperClass.setValue.apply(this, arguments);

                if (this.fireChangeOnSetValue) {
                    if (oldValue !== this.getValue()) {
                        // doValueChanged在基类ValidatorBase上
                        this.doValueChanged();
                    }
                }

                if (this._textEl && oText != this._textEl.value) {
                    this._setTip(this._textEl.value);
                }

                return ret;
            },
            getFormValue: function () {
                if (!Function.isFunction(SuperClass.getFormValue))
                    return null;

                var value = SuperClass.getFormValue.apply(this, arguments);

                return this._emptyValue(value);
            },

            setText: function (text) {
                if (!Function.isFunction(SuperClass.setText))
                    return;

                var ret = SuperClass.setText.apply(this, arguments);

                this._setTip(text);

                return ret;
            },

            showTip: false,
            setShowTip: function (showTip) {
                this.showTip = showTip;
            },
            getShowTip: function () {
                return this.showTip;
            },
            _setTip: function (tip) {
                if (this._textEl && this.showTip) {
                    if (tip) {
                        this._textEl.setAttribute('title', tip);
                    } else {
                        this._textEl.removeAttribute('title');
                    }
                }
            },

            asLabel: false,
            setAsLabel: function (asLabel) {
                this.asLabel = asLabel;

                if (asLabel) {
                    if (this.setReadOnly) this.setReadOnly(true); //只读
                    if (this.setIsValid) this.setIsValid(true);   //去除错误提示
                    if (this.addCls) this.addCls('asLabel');      //增加asLabel外观

                    // mini.addClass(this.el, 'asLabel');
                } else {
                    if (this.setReadOnly) this.setReadOnly(false);
                    if (this.removeCls) this.removeCls('asLabel');

                    // mini.removeClass(this.el, 'asLabel');
                }
            }
        };
    };

    /**
     * Grid 成员
     */
    var GridMembers = function (SuperClass) {
        return {

            getAttrs: function (el) {
                var thisClass = this.constructor;
                var attrs = SuperClass.getAttrs.apply(this, arguments);

                if (attrs.pageSize == null) {
                    attrs.pageSize = 50;
                }

                // TreeGrid/TreeSelect 默认加载方式为同步，这里进行强制设置
                if (isInheritFrom(thisClass, mini.WdTreeGrid) || isInheritFrom(thisClass, mini.WdTreeSelect)) {
                    (attrs.ajaxAsync == null) && (attrs.ajaxAsync = true);
                }

                return attrs;
            },

            /**
             * grid getChanges 扩展，适配后台接收数据格式
             * @return {{added: *, modified: *, removed: *}}
             */
            getChangesExt: function () {
                var changes = this.getChanges.apply(this, arguments);
                var added = [], modified = [], removed = [];

                changes.forEach(function (c) {
                    var state = c._state;

                    if (state == 'added') {
                        added.push(c);
                    } else if (state == 'modified') {
                        modified.push(c);
                    } else if (state == 'removed') {
                        removed.push(c);
                    }
                });

                return {
                    added: added.length ? added : undefined,
                    modified: modified.length ? modified : undefined,
                    removed: removed.length ? removed : undefined,
                };
            },

            /**
             * 验证，自动定位错误单元格
             */
            validateWithFocusError: function () {
                this.validate();

                var isValid = this.isValid();

                if (!isValid) {
                    var error = this.getCellErrors()[0];

                    this.beginEditCell(error.record, error.column);
                }

                return isValid ? null : error.errorText;
            },

            /**
             * 行编辑回车导航
             * @param value
             */
            setEditNextOnEnterKeyForRowEdit: function (value) {
                var me = this;

                if (value) {
                    $(this.el).on('keydown.re',
                        '.mini-grid-rowEdit .mini-textbox-input, .mini-grid-rowEdit .mini-buttonedit-input, .mini-grid-rowEdit .mini-textboxlist-input',
                        function (e) {
                            var e = e || window.event;

                            if (e.keyCode == 13) {
                                var nextControl = getNextInput(this);

                                if (nextControl) {
                                    nextControl.focus();

                                    Function.isFunction(nextControl.showPopup) &&
                                    nextControl.showPopup();

                                    Function.isFunction(nextControl.doQuery) &&
                                    nextControl.doQuery();
                                }
                            }
                        });
                } else {
                    $(this.el).off('.re', '.mini-grid-rowEdit .mini-textbox-input, .mini-grid-rowEdit .mini-buttonedit-input, .mini-grid-rowEdit .mini-textboxlist-input');
                }

                function getNextInput(current) {
                    var controls = mini.getChildControls(me).filter(function (c) {
                        return mini.hasClass(c.el, 'mini-grid-editor');
                    });

                    for (var i = 0, l = controls.length; i < l; i++) {
                        var control = controls[i],
                            controlEl = control._textEl || control._inputEl;
                        if (current == controlEl) {
                            for (var j = 0, k = l - i; j < k; j++) {

                                var nextControl = controls[i + j + 1];
                                if (nextControl &&
                                    (nextControl.getEnabled() !== false) &&
                                    (nextControl.getVisible() !== false) &&
                                    (mini.hasClass(nextControl.el, 'mini-textbox') || mini.hasClass(nextControl.el, 'mini-buttonedit') || mini.hasClass(nextControl.el, 'mini-textboxlist')) &&
                                    !mini.hasClass(nextControl.el, 'mini-hidden') &&
                                    !nextControl.skipEnter) {
                                    return nextControl;
                                } else {
                                    continue;
                                }
                            }
                        }
                    }

                    return null;
                }
            },

            /**
             * 行编辑自动焦点
             * @param row
             * @param focusColumn 参数类型和 DataGrid的getColumn方法一致
             * @param showPopup 下拉检索框等是否自动弹出
             */
            beginEditRowWithFocus: function (row, focusColumn, showPopup) {
                var me = this;

                me.beginEditRow(row);

                if (!focusColumn)
                    return;

                window.setTimeout(function () {
                    var eidtor = me.getCellEditor(me.getColumn(focusColumn), row);

                    eidtor.focus();

                    if (showPopup) {
                        Function.isFunction(eidtor.showPopup) &&
                        eidtor.showPopup();

                        Function.isFunction(eidtor.doQuery) &&
                        eidtor.doQuery();
                    }
                }, 100);
            }
        };
    };

    /**
     *
     * @type {{}}
     */
    var PopupEditorMembers = function (SuperClass) {
        return {
            showPopupOnClick: true,

            setEnabled: function () {
                this.hidePopup();

                return SuperClass.setEnabled.apply(this, arguments);
            }
        };
    };

    /**
     * setUrl
     */
    var SetUrl = function (SuperClass) {
        return {
            forceUpdateUrl: false,
            setUrl: function (url, force) {
                var oUrl = this.getUrl();

                if ((force === true || this.forceUpdateUrl === true) || url != oUrl) {
                    return SuperClass.setUrl.apply(this, arguments);
                }
            }
        }
    };

    /**
     * mini控件 -> wd控件基础继承
     * @param miniClass
     */
    function inheritToWd(miniClass) {
        var type = miniClass.toLowerCase(),
            wdType = 'wd-' + type,
            wdClass = 'Wd' + miniClass;

        // 构造函数
        var WdClass = mini[wdClass] = function () {
            // 复用功能
            WdClass.superclass.constructor.apply(this, arguments);
        };

        WdClass.wdClass = wdClass;

        // 继承成员
        var extend = mini.copyTo({
            uiCls: wdType,
            getAttrs: function (el) {
                return getAttrsWithOptions.call(this, WdClass, el);
            },
            _initEvents: function () {
                var ret = WdClass.superclass._initEvents.apply(this, arguments);

                if (this._initWdEvents) {
                    this._initWdEvents.apply(this, arguments);
                }

                return ret;
            },
            _afterApply: function (el) {
                // 复用样式
                this.addCls('mini-' + type);

                WdClass.superclass._afterApply &&
                WdClass.superclass._afterApply.apply(this, arguments);
            }
        }, EventsExt[wdClass] || {});

        // 继承
        mini.extend(WdClass, mini.getClass(type), extend);

        // 注册
        mini.regClass(WdClass, wdType);
    }

    /**
     * 设置标签属性
     * @param el
     * @param attrs
     */
    function setAttrs(el, attrs) {
        if (attrs) {
            for (var k in attrs) {
                mini.setAttr(el, k, attrs[k]);
            }
        }
    }

    /**
     * 自定义的控件属性配置函数
     *
     * @param {String} id - 标签id .
     * @param {Object} opts - 配置 .
     * @param {Boolean} useAttr - 以标签属性的方式设置选项的各个参数 .
     * @see getAttrsWithOptions
     */
    function options(id, opts, useAttr) {
        if (!opts) {
            return;
        }

        var el = document.getElementById(id);

        if (el == null) {
            throw new Error('不存在id为 "' + id + '" 的元素（useAttr=' + (Boolean(useAttr)) + '）');
        }

        useAttr ? setAttrs(el, opts) : $(el).data('options', opts);
    }

    /**
     * getAttrs 统一入口，支持options配置
     *
     * @param ThisClass
     * @param el
     * @returns {*}
     */
    function getAttrsWithOptions(ThisClass, el) {
        var attrs = ThisClass.superclass.getAttrs.call(this, el),
            options = $(el).data('options');

        return mini.copyTo(attrs, options);
    }

    /**
     * 表单label处理
     * @param el
     * @param attrs
     */
    function processAttrsWithLabel(el, attrs) {
        if (attrs.label != undefined && attrs.label !== '') {
            attrs.labelField = true;
            attrs.labelWidth = attrs.labelWidth || 80;
            attrs.labelAlign = attrs.labelAlign || 'right';
        }

        return attrs;
    }

    /**
     * Panel 获取内容window对象
     */
    function getContentWindow() {
        var frameEl = this.getIFrameEl();

        return frameEl && frameEl.contentWindow;
    }

    /**
     * 判断控件继承关系
     *
     * @param {Function} thisClass 子类
     * @param {Function} baseClass 父类(或间接父类)
     * @returns {Boolean}
     */
    function isInheritFrom(thisClass, baseClass) {
        var flag = true;

        if (baseClass === mini.Component)
            return true;

        while ((thisClass !== mini.Component) &&
        (flag = thisClass.superclass !== baseClass.prototype)) {
            thisClass = thisClass.superclass.constructor;
        }

        return !flag;
    }

    /**
     * 判断组件是否兼容 clazz
     *
     * @param cmp
     * @param clazz
     * @returns {Boolean}
     */
    function isInstanceOf(cmp, clazz) {
        return isInheritFrom(cmp.constructor, clazz);
    }

    /**
     * 判断组件是否是 clazz 的实例
     *
     * @param cmp
     * @param clazz
     * @returns {Boolean}
     */
    function isExactlyInstanceOf(cmp, clazz) {
        return cmp.constructor === clazz;
    }

    /**
     * 内部继承函数
     *
     * @param SuperClass
     * @returns {SubClass}
     */
    function extend(SuperClass) {
        var SubClass = function () {
            SubClass.superclass.constructor.apply(this, arguments);
        };

        var overrides = {};
        for (var i = 1; i < arguments.length; i++) {
            mini.copyTo(overrides, arguments[i]);
        }

        mini.extend(SubClass, SuperClass, overrides);
        // 子类替换父类
        mini.classes[SuperClass.prototype.type] =
            mini.uiClasses[SuperClass.prototype.uiCls] =
                mini[SuperClass.wdClass] = SubClass;

        return SubClass;
    }

    /**
     * fix miniui
     * miniui获取尺寸相关的函数，这里将尺寸取整，否则控件有可能会出错，比如combobox弹出框报错。
     * 这是jquery版本问题，miniui在jqiuey 1.9 版本下进行过充分测试
     */
    (function (mini, $) {
        var o_getWidth = mini.getWidth;
        mini.getWidth = function () {
            return parseInt(o_getWidth.apply(this, arguments));
        };
        var o_getHeight = mini.getHeight;
        mini.getHeight = function () {
            return parseInt(o_getHeight.apply(this, arguments));
        };
        var o_getViewportBox = mini.getViewportBox;
        mini.getViewportBox = function () {
            var box = o_getViewportBox.apply(this, arguments);

            var x = box.x,
                y = box.y,
                top = box.top,
                left = box.left,
                w = parseInt(box.width),
                h = parseInt(box.height);

            return {
                x: x,
                y: y,
                top: top,
                left: left,
                width: w,
                height: h,
                right: x + w,
                bottom: y + h
            };
        };
    })(mini, $);

    /**
     * 常量
     */
    (function (mini, $) {
        mini.copyTo(mini.MessageBox, {
            /**
             * 取消编辑确认信息
             */
            EditCancelConfirmMsg: '是否取消编辑？',
            /**
             * 取消新增确认信息
             */
            AddCancelConfirmMsg: '是否取消编辑？',
            /**
             * 删除确认信息
             */
            DeleteConfirmMsg: '确定删除？',
            /**
             * 提交确认信息
             */
            CommitConfirmMsg: '确定提交？',
            /**
             * 保存确认信息
             */
            SaveConfirmMsg: '确定保存？'
        });
    })(mini, $);

    /**
     * 截获miniui全局数据加载回调函数，适配后台数据格式
     */
    (function (mini, $) {
        var o_mini_doload = window.mini_doload;

        function extractData(result) {

            var match = (Object.isObject(result)) &&
                ('status' in result);

            if (!match)
                return result;

            var data = (result.body && result.body.data);

            if (result.status === 0) {
                return data;
            } else {
                var e = new Error(result.msg);
                e.errorCode = result.status;
                e.data = data;

                var errorMsg = result.msg;
                if (String.isString(e.data)) {
                    errorMsg += ' 详细信息：' + data;
                }

                topMini.wdShowMessageBox('error', '错误', errorMsg, ['ok']);

                //throw e;
            }
        }

        window.mini_doload = function (e) {

            if (o_mini_doload) {
                var ret = o_mini_doload.apply(this, arguments);
            }

            if (!e.result) {
                e.result = mini.decode(e.text);
            }

            e.result = extractData(e.result);

            return ret;
        }
    })(mini, $);

    /**
     * 原生控件hack
     */
    (function (mini, $) {
        // tree控件。重写默认的leafField字段名，防止和后台常用的"isLeaf"字段名冲突.
        var leafField = '_isLeaf';
        mini.DataTree.prototype.leafField = leafField;
        mini.TreeGrid.prototype.leafField = leafField;

        mini.Panel.prototype.getContentWindow = getContentWindow;
        mini.Window.prototype.getContentWindow = getContentWindow;
        // Window 取消拖动效果
        mini.Window.prototype.enableDragProxy = false;

        mini.ComboBox.prototype.autoFocusItem = true;

        mini.Control.prototype.loadingMsg = '正在加载...';
    })(mini, $);

    /**
     * grid column types
     */
    (function (mini, $) {
        /**
         * grid里面如果列类型是wd-开头的列表控件，渲染的时候会报错。
         * 这里增加针对wd控件的列类型，对应的列type指定：wd-comboboxcolumn/wd-treeselectcolumn
         * 摘自miniui源码：在类型判断时加了wd-前缀
         * @param e
         * @return {string}
         */
        var wdListColumnRenderer = function (e) {
            var column = e.column;
            var value = !mini.isNull(e.value) ? String(e.value) : "";
            var values = value.split(",");

            var valueField = "id", textField = "text";
            var valueMaps = {};

            var editor = column.editor;
            var _editor = column.__editor;

            if (editor) {


                if (!_editor && (editor.type == "wd-combobox" || editor.type == "wd-treeselect")) {

                    if (mini.isControl(editor)) {
                        _editor = editor;
                    } else {
                        editor = mini.clone(editor);
                        _editor = mini.create(editor);
                    }
                    e.column.__editor = _editor;
                }

                valueField = _editor.getValueField();
                textField = _editor.getTextField();

                var data = _editor.getData();

                valueMaps = column._valueMaps;
                if (!valueMaps || data !== column._data) {

                    var list = _editor.getList ? _editor.getList() : data;

                    valueMaps = {};
                    for (var i = 0, l = list.length; i < l; i++) {
                        var o = list[i];
                        valueMaps[o[valueField]] = o;
                    }

                    column._valueMaps = valueMaps;
                    column._data = data;
                }
            }

            var texts = [];
            for (var i = 0, l = values.length; i < l; i++) {
                var id = values[i];
                var o = valueMaps[id];
                if (o) {
                    var text = o[textField];
                    if (text === null || text === undefined) {
                        text = "";
                    }
                    texts.push(text);
                }
            }

            if (texts.length == 0 && column.valueFromSelect === false) {
                return value;
            }
            return texts.join(',');
        };

        mini.WdComboBoxColumn = function (config) {
            return mini.copyTo(
                {
                    renderer: wdListColumnRenderer
                }, config);
        };
        mini._Columns["wd-comboboxcolumn"] = mini.WdComboBoxColumn;

        mini.WdTreeSelectColumn = function (config) {
            return mini.copyTo(
                {
                    renderer: wdListColumnRenderer

                }, config);
        };
        mini._Columns["wd-treeselectcolumn"] = mini.WdTreeSelectColumn;
    })(mini, $);

    /**
     * mini.open
     */
    (function (mini, $) {
        var rProtocolPrefix = /^(http|https)/;
        var oOpen = mini.open;

        mini.open = function (o) {
            var url = o.url;

            /**
             * 统一都采用带协议的url，防止跨域的时候找不到对应的url
             */
            if (!rProtocolPrefix.test(url)) {
                var l = window.location;
                o.url = l.protocol + '//' + l.host + url;
            }

            return oOpen.apply(this, arguments);
        }
    })(mini, $);

    /**
     * mini.applyTo
     */
    (function (mini, $) {
        var oApplyTo = mini.applyTo;

        mini.applyTo = function (el) {
            var ret = oApplyTo.apply(this, arguments);

            // 保证 _afterApply 能够得到调用
            this._afterApply && this._afterApply(el);

            return ret;
        }
    })(mini, $);

    /**
     * WdForm
     */
    (function (mini, $) {
        var WdForm = mini.WdForm = function (id, opts) {
            WdForm.superclass.constructor.apply(this, arguments);

            this.set(opts || {});
        };

        mini.extend(WdForm, mini.Form, {
            setReadOnly: function (readOnly) {
                this.getFields().forEach(function (c) {
                    c.setReadOnly(readOnly);
                });
            },

            setAsLabel: function (asLabel) {
                this.getFields().forEach(function (c) {
                    c.setAsLabel && c.setAsLabel(asLabel);
                });
            }
        });
    })(mini, $);

    /**
     * WdControls
     */
    (function (mini, $) {
        [
            'ProgressBar',
            'ToolTip',
            'AutoComplete',
            'TextBoxList',
            'Button',
            'CheckBox',
            'ListBox',
            'CheckBoxList',
            'RadioButtonList',
            'Calendar',
            'ButtonEdit',
            'FilterEdit',
            'PopupEdit',
            'TextBox',
            'Password',
            'TextArea',
            'ComboBox',
            'DatePicker',
            'MonthPicker',
            'Spinner',
            'TimeSpinner',
            'TreeSelect',
            'Lookup',
            'HtmlFile',
            'FileUpload',
            'Hidden',
            'DataGrid',
            'Tree',
            'TreeGrid',
            'Fit',
            'Panel',
            'Window',
            'Splitter',
            'Layout',
            'Pager',
            'OutlookBar',
            'OutlookMenu',
            'OutlookTree',
            'Tabs',
            'Menu',
            'MenuBar',
            'MenuItem',
            'MenuButton',
            'ToolBar',
            'Popup',
            'Box',
            'Include',
            'Separator',
            'ContextMenu',
            'NavBar',
            'SplitButton',
            'NavBarMenu',
            'NavBarTree',
        ].forEach(inheritToWd);

    })(mini, $);

    /**
     * WdControl，Wd-控件基础类
     */
    (function (mini, $) {

        var WdControl = mini.WdControl = function () {
            WdControl.superclass.constructor.apply(this, arguments);
        };
        mini.extend(WdControl, mini.Control, {
            getAttrs: function (el) {
                return getAttrsWithOptions.call(this, WdControl, el);
            },

            _afterApply: function (el) {
                WdControl.superclass._afterApply &&
                WdControl.superclass._afterApply.apply(this, arguments);
            }
        });

    })(mini, $);

    /**
     * WdDataTable
     */
    (function (mini, $) {

        var WdDataTable = mini.WdDataTable = function () {
            WdDataTable.superclass.constructor.apply(this, arguments);
        };
        mini.extend(WdDataTable, mini.DataTable, $.extend({}, DataSourceMembers(mini.DataTable.prototype), {}));
        mini.regClass(WdDataTable, 'wd-datatable');
    })(mini, $);

    /**
     * WdDataTree
     */
    (function (mini, $) {

        var WdDataTree = mini.WdDataTree = function () {
            WdDataTree.superclass.constructor.apply(this, arguments);
        };
        mini.extend(WdDataTree, mini.DataTree, $.extend({}, DataSourceMembers(mini.DataTree.prototype), {}));
        mini.regClass(WdDataTree, 'wd-datatree');
    })(mini, $);

    /**
     * WdTextBox
     */
    (function (mini, $) {
        extend(mini.WdTextBox, InputEleMembers(mini.WdTextBox.prototype));
    })(mini, $);

    /**
     * WdPassword
     */
    (function (mini, $) {
        extend(mini.WdPassword, InputEleMembers(mini.WdPassword.prototype));
    })(mini, $);

    /**
     * WdTextArea
     */
    (function (mini, $) {
        extend(mini.WdTextArea, InputEleMembers(mini.WdTextArea.prototype));
    })(mini, $);

    /**
     * WdCheckBoxList
     */
    (function (mini, $) {
        extend(mini.WdCheckBoxList, InputEleMembers(mini.WdCheckBoxList.prototype));
    })(mini, $);

    /**
     * WdRadioButtonList
     */
    (function (mini, $) {
        extend(mini.WdRadioButtonList, InputEleMembers(mini.WdRadioButtonList.prototype));
    })(mini, $);

    /**
     * WdButtonEdit
     */
    (function (mini, $) {
        extend(mini.WdButtonEdit, InputEleMembers(mini.WdButtonEdit.prototype));
    })(mini, $);

    /**
     * WdPopupEdit
     */
    (function (mini, $) {
        extend(mini.WdPopupEdit, InputEleMembers(mini.WdPopupEdit.prototype));
    })(mini, $);

    /**
     * WdTextBoxList
     */
    (function (mini, $) {
        extend(mini.WdTextBoxList, InputEleMembers(mini.WdTextBoxList.prototype), {
            valueFromSelect: true
        });
    })(mini, $);

    /**
     * WdComboBox
     */
    (function (mini, $) {
        var SuperClass = mini.WdComboBox;

        var SubClass = extend(SuperClass, InputEleMembers(SuperClass.prototype), {
            autoFocusItem: true,

            selectFirst: function () {
                var showNullItem = this.getShowNullItem();

                this.select(showNullItem ? 1 : 0);
            },

            localSearchFields: null,
            /**
             * 设置多个本地检索字段
             * @param searchFields
             */
            setLocalSearchFields: function (searchFields) {

                this.localSearchFields = searchFields;

                this.on('preload', this.__preLoad);
            },
            __preLoad: function (e) {
                if (this.localSearchFields) {
                    this.__combineFieldsForSearch(e.data);
                }

                if (this.queryLimit > 0) {
                    this.setDataSource(e.data);

                    e.data = e.data.slice(0, this.queryLimit);
                }
            },
            setData: function (data) {
                if (this.localSearchFields) {
                    this.__combineFieldsForSearch(data);
                }

                if (this.queryLimit > 0) {
                    this.setDataSource(data);

                    data = data.slice(0, this.queryLimit);
                }

                return SubClass.superclass.setData.call(this, data);
            },
            __combineFieldsForSearch: function (data) {
                wdlib.combineFields(data, this.getPinyinField(), this.localSearchFields, ' ');
            },

            queryLimit: null,
            setQueryLimit: function (queryLimit) {
                if (queryLimit > 0) {
                    this.queryLimit = queryLimit;

                    this.on('preload', this.__preLoad);
                }
            },

            /**
             * HACK _doQuery
             * @param key
             * @private
             */
            _doQuery: function (key) {
                if (!this.autoFilter) return;

                if (this.multiSelect == true) return;

                var listbox = this.getListBox();

                var result = this._query(key, this.queryFilter);
                listbox.setData(result);
                // IMPORTANT
                if (this.queryLimit) {
                    this.data = result;
                }

                this._filtered = true;
                if (key !== "" || this.isShowPopup()) {
                    this.showPopup();

                    listbox._focusItem(listbox.getShowNullItem() ? 1 : 0, true);
                }
            },
            applyKeyBeforeFilter: true,
            _query: function (key, queryFilter) {
                if (Function.isFunction(queryFilter) && !this.applyKeyBeforeFilter) {
                    return this._queryByFilter(key, queryFilter);
                } else {
                    return this._queryByKey(key);
                }
            },
            _queryByKey: function (key) {
                var view = [];
                key = key.toUpperCase();

                var queryFilter = this.queryFilter,
                    applyFilter = this.applyKeyBeforeFilter && Function.isFunction(queryFilter);
                var data = this.getDataForQuery();

                for (var i = 0, l = data.length; i < l; i++) {
                    var o = data[i];
                    var text = mini._getMap(this.textField, o);
                    var pinyin = mini._getMap(this.pinyinField, o);

                    text = text ? String(text).toUpperCase() : "";
                    pinyin = pinyin ? String(pinyin).toUpperCase() : "";
                    if ((text.indexOf(key) != -1 || pinyin.indexOf(key) != -1) &&
                        (!applyFilter || (applyFilter && queryFilter(o, key)))) {
                        // HACK
                        if (!this.queryLimit || view.length < this.queryLimit) {
                            view.push(o);
                        } else {
                            break;
                        }
                    }
                }

                return view;
            },
            _queryByFilter: function (key, queryFilter) {
                var data = this.getDataForQuery(),
                    result = [];

                for (var i = 0; i < data.length; i++) {
                    if (this.queryLimit && result.length >= this.queryLimit)
                        break;

                    (queryFilter(data[i], key) === true) && result.push(data[i]);
                }

                return result;
            },

            dataSource: null,
            setDataSource: function (dataSource) {
                this.dataSource = dataSource;
            },
            getDataSource: function () {
                return this.dataSource || [];
            },

            getDataForQuery: function () {
                if (this.queryLimit > 0) {
                    return this.getDataSource();
                }

                return this.getData() || [];
            },

            getListBox: function () {
                return this._listbox;
            },

            reload: function () {
                if (SubClass.superclass.reload) {
                    SubClass.superclass.reload.apply(this, arguments);
                } else {
                    this.setUrl(this.getUrl(), true);
                }
            },

            valueFromSelect: true,
            allowInput: true
        }, PopupEditorMembers(SuperClass.prototype), SetUrl(SuperClass.prototype));
    })(mini, $);

    /**
     * WdDatePicker
     */
    (function (mini, $) {
        extend(mini.WdDatePicker, InputEleMembers(mini.WdDatePicker.prototype), PopupEditorMembers(mini.WdDatePicker.prototype));
    })(mini, $);

    /**
     * WdFileUpload
     */
    (function (mini, $) {
        var SuperClass = mini.WdFileUpload;

        var SubClass = extend(SuperClass, {
            _create: function () {
                SubClass.superclass._create.call(this);

                this.on('uploadsuccess', function (e) {
                    var file = e.file,
                        serverData = JSON.parse(e.serverData),
                        match = 'status' in serverData;

                    if (match) {
                        var status = serverData.status;

                        if (status == 0) {
                            this.fire('success', {file: file, data: serverData.body && serverData.body.data});
                        } else {
                            this.fire('error', {
                                file: file,
                                msg: serverData.msg,
                                data: serverData.body && serverData.body.data
                            });
                        }
                    } else {
                        this.fire('success', {file: file, data: serverData});
                    }
                });
            }
        }, InputEleMembers(SuperClass.prototype));
    })(mini, $);

    /**
     * WdSpinner
     */
    (function (mini, $) {
        var SuperClass = mini.WdSpinner;

        var SubClass = extend(mini.WdSpinner, {
            _ValueLimit: function () {
                if (this.getAllowLimitValue()) {
                    var value = this.getValue(),
                        maxValue = this.getMaxValue(),
                        minValue = this.getMinValue();

                    if (!(value <= maxValue && value >= minValue)) {
                        this.fire('ValueExceed', {
                            value: value,
                            minValue: minValue,
                            maxValue: maxValue,
                            exceedMin: value < minValue,
                            exceedMax: value > maxValue
                        });
                    }
                }

                return SuperClass.superclass._ValueLimit.apply(this, arguments);
            }
        }, InputEleMembers(SuperClass.prototype));
    })(mini, $);

    /**
     * WdTimeSpinner
     */
    (function (mini, $) {
        extend(mini.WdTimeSpinner, InputEleMembers(mini.WdTimeSpinner.prototype));
    })(mini, $);

    /**
     * WdHtmlFile
     */
    (function (mini, $) {
        extend(mini.WdHtmlFile, InputEleMembers(mini.WdHtmlFile.prototype));
    })(mini, $);

    /**
     * WdFilterEdit
     */
    (function (mini, $) {
        extend(mini.WdFilterEdit, InputEleMembers(mini.WdFilterEdit.prototype));
    })(mini, $);

    /**
     * WdLookup
     */
    (function (mini, $) {
        extend(mini.WdLookup, InputEleMembers(mini.WdLookup.prototype), PopupEditorMembers(mini.WdLookup.prototype));
    })(mini, $);

    /**
     * WdAutoComplete
     */
    (function (mini, $) {
        var SuperClass = mini.WdAutoComplete;

        var SubClass = extend(SuperClass, InputEleMembers(SuperClass.prototype), {
            setValue: function (value) {
                SubClass.superclass.setValue.apply(this, arguments);

                if (value == null) {
                    this.setText(null);
                }
            },

            /**
             * 摘自miniui源码
             * 由于针对AutoComplete（如preload事件）的一些个性需求源码为提供相关可扩展的口子，
             * 所以这里覆盖源码的实现
             * @param key
             * @private
             */
            _doQuery: function (key) {
                var me = this;

                if (mini.getActiveElement() != me._textEl) {
                    me.hidePopup();
                    return;
                }

                if (!this.remote) {
                    mini.AutoComplete.superclass._doQuery.apply(this, arguments);
                    return;
                }

                if (this._ajaxer) {
                    this._ajaxer.abort();
                }

                var url = this.url;
                var ajaxMethod = "post";
                if (url) {
                    if (url.indexOf(".txt") != -1 || url.indexOf(".json") != -1) {
                        ajaxMethod = "get";
                    }
                }

                var params = {};
                params[this.searchField] = key;

                var e = {
                    url: url,
                    async: true,
                    params: params,
                    data: params,
                    type: this.ajaxType ? this.ajaxType : ajaxMethod,
                    cache: false,
                    cancel: false
                };

                this.fire("beforeload", e);

                function doload(data, result) {
                    if (!me._focused) return;

                    if (me._tryHide() === false) return;
                    if (me._doloadTimer) {
                        clearTimeout(me._doloadTimer);
                        me._doloadTimer = null;
                    }
                    me._doloadTimer = setTimeout(function () {
                        me._doloadTimer = null;
                        me._tryHide();
                    }, 100);

                    // NOTE: WdAutoComplete preload
                    me.fire('preload', {data: data});

                    me._listbox.setData(data);
                    me.showPopup();
                    me._listbox._focusItem(0, true);
                    me.data = data;
                    me.fire("load", {data: data, result: result});
                }

                if (e.cancel) {
                    var data = e.result || [];
                    doload(data, data);
                    return;
                }

                me.loading = true;

                mini.copyTo(e, {
                    success: function (text, textStatus, xhr) {
                        delete e.params;
                        var obj = {text: text, result: null, sender: me, options: e, xhr: xhr};
                        var result = null;
                        try {
                            mini_doload(obj);
                            result = obj.result;
                            if (!result) {
                                result = mini.decode(text);
                            }
                        } catch (ex) {
                            if (mini_debugger == true) {
                                throw new Error("autocomplete json is error");
                            }
                        }
                        if (mini.isArray(result)) result = {data: result};

                        if (me.dataField) {
                            result.data = mini._getMap(me.dataField, result);
                        }
                        if (!result.data) result.data = [];

                        doload(result.data, result);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {

                    },
                    complete: function () {
                        me.loading = false;
                        me._requestSearch = false;
                        me._ajaxer = null;
                    }
                });

                this._ajaxer = mini.ajax(e);
            },
        }, PopupEditorMembers(SuperClass.prototype), {
            // showPopupOnClick 为true后，AutoComplete的下拉会有数据暂留的情况
            showPopupOnClick: false
        });
    })(mini, $);

    /**
     * WdMonthPicker
     */
    (function (mini, $) {
        extend(mini.WdMonthPicker, InputEleMembers(mini.WdMonthPicker.prototype), PopupEditorMembers(mini.WdMonthPicker.prototype));
    })(mini, $);

    /**
     * WdTreeSelect
     */
    (function (mini, $) {
        var SuperClass = mini.WdTreeSelect;

        var combineFieldsForTree = function (data, combineFieldName, combineFields, separator, childrenField) {

            wdlib.combineFields(data, combineFieldName, combineFields, separator);

            for (var i = 0; i < data.length; i++) {
                combineFieldsForTree(data[i][childrenField] || [], combineFieldName, combineFields, separator, childrenField);
            }
        };

        var SubClass = extend(SuperClass, InputEleMembers(SuperClass.prototype), {

            localSearchFields: null,
            /**
             *
             * @param searchFields
             */
            setLocalSearchFields: function (searchFields) {
                this.localSearchFields = searchFields;

                var me = this,
                    tree = this.tree;

                tree.on('preload', function (e) {
                    me.__combineFieldsForSearch(e.data, tree.getNodesField());
                });
            },

            setData: function (data) {
                var ret = SubClass.superclass.setData.apply(this, arguments);

                if (this.localSearchFields) {
                    this.__combineFieldsForSearch(this.getData());
                }

                return ret;
            },

            __combineFieldsForSearch: function (data, nodesField) {
                if (this.getResultAsTree()) {
                    wdlib.combineFields(data, this.getPinyinField(), this.localSearchFields, ' ');
                } else {
                    combineFieldsForTree(data, this.getPinyinField(), this.localSearchFields, ' ', nodesField);
                }
            },

            _doQuery: function () {
                var ret = SubClass.superclass._doQuery.apply(this, arguments);

                this.tree.selectNode(1);

                return ret;
            },

            valueFromSelect: true
        }, PopupEditorMembers(SuperClass.prototype), SetUrl(SuperClass.prototype));
    })(mini, $);

    /**
     * WdDataGrid
     */
    (function (mini, $) {

        var SuperClass = mini.WdDataGrid;

        var SubClass = extend(SuperClass, {
            _createSource: function () {
                this._dataSource = new mini.WdDataTable();
            }
        }, GridMembers(SuperClass.prototype));
    })(mini, $);

    /**
     * WdTreeGrid
     */
    (function (mini, $) {

        var SuperClass = mini.WdTreeGrid;

        var SubClass = extend(SuperClass, {
            _createSource: function () {
                this._dataSource = new mini.WdDataTree();
            }
        }, GridMembers(SuperClass.prototype));
    })(mini, $);

    /**
     * WdPanel
     */
    (function (mini, $) {
        var SuperClass = mini.WdPanel;

        var SubClass = extend(SuperClass, {
            // 视图区域样式，默认不支持设置样式并且背景色为白色
            setViewportStyle: function (style) {
                var el = mini.byClass('mini-panel-viewport', this.el);
                mini.setStyle(el, style);
            }
        });
    })(mini, $);

    /**
     * WdTabs
     */
    (function (mini, $) {
        var SuperClass = mini.WdTabs;

        var SubClass = extend(SuperClass, {
            setTabs: function (tabs) {
                if (tabs && tabs.length) {
                    return SubClass.superclass.setTabs.apply(this, arguments);
                }
            },

            isActiveTab: function (tab) {
                var _tab = this.getTab(tab);

                return _tab === this.getActiveTab();
            }
        });
    })(mini, $);

    /**
     * WdMultiUpload
     */
    (function (mini, $) {
        var MultiUpload = mini.MultiUpload = function () {
            MultiUpload.superclass.constructor.call(this);

            var me = this;

            me.postParam = {};
            setTimeout(function () {
                me.bindEvents();
            }, 300);
        };

        mini.extend(MultiUpload, mini.DataGrid, {

            uiCls: 'mini-multiupload',
            flashUrl: '',
            uploadUrl: '',
            uploader: undefined,
            uploadName: 'files',
            limitSize: '10MB',
            limitType: '*',
            uploadLimit: 0,
            queueLimit: 10,
            postParam: null,
            autoUpload: false,   //选中即上传
            customSettings: {queue: null},
            columnsTexts: {
                nameColumnHeader: '文件名',
                typeColumnHeader: '文件类型',
                sizeColumnHeader: '文件大小',
                completeColumnHeader: '上传进度',
                statusColumnHeader: '上传状态',
                actionColumnHeader: '操作'
            },

            _create: function () {
                MultiUpload.superclass._create.call(this);

                var me = this,
                    headerAlign = 'center',
                    textAlign = mini.WdDataGrid.TextAlign,
                    enumAlign = mini.WdDataGrid.EnumAlign,
                    numberAlign = mini.WdDataGrid.NumberAlign;

                me.set({
                    showPager: false,
                    showToolbar: true,
                    columns: [
                        {
                            type: 'indexColumn'
                        },
                        {
                            field: 'fileName',
                            width: 150,
                            header: me.columnsTexts.nameColumnHeader,
                            headerAlign: headerAlign,
                            align: textAlign
                        },
                        {
                            field: 'type',
                            width: 50,
                            header: me.columnsTexts.typeColumnHeader,
                            align: enumAlign,
                            headerAlign: headerAlign
                        },
                        {
                            field: 'size',
                            width: 60,
                            header: me.columnsTexts.sizeColumnHeader,
                            align: numberAlign,
                            headerAlign: headerAlign
                        },
                        {
                            field: 'complete',
                            width: 80,
                            header: me.columnsTexts.completeColumnHeader,
                            headerAlign: headerAlign
                        },
                        {
                            field: 'status',
                            width: 60,
                            header: me.columnsTexts.statusColumnHeader,
                            align: enumAlign,
                            headerAlign: headerAlign
                        },
                        {
                            field: 'action',
                            width: 30,
                            header: me.columnsTexts.actionColumnHeader,
                            align: enumAlign,
                            headerAlign: headerAlign
                        }
                    ]
                });

                var toolbarEl = me.getToolbarEl();
                toolbarEl.style.height = '30px';

                me._uploadId = me._id + '$button_placeholder';

                var sb = [];

                sb.push('<div class="mini-toolbar" style="border-bottom:0;padding:0px;">');
                sb.push('<table><tr><td style="width:80px;">' +
                    '<a class="mini-button" iconCls="icon-search" style="width:80px">浏览...</a>' +
                    '<span style="width: 80px; height: 22px; position: absolute;left: 0px;top: 3px;cursor: pointer;background: transparent">' +
                    '<span id="' + me._uploadId + '" style="width: 100%;height: 100%;display: inline-block;"></span></span>');
                sb.push('</td><td><a class="mini-button" iconCls="icon-upload" name="multiupload">批量上传</a>');
                sb.push('</td><td><a class="mini-button" iconCls="icon-remove" name="removeAll">清空上传</a>');
                sb.push('</td></tr></table>');
                sb.push('</div>');

                toolbarEl.innerHTML = sb.join('');
            },
            __OnMouseMove: function () {
                var me = this;

                if (!me.uploader) {
                    var upload = new SWFUpload({
                        file_post_name: me.uploadName,
                        upload_url: me.uploadUrl,
                        flash_url: me.flashUrl,
                        file_size_limit: me.limitSize,
                        file_types: me.limitType,
                        file_types_description: me.typesDescription,
                        file_upload_limit: parseInt(me.uploadLimit),
                        file_queue_limit: me.queueLimit,

                        // 事件处理设置（所有的自定义处理方法都在handler.js文件里）
                        file_queued_handler: mini.createDelegate(me.__on_file_queued, me),
                        upload_error_handler: mini.createDelegate(me.__on_upload_error, me),
                        upload_success_handler: mini.createDelegate(me.__on_upload_success, me),
                        upload_complete_handler: mini.createDelegate(me.__on_upload_complete, me),
                        upload_progress_handler: mini.createDelegate(me.__on_upload_progress, me),
                        file_queue_error_handler: mini.createDelegate(me.__on_file_queued_error, me),

                        // 按钮设置
                        //button_placeholder: this.uploadEl,
                        button_placeholder_id: me._id + '$button_placeholder',
                        button_width: 80,
                        button_height: 25,
                        button_window_mode: 'transparent',
                        button_action: SWFUpload.BUTTON_ACTION.SELECT_FILES,  //对话框按shift多选文件
                        button_text: '',
                        // button_text_style: ".redText { color: #FF0000; }",
                        button_text_left_padding: 0,
                        button_text_top_padding: 0,
                        button_image_url: 'http://www.swfupload.org/button_sprite.png',
                        // Debug 设置
                        debug: false
                    });
                    upload.flashReady();
                    me.uploader = upload;
                    me.uploadButton.on('click', function () {
                        var rows = me.getData();

                        if (rows.length > 0) {
                            me.startUpload();
                        }
                    });
                    me.removeButton.on('click', function () {
                        var rows = me.getData();

                        for (var i = 0, l = rows.length; i < l; i++) {
                            me.uploader.cancelUpload(rows[i].fileId);
                            me.customSettings.queue.remove(rows[i].fileId);
                        }

                        me.clearData();
                    });
                }
            },
            bindEvents: function () {
                var me = this,
                    toolbarEl = me.getToolbarEl();

                me._fileEl = document.getElementById(me._uploadId);
                me.uploadEl = me._fileEl;
                me.uploadButton = mini.getbyName('multiupload', toolbarEl);
                me.removeButton = mini.getbyName('removeAll', toolbarEl);

                mini.on(me.uploadEl, 'mousemove', me.__OnMouseMove, me);
                me.on('drawcell', function (e) {
                    var field = e.field,
                        record = e.record,
                        uid = record._uid,
                        value = e.value;

                    if (field == 'complete') {
                        e.cellHtml = '<div style="position: relative; background: #bbb; width: 100%; height: 16px; overflow: hidden">'
                            + '<div style="width:' + value + '%; height: 18px;position: absolute;background: blue;left: 0;top: 0;overflow: hidden;z-index: 1"></div>'
                            + '<div style="position: absolute;left: 0;top: 0;width: 100%;font-size: 13px;color: white;z-index: 10;text-align: center;height: 16px;line-height: 16px;">' + value + '%</div>'
                            + '</div>';
                    }

                    if (field == 'status') {
                        if (e.value == 0) {
                            e.cellHtml = '准备上传';
                        } else if (e.value == 1) {
                            e.cellHtml = '上传成功';
                        } else if (e.value == 2) {
                            e.cellHtml = '上传失败';
                        }
                    }

                    if (field == 'action') {
                        e.cellHtml =
                            '<a class="icon-remove" title="删除" data-uid="' + uid + '" style="width: 20px;height: 20px;display: inline-block;cursor: pointer;"><a>' +
                            '<a class="icon-download" title="下载" data-uid="' + uid + '" style="width: 20px;height: 20px;display: inline-block;cursor: pointer;margin-left: 4px"><a>' +
                            '<a class="icon-preview" title="查看" data-uid="' + uid + '" style="width: 20px;height: 20px;display: inline-block;cursor: pointer;margin-left: 4px"><a>';
                    }
                });

                $(document.body).on('click', '.icon-remove', function () {
                    var uid = $(this).data('uid'),
                        row = me.getRowByUID(uid);

                    if (me.uploader.getStats().files_queued !== 0) {
                        me.uploader.cancelUpload(row.fileId);
                    }
                    me.removeRow(row);
                });
                $(document.body).on('click', '.icon-download', function () {

                });
                $(document.body).on('click', '.icon-preview', function () {

                });
            },

            startUpload: function (fileId) {
                var me = this;

                if (me.uploader) {
                    if (me.postParam) {
                        me.uploader.setPostParams(this.postParam);
                    }

                    if (fileId) {
                        me.uploader.startUpload(fileId);
                    } else {
                        me.uploader.startUpload();
                    }
                }
            },
            addPostParam: function (value) {
                mini.copyTo(this.postParam, value);
            },

            __on_file_queued: function (file) {

                function bytesToSize(bytes) {
                    if (bytes === 0)
                        return '0 B';

                    var k = 1024,
                        sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
                        i = Math.floor(Math.log(bytes) / Math.log(k));

                    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
                }

                var me = this,
                    row = {
                        fileId: file.id,
                        fileName: file.name,
                        type: file.type,
                        status: 0,
                        size: bytesToSize(file.size),
                        complete: 0
                    };

                me.addRow(row);
                me.customSettings.queue = me.customSettings.queue || [];
                me.customSettings.queue.push(file.id);

                if (me.autoUpload) {
                    me.startUpload(file.id);
                }
            },
            __on_upload_error: function (file, errorCode, msg) {
                if (msg == 'File Cancelled')
                    return;

                var me = this;

                if (file) {
                    var row = me.findRow(function (row) {
                        if (row.fileId == file.id) return true;
                    });

                    me.updateRow(row, {status: 2});
                }

                me.fire("uploaderror", {file: file, code: errorCode, message: msg});
            },
            __on_upload_success: function (file, serverData) {
                var me = this;
                var row = me.findRow(function (row) {
                    if (row.fileId == file.id) return true;
                });

                me.updateRow(row, {status: 1, complete: 100});

                this.fire("uploadsuccess", {file: file, serverData: serverData});
            },
            __on_upload_complete: function (file) {
                if (this.uploader.getStats().files_queued !== 0) {
                    this.startUpload();
                }
            },
            __on_upload_progress: function (file, complete, total) {

                var percent = mini.formatNumber(complete / total, 'n2') * 100;
                var me = this;
                var row = me.findRow(function (row) {
                    if (row.fileId == file.id) return true;
                });

                me.updateRow(row, {complete: percent});
            },
            __on_file_queued_error: function (file, errorCode, msg) {
                mini.alert('文件选择出错! errorCode:' + errorCode + '; msg:' + msg);
            },

            setPostParam: function (value) {
                this.addPostParam(value);
            },
            getPostParam: function () {
                return this.postParam;
            },
            setUploadUrl: function (url) {
                this.uploadUrl = url;
            },
            getUploadUrl: function () {
                return this.uploadUrl;
            },
            setFlashUrl: function (url) {
                this.flashUrl = url;
            },
            getFlashUrl: function () {
                return this.flashUrl;
            },
            setLimitType: function (type) {
                this.limitType = type;
            },
            getLimitType: function () {
                return this.limitType;
            },
            setLimitSize: function (size) {
                this.limitSize = size;
            },
            getLimitTSize: function () {
                return this.limitSize;
            },
            setUploadName: function (name) {
                this.uploadName = name;
            },
            getUploadName: function () {
                return this.uploadName;
            },
            setAutoUpload: function (val) {
                this.autoUpload = val;
            },
            getAutoUpload: function () {
                return this.autoUpload;
            },
            setQueueLimit: function (num) {
                this.queueLimit = num;
            },
            getQueueLimit: function () {
                return this.queueLimit;
            },

            getAttrs: function (el) {
                var attrs = MultiUpload.superclass.getAttrs.call(this, el);

                mini._ParseString(el, attrs,
                    ['uploadUrl', 'flashUrl', 'limitType', 'limitSize', 'uploadName', 'queueLimit',
                        'onuploaderror', 'onuploadsuccess']
                );
                mini._ParseBool(el, attrs,
                    ['autoUpload']
                );

                return attrs;
            },

            onPreload: function (e) {
                e.data.forEach(function (d) {
                    var fileName = d.fileName,
                        dotIdx = fileName.lastIndexOf('.'),
                        type = dotIdx < 0 ? '' : fileName.substring(dotIdx + 1),
                        complete = 100,
                        status = 1;

                    d.type = type;
                    d.complete = complete;
                    d.status = status;
                });
            }
        });

        mini.regClass(MultiUpload, 'multiupload');

        inheritToWd('MultiUpload');
    })(mini, $);

    /**
     *
     */
    (function (mini, $) {
        var SuperClass = mini.WdPager;

        var SubClass = extend(SuperClass, {
            showFirstAndLastButton: true,
            setShowFirstAndLastButton: function (value) {
                this.showFirstAndLastButton = value;
            },
            getShowFirstAndLastButton: function (value) {
                return this.showFirstAndLastButton;
            },

            update: function () {
                var ret = SubClass.superclass.update.apply(this, arguments);

                if (!this.getShowFirstAndLastButton()) {
                    this.firstButton.setVisible(false);
                    this.lastButton.setVisible(false);
                }

                return ret;
            }
        });
    })(mini, $);

    /**
     * WdSimplePager
     */
    (function (mini, $) {
        var SubClass = mini.WdSimplePager = function () {
            mini.WdSimplePager.superclass.constructor.apply(this, arguments);
        };

        mini.extend(mini.WdSimplePager, mini.WdPager, {
            uiCls: 'wd-simple-pager',

            showFirstAndLastButton: false
        });

        mini.regClass(mini.WdSimplePager, 'wd-simple-pager');
    })(mini, $);

    /**
     * WdLabel TODO: 重构
     */
    (function (mini, $) {
        var WdLabel = mini.WdLabel = function () {
            WdLabel.superclass.constructor.apply(this, arguments);
        };
        mini.extend(WdLabel, mini.WdControl, {
            uiCls: 'wd-label',

            formField: true,

            _create: function () {
                WdLabel.superclass._create.apply(this, arguments);

                var labelId = this.uid + '$title';
                var textId = this.uid + '$text'

                //this.el = document.createElement('div');
                //this.el.className = 'wd-label';
                this.el.innerHTML =
                    '<label id="' + labelId + '" style="display: inline-block;text-align: right"></label>' +
                    '<label id="' + textId + '" style="display: inline-block"></label>';

                this._labelEl = this.el.firstChild;
                this._textEl = this.el.lastChild;

            },
            setLabel: function (label) {
                this._labelEl.innerHTML = label;
            },
            text: '',
            setText: function (text) {
                text = (text == null) ? '' : String(text);

                this.text = text;
                this._textEl.innerHTML = text;

                // if (!text) {
                //     this.width = (this.width - this.labelWidth);
                //     mini.setStyle(this._textEl, 'display:none');
                //     mini.setStyle(this.el, 'width:' + this.width + 'px');
                // } else {
                //     this._textEl.innerHTML = text;
                //     mini.setStyle(this._textEl, 'display:inline-block');
                // }
            },
            getText: function () {
                return this.text;
            },

            getAttrs: function (el) {
                var attrs = WdLabel.superclass.getAttrs.apply(this, arguments);

                if (attrs.width === undefined) {
                    attrs.width = this.width;
                }

                if (attrs.labelWidth === undefined) {
                    attrs.labelWidth = this.labelWidth;
                }

                if (attrs.textPointer === undefined) {
                    attrs.textPointer = this.textPointer;
                }

                if (attrs.enabled == false) {
                    attrs.textPointer = false;
                }

                return attrs;
            },
            width: 200,
            setWidth: function (width) {
                this.width = width;
                mini.setStyle(this.el, 'width:' + this.width + 'px');
            },
            value: null,
            setValue: function (value) {
                this.value = value;

                this.setText(value);
            },
            getValue: function () {
                return this.value;
            },
            labelWidth: 80,
            setLabelWidth: function (width) {
                this.labelWidth = width;

                mini.setStyle(this._labelEl, 'width:' + this.labelWidth + 'px');
                mini.setStyle(this._textEl, 'width:' + (this.width - this.labelWidth) + 'px');
            },
            setLabelAlign: function (align) {
                mini.setStyle(this._labelEl, 'text-align:' + align);
            },
            setInline: function (inline) {
                if (inline) {
                    mini.setStyle(this.el, 'display:inline-block');
                } else {
                    mini.setStyle(this.el, 'display:block');
                }
            },
            setLabelStyle: function (style) {
                mini.setStyle(this._labelEl, style);
            },
            setTextStyle: function (style) {
                mini.setStyle(this._textEl, style);
            },
            textPointer: true,
            setTextPointer: function (pointer) {
                mini.setStyle(this._textEl, 'cursor:' + (pointer ? 'pointer' : 'default'));
            },
            setEnabled: function (enabled) {
                var ret = WdLabel.superclass.setEnabled.apply(this, arguments);

                this.setTextPointer(enabled);

                if (!enabled) {
                    mini.removeClass(this.el, 'mini-disabled');
                }

                return ret;
            },
            _afterApply: function () {
                mini.on(this._textEl, 'click', this.__OnTextClick, this);
            },
            __OnTextClick: function (e) {
                if (this.enabled) {
                    this.fire('textclick', {htmlEvent: e, text: this.text});
                }
            }
        });
        mini.regClass(WdLabel, 'wd-label');
    })(mini, $);

    /**
     * WdSeparatorV 竖向分割条
     */
    (function (mini, $) {
        var WdSeparatorV = mini.WdSeparatorV = function () {
            WdSeparatorV.superclass.constructor.apply(this, arguments);
        };
        mini.extend(WdSeparatorV, mini.WdControl, {
            uiCls: 'wd-separator-v',

            _clearBorder: false,

            _create: function () {
                WdSeparatorV.superclass._create.apply(this, arguments);

                this.el = document.createElement('span');
                this.addCls('separator');
            },

            _afterApply: function () {
                WdSeparatorV.superclass._afterApply.apply(this, arguments);
            }
        });
        mini.regClass(WdSeparatorV, 'wd-separator-v');
    })(mini, $);

    /**
     * MessageBox 扩展
     */
    (function (mini) {

        if (mini.wdShowMessageBox) {
            return;
        }

        /**
         * 根据 uid 获取miniui控件
         * @param uid
         * @return {*}
         */
        function byUid(uid) {
            // TODO: miniui不同版本接口不一致
            //return mini.getByUid(uid);
            return mini.getbyUID(uid);
        }

        /**
         * MessageBox.hide 用于销毁Editor
         */
        var oHide = mini.MessageBox.hide;
        mini.MessageBox.hide = function (id) {
            if (!id)
                return;
            var control = typeof id == 'object' ? id : byUid(id);

            if (!control)
                return;

            control._Editor && control._Editor.destroy();

            return oHide.apply(this, arguments);
        };

        function showMessageBox(state, title, msg, actions, editor) {
            var buttons = [];

            var actionCb = {};

            var holder = {
                winHdl: null,

                action: function (action) {
                    if (doAction(action) !== false) {
                        // NOTE: 等待控件相关工作处理完成
                        wdlib.delay(function (winHdl) {
                            mini.MessageBox.hide(holder.winHdl);
                        }, null, 100);
                    }
                }
            };

            var currFocusIndex = (actions || []).findIndex(function (a) {
                return (a && a.autoFocus == true);
            });
            if (currFocusIndex < 0) {
                currFocusIndex = 0;
            }

            function doAction(action) {
                var cb = actionCb[action],
                    editor = byUid(holder.winHdl)._Editor,
                    editorValue = editor && editor.getValue();

                return !cb || cb.call(holder, editorValue, editor) !== false;
            }

            function createAction(a) {
                return function (cb) {

                    var oCb = actionCb[a];

                    actionCb[a] = function () {
                        oCb && oCb.apply(this, arguments);

                        return cb.apply(this, arguments);
                    };

                    return holder;
                }
            }

            function getButtons() {
                return byUid(holder.winHdl)._Buttons || [];
            }

            function focusEditor() {
                var win = byUid(holder.winHdl);

                win._Editor && win._Editor.focus();
            }

            function focusButton(index) {
                var buttons = getButtons();

                if (buttons.length) {
                    buttons[index].focus();
                }
            }

            function focusNextButton() {
                var buttons = getButtons();

                if (currFocusIndex < buttons.length - 1) {
                    focusButton(++currFocusIndex);
                }
            }

            function focusPreButton() {
                if (currFocusIndex > 0) {
                    focusButton(--currFocusIndex);
                }
            }

            (function createActions(actions) {
                holder['close'] = createAction('close');
                for (var i = 0; i < actions.length; i++) {
                    var a = actions[i],
                        _a, buttonText;

                    if (typeof a === 'string') {
                        _a = a;
                        buttonText = a;
                    } else {
                        _a = a.action;
                        buttonText = a.text;
                    }

                    /**
                     * 句柄自有的特殊方法
                     */
                    if (_a === 'action') {
                        throw new Error('action name: "action" is not allowd.');
                    }

                    /**
                     * 关闭
                     */
                    if (_a === 'close' || buttonText === 'close') {
                        throw new Error('action name or text: "close" is not allowd.');
                    }

                    buttons.push(buttonText);
                    holder[_a] = createAction(buttonText);
                }
            })(actions);

            holder.winHdl = mini.showMessageBox({
                minWidth: 250,
                title: title,
                buttons: buttons,
                message: msg,
                iconCls: state ? 'mini-messagebox-' + state : null,
                html: mini.isControl(editor) ? editor.el : editor,
                callback: function (action) {
                    var ret = doAction(action);

                    if (ret !== false) {
                        // 关闭
                        doAction('close');
                    }

                    return ret;
                }
            });

            if (mini.isControl(editor)) {
                var win = byUid(holder.winHdl);

                win._Editor = editor;
            }

            mini.on(byUid(holder.winHdl).el, 'keydown', function (e) {
                if (e.keyCode == 37) {
                    focusPreButton();
                } else if (e.keyCode == 39) {
                    focusNextButton();
                }
            });

            // NOTE: 延迟focus，防止其他控件夺取焦点
            wdlib.delay(function () {
                if (byUid(holder.winHdl)._Editor) {
                    focusEditor();
                } else {
                    focusButton(currFocusIndex);
                }
            }, null, 10);

            return holder;
        }

        /**
         * wd前缀避免名称冲突
         * @type {showMessageBox}
         */
        mini.wdShowMessageBox = showMessageBox;

    })(topMini);

    /**
     * 地址控件
     */
    (function (mini) {
        mini.WdAddressPicker = function () {
            mini.WdAddressPicker.superclass.constructor.apply(this, arguments);

            mini.WdAddressPicker.superclass.setShowPopupOnClick.call(this, true);
            mini.WdAddressPicker.superclass.setAllowInput.call(this, false);
        };

        mini.extend(mini.WdAddressPicker, mini.WdPopupEdit, {
            uiCls: 'wd-addresspicker',

            set: function (kv) {
                if (kv.addressFields) {
                    this.setAddressFields(kv.addressFields);

                    delete kv.addressFields;
                }

                var value = kv.value,
                    dataSource = kv.dataSource;

                if (value) {
                    delete kv.dataSource;
                    delete kv.value;

                    var ret = mini.WdAddressPicker.superclass.set.apply(this, arguments);

                    this.setDataSource(dataSource);
                    this.setValue(value);

                    return ret;
                }

                return mini.WdAddressPicker.superclass.set.apply(this, arguments);
            },

            showPopup: function () {
                this.setPopupWidth(Math.max(300, this.getWidth()));

                mini.WdAddressPicker.superclass.showPopup.apply(this, arguments);

                this._tabs.activeTab('province');
                this._getTabCmb('province').focus();
                this._getTabCmb('province').showPopup();
            },

            _createPopup: function () {
                mini.WdAddressPicker.superclass._createPopup.call(this);

                this.popup.addCls('wd-addresspicker-popup');

                this._initTabs();

                this._tabs.render(this.popup._contentEl);
            },

            _initTabs: function () {
                var me = this;

                var tabs = this._tabs = new mini.WdTabs();

                tabs.set({
                    width: '100%',
                    tabAlign: 'fit',
                    bodyStyle: 'padding: 0px',
                    onActiveChanged: function (e) {
                        me._ActiveTabChanged(e.tab);
                    },
                    onBeforeActiveChanged: function (e) {
                        me._BeforeActiveTabChanged(e.sender.getActiveTab());
                    },
                    tabs: [
                        {
                            name: 'province',
                            title: '省'
                        },
                        {
                            name: 'city',
                            title: '市'
                        },
                        {
                            name: 'county',
                            title: '区（县）'
                        },
                        {
                            name: 'town',
                            title: '街道（镇）'
                        },
                        {
                            name: 'village',
                            title: '社区（村）'
                        },
                        {
                            name: 'detailed',
                            title: '详细地址'
                        }
                    ]
                });

                this._initProvinceTab();
                this._initCityTab();
                this._initCountyTab();
                this._initTownTab();
                this._initVillageTab();
                this._initDetailedTab();
            },
            _initProvinceTab: function () {
                var tab = this._tabs.getTab('province');

                var cmbProvince = this._cmbProvince = new mini.WdComboBox();
                cmbProvince.set(this._getCmbOpts('province', {
                    emptyText: '选择 省份'
                }));

                cmbProvince.render(this._tabs.getTabBodyEl(tab));
            },
            _initCityTab: function () {
                var tab = this._tabs.getTab('city');

                var cmbCity = this._cmbCity = new mini.WdComboBox();
                cmbCity.set(this._getCmbOpts('city', {
                    emptyText: '选择 市'
                }));

                cmbCity.render(this._tabs.getTabBodyEl(tab));
            },
            _initCountyTab: function () {
                var tab = this._tabs.getTab('county');

                var cmbCounty = this._cmbCounty = new mini.WdComboBox();
                cmbCounty.set(this._getCmbOpts('county', {
                    emptyText: '选择 区（县）'
                }));

                cmbCounty.render(this._tabs.getTabBodyEl(tab));
            },
            _initTownTab: function () {
                var tab = this._tabs.getTab('town');

                var cmbTown = this._cmbTown = new mini.WdComboBox();
                cmbTown.set(this._getCmbOpts('town', {
                    emptyText: '选择 街道（镇），可手输',
                    valueFromSelect: false
                }));

                cmbTown.render(this._tabs.getTabBodyEl(tab));
            },
            _initVillageTab: function () {
                var tab = this._tabs.getTab('village');

                var cmbVillage = this._cmbVillage = new mini.WdComboBox();
                cmbVillage.set(this._getCmbOpts('village', {
                    emptyText: '选择 社区（村），可手输',
                    valueFromSelect: false
                }));

                cmbVillage.render(this._tabs.getTabBodyEl(tab));
            },
            _initDetailedTab: function () {
                var me = this;

                var tab = this._tabs.getTab('detailed');

                var
                    //txtTown = this._txtTown = new mini.WdTextBox(),
                    //txtVillage = this._txtVillage = new mini.WdTextBox(),
                    txtRoad = this._txtRoad = new mini.WdTextBox(),
                    txtLane = this._txtLane = new mini.WdTextBox(),
                    txtNum = this._txtNum = new mini.WdTextBox(),
                    txtRoom = this._txtRoom = new mini.WdTextBox();

                var numValueChanged = function (unit) {
                    return function (e) {
                        var value = e.sender.getValue();

                        if (/^\d+$/.test(value)) {
                            e.sender.setValue(value + unit)
                        }
                    };
                };

                // txtTown.set(this._getTxtOpts('town', {
                //     emptyText: '街道/镇'
                // }));
                // txtVillage.set(this._getTxtOpts('village', {
                //     emptyText: '村/社区'
                // }));
                txtRoad.set(this._getTxtOpts('road', {
                    width: '25%',
                    emptyText: '小区/路'
                }));
                txtLane.set(this._getTxtOpts('lane', {
                    width: '25%',
                    emptyText: '弄/幢',
                    onValueChanged: numValueChanged('弄')
                }));
                txtNum.set(this._getTxtOpts('num', {
                    width: '25%',
                    emptyText: '号',
                    onValueChanged: numValueChanged('号')
                }));
                txtRoom.set(this._getTxtOpts('room', {
                    width: '25%',
                    emptyText: '室',
                    onEnter: function (e) {
                        me.hidePopup();
                        me.focus();
                    },
                    onValueChanged: numValueChanged('室')
                }));

                var tabBodyEl = this._tabs.getTabBodyEl(tab);

                //txtTown.render(tabBodyEl);
                //txtVillage.render(tabBodyEl);
                txtRoad.render(tabBodyEl);
                txtLane.render(tabBodyEl);
                txtNum.render(tabBodyEl);
                txtRoom.render(tabBodyEl);
            },

            _syncCmbDataSource: function (name, parentValue) {
                var cmb = this._getTabCmb(name),
                    dataSource = this.dataSource[name];

                if (!dataSource)
                    return;

                if (Array.isArray(dataSource)) {
                    var mapped = this.dataSource[name + 'Mapped'] || (this.dataSource[name + 'Mapped'] = {});

                    if (!parentValue) {
                        cmb.setValue(null);
                        cmb.setEnabled(false);

                        return -1;
                    } else {
                        cmb.setEnabled(true);

                        var parentField = this.getParentField();
                        var data = mapped[parentValue] ||
                            (mapped[parentValue] = dataSource.filter(function (d) {
                                return d[parentField] == parentValue;
                            }));

                        if (cmb.getData() !== data) {
                            cmb.setValue(null);
                            cmb.setData(data);
                        }

                        if (data.length == 1) {
                            cmb.selectFirst();
                        }

                        return data.length;
                    }
                } else {
                    if (!parentValue) {
                        cmb.setValue(null);
                        cmb.setEnabled(false);

                        return -1;
                    } else {
                        cmb.setEnabled(true);

                        var oldUrl = cmb.getUrl(),
                            newUrl = wdlib.appendQueryString(dataSource, this.getSearchField() + '=' + parentValue);

                        if (oldUrl != newUrl) {
                            cmb.setValue(null);
                            cmb.setUrl(newUrl);

                            return 0;
                        } else {
                            return cmb.getData().length;
                        }
                    }
                }
            },

            dataSource: {},
            setDataSource: function (dataSource) {
                if ('province' in dataSource) {
                    this.setProvinceDataSource(dataSource.province);
                }

                if ('city' in dataSource) {
                    this.setCityDataSource(dataSource.city);
                }

                if ('county' in dataSource) {
                    this.setCountyDataSource(dataSource.county);
                }

                if ('town' in dataSource) {
                    this.setTownDataSource(dataSource.town);
                }

                if ('village' in dataSource) {
                    this.setVillageDataSource(dataSource.village);
                }
            },
            getDataSource: function () {
                return {
                    province: this.getProvinceDataSource(),
                    city: this.getCityDataSource(),
                    county: this.getCountyDataSource(),
                    town: this.getTownDataSource(),
                    village: this.getVillageDataSource()
                };
            },
            setProvinceDataSource: function (dataSource) {
                var cmb = this._getTabCmb('province');

                this.dataSource.province = dataSource;

                if (String.isString(dataSource)) {
                    cmb.setUrl(dataSource);
                } else {
                    cmb.setData(dataSource);
                }
            },
            getProvinceDataSource: function () {
                return this.dataSource.province;
            },
            setCityDataSource: function (dataSource) {
                this._setCmbDataSource('city', dataSource);
            },
            getCityDataSource: function () {
                return this.dataSource.city;
            },
            setCountyDataSource: function (dataSource) {
                this._setCmbDataSource('county', dataSource);
            },
            getCountyDataSource: function () {
                return this.dataSource.county;
            },
            setTownDataSource: function (dataSource) {
                this._setCmbDataSource('town', dataSource);
            },
            getTownDataSource: function () {
                return this.dataSource.town;
            },
            setVillageDataSource: function (dataSource) {
                this._setCmbDataSource('village', dataSource);
            },
            getVillageDataSource: function () {
                return this.dataSource.village;
            },

            addressFields: {
                province: 'province',
                city: 'city',
                county: 'county',
                town: 'town',
                village: 'village',
                road: 'road',
                lane: 'lane',
                num: 'num',
                room: 'room'
            },
            setAddressFields: function (fields) {
                if ('province' in fields) {
                    this.addressFields.province = fields.province;
                }

                if ('city' in fields) {
                    this.addressFields.city = fields.city;
                }

                if ('county' in fields) {
                    this.addressFields.county = fields.county;
                }

                if ('town' in fields) {
                    this.addressFields.town = fields.town;
                }

                if ('village' in fields) {
                    this.addressFields.village = fields.village;
                }

                if ('road' in fields) {
                    this.addressFields.road = fields.road;
                }

                if ('lane' in fields) {
                    this.addressFields.lane = fields.lane;
                }

                if ('num' in fields) {
                    this.addressFields.num = fields.num;
                }

                if ('room' in fields) {
                    this.addressFields.room = fields.room;
                }
            },

            address: {
                'province': {
                    lavel: 1,
                    next: 'city'
                },
                'city': {
                    lavel: 2,
                    pre: 'province',
                    next: 'county'
                },
                'county': {
                    lavel: 3,
                    pre: 'city',
                    next: 'town'
                },
                'town': {
                    lavel: 4,
                    pre: 'county',
                    next: 'village'
                },
                'village': {
                    lavel: 5,
                    pre: 'town',
                    next: 'detailed',
                },
                'detailed': {},
                'road': {
                    lavel: 6,
                    pre: 'village',
                    next: 'lane'
                },
                'lane': {
                    lavel: 7,
                    pre: 'road',
                    next: 'num',
                },
                'num': {
                    lavel: 8,
                    pre: 'lane',
                    next: 'room'
                },
                'room': {
                    lavel: 9,
                    pre: 'num'
                }
            },
            setValue: function (address) {
                if (!address) {
                    address = {};

                    address[this.addressFields['province']] = null;
                    address[this.addressFields['city']] = null;
                    address[this.addressFields['county']] = null;
                    address[this.addressFields['town']] = null;
                    address[this.addressFields['village']] = null;
                    address[this.addressFields['road']] = null;
                    address[this.addressFields['lane']] = null;
                    address[this.addressFields['num']] = null;
                    address[this.addressFields['room']] = null;
                }

                if (this.addressFields['province'] in address) {
                    this._setProvince(address[this.addressFields['province']]);
                }

                if (this.addressFields['city'] in address) {
                    this._setCity(address[this.addressFields['city']]);
                }

                if (this.addressFields['county'] in address) {
                    this._setCounty(address[this.addressFields['county']]);
                }

                if (this.addressFields['town'] in address) {
                    this._setTown(address[this.addressFields['town']]);
                }

                if (this.addressFields['village'] in address) {
                    this._setVillage(address[this.addressFields['village']]);
                }

                if (this.addressFields['road'] in address) {
                    this._setRoad(address[this.addressFields['road']]);
                }

                if (this.addressFields['lane'] in address) {
                    this._setLane(address[this.addressFields['lane']]);
                }

                if (this.addressFields['num'] in address) {
                    this._setNum(address[this.addressFields['num']]);
                }

                if (this.addressFields['room'] in address) {
                    this._setRoom(address[this.addressFields['room']]);
                }
            },
            getValue: function () {
                var value = {};

                value[this.addressFields['province']] = this._getProvince();
                value[this.addressFields['city']] = this._getCity();
                value[this.addressFields['county']] = this._getCounty();
                value[this.addressFields['town']] = this._getTown();
                value[this.addressFields['village']] = this._getVillage();
                value[this.addressFields['road']] = this._getRoad();
                value[this.addressFields['lane']] = this._getLane();
                value[this.addressFields['num']] = this._getNum();
                value[this.addressFields['room']] = this._getRoom();

                return value;
            },
            getText: function () {
                return this._getTextWithSplit();
            },
            getAddressNames: function () {
                var me = this,
                    texts = this._getTexts();

                var names = {};

                [
                    'province',
                    'city',
                    'county',
                    'town',
                    'village',
                    'road',
                    'lane',
                    'num',
                    'room'
                ].forEach(function (name) {
                    names[me.addressFields[name]] = texts[name];
                });

                return names;
            },
            _setProvince: function (province) {
                this._setCmbValue('province', province);
            },
            _getProvince: function () {
                return this._getTabCmb('province').getValue();
            },
            _getProvinceName: function () {
                return this._getTabCmb('province').getText() || '';
            },
            _setCity: function (city) {
                this._ensureCmbDataSource('city');
                this._setCmbValue('city', city);
            },
            _getCity: function () {
                return this._getProvince() && this._getTabCmb('city').getValue();
            },
            _getCityName: function () {
                return this._getProvinceName() && (this._getTabCmb('city').getText() || '');
            },
            _setCounty: function (county) {
                this._ensureCmbDataSource('county');
                this._setCmbValue('county', county);
            },
            _getCounty: function () {
                return this._getCity() && this._getTabCmb('county').getValue();
            },
            _getCountyName: function () {
                return this._getCityName() && (this._getTabCmb('county').getText() || '');
            },
            _setTown: function (town) {
                this._ensureCmbDataSource('town');
                this._setCmbValue('town', town);
            },
            _getTown: function () {
                //return this._cmbTown.getValue() || this._txtTown.getValue();

                return this._getCounty() && this._getTabCmb('town').getValue();
            },
            _getTownName: function () {
                //return (this._cmbTown.getText() || this._txtTown.getValue()) || '';

                return this._getCountyName() && (this._getTabCmb('town').getText() || '');
            },
            _setVillage: function (village) {
                this._ensureCmbDataSource('village');
                this._setCmbValue('village', village);
            },
            _getVillage: function () {
                //return this._cmbVillage.getValue() || this._txtVillage.getValue();
                return this._getTown() && this._getTabCmb('village').getValue();
            },
            _getVillageName: function () {
                //return (this._cmbVillage.getText() || this._txtVillage.getValue()) || '';

                return this._getTownName() && (this._getTabCmb('village').getText() || '');
            },
            _setRoad: function (road) {
                this._txtRoad.setValue(road);
            },
            _getRoad: function () {
                return this._getCounty() && this._txtRoad.getValue();
            },
            _getRoadName: function () {
                return this._getCountyName() && (this._getRoad() || '');
            },
            _setLane: function (lane) {
                this._txtLane.setValue(lane);
            },
            _getLane: function () {
                return this._getCounty() && this._txtLane.getValue();
            },
            _getLaneName: function () {
                return this._getCountyName() && (this._getLane() || '');
            },
            _setNum: function (num) {
                this._txtNum.setValue(num);
            },
            _getNum: function () {
                return this._getCounty() && this._txtNum.getValue();
            },
            _getNumName: function () {
                return this._getCountyName() && (this._getNum() || '');
            },
            _setRoom: function (room) {
                this._txtRoom.setValue(room);
            },
            _getRoom: function () {
                return this._getCounty() && this._txtRoom.getValue();
            },
            _getRoomName: function () {
                return this._getCountyName() && (this._getRoom() || '');
            },

            _setCmbValue: function (name, value) {
                var ds = this.dataSource[name],
                    cmb = this._getTabCmb(name);

                this.address[name].value = value;

                if (String.isString(ds)) {
                    if (this._loaded[name]) {
                        cmb.setValue(value);
                    }
                } else {
                    cmb.setValue(value);
                }
            },
            _setCmbDataSource: function (name, dataSource) {
                var cmb = this._getTabCmb(name);

                this.dataSource[name] = dataSource;

                if (Array.isArray(dataSource)) {
                    cmb.setData(dataSource);
                } else {
                    //cmb.setUrl(dataSource);
                }
            },
            _ensureCmbDataSource: function (name) {
                var ds = this.dataSource[name];

                if (String.isString(ds)) {
                    var searchField = this.getSearchField(),
                        parentValue = this.address[this._getPreName(name)].value || 0;

                    this._getTabCmb(name).setUrl(wdlib.appendQueryString(ds, searchField + '=' + parentValue));
                }
            },

            _getTexts: function () {
                return {
                    province: this._getProvinceName(),
                    city: this._getCityName(),
                    county: this._getCountyName(),
                    town: this._getTownName(),
                    village: this._getVillageName(),
                    road: this._getRoadName(),
                    lane: this._getLaneName(),
                    num: this._getNumName(),
                    room: this._getRoomName()
                };
            },

            _stepNextTab: function (tab) {
                var nextTab = this._getNextTab(tab);

                if (nextTab) {
                    this._closePosiblePopup(tab);
                    this._tabs.activeTab(nextTab);
                }
            },
            _getNextTab: function (tab) {
                var tabs = this._tabs;

                if (!tab) {
                    tab = tabs.getActiveTab();
                } else {
                    tab = tabs.getTab(tab);
                }

                if (!tab) {
                    return;
                }

                return tabs.getTab(this._getNextName(tab.name));
            },

            _ActiveTabChanged: function (tab) {
                // popup尺寸适配各个tab页
                this.popup.doLayout();
                // 控制当前tab内容状态
                this._syncTabState(tab);
            },
            _BeforeActiveTabChanged: function (tab) {
                this._closePosiblePopup(tab);
            },

            _closePosiblePopup: function (tab) {
                tab = tab ? this._tabs.getTab(tab) : this._tabs.getActiveTab();

                if (!tab)
                    return;

                var cmb = this._getTabCmb(tab.name);

                cmb && cmb.hidePopup();
            },
            _syncTabState: function (tab) {
                tab = this._tabs.getTab(tab);

                if (!tab) {
                    return;
                }

                var thisShowPopup = this.isShowPopup();

                switch (tab.name) {
                    case 'province': {
                        this._cmbProvince.focus();
                        thisShowPopup && this._cmbProvince.showPopup();

                        break;
                    }
                    case 'city':
                    case 'county':
                    case 'town':
                    case 'village': {
                        var tabCmb = this._getTabCmb(tab.name),
                            parentTabCmb = this._getParentTabCmb(tab.name);

                        var dataLength = this._syncCmbDataSource(tab.name, parentTabCmb.getValue());

                        if (thisShowPopup && (dataLength > 1 || dataLength == 0)) {
                            tabCmb.showPopup();
                            tabCmb.focus();
                        } else if (thisShowPopup && dataLength == 1) {
                            tabCmb.getValueFromSelect() && this._stepNextTab(tab.name);
                        } else if (dataLength == -1) {
                            // 禁用
                        }

                        break;
                    }
                    case 'detailed': {
                        var address = this._getTexts();

                        var enabled = !!address.province && !!address.city && !!address.county;

                        this._doWithTxts(function (txt) {
                            txt.setEnabled(enabled);
                            !enabled && txt.setValue(null);
                        });

                        if (enabled) {
                            // this._txtTown.setValue(address.town);
                            // this._txtTown.setEnabled(!address.town);
                            //
                            // this._txtVillage.setValue(address.village);
                            // this._txtVillage.setEnabled(!address.village);
                            //
                            // !address.town ? this._txtTown.focus() :
                            //     !address.village ? this._txtVillage.focus() :
                            //         this._txtRoad.focus();

                            this._txtRoad.focus()
                        }

                        break;
                    }
                }
            },
            _updateText: function () {
                var txt = this._getTextWithSplit('/');

                this.setText(txt);
            },

            _getTextWithSplit: function (split) {
                split = split || '';

                var value = this._getTexts();
                var detailed = value.road + value.lane + value.num + value.room;

                var txt = '';

                var addrs = [
                    value.province,
                    value.city,
                    value.county,
                    value.town,
                    value.village
                ];

                for (var i = 0; i < addrs.length; i++) {
                    if (!addrs[i])
                        break;

                    txt += (i === 0 ? '' : split) + addrs[i];
                }

                (addrs[0] && addrs[1] && addrs[2] && detailed) && (txt += split + detailed);

                return txt;
            },

            valueField: 'id',
            setValueField: function (valueField) {
                this.valueField = valueField;

                this._doWithCmbs(function (cmb) {
                    cmb.setValueField(valueField);
                });
            },
            getValueField: function () {
                return this.valueField;
            },

            textField: 'text',
            setTextField: function (textField) {
                this.textField = textField;

                this._doWithCmbs(function (cmb) {
                    cmb.setTextField(textField);
                });
            },
            getTextField: function () {
                return this.valueField;
            },

            parentField: 'parentId',
            setParentField: function (parentField) {
                this.parentField = parentField;
            },
            getParentField: function () {
                return this.parentField;
            },

            searchField: 'parentId',
            setSearchField: function (searchField) {
                this.searchField = searchField;
            },
            getSearchField: function () {
                return this.searchField;
            },

            localSearchFields: null,
            setLocalSearchFields: function (localSearchFields) {
                this.localSearchFields = localSearchFields;

                this._doWithCmbs(function (cmb) {
                    cmb.setLocalSearchFields(localSearchFields);
                });
            },
            getLocalSearchFields: function () {
                return this.localSearchFields;
            },

            columns: null,
            setColumns: function (columns) {
                this.columns = columns;

                this._doWithCmbs(function (cmb) {
                    cmb.setColumns(columns);
                });
            },
            getColumns: function () {
                return this.columns;
            },

            lavel: null,
            setLavel: function (lavel) {
                if (lavel && lavel < 3) {
                    this.lavel = 3; // 目前只支持最小3级
                }
            },
            getLavel: function () {
                return this.lavel;
            },

            _loaded: {},

            _doWithCmbs: function (fn) {
                var me = this;

                [
                    'province',
                    'city',
                    'county',
                    'town',
                    'village'
                ].forEach(function (name) {
                    fn(me._getTabCmb(name));
                });
            },
            _doWithTxts: function (fn) {
                [
                    //this._txtTown,
                    //this._txtVillage,
                    this._txtRoad,
                    this._txtLane,
                    this._txtNum,
                    this._txtRoom
                ].forEach(function (txt) {
                    fn(txt);
                });
            },
            _getCmbOpts: function (name, opt) {
                var me = this;

                !opt && (opt = {});

                var _onValueChanged = opt.onValueChanged;
                delete opt.onValueChanged;

                return mini.copyTo({
                    width: '100%',
                    showClose: true,
                    fireChangeOnSetValue: true,
                    ajaxAsync: true,
                    onBeforeShowPopup: function (e) {
                        if (!me.isShowPopup() || me._tabs.getActiveTab().name != name) {
                            e.cancel = true;
                        }
                    },
                    onValueChanged: function (e) {
                        me.address[name].value = e.value;

                        //me._syncNextCmbDataSource(name, e.value);
                        me._updateText();

                        _onValueChanged && _onValueChanged.apply(this, arguments);
                    },
                    onCloseClick: function (e) {
                        e.sender.setValue(null);
                    },
                    onBeforeItemClick: function (e) {
                        me._stepNextTab(name);
                    },
                    onEnter: function (e) {
                        me._stepNextTab(name);
                    },
                    onBeforeLoad: function (e) {
                        me._loaded[name] = false;
                    },
                    onLoad: function (e) {
                        me._loaded[name] = true;

                        if (e.data.length == 1) {
                            e.sender.selectFirst();
                            if (e.sender.getValueFromSelect()) {
                                me._stepNextTab(name);
                            }
                        } else {
                            me._getTabCmb(name).setValue(me.address[name].value);

                            me.isShowPopup() && e.sender.showPopup();
                        }
                    }
                }, opt);
            },
            _getTxtOpts: function (name, opts) {
                var me = this;

                var _onValueChanged = opts.onValueChanged;
                delete opts.onValueChanged;

                return mini.copyTo({
                    width: '50%',
                    onEnter: function (e) {
                        var nextTxt =
                            //name == 'town' ? me._txtVillage :
                            //name == 'village' ? me._txtRoad :
                            name == 'road' ? me._txtLane :
                                name == 'lane' ? me._txtNum :
                                    name == 'num' ? me._txtRoom : null;

                        nextTxt && nextTxt.focus();
                    },
                    onValueChanged: function (e) {
                        _onValueChanged && _onValueChanged.apply(this, arguments);

                        me._updateText();
                    }
                }, opts || {});
            },
            _getTabCmb: function (tabName) {
                var cmbName = '_cmb' + tabName[0].toUpperCase() + tabName.substr(1);

                return this[cmbName];
            },
            _getParentTabCmb: function (name) {
                return this._getTabCmb(this._getPreName(name));
            },
            _getPreName: function (name) {
                return this.address[name].pre;
            },
            _getNextName: function (name) {
                return this.address[name].next;
            },

            // disabled methods
            setAllowInput: function () {
            },
            setShowPopupOnClick: function () {
            },

            __OnPopupKeyDown: function (e) {
                mini.WdAddressPicker.superclass.__OnPopupKeyDown.apply(this);

                if (e.keyCode == 27) {
                    this.hidePopup();
                    this.focus();
                }
            },

            __OnPopupClose: function (e) {
                mini.WdAddressPicker.superclass.__OnPopupClose.apply(this);

                this.focus();
            },

            showTip: true
        });

        mini.regClass(mini.WdAddressPicker, 'wd-addresspicker');
    })(mini);

    /**
     * 表单控件回车导航
     * @param formId
     * @param showPopup 下拉框是否自动弹出
     * @param withParents 是否考虑父元素的可见性
     * @param onEnterEnd 回车结束事件
     * @param 表单配置
     * @return {WdForm}
     */
    mini.bindFormEnterKey = function (formId, showPopup, withParents, onEnterEnd, formOpts) {
        var form = new mini.WdForm(formId, formOpts);

        (showPopup == undefined) && (showPopup = true);

        $('#' + formId).on('keydown', '.mini-textbox-input,.mini-buttonedit-input,.mini-textboxlist-input', function (e) {
            var e = e || window.event;

            if (e.keyCode == 13) {
                var el = $(this);
                var nextControl = getNextInput(el[0]);

                if (nextControl) {
                    nextControl.focus();

                    if (showPopup) {
                        Function.isFunction(nextControl.showPopup) &&
                        nextControl.showPopup();

                        Function.isFunction(nextControl.doQuery) &&
                        nextControl.doQuery();
                    }
                } else {
                    form.fire('enterend');
                }
            }
        });

        Function.isFunction(onEnterEnd) &&
        form.on('enterend', onEnterEnd);

        function getNextInput(current) {
            var controls = form.getFields();

            for (var i = 0, l = controls.length; i < l; i++) {
                var control = controls[i],
                    controlEl = control._textEl || control._inputEl;
                if (current == controlEl) {
                    for (var j = 0, k = l - i; j < k; j++) {

                        var nextControl = controls[i + j + 1],
                            parentsHidden = withParents && nextControl && $(nextControl.el).parents().is(':hidden');

                        if (nextControl &&
                            (nextControl.getEnabled() !== false) &&
                            (nextControl.getVisible() !== false) &&
                            (mini.hasClass(nextControl.el, 'mini-textbox') || mini.hasClass(nextControl.el, 'mini-buttonedit') || mini.hasClass(nextControl.el, 'mini-textboxlist')) &&
                            !mini.hasClass(nextControl.el, 'mini-hidden') &&
                            !nextControl.skipEnter &&
                            !parentsHidden) {
                            return nextControl;
                        } else {
                            continue;
                        }
                    }
                }
            }

            return null;
        }

        return form;
    };

    /**
     * 遮罩操作
     * @param fn
     * @param msg
     * @param begin 遮罩开始回调
     * @param end 遮罩结束回调
     * @return {Function}
     */
    mini.withWaiting = function (fn, msg, begin, end) {
        if (Function.isFunction(msg)) {
            end = begin;
            begin = msg;
        }

        return function () {
            begin && begin();

            topMini.showMaskLoading({html: msg});

            return fn.apply(this, arguments)
                .then(function (data) {
                    topMini.unmask();
                    end && end();

                    return data;
                })
                .catch(function (e) {
                    topMini.unmask();
                    end && end();

                    throw e;
                });
        };
    };

    /**
     * 获取父窗体
     * @param me 当前窗体
     * @param hasMini 是否要求miniui
     */
    mini.getParentWin = function (me, hasMini) {
        me = me || window;

        if (me.parent && me.parent != me) {
            if (hasMini) {
                try {
                    me['___try'] = 1;
                    if (me['___try'] == 1 && me.parent.mini) {
                        return me.parent;
                    }
                } catch (ex) {
                    return null;
                }
            } else {
                return me.parent;
            }
        } else {
            return null;
        }
    };

    //mini.getAttrsWithOptions = getAttrsWithOptions;
    mini.options = options;
    mini.wdExtend = extend;
    mini.jQuery = $;

    return mini;
});
