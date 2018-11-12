(function () {
    console.log(document.domain)
    var div = window.parent.document.getElementById("printdiv")
    var iframes = div.getElementsByTagName("iframe");
    for (var i = 0; i < iframes.length; i++) {
        if (iframes[i].contentWindow == window) {
            console.log(iframes[i].src);
            var htmldom = document.getElementsByTagName('html')[0];
            var html = htmldom.innerHTML;
            // //定义正则表达式，只要是存在于<script>和</script>之间的内容都会被删除
            // var SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<script[^<]*\/>/gi;
            // var HEAD_REGEX = /<head\b\s*>([^<]*(?:(?!<\/head>)<[^<]*)*)<\/head>/i;
            // var META_REGEX = /<meta\b[^<]*(?:http-equiv="X-UA-Compatible").*>/i;
            // var metahtml = "<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">";
            // if (SCRIPT_REGEX.test(html)) {
            //     html = html.replace(SCRIPT_REGEX, ""); //正则替换为空
            // }
            // if (HEAD_REGEX.test(html)) {
            //     if (META_REGEX.test(html)) {
            //         html = html.replace(META_REGEX, metahtml);
            //     } else {
            //         let matches = HEAD_REGEX.exec(html);
            //         console.log(matches);
            //         if (matches) {
            //             var intxt = matches[1];
            //             intxt = "<head>" + metahtml + intxt + "</head>";
            //             html = html.replace(HEAD_REGEX, intxt);
            //         }
            //     }
            // } else {
            //     html = "<head>" + metahtml + "</head>" + html;
            // }
            // html = '<!DOCTYPE html><html>' + html + '</html>';
            iframes[i].printthis(html);
        }
    }
})();