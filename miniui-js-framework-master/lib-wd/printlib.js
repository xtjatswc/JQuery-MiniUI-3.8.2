define(['nativelib'], function (nativelib) {

    function Printer() {
        const doPrintUrl = function (opt) {
            var printdiv = document.getElementById("printdiv");
            //printdiv.innerHTML = "";
            var iframe = document.createElement('iframe');
            iframe.src = opt.xmlurl;
            iframe.style.width = "1px";
            iframe.style.height = "1px";
            iframe.style.display = "none";
            iframe.printthis = function (html) {
                iframe.printthis = null;
                opt.html = html;
                printdiv.removeChild(iframe);
                doPrint(opt);
            }
            iframe.onerror = function (e) {
                console.error(e)
                iframe.printthis = null;
                printdiv.removeChild(iframe);
            }
            printdiv.appendChild(iframe);
        }
        const doPrintUrlPost = function (opt) {
            var printdiv = document.getElementById("printdiv");
            var ifname = 'printiframe_' + Math.random();
            //创建form
            var turnForm = document.createElement("form");
            printdiv.appendChild(turnForm);
            turnForm.method = 'post';
            turnForm.action = opt.xmlurl;
            turnForm.encoding = "multipart/form-data";
            turnForm.target = ifname;
            //创建隐藏表单
            var newElement = document.createElement("input");
            newElement.setAttribute("name", opt.jsonkey || "jsondata");
            newElement.setAttribute("type", "hidden");
            newElement.setAttribute("value", opt.jsonbody);
            turnForm.appendChild(newElement);

            var iframe = document.createElement('iframe');
            //iframe.src = opt.xmlurl;
            iframe.name = ifname
            iframe.style.width = "1px";
            iframe.style.height = "1px";
            iframe.style.display = "none";
            iframe.printthis = function (html) {
                iframe.printthis = null;
                opt.html = html;
                printdiv.removeChild(iframe);
                printdiv.removeChild(turnForm);
                doPrint(opt);
            }
            iframe.onerror = function (e) {
                console.error(e)
                iframe.printthis = null;
                printdiv.removeChild(iframe);
            }
            printdiv.appendChild(iframe);
            turnForm.submit();
        }
        const doPrint = function (opt) {
            if (opt.html) {
                opt.html = formathtml(opt.html);
            }
            setTimeout(function (opt) {
                lodopfun(opt)
            }, 200, opt)
        }

        const lodopfun = function (opt) {
            //打印
            LODOP.PRINT_INIT(opt.title || "printinit");
            //intOrient：
            // 打印方向及纸张类型，数字型，
            //1---纵(正)向打印，固定纸张；
            //2---横向打印，固定纸张；
            //3---纵(正)向打印，宽度固定，高度按打印内容的高度自适应；
            //0(或其它)----打印方向由操作者自行选择或按打印机缺省设置；
            LODOP.SET_PRINT_PAGESIZE(opt.orient || 0, opt.pagew || 0, opt.pageh || 0, opt.pagetype || "");//设置打印纸张大小
            LODOP.SET_PRINTER_INDEX(opt.printer || -1);//指定打印机 -1默认
            if (LODOP && !window.ISCLODOP) {
                LODOP.SET_SHOW_MODE("MESSAGE_GETING_URL", "");
                LODOP.SET_SHOW_MODE("MESSAGE_PARSING_URL", "");
                var printvurl = window.top.location.protocol + '//' + window.top.location.host + '/wdhis-core-web/print/hack/printv.html';
                console.log(printvurl);
                LODOP.ADD_PRINT_URL(0, 0, 0, 0, printvurl);
            }
            if (opt.url) {
                LODOP.ADD_PRINT_URL(opt.top || 0, opt.left || 0, opt.width || "100%", opt.height || "100%", opt.url);
            }
            if (opt.html) {
                LODOP.ADD_PRINT_HTM(opt.top || 0, opt.left || 0, opt.width || "100%", opt.height || "100%", opt.html);
            }
            if (opt.preview == 1) {
                LODOP.SET_PREVIEW_WINDOW(1, 2, 1, 0, 0, "打印预览");
                LODOP.PREVIEW();
            } else if (opt.preview == 2) {
                LODOP.PRINT_DESIGN();
            } else {
                LODOP.PRINT();
            }
        }
        const doPrintAjaxUrl = function (opt) {

            function loadxmldoc(url) {
                var xmlhttp;
                if (window.ActiveXObject) {
                    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
                } else if (window.XMLHttpRequest) {
                    xmlhttp = new XMLHttpRequest();
                }
                xmlhttp.open("GET", url, false);
                xmlhttp.send();
                if (!xmlhttp.responseXML && xmlhttp.responseText) {
                    //转化为dom
                    try {
                        if (window.activexobject) {
                            var xmlobject = new ActiveXObject("Microsoft.XMLDOM");
                            xmlobject.async = "false";
                            xmlobject.loadxml(xmlhttp.responseText);
                            return xmlobject;
                        }
                        else {
                            var parser = new DOMParser();
                            var xmlobject = parser.parseFromString(xmlhttp.responseText, "text/xml");
                            return xmlobject;
                        }
                    } catch (e) {
                        return "";
                    }
                } else {
                    return xmlhttp.responseXML;
                }
            }

            function load(opt) {
                var xml = loadxmldoc(opt.xmlurl);//加载xml
                var xsl = loadxmldoc(opt.xslurl);//加载xsl
                var doc;
                if (window.activexobject) { //ie
                    doc = xml.transformNode(xsl);
                    console.log(doc);//doc就是html字符串,这个先不考虑
                }
                else if (document.implementation && document.implementation.createDocument) {
                    //其他浏览器 就是我门用的-_-
                    var xsltprocessor = new XSLTProcessor();
                    xsltprocessor.importStylesheet(xsl);
                    doc = xsltprocessor.transformToDocument(xml, document);
                    var printdiv = document.getElementById("printdiv");
                    var iframe = document.createElement('iframe');
                    //iframe.src = url;
                    iframe.style.width = "1px";
                    iframe.style.height = "1px";
                    iframe.style.display = "none";
                    iframe.printthis = function (html) {
                        iframe.printthis = null;
                        opt.html = html
                        printdiv.removeChild(iframe);
                        doPrint(opt);
                    }
                    iframe.onload = function () {
                        iframe.contentWindow.document.write(doc.getElementsByTagName('html')[0].innerHTML);
                    }
                    printdiv.appendChild(iframe);
                }
            }

            try {
                load(opt);
            } catch (e) {
                throw "打印失败!"
            }
        }
        const formathtml = function (html) {
            //定义正则表达式，只要是存在于<script>和</script>之间的内容都会被删除
            var SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<script[^<]*\/>/gi;
            var HEAD_REGEX = /<head\b\s*>([^<]*(?:(?!<\/head>)<[^<]*)*)<\/head>/i;
            var META_REGEX = /<meta\b[^<]*(?:http-equiv="X-UA-Compatible").*>/i;
            var HTML_REGEX = /(.*<\s*html\b\s*>)|(<\/\s*html\b\s*>)/gi;
            //var metahtml = "<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">";
            var metahtml = "<meta http-equiv=\"X-UA-Compatible\" content=\"IE=EmulateIE8\">";

            if (SCRIPT_REGEX.test(html)) {
                html = html.replace(SCRIPT_REGEX, ""); //正则替换为空
            }
            if (HEAD_REGEX.test(html)) {
                if (META_REGEX.test(html)) {
                    html = html.replace(META_REGEX, metahtml);
                } else {
                    let matches = HEAD_REGEX.exec(html);
                    console.log(matches);
                    if (matches) {
                        var intxt = matches[1];
                        intxt = "<head>" + metahtml + intxt + "</head>";
                        html = html.replace(HEAD_REGEX, intxt);
                    }
                }
            } else {
                html = "<head>" + metahtml + "</head>" + html;
            }
            if (HTML_REGEX.test(html)) {
                html = html.replace(HTML_REGEX, ""); //正则替换为空
            }
            return '<!DOCTYPE html><html>' + html + '</html>';
        }
        return {
            doPrintUrl: doPrintUrl,
            doPrint: doPrint,
            doPrintUrlPost: doPrintUrlPost
        }
    }

    window.CPRINTER = (function () {
        const lodop = {};
        const regfun = function () {
            if (LODOP) {
                //===如下空白位置适合调用统一功能(如注册语句、语言选择等):===
                LODOP.SET_LICENSES("宁波金唐软件有限公司", "1D7421D5AB0D28764777D05CDAAADDA1", "", "");
                //===========================================================
            }
            lodop.LODOP = LODOP;
        }
        if (typeof LODOP === "undefined") {
            window.LODOP = null;
            window.LODOP = nativelib.lodop;
            if (!LODOP) {
                var head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
                var oscript = document.createElement("script");
                oscript.src = "http://localhost:8000/CLodopfuncs.js?priority=1";
                head.insertBefore(oscript, head.firstChild);
                if (oscript.readyState) {
                    oscript.onreadystatechange = function () {
                        if (oscript.readyState == "loaded" || oscript.readyState == "complete") {
                            oscript.onreadystatechange = null;
                            regfun();
                        }
                    }
                } else {
                    oscript.onload = function () {
                        regfun();
                    }
                }
                window.ISCLODOP = true;
                //head.insertBefore(oscript, head.firstChild);
            } else {
                window.ISCLODOP = false;
                regfun();
            }
        }
        //直接打印
        lodop.LODOPPRINT = function (opt) {
            if (typeof LODOP === "undefined") {
                throw "打印控件未安装！"
            }
            new Printer().doPrint(opt);
        };
        //xsl里面跨域不能用
        lodop.LODOPPRINTURL = function (opt) {
            let printer = new Printer();
            if (opt.jsonbody) {
                printer.doPrintUrlPost(opt);
            } else {
                printer.doPrintUrl(opt);
            }
        };
        return lodop;
    })();
    return window.CPRINTER;
})
