function Controller() {
    require("alloy/controllers/BaseController").apply(this, Array.prototype.slice.call(arguments));
    arguments[0] ? arguments[0]["__parentSymbol"] : null;
    arguments[0] ? arguments[0]["$model"] : null;
    arguments[0] ? arguments[0]["__itemTemplate"] : null;
    var $ = this;
    var exports = {};
    if (Alloy.isTablet) {
        $.__views.master = Alloy.createController("master", {
            id: "master"
        });
        $.__views.detail = Alloy.createController("detail", {
            id: "detail"
        });
        $.__views.index = Ti.UI.iPad.createSplitWindow({
            masterView: $.__views.master.getViewEx({
                recurse: true
            }),
            detailView: $.__views.detail.getViewEx({
                recurse: true
            }),
            id: "index"
        });
        $.__views.index && $.addTopLevelView($.__views.index);
    }
    if (!Alloy.isTablet) {
        $.__views.index = Ti.UI.createWindow({
            backgroundColor: "#fff",
            id: "index"
        });
        $.__views.index && $.addTopLevelView($.__views.index);
        $.__views.master = Alloy.createController("master", {
            id: "master"
        });
        $.__views.navgroup = Ti.UI.iPhone.createNavigationGroup({
            window: $.__views.master.getViewEx({
                recurse: true
            }),
            id: "navgroup"
        });
        $.__views.index.add($.__views.navgroup);
    }
    exports.destroy = function() {};
    _.extend($, $.__views);
    var isIpad = true && Alloy.isTablet;
    var usesNavGroup = true && Alloy.isHandheld || false;
    usesNavGroup && (Alloy.Globals.navgroup = $.navgroup);
    $.master.on("detail", function(e) {
        var controller = isIpad ? $.detail : Alloy.createController("detail");
        var win = controller.getView();
        controller.setArticle(e.row.articleUrl);
        usesNavGroup && Alloy.Globals.navgroup.open(win);
    });
    $.index.open();
    _.extend($, exports);
}

var Alloy = require("alloy"), Backbone = Alloy.Backbone, _ = Alloy._;

module.exports = Controller;