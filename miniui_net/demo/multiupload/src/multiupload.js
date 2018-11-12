if (!window.UserControl) window.UserControl = {};

UserControl.MultiUpload = function () {

    UserControl.MultiUpload.superclass.constructor.call(this);
    var me = this;
    me.postParam = {};
    setTimeout(function () {
        //  me.initComponents();
        me.bindEvents();
    }, 300);
}

mini.extend(UserControl.MultiUpload, mini.DataGrid, {

    uiCls: 'uc-multiupload',

    flashUrl: '',
    uploadUrl: '',
    uploader: undefined,
    uploadName: "Fdata",
    limitSize: "10MB",
    limitType: "*",
    uploadLimit: 0,
    queueLimit: 10,
    postParam: null,
    //  continuity: false,  //连续上传
    autoUpload: false,   //选中即上传

    customSettings: { queue: null },

    columnsTexts: {
        nameColumnHeader: "文件名",
        typeColumnHeader: "文件类型",
        sizeColumnHeader: "文件大小",
        completeColumnHeader: "上传进度",
        statusColumnHeader: "上传状态",
        actionColumnHeader: "操作"

    },
    _create: function () {

        UserControl.MultiUpload.superclass._create.call(this);
        var me = this;
        var defaultColumns = [
                    { "type": "indexColumn" },
                    { field: "name", width: 150, header: me.columnsTexts.nameColumnHeader },
                    { field: "type", width: 50, header: me.columnsTexts.typeColumnHeader, align: "center", headerAlign: "center" },
                    { field: "size", width: 60, header: me.columnsTexts.sizeColumnHeader, align: "center", headerAlign: "center" },
                    { field: "complete", width: 80, header: me.columnsTexts.completeColumnHeader, headerAlign: "center" },
                    { field: "status", width: 60, header: me.columnsTexts.statusColumnHeader, align: "center", headerAlign: "center" },
                    { field: "action", width: 30, header: me.columnsTexts.actionColumnHeader, align: "center", headerAlign: "center" }
                  ];

        me.set({
            showPager: false,
            showToolbar: true,
            columns: defaultColumns
        })
        var toolbarEl = me.getToolbarEl();
        toolbarEl.style.height = "30px";

        me._uploadId = me._id + "$button_placeholder";
        var sb = [];
        sb.push('<table><tr><td style="width:80px;height:25px;"><a class="mini-button" iconCls="icon-search" style="width:80px">浏览...</a><span class="mini-upload"><span id="' + me._uploadId + '" class="mini-upload-placeholder" style=""></span></span>');
        // sb.push('<table><tr><td style="width:80px"><div class="mini-upload" style=""><span id="' + me._uploadId + '" class="mini-upload-placeholder" style=""></span><span class="mini-upload-button" style="">浏览...</span></div>');
        sb.push('</td><td><a class="mini-button" iconCls="icon-upload" name="multiupload">批量上传</a>');
        sb.push('</td><td><a class="mini-button" iconCls="icon-remove" name="removeAll">清空上传</a>');
        sb.push('</td></tr></table>');


        toolbarEl.innerHTML = sb.join("");

        // me._fileEl = mini.append(toolbarEl, '<div style="width:80px;height:20px;display:inline-block;padding-left:5px;padding-top:2px;"><span id="' + me._uploadId + '" style="display:inline-block;width:100%;height:100%">浏览...</span></div>');



    },
    //    initComponents: function () {


    //    },
    __OnMouseMove: function () {
        var me = this;
        if (!me.uploader) {
            var upload = new SWFUpload({
                file_post_name: me.uploadName,
                upload_url: me.uploadUrl,
                flash_url: me.flashUrl,

                file_size_limit: me.limitSize,  // 10MB  
                file_types: me.limitType,   //此处也可以修改成你想限制的类型，比如：*.doc;*.wpd;*.pdf  
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
                button_placeholder_id: me._id + "$button_placeholder",
                button_width: 80,
                button_height: 25,
                button_window_mode: "transparent",
                button_action: SWFUpload.BUTTON_ACTION.SELECT_FILES,  //对话框按shift多选文件
                button_text: '',
                // button_text_style: ".redText { color: #FF0000; }",  
                button_text_left_padding: 0,
                button_text_top_padding: 0,
                //  button_image_url: "http://www.swfupload.org/button_sprite.png",  
                // Debug 设置
                debug: false

            });
            upload.flashReady();
            me.uploader = upload;
            me.uploadButton.on("click", function () {
                var rows = me.getData();
                if (rows.length > 0) {
                    me.continuity = true;
                    me.startUpload();
                }
            });
            me.removeButton.on("click", function () {

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
        var me = this;
        me._fileEl = document.getElementById(me._uploadId);
        me.uploadEl = me._fileEl;
        var toolbarEl = me.getToolbarEl();
        mini.on(me.uploadEl, "mousemove", me.__OnMouseMove, me);
        me.uploadButton = mini.getbyName("multiupload", toolbarEl);
        me.removeButton = mini.getbyName("removeAll", toolbarEl);




        me.on("drawcell", function (e) {
            var field = e.field;
            var record = e.record;
            var uid = record._uid;
            var value = e.value;
            //            if (field == "size") {
            //                e.cellHtml = bytesToSize(e.value);
            //            }
            if (field == "complete") {
                e.cellHtml = '<div class="progressbar">'
                                + '<div class="progressbar-percent" style="width:' + value + '%;"></div>'
                                + '<div class="progressbar-label">' + value + '%</div>'
                            + '</div>';
            }
            if (field == "status") {
                if (e.value == 0) {
                    e.cellHtml = "准备上传";
                } else if (e.value == 1) {
                    e.cellHtml = "上传成功";
                } else if (e.value == 2) {
                    e.cellHtml = "上传失败";
                }
            }
            if (field == "action") {
                e.cellHtml = '<a class="upicon-remove" name="' + uid + '"><a>';

            }
        })
        $(document.body).on("click", ".upicon-remove", function () {
            var uid = $(this).attr("name");
            var row = me.getRowByUID(uid);
            if (me.uploader.getStats().files_queued !== 0) {
                me.uploader.cancelUpload(row.fileId);
            }
            me.removeRow(row);
        })
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
    setPostParam: function (value) {
        this.addPostParam(value);
    },
    getPostParam: function () {
        return this.postParam;
    },
    __on_file_queued: function (file) {

        function bytesToSize(bytes) {
            if (bytes === 0) return '0 B';
            var k = 1024,
            sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
           i = Math.floor(Math.log(bytes) / Math.log(k));

            return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
        }


        var me = this;
        var row = {};
        row.name = file.name;
        row.type = file.type;
        row.status = 0;
        row.fileId = file.id;
        row.size = bytesToSize(file.size);
        row.complete = 0;
        me.addRow(row);

        me.customSettings.queue = me.customSettings.queue || new Array();

        me.customSettings.queue.push(file.id);

        if (me.autoUpload) {
            me.startUpload(file.id);
        }
    },
    __on_upload_error: function (file, errorCode, msg) {
        if (msg == "File Cancelled") return;

        var me = this;
        if (file) {
            var row = me.findRow(function (row) {
                if (row.fileId == file.id) return true;
            })
            me.updateRow(row, { status: 2 });
        }


        var e = { file: file, code: errorCode, message: msg };
        this.fire("uploaderror", e);
    },
    __on_upload_success: function (file, serverData) {
        var me = this;
        var row = me.findRow(function (row) {
            if (row.fileId == file.id) return true;
        })
        me.updateRow(row, { status: 1, complete: 100 });

        var e = { file: file, serverData: serverData };
        this.fire("uploadsuccess", e);
    },
    __on_upload_complete: function (file) {
        //实现连续上传功能
        //        if (this.continuity || this.autoUpload) {
        //            if (this.uploader.getStats().files_queued == 0) {
        //                this.continuity = false;
        //            }
        if (this.uploader.getStats().files_queued !== 0) {
            this.startUpload();
        }
        //  }

    },
    __on_upload_progress: function (file, complete, total) {

        var percent = mini.formatNumber(complete / total, "n2") * 100;
        var me = this;
        var row = me.findRow(function (row) {
            if (row.fileId == file.id) return true;
        })
        me.updateRow(row, { complete: percent });

    },
    __on_file_queued_error: function (file, errorCode, msg) {
        mini.alert("文件选择出错!errorCode:" + errorCode + ";msg:" + msg);
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
        var attrs = UserControl.MultiUpload.superclass.getAttrs.call(this, el);
        mini._ParseString(el, attrs,
            ["uploadUrl", "flashUrl", "limitType", "limitSize", "uploadName", "queueLimit", "onuploaderror", "onuploadsuccess"]
        );
        mini._ParseBool(el, attrs,
            ["autoUpload"]
        );
        return attrs;
    }

});

mini.regClass(UserControl.MultiUpload, "multiupload");


