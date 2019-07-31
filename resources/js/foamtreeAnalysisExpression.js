/**
 * Created by Chuqiao on 19/5/9.
 */

function foamtreeExpressionAnalysis(type, expAnaData, min, max, columnArray) {

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

    // Assign proper function to setColor base on analysis type
    function setColor(type, column, flgNew){

        if (type == "EXPRESSION"){
            setColorExp.call(this, column, flgNew)
        } else if (type == "GSA_REGULATION"){
            setColorReg.call(this, column, flgNew)
        }
    }

    // Set color base on pValue range and columns value in expression analysis
    var setColorExp = function(column, flagNew){
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
                if (props.group.flg && flagNew){
                    vars.labelColor = ColorProfileEnum.properties[profileSelected].flag;
                } else{
                    vars.labelColor = ColorProfileEnum.properties[profileSelected].label;
                }
            },
            groupSelectionOutlineColor: ColorProfileEnum.properties[profileSelected].selection
        });
        // Schedule a redraw to draw the new colors
        window.setTimeout(foamtree.redraw, 0);
    };

    // Set color base on pValue range and columns value in regulation analysis
    var setColorReg = function(column, flagNew){
        foamtree.set({
            groupColorDecorator: function (opts, props, vars) {
                if ( props.group.exp !== null) {

                    var coverage = props.group.exp[column];
                    var pValue = props.group.pValue;

                    if (pValue !== null && pValue >= 0 && pValue <= 0.05) {

                        vars.groupColor.r = colorMapInReg.get(coverage).red;
                        vars.groupColor.g = colorMapInReg.get(coverage).green;
                        vars.groupColor.b = colorMapInReg.get(coverage).blue;

                        vars.groupColor.model = "rgb";

                    } else if ( pValue !== null && pValue > 0.05) {
                        vars.groupColor = ColorProfileEnum.properties[profileSelected].hit;
                    }
                } else {
                    vars.groupColor = ColorProfileEnum.properties[profileSelected].fadeout;
                }
                // Add flag color
                if (props.group.flg && flagNew){
                    vars.labelColor = ColorProfileEnum.properties[profileSelected].flag;
                } else{
                    vars.labelColor = ColorProfileEnum.properties[profileSelected].label;
                }
            },
            groupSelectionOutlineColor: ColorProfileEnum.properties[profileSelected].selection
        });
        // Schedule a redraw to draw the new colors
        window.setTimeout(foamtree.redraw, 0);
    };

    // Exp bar array
    for (var j = 0; j < columnArray.length; j++) {
        var span = document.createElement("span");
        span.setAttribute("value", columnArray[j]);
        span.setAttribute("title", columnArray[j]);
        var textnode = document.createTextNode( j+1 + "/"  + columnArray.length + " :: " +columnArray[j]);
        span.appendChild(textnode);
        columnNames.appendChild(span);
    }

    // Expression bar to change color
    var divs = $("#columnNames>span");
    var now = 0;
    var container =  $("#container");
    $("#expressionBar").show();
    container.addClass("adjustHeight");

    // Currently shown span
    divs.hide().first().show();

    // Get the first item in columnNames
    var columnFirst = divs.eq(now).show().attr("value");

    // Use the first item as default coverage value
    setColor(type, columnFirst, flag);

    // Prev and next button color control
    $("button[name=next]").click(function () {
        divs.eq(now).hide();
        now = (now + 1 < divs.length) ? now + 1 : 0;
        divs.eq(now).show(); // show next
        var column = divs.eq(now).show().attr("value");
        var flagAfterClear = typeof getUrlVars()["flg"] !== "undefined" ? getUrlVars()["flg"] : null;
        setColor(type, column, flagAfterClear);
    });

    $("button[name=prev]").click(function () {
        divs.eq(now).hide();
        now = (now > 0) ? now - 1 : divs.length - 1;
        divs.eq(now).show();
        var column = divs.eq(now).show().attr("value");
        var flagAfterClear = typeof getUrlVars()["flg"] !== "undefined" ? getUrlVars()["flg"] : null;
        setColor(type, column, flagAfterClear);
    });

    // Play button control
    var intervalId = null;
    $("button[name=play]").click(function () {

        $(".playButton").hide();
        $(".pauseButton").show();

        if (!intervalId) {
            intervalId = setInterval(function () {
                $("button[name=next]").click();
            }, 2000);
        } else {
            clearInterval(intervalId);
            intervalId = null;
        }
    });

    // Pause button control
    $("button[name=pause]").click(function () {

        $(".playButton").show();
        $(".pauseButton").hide();

        if (!intervalId) {
            intervalId = setInterval(function () {
                $("button[name=next]").click();
            }, 2000);
        } else {
            clearInterval(intervalId);
            intervalId = null;
        }
    });

    // Close button control
    $("button[name=close]").click(function () {
        $("#expressionBar").hide();
        var analysisParam = getUrlVars()["analysis"];
        var resourceParam = getUrlVars()["resource"];
        var url = location.href.replace("&analysis="+analysisParam, "").replace("?analysis="+analysisParam, "").replace("analysis="+analysisParam, "")
                               .replace("&resource="+resourceParam, "").replace("?resource="+resourceParam, "").replace("resource="+resourceParam, "");
        window.location.href = url;
    });

    // Add flag bar
    if (flag !== null){
        $("#flagBar").show();
        container.addClass("adjustHeightwithFlg");
        var span = document.createElement("span");
        var textnode = document.createTextNode(flag+ " - " + countFlaggedItems + " pathways flagged");
        span.appendChild(textnode);
        flagPathway.appendChild(span);
    }

    // Clear flag and redraw foamtree
    $("button[name=clearFlg]").click(function () {

        var url = location.href.replace("&flg="+flag, "").replace("?flg="+flag, "").replace("flg="+flag, "");
        window.history.pushState(null, null, url);

        var column = divs.eq(now).show().attr('value');
        var flagAfterClear = typeof getUrlVars()["flg"] !== "undefined" ? getUrlVars()["flg"] : null;
        setColor(type, column, flagAfterClear);

        $("#flagBar").hide();
        container.removeClass("adjustHeightwithFlg");
    });

    // Create canvas and fill gradient
    createCanvas(type, colorMinExp, colorStopExp, colorMaxExp, min, max);

    // Draw flags when click or hover a group on canvas
    var selected = null;
    var hovered = null;
    foamtree.on("groupClick", function (event) {
        var column = divs.eq(now).show().attr('value');
        var pGroup = event.group;
        if (!pGroup){
            return
        }
        selected = (event.group.exp && (pGroup.pValue!==null && pGroup.pValue <= 0.05) )? event.group.exp[column]: null;
       drawFlag(type, selected, hovered, min, max);
    });

    foamtree.on("groupHover", function (event) {
        var column = divs.eq(now).show().attr('value');
        var pGroup = event.group;
        if (!pGroup) {
            return;
        }
        var hovered = (event.group.exp && (pGroup.pValue!==null && pGroup.pValue <= 0.05)) ? event.group.exp[column]: null;
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
        if (!event.target.href) {
            return;
        }
        event.preventDefault();
        var href = event.target.href.substring(event.target.href.indexOf("#"));
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

    // Enable browser when after using pushstate
    window.addEventListener("popstate", function() {
        window.location.href = location.href;
    });
}