
var GridMenu = function (grid) {
    this.grid = grid;

    this.menu = this.createMenu();

    grid.setContextMenu(this.menu);
}

GridMenu.prototype = {

    createMenu: function () {
        var grid = this.grid;

        var menu = mini.create({ type: "menu" });

        var items = [
            { text: "增加", name: "add", iconCls: 'icon-add' },
            { text: "修改", name: "edit", iconCls: 'icon-edit' },
            '-',
            { text: "删除", name: "remove", iconCls: 'icon-remove' }
        ];

        menu.setItems(items);

        menu.on("itemclick", this.onMenuItemClick, this);

        return menu;
    },

    onMenuItemClick: function (e) {
        var grid = this.grid,
            menu = e.sender,
            item = e.item;

        //用item.name区分不同菜单项
        switch (item.name) {
            case "add":
                this.doAdd();
                break;
            case "edit":
                this.doEdit();
                break;
            case "remove":
                this.doRemove();
                break;
        }
    },

    doAdd: function () {
        var grid = this.grid;
        alert("doAdd");
    },

    doEdit: function () {
        var grid = this.grid;
        alert("doEdit");
    },

    doRemove: function () {
        var grid = this.grid;
        alert("doRemove");
    }

};