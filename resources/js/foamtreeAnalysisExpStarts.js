/**
 * Created by Chuqiao on 19/5/9.
 */

function foamtreeExpStarts(expAnaData, min, max, columnArray) {

    if ( sel !== null){
        addSel(expAnaData);
    }

    // Basic definitions
    var foamtree = new CarrotSearchFoamTree({
        id: "visualization",
        pixelRatio: window.devicePixelRatio || 1,

        stacking: "flattened",

        // The duration of the group exposure and unexposure animation.
        exposeDuration: 500,

        // Attach and draw a maximum of 8 levels of groups
        maxGroupLevelsAttached: 12,
        maxGroupLevelsDrawn: 12,
        maxGroupLabelLevelsDrawn: 12,

        // Maximum duration of a complete high-quality redraw of the visualization
        finalCompleteDrawMaxDuration: 50000,
        finalIncrementalDrawMaxDuration: 50000,
        wireframeDrawMaxDuration: 5000,

        // Use a simple fading animation. Animated rollouts are very expensive for large hierarchies.
        rolloutDuration: 0.5,
        pullbackDuration: 0,

        // Lower groupMinDiameter to fit as many groups as possible
        groupMinDiameter: 0,

        // Lower the minimum label font size a bit to show more labels.
        groupLabelMinFontSize: 3,

        // Lower the border radius a bit to fit more groups.
        groupBorderWidth: 2,
        groupInsetWidth: 4,

        groupSelectionOutlineWidth: 3,

        // Tune the border options to make them more visible
        groupBorderWidthScaling: 0.5,

        // Make the description group (in flattened view) smaller to make more space for child groups.
        descriptionGroupMaxHeight: 0.25,


        // Don't use gradients and rounded cornrs for faster rendering.
        groupFillType: "plain",

        groupSelectionOutlineColor: "#58C3E5",

        //show labels during relaxation
        wireframeLabelDrawing: "always"

    });

    // Loading data set
    foamtree.set({
        dataObject: {
            groups: expAnaData
        }
    });

    // Hold a polygonal to jump to Reactome page
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

    // Set color base on pValue range and columns value
    function setColor(column, flgNew){
        foamtree.set({
            groupColorDecorator: function (opts, props, vars) {
                if ( props.group.exp !== null) {

                    var coverage = props.group.exp[column];
                    var pValue = props.group.pValue;
                    var ratio = 1 - ((coverage - min) / (max - min));
                    var colorValue = threeGradient(ratio, colorMinExp, colorMaxExp, colorStopExp);

                    if (pValue !== null && pValue >= 0 && pValue <= 0.05) {
                        vars.groupColor.r = colorValue.red;
                        vars.groupColor.g = colorValue.green;
                        vars.groupColor.b = colorValue.blue;

                        vars.groupColor.model = "rgb";

                    } else if ( pValue !== null && pValue > 0.05) {
                        vars.groupColor = ColorProfileEnum.properties[profileSelected].hit;
                    }
                } else {
                    vars.groupColor = ColorProfileEnum.properties[profileSelected].fadeout;
                }
                // Add flag color
                if (props.group.flg && flgNew){
                    vars.labelColor = ColorProfileEnum.properties[profileSelected].flag;
                } else{
                    vars.labelColor = ColorProfileEnum.properties[profileSelected].label;
                }
            },
            groupSelectionOutlineColor: ColorProfileEnum.properties[profileSelected].selection
        });
        // Schedule a redraw to draw the new colors
        window.setTimeout(foamtree.redraw, 0);
    }

    // Exp bar array
    for (var j = 0; j < columnArray.length; j++) {
        var span = document.createElement("span");
        span.setAttribute("value", columnArray[j]);
        var textnode = document.createTextNode( j+1 + "/"  + columnArray.length + " :: " +columnArray[j]);
        span.appendChild(textnode);
        columnNames.appendChild(span);
    }

    // Expression bar to change color
    var divs = $('#columnNames>span');
    var now = 0;
    $("#expressionBar").show();
    // Currently shown span
    divs.hide().first().show();

    // Get the first item in columnNames
    var columnFirst = divs.eq(now).show().attr('value');
    // Use the first item as default coverage value
    setColor(columnFirst, flg);

    // Prev and next button color control
    $("button[name=next]").click(function () {
        divs.eq(now).hide();
        now = (now + 1 < divs.length) ? now + 1 : 0;
        divs.eq(now).show(); // show next
        var column = divs.eq(now).show().attr('value');
        var flgAfterClear = typeof getUrlVars()["flg"] !== "undefined" ? getUrlVars()["flg"] : null;
        setColor(column, flgAfterClear);
    });

    $("button[name=prev]").click(function () {
        divs.eq(now).hide();
        now = (now > 0) ? now - 1 : divs.length - 1;
        divs.eq(now).show();
        var column = divs.eq(now).show().attr('value');
        var flgAfterClear = typeof getUrlVars()["flg"] !== "undefined" ? getUrlVars()["flg"] : null;
        setColor(column, flgAfterClear);
    });

    // Switching views
    document.addEventListener("click", function (e) {
        if (!e.target.href) {
            return;
        }
        e.preventDefault();
        var href = e.target.href.substring(e.target.href.indexOf("#"));
        switch (href) {
            case "#flattened":
                foamtree.set({
                    stacking: "flattened"
                });
                break;
            case "#hierarchical":
                foamtree.set({
                    stacking: "hierarchical"
                });
                break;
        }
        foamtree.set("dataObject", foamtree.get("dataObject"));
    });

    // Resize FoamTree on orientation change
    window.addEventListener("orientationchange", foamtree.resize);

    // Resize on window size changes
    window.addEventListener("resize", (function () {
        var timeout;
        return function () {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(foamtree.resize, 300);
        }
    })());

    // Play button control
    var intervalId = null;
    $("button[name=play]").click(function () {

        $(this).attr('title', $(this).attr('title')==='Play'? 'Pause':'Play');
        $(this).html( $(this).html() === String.fromCharCode(9656) ? '&#2405;':'&#9656;');

        if (!intervalId) {
            intervalId = setInterval(function () {
                $("button[name=next]").click();
            }, 2000);
        } else {
            clearInterval(intervalId);
            intervalId = null;
        }
    });

    // Colse button control
    $("button[name=close]").click(function () {
        $("#expressionBar").hide();
        //TODO if flag exists
        window.location.href = location.href.split("?")[0];
    });
    // Add flag bar
    if (flg !== null){
        $("#flagBar").show();
        var span = document.createElement("span");
        var textnode = document.createTextNode(flg+ " - " + countFlaggedItems + " pathways flagged");
        span.appendChild(textnode);
        flagPathway.appendChild(span);
    }
    // Clear flag and redraw foamtree
    $("button[name=clearFlg]").click(function () {

        var url = location.href.replace("&flg="+flg, "").replace("?flg="+flg, "").replace("flg="+flg, "");
        window.history.pushState(null, null, url);

        var column = divs.eq(now).show().attr('value');
        var flgAfterClear = typeof getUrlVars()["flg"] !== "undefined" ? getUrlVars()["flg"] : null;
        setColor(column, flgAfterClear);

        $("#flagBar").hide();

    });
    // Enable browser when after using pushstate
    window.addEventListener("popstate", function() {
        window.location.href = location.href;
    });

    $("#colorLegend").show();
    createCanvas(colorMinExp,colorStopExp,colorMaxExp,min, max);

    foamtree.on("groupClick", function (event) {
        var column = divs.eq(now).show().attr('value');
        var p = event.group.pValue;
        var coverage = event.group.exp ? event.group.exp[column]: null;
        var selected = event.group;
        var hovered = null;
        drawExp(p,coverage, selected,hovered, min, max)
    });
}