var HeaderFilter = function (grid, options) {
    var me = this;
    me.grid = grid;
    me.options = options || {};
    me.init();
}
HeaderFilter.prototype = {

    init: function () {
        var me = this,
            grid = me.grid,
            columns = me.options.columns;

        me.filterColumns = [];

        for (var i = 0, l = columns.length; i < l; i++) {
            var o = columns[i];
            var column = grid.getColumn(o.name);
            if (!column) throw new Error('undefined column ' + o.name);
            o.column = column;
            column.header = column.header + '<div class="icon-filter headerfilter-trigger"></div>';

            me.filterColumns.push(column);
        }

        $(grid.el).on("click", ".headerfilter-trigger", function (e) {
            e.stopPropagation();

            var column = grid.getColumnByEvent(e);
            me.showFilterWindow(column);
        });

        grid.on("load", function (e) {
            //me.clearFilterAll();
        })
        grid.on("resize", function (e) {

        });

        grid.on("update", function (e) {
            me._updateFilterStatus();
        });

        $(document).on("mousedown", function (event) {
            if (!$(event.target).closest(".filterwindow")[0]) {
                $(".filterwindow").hide();
            }
        });

        ///////////////////////////////////////////////////////////////

        var within = grid.within;
        grid.within = function (e) {
            
            var result = within.call(this, e);
            if (!result && me.filterWindow) {
                result = mini.isAncestor(me.filterWindow[0], e.target);
            }

            return result;
        }
    },

    _createFilterListData: function (column) {

        var data = this.grid.getData(),     //getDataView
            sb = [],
            map = {},
            result = [];

        var blank = {};
        blank[column.displayField || column.field] = 'All';     //暂不知道具体逻辑
        result.push(blank);

        for (var i = 0, l = data.length; i < l; i++) {
            var record = data[i];
            var text = record[column.field] || '';
            if (column.displayField) {
                text = record[column.displayField] || '';
            } else {

            }
            if (!map[text]) {
                map[text] = text;
                result.push(record);
            }
        }

        return result;
    },

    _getFilterValues: function (column) {
        var win = this.filterWindow;
        var values = [];
        win.find("input:checked").not(".checkall").each(function () {
            values.push(this.value);
        });

        return values;
    },

    doFilter: function () {
        var me = this,
            columns = me.filterColumns;

        if (me.hasFiltered()) {

            grid.filter(function (record) {
                var pass = true;
                for (var i = 0, l = columns.length; i < l; i++) {
                    var column = columns[i];
                    if (column.filterData) {
                        var text = column.displayField ? record[column.displayField] : record[column.field];
                        if (text == null) text = "";
                        text = String(text);
                        if (!column._filterMap[text]) {
                            pass = false;
                            break;
                        }
                    }
                }
                return pass;
            });
        } else {
            grid.clearFilter();
        }

        me._updateFilterStatus();
        //alert("doFilter");
    },

    _createFilterWindow: function (column) {
        var me = this;
        var el = $('<div class="filterwindow mini-popup"><div class="filterwindow-content"></div><div class="filterwindow-footer"><button class="filterwindow-button filter mini-button" noparser>Filter</button><button class="filterwindow-button clearfilter mini-button" noparser>ClearFilter</button></div></div>').appendTo('body');

        var data = this._createFilterListData(column),
            sb = [];
        for (var i = 0, l = data.length; i < l; i++) {
            var record = data[i];
            var text = record[column.field];
            if (column.displayField) text = record[column.displayField];
            if (text == null) text = '';

            var checked = false;
            if (column._filterMap) checked = !!column._filterMap[text];

            sb[sb.length] = '<div class="filterwindow-item"><label><input class="filterwindow-item-checkbox ' + (i == 0 ? "checkall" : "") + '" type="checkbox" ' + (checked ? 'checked' : '') + ' value="' + text + '"/>' + text + '</label></div>';
        }
        el.find('.filterwindow-content').html(sb.join(''));

        el.find(".filter").on("click", function () {
            var values = me._getFilterValues(column);
            if (values.length) {
                me.filter(column, values);
            } else {
                me.clearFilter(column);
            }
        });

        el.find(".clearfilter").on("click", function () {
            me.clearFilter(column);
        });

        el.find("input[type=checkbox]").on("click", function () {
            //me.clearFilter(column);

            var jq = $(this);
            var checked = jq.is(":checked");

            if (jq.hasClass("checkall")) {
                el.find("input[type=checkbox]").prop("checked", checked);
            } else {
                updateCheckAll();
            }
        });

        function updateCheckAll() {
            var len1 = el.find("input[type=checkbox]").not(".checkall").length
            var len2 = el.find("input[type=checkbox]:checked").not(".checkall").length
            //alert(len1 + ":" + len2);
            el.find(".checkall").prop("checked", len1 == len2);
        }

        updateCheckAll();

        return el;
    },

    _updateFilterStatus: function () {
        var me = this,
            grid = me.grid,
            columns = me.filterColumns;

        for (var i = 0, l = columns.length; i < l; i++) {
            var column = columns[i];
            var headerCellEl = $(me._getHeaderCellEl(column));

            if (me.isFiltered(column)) headerCellEl.addClass("headerfilter-filtered");
            else headerCellEl.removeClass("headerfilter-filtered");
        }
    },
    _getHeaderCellEl: function (column) {
        var me = this,
            grid = me.grid;
        var columns = grid.getBottomColumns();
        var end = grid.getFrozenEndColumn();
        var columnIndex = columns.indexOf(column);
        var index = 1;
        if (columnIndex > end) {
            index = 2;
        }
        return grid.getHeaderCellEl(column, index);
    },
    showFilterWindow: function (column) {
        var me = this,
            grid = me.grid;



        headerCellEl = this._getHeaderCellEl(column)

        me.hideFilterWindow();

        me.filterColumn = column;
        me.filterWindow = me._createFilterWindow(column);

        var box = mini.getBox(headerCellEl),
            triggerEl = $(headerCellEl).find(".headerfilter-trigger")[0],
            triggerBox = mini.getBox(triggerEl);

        me.filterWindow.show();
        mini.setXY(me.filterWindow, triggerBox.left, box.bottom);
    },

    hideFilterWindow: function () {
        this.filterColumn = null;
        if (this.filterWindow) {
            this.filterWindow.remove();
            this.filterWindow = null;
        }
    },

    isFiltered: function (name) {
        var column = this.grid.getColumn(name);
        if (column) return !!column.filterData;
        return false;
    },

    hasFiltered: function () {
        var me = this,
            columns = me.filterColumns;
        for (var i = 0, l = columns.length; i < l; i++) {
            var column = columns[i];
            if (me.isFiltered(column)) return true;
        }
        return false;
    },

    filter: function (column, values) {
        var me = this;

        column.filterData = values;
        column._filterMap = {};
        for (var i = 0, l = values.length; i < l; i++) {
            var value = values[i];
            column._filterMap[value] = true;
        }

        me.doFilter();
        me.hideFilterWindow();
        if (me.options.callback) me.options.callback(column, true);
    },

    clearFilter: function (column) {
        var me = this;
        column.filterData = null;
        column._filterMap = null;
        me.doFilter();
        me.hideFilterWindow();

        if (me.options.callback) me.options.callback(column, false);
    },

    clearAllFilterData: function () {
        var me = this;

        var columns = me.filterColumns;
        for (var i = 0, l = columns.length; i < l; i++) {
            var column = columns[i];
            column.filterData = null;
            column._filterMap = null;
        }
    },

    clearAllFilter: function () {
        var me = this;

        me._updateFilterStatus();
        me.clearAllFilterData();
        me.grid.clearFilter();
        me.hideFilterWindow();
    }
};


