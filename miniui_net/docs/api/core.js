function GetParams(url, c) {
    if (!url) url = location.href;
    if (!c) c = "?";
    url = url.split(c)[1];
    var params = {};
    if (url) {
        var us = url.split("&");
        for (var i = 0, l = us.length; i < l; i++) {
            var ps = us[i].split("=");
            params[ps[0]] = decodeURIComponent(ps[1]);
        }
    }
    return params;
}
function GetUI(url) {
    var ss = url.split("\/");
    url = ss[ss.length - 1];
    ss = url.split(".");
    var ui = ss[0];
    return ui;
}
function ExpandUI(ui) {
    var apiTree = mini.get("apiTree");
    
}

function onIFrameLoad(iframe) {
    var ui = "";
    try {
        var url = iframe.contentWindow.location.href;
        ui = GetUI(url);
    } catch (e) {
    }
    if (ui && ui != "overview") {
        window.location = "index.html#ui=" + ui;        
    }
}


window.onload = function () {
    var url = window.location.href;
    if (url.indexOf("index.html") == -1) {
        if (parent == window) {
            var ui = GetUI(location.href);
            window.location = "index.html#ui=" + ui;
        }
    } else {
        var params = GetParams(location.href, "#");
        if (params.ui) {
            var frame = document.getElementById("mainframe");
            frame.src = params.ui + ".html";

            //处理树形节点展开
            ExpandUI(ui);
        }
    }
}