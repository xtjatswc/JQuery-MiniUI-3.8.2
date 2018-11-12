/*
 html5消息 处理类
 */

var postMessageClass = function () {
    this.topreflash = function () {
        window.top.postMessage({"id": 3}, "*"); //*允许跨域
    };
    this.topeval = function (code) {
        window.top.postMessage({"id": 1, "msg": code}, "*"); //*允许跨域
    }
    return this;
}

/**
 * Created by JXH on 2017/7/25.
 */

$(function () {
    if (window.parent != window &&
        window.parent == window.top) {
        $("body").click(function () {
            window.top.postMessage({"id": 2}, "*"); //*允许跨域
        })
    }
    window.topMessageObject = new postMessageClass();

    window.getFunctionName = function (func) {
        if (typeof func == 'function' || typeof func == 'object') {
            var name = ('' + func).match(/function\s*([\w\$]*)\s*\(/);
        }
        return name && name[1];
    }

    window.topreflash = function (result) {
        if (topMessageObject) {
            var r = confirm("登陆超时，是否重新登陆？")
            if (r == true) {
                topMessageObject.topreflash();
            }
        }
    }

    window.logincheck = function () {
        if (window != window.top) {
            topMessageObject.topreflash();
        }
    }

});
