define(function () {
    if (typeof  window.top.noderequire === 'undefined') {
        console.warn("noderequire undefined");
        return {"iselectron": false};
    }
    if (typeof window.top.electron === 'undefined' || !window.top.electron) {
        try {
            window.top.electron = noderequire('nativelib');
            window.top.electron.noderequire = noderequire;
        } catch (e) {
            console.warn(e);
        }
    }
    return window.top.electron
});