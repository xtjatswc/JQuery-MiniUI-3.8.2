var MultiSelectCell = function (grid) {
    var me = this;
    me.grid = grid;
    me.grid.setAllowCellSelect(true);
    me.grid.setAllowCellEdit(true);
    me._selectedCells = [];

    me._initSelection();

    ///////////////////////////////////////
    grid.on("sort", function (e) {
        me.deselectAll();
    });
}
MultiSelectCell.prototype = {

    _initSelection: function () {
        var me = this,
            grid = this.grid,
            columns = grid.getVisibleColumns();


        function getCellAddress(e) {
            var cell = e.length == 2 ? e : grid.getCellFromEvent(e);
            var rowIndex = -1;
            var colIndex = -1;
            if (cell) {
                rowIndex = grid.indexOf(cell[0]);
                colIndex = columns.indexOf(cell[1]);
            }
            return { row: rowIndex, col: colIndex };
        }
        function selectCellRange(cell1, cell2) {
            var range = {};

            range.startRow = Math.min(cell1.row, cell2.row);
            range.endRow = Math.max(cell1.row, cell2.row);
            range.startCol = Math.min(cell1.col, cell2.col);
            range.endCol = Math.max(cell1.col, cell2.col);

            //document.title = cell2.row + ":" + cell2.col;

            me.cellRange = range;

            $(grid.el).find(".excel-cell-selected").removeClass("excel-cell-selected");
            me._selectedCells = [];

            for (var i = range.startRow, l = range.endRow; i <= l; i++) {
                for (var j = range.startCol, k = range.endCol; j <= k; j++) {
                    var cellEl = grid.getCellEl(i, j);
                    $(cellEl).addClass("excel-cell-selected");
                    var cel = { row: i, col: j };
                    if (!me.isSelectedCell(cel)) {
                        me._selectedCells.push({ row: i, col: j });
                    }
                }
            }
        }


        var isMove = false, moveCell;

        function handleMove(e) {

            if (!isMove) {
                isMove = true;
            }

            var cell = $(e.target).closest('.mini-grid-cell')[0];
            if (cell) {
                moveCell = getCellAddress(e);
            }

            selectCellRange(me.currentCell, moveCell || me.currentCell);

            e.preventDefault();
        }

        function handleEnd(e) {

            isMove = false;
            moveCell = null;
            $(document).unbind(".excel-selection");
        }

        $(grid.el).bind("mousedown", function (e) {

            var cell = $(e.target).closest('.mini-grid-cell')[0];
            if (cell) {

                var cellAddress = getCellAddress(e)
                me.currentCell = cellAddress;

                if (e.ctrlKey) {

                    if (!me.isSelectedCell(cellAddress)) {
                        me.selectCell(cellAddress);
                    } else {
                        me.deselectCell(cellAddress);
                        setTimeout(function () {
                            grid.setCurrentCell(null);
                        }, 10);
                    }

                } else {
                    $(document).bind("mousemove.excel-selection", handleMove);
                    $(document).bind("mouseup.excel-selection", handleEnd);

                    me.deselectAll();
                    me.selectCell(cellAddress);
                }
                e.preventDefault();
            }

        });
        grid.on('currentcellchanged', function (e) {


            //            var cell = grid.getCurrentCell();
            //            me.currentCell = getCellAddress(cell);


            //            if (me._input) {
            //                var box = grid.getCellBox(cell[0], cell[1]);
            //                mini.setXY(me._input, box.left, box.top);
            //            }
        });

    },

    _doSelectCells: function (cells) {
        for (var i = 0, l = cells.length; i < l; i++) {
            var cell = cells[i];
            this.selectCell(cell);
        }

    },

    _getIndex: function (cell) {
        var cells = this._selectedCells;
        var flag = -1;
        for (var i = 0, l = cells.length; i < l; i++) {
            var item = cells[i];
            if (item.row == cell.row && item.col == cell.col) {
                flag = i;
                break;
            }

        }
        return flag;
    },

    getSelectedCells: function () {
        return this._selectedCells;         //[ { row: 1, col: 2 }, ... ]
    },

    selectCell: function (cell) {           //cell = { row: 1, col: 2 }
        var row = cell.row;
        var column = cell.col;
        var cellEl = grid.getCellEl(row, column);
        this._selectedCells.add(cell);
        $(cellEl).addClass("excel-cell-selected");
    },

    deselectCell: function (cell) {         //cell = { row: 1, col: 2 }
        if (!cell) return;
        var row = cell.row;
        var column = cell.col;
        var cellEl = grid.getCellEl(row, column);
        if (this.isSelectedCell(cell)) {

            var index = this._getIndex(cell);
            this._selectedCells.removeAt(index);
            $(cellEl).removeClass("excel-cell-selected");
        }
    },

    deselectAll: function () {
        var me = this;
        var cells = mini.clone(me._selectedCells);
        for (var i = 0, l = cells.length; i < l; i++) {
            var cel = cells[i];
            me.deselectCell(cel);
        }
    },

    isSelectedCell: function (cell) {       //cell = { row: 1, col: 2 }
        var cells = this._selectedCells;
        var flag = false;
        for (var i = 0, l = cells.length; i < l; i++) {
            var item = cells[i];
            if (item.row == cell.row && item.col == cell.col) {
                flag = true;
                break;
            }

        }
        return flag;
    }

}