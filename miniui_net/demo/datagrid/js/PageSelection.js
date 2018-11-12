///////////////////////////////////////////////////////////////////////////////////
var PageSelection = function (grid, options) {
    options = $.extend({
        selectOnLoad: true,
        idField: grid.idField || 'id',
        delimiter: ','
    }, options);
    this.grid = grid;
    this.options = options;
    this.selection = [];
    this.init();
}
PageSelection.prototype = {

    init: function () {
        var me = this,
            grid = me.grid;

        me.ignoreSelection = false;

        grid.on("select", function (e) {

            if (!me.ignoreSelection) {
                me.addSelection([e.record]);

                if (me.options.selectionchange) me.options.selectionchange();
            }
        });
        grid.on("deselect", function (e) {
            if (!me.ignoreSelection) {
                me.removeSelection([e.record]);
                if (me.options.selectionchange) me.options.selectionchange();
            }
        });

        grid.on("load", function (e) {
            //是否将之前选中的，反过来设置到表格？

            if (me.options.selectOnLoad) {
                var rows = [];

                var selection = me.selection;
                for (var i = 0, l = selection.length; i < l; i++) {
                    var o = selection[i];
                    var id = String(o[me.options.idField]);
                    var row = grid.getRow(id);
                    if (row) rows.push(row);
                }

                me.ignoreSelection = true;
                grid.selects(rows);
                me.ignoreSelection = false;
            }
            //            function onGridLoad(e) {
            //                var rows = selectMaps[grid.getPageIndex()];

            //                if (rows) grid.selects(rows);
            //            }
        });
    },

    getRecordIndex: function (id) {
        var selection = this.selection,
                    idField = this.options.idField;

        if (id instanceof Object) id = id[idField];

        for (var i = 0, l = selection.length; i < l; i++) {
            var o = selection[i];
            if (o[idField] === id) return i;
        }
        return null;
    },

    getRecord: function (id) {
        return this.selection[this.getRecordIndex(id)];
    },

    isSelected: function (record) {
        var o = this.getRecord(record);
        return !!o;
    },

    addSelection: function (records) {
        for (var i = 0, l = records.length; i < l; i++) {
            var record = records[i];
            if (!this.isSelected(record)) {
                this.selection.push(record);
            }
        }
    },

    removeSelection: function (records) {
        var me = this;
        var grid = this.grid;

        me.ignoreSelection = true;

        records = records.clone();
        for (var i = 0, l = records.length; i < l; i++) {
            var record = records[i];
            var index = this.getRecordIndex(record);
            if (index != -1) {
                this.selection.removeAt(index);
            }
        }
        grid.deselects(records);

        me.ignoreSelection = false;
    },

    clearSelection: function () {

        this.removeSelection(this.selection);
    },

    getSelection: function () {
        return this.selection;
    },

    getSelectionValue: function (field, delimiter) {
        if (!field) field = this.options.idField;
        if (!delimiter) delimiter = this.options.delimiter;

        var records = this.getSelection();
        var sb = [];
        for (var i = 0, l = records.length; i < l; i++) {
            var record = records[i];
            var text = record[field];
            sb.push(text);
        }

        return sb.join(',');
    }
};