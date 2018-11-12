/**
 * Created by shao on 2018/1/18.
 * 提供打印相关接口
 */
define(['View', 'jquery', 'print'], function (View, $) {

    function createPrintIFrame(url) {

        var promise = $.Deferred();

        function _load() {
            var win = iframe.contentWindow;

            try {
                var viewReady = win.viewReady;
            } catch (e) {
            }

            if (Function.isFunction(viewReady)) {
                win.viewReady(function (view) {
                    promise.resolve(iframe);
                });
            } else {
                promise.resolve(iframe);
            }
        }

        var iframe = document.createElement('iframe');
        iframe.name = 'printIframe';
        iframe.id = 'printThis-' + (new Date()).getTime();
        iframe.src = url;

        if (iframe.attachEvent) {
            iframe.attachEvent('onload', _load);
        } else {
            iframe.onload = _load;
        }

        document.body.appendChild(iframe);

        $(iframe).css({
            position: 'absolute',
            width: '0px',
            height: '0px',
            left: '-600px',
            top: '-600px'
        });

        return promise;
    }

    function printIFrame(iframe) {
        if (document.queryCommandSupported('print')) {
            iframe.contentWindow.document.execCommand('print', false, null);
        } else {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }

        // remove iframe
        setTimeout(function () {
            $(iframe).remove();
        }, 1000);
    }

    return View.add({
        /**
         * 打印当前页面元素
         * @param selector
         */
        printThis: function (selector) {
            this.$(selector).printThis();
        },

        /**
         * 打印外部链接页面
         * @param url
         */
        printUrl: function (url) {
            createPrintIFrame(url).then(printIFrame);
        }
    });
});