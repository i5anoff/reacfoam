/**
 * Created by Chuqiao on 07/03/19.
 */

function foamtreeEnrichmentAnalysis(type, anaData) {

    if ( sel !== null){
        addSel(anaData);
    }

    var foamtree = new CarrotSearchFoamTree({
        id: "visualization",
        stacking: "flattened",
        pixelRatio: window.devicePixelRatio || 1,

        // The duration of the group exposure and unexposure animation.
        exposeDuration: 500,

        // Lower groupMinDiameter to fit as many groups as possible
        groupMinDiameter: 0,

        // Set a simple fading animation. Animated rollouts are very expensive for large hierarchies
        rolloutDuration: 0,
        pullbackDuration: 0,

        // Lower the border radius a bit to fit more groups
        groupBorderWidth: 2,
        groupInsetWidth: 3,
        groupBorderRadius:0,

        // Don't use gradients and rounded corners for faster rendering
        groupFillType: "plain",

        // Lower the minimum label font size a bit to show more labels
        groupLabelMinFontSize: 3,

        // Attach and draw a maximum of 8 levels of groups
        maxGroupLevelsAttached: 12,
        maxGroupLevelsDrawn: 12,
        maxGroupLabelLevelsDrawn: 12,

        // Tune the border options to make them more visible
        groupBorderWidthScaling: 0.5,

        // Width of the selection outline to draw around selected groups
        groupSelectionOutlineWidth: 3,

        // Show labels during relaxation
        wireframeLabelDrawing: "always",

        // Make the description group (in flattened view) smaller to make more space for child groups
        descriptionGroupMaxHeight: 0.25,

        // Maximum duration of a complete high-quality redraw of the visualization
        finalCompleteDrawMaxDuration: 40000,
        finalIncrementalDrawMaxDuration: 40000,
        wireframeDrawMaxDuration: 4000

    });
    // Loading data set
    foamtree.set({
        dataObject: {
            groups: anaData
        }
    });

    // Hold a polygonal to open a new tab of Reactome analysis page
    foamtree.set({
        onGroupHold: function (event) {
            event.preventDefault();
            window.open(event.group.url);
        }
    });

    // Title bar
    foamtree.set({
        maxLabelSizeForTitleBar: Number.MAX_VALUE,
        titleBarDecorator: function (options, parameters, variables) {
            variables.titleBarText = parameters.group.label;
        }
    });

    // Display hints
    CarrotSearchFoamTree.hints(foamtree);

    // Switching color profiles by color param from url and save to profileSelected
    function setColor(flagNew){
        foamtree.set({
            groupColorDecorator: function (opts, props, vars) {
                var pValue = props.group.pValue;
                var ratio = pValue / 0.05;
                var colorValue = twoGradient(ratio, colorMax, colorMin);

                // Calculate color gradient base on the range of pValue 0~0.5
                if (pValue !== null && pValue >= 0 && pValue <= 0.05) {
                    vars.groupColor.r = colorValue.red;
                    vars.groupColor.g = colorValue.green;
                    vars.groupColor.b = colorValue.blue;

                    vars.groupColor.model = "rgb";

                } else if (pValue !== null && pValue >= 0.05 ) {
                    // Coverage defined, but greater than range
                    vars.groupColor = ColorProfileEnum.properties[profileSelected].hit;
                } else {
                    // Coverage not defined
                    vars.groupColor = ColorProfileEnum.properties[profileSelected].fadeout;
                }
                // Add flag color
                if (props.group.flg && flagNew){
                    vars.labelColor =ColorProfileEnum.properties[profileSelected].flag;
                } else {
                    vars.labelColor = ColorProfileEnum.properties[profileSelected].label;
                }
            },
            // Color of the outline stroke for the selected groups
            groupSelectionOutlineColor : ColorProfileEnum.properties[profileSelected].selection
        });
    }
    setColor(flag);

    // Add flag bar
    if (flag !== null){
        $("#flagBar").show();
        $("#container").addClass("adjustHeightwithFlg");
        var span = document.createElement("span");
        var textnode = document.createTextNode(flag+ " - " + countFlaggedItems + " pathways flagged");
        span.appendChild(textnode);
        flagPathway.appendChild(span);
    }
    // Clear flag and redraw foamtree
    $("button[name=clearFlg]").click(function () {
        var url = location.href.replace("&flg="+flag, "").replace("?flg="+flag, "").replace("flg="+flag, "");
        window.history.pushState(null, null, url);

        var flagAfterClear = typeof getUrlVars()["flg"] !== "undefined" ? getUrlVars()["flg"] : null;
        setColor(flagAfterClear);
        foamtree.redraw();

        $("#flagBar").hide();
        $("#container").removeClass("adjustHeightwithFlg");
    });

    // Enable browser when after using pushstate
    window.addEventListener("popstate", function() {
        window.location.href = location.href;
    });

    // Create canvas and fill gradient
    $("#colorLegend").show();

    // Min and max here are for the label text in gradient canvas
    var max = null;
    var min = null;
    createCanvas(type, colorMin, colorStop, colorMax, min, max);

    // Draw flags when click or hover a group on canvas
    var selected = null;
    var hovered = null;
    foamtree.on("groupClick", function (event) {
        var selectedGroup = event.group;

        // To avoid clik the white space between two borders
        if (!selectedGroup){
            return
        }
        // Min and max here are for calculate the percentage in Flag canvas
        var max = 0;
        var min = 0.05;
        selected = selectedGroup.pValue;
        drawFlag(type, selected, hovered, min, max);
    });

    foamtree.on("groupHover", function (event) {
        var hoveredGroup = event.group;
        if (!hoveredGroup) {
            return;
        }
        var max = 0;
        var min = 0.05;
        var hovered = hoveredGroup.pValue;
        drawFlag(type, selected, hovered, min, max);
    });

    // Display export icon
    $("#export").show();

    // Export an image when click export icon
    $("button[name=export-button]").click(function () {
        onImageExport(type, foamtree);
    });

    // Switching views
    document.addEventListener("click", function (event) {
        if (!event.target.href) {return;}
        event.preventDefault();

        var href = event.target.href.substring(event.target.href.indexOf("#"));
        switch (href) {
            case "#flattened":
                foamtree.set({stacking: "flattened"});
                break;
            case "#hierarchical":
                foamtree.set({stacking: "hierarchical"});
                break;
        }
        foamtree.set("dataObject", foamtree.get("dataObject"));
    });

    // Resize FoamTree on orientation change
    window.addEventListener("orientationchange", foamtree.resize);

    // Resize on window size changes
    window.addEventListener("resize", (function() {
        var timeout;
        return function() {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(foamtree.resize, 300);
        }
    })());
}
