/**
 * Created by shao on 2018/1/18.
 * 提供和主界面的交互接口
 */
define(
    [
        'View'
    ],
    function (View) {
        return View.add({
            /**
             * 从主界面打开或刷新窗口
             * @param id 标识/对应菜单的CODE
             * @param url
             * @param title
             * @param icon
             * @param options
             */
            openOrRefreshWin: function (id, url, title, icon, options) {
                window.top.view.openOrRefreshTab(this.mini.copyTo(options || {},
                    {
                        code: id,
                        url: url,
                        title: title,
                        iconCls: icon || undefined,
                        showCloseButton: true
                    }));
            },

            /**
             * 打开或定位窗口
             * @param id
             * @param url
             * @param title
             * @param icon
             * @param options
             */
            openWin: function (id, url, title, icon, options) {
                window.top.view.openTab(this.mini.copyTo(options || {},
                    {
                        code: id,
                        url: url,
                        title: title,
                        iconCls: icon || undefined,
                        showCloseButton: true
                    }));
            },

            /**
             * 关闭窗口
             * @param id
             */
            closeWin: function (id) {
                window.top.view.closeTab(id);
            },

            /**
             * 获取打开窗口数
             * @return {*}
             */
            getWinCount: function () {
                return window.top.view.getTabCount();
            },

            /**
             * 注册工具菜单
             * @param fn
             */
            regiterToolFn: function (fn) {
                window.top.view.regiterToolFn(fn);
            },

            /**
             * 注销工具菜单
             * @param code
             */
            unregisterToolFn: function (code) {
                window.top.view.unregisterToolFn(code);
            },

            updateToolFn: function (fn) {
                window.top.view.updateToolFn(fn);
            },

            /**
             * 判断工具菜单是否已注册
             * @param code
             * @return {*}
             */
            isToolFnRegistered: function (code) {
                return window.top.view.isToolFnRegistered(code);
            }
        });
    });