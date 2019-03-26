/**
 * Created by Chuqiao on 07/03/19.
 */

function foamtreeStarts(newResponse, token) {
    var foamtreeMapping = getData(foamtreeData);

    //set Max Level for debugging
    foamtreeMapping.forEach(setMaxLevel);
    function setMaxLevel(group) {
        if (group.groups && group.groups.length > 0) {
            group.groups.forEach(setMaxLevel);
            group.maxLevel = group.groups.reduce(function (max, group) {
                return Math.max(max, group.maxLevel);
            }, 0) + 1;
        } else {
            group.maxLevel = 1;
        }
    }

    //add Pvalue and new url to Top 1 level
    foamtreeMapping.forEach(addTopPvalueAndUrl);
    function addTopPvalueAndUrl(group){

        if (newResponse[group.stId]) {

            group = Object.assign( group, {'pValue': newResponse[group.stId], 'url': group.url+ "&DTAB=AN&ANALYSIS=" + token });

        } else {

            group = Object.assign(group, {'pValue': undefined, 'url': group.url+ "&DTAB=AN&ANALYSIS=" + token });
        }
    }

    //add Pvalue to child groups
    foamtreeMapping.forEach(addPvalueToChild);
    function addPvalueToChild(group) {
        if (group.groups && group.groups.length > 0) {

            group.groups.forEach(addPvalueToChild);

            for (var i =0; i < group.groups.length; i++){

                if (newResponse[group.groups[i].stId]) {

                    group.groups[i] = Object.assign( group.groups[i],{'pValue': newResponse[group.groups[i].stId]});

                } else {

                    group.groups[i] = Object.assign(group.groups[i],{'pValue': undefined });
                }
            }
        }
    }

    //add analysis result url to child groups
    foamtreeMapping.forEach(addAnalysisUrl);
    function addAnalysisUrl(group) {
        if (group.groups && group.groups.length > 0) {

            group.groups.forEach(addAnalysisUrl);

            for (var i =0; i < group.groups.length; i++){

                if (newResponse[group.groups[i].stId]) {

                    group.groups[i] = Object.assign( group.groups[i],{'url': group.groups[i].url + "&DTAB=AN&ANALYSIS=" + token});

                }
            }
        }
    }

    //basic definitions
    var foamtree = new CarrotSearchFoamTree({
        id: "visualization",
        pixelRatio: window.devicePixelRatio || 1,

        stacking: "flattened",

        //Attach and draw a maximum of 8 levels of groups
        maxGroupLevelsAttached: 12,
        maxGroupLevelsDrawn: 12,
        maxGroupLabelLevelsDrawn: 12,

        //maximum duration of a complete high-quality redraw of the visualization
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

    //Loading data set
    foamtree.set({
        dataObject: {
            groups: foamtreeMapping
        }
    });

    //hold a polygonal to jump to real reactome page
    foamtree.set({
        onGroupHold: function (event) {
            event.preventDefault();
            window.open(event.group.url);
        }
    });


    //title bar
    foamtree.set({
        maxLabelSizeForTitleBar: Number.MAX_VALUE,
        titleBarDecorator: function (options, parameters, variables) {
            variables.titleBarText = parameters.group.label;
        }
    });

    //display hints
    CarrotSearchFoamTree.hints(foamtree);

    //switching color profiles by url
    function getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m ,key, value) {
            vars[key] = value;
        });
        return vars
    }
    var colorParam =  getUrlVars()["color"];
    if (typeof colorParam !== "undefined" ) {
        foamtree.set({
            groupColorDecorator: function (opts, params, vars) {
                var coverage = params.group.pValue;
                var profileSelected = ColorProfileEnum[colorParam];
                if (coverage !== undefined && coverage >= 0 && coverage <= 0.05) {
                    vars.groupColor.h = ColorProfileEnum.properties[profileSelected].min_h + (ColorProfileEnum.properties[profileSelected].max_h - ColorProfileEnum.properties[profileSelected].min_h) * (coverage / 0.05 );
                    vars.groupColor.s = ColorProfileEnum.properties[profileSelected].min_s + (ColorProfileEnum.properties[profileSelected].max_s - ColorProfileEnum.properties[profileSelected].min_s) * (coverage / 0.05 );
                    vars.groupColor.l = ColorProfileEnum.properties[profileSelected].min_l + (ColorProfileEnum.properties[profileSelected].max_l - ColorProfileEnum.properties[profileSelected].min_l) * (coverage / 0.05 );

                } else if (coverage !== undefined && coverage >= 0.05 ) {

                    // Coverage defined, but greater than range
                    vars.groupColor = ColorProfileEnum.properties[profileSelected].hit;
                }
                else {
                    //coverage not defined
                    vars.groupColor = ColorProfileEnum.properties[profileSelected].fadeout;
                }
            }

        });
    } else {
        foamtree.set({
            groupColorDecorator: function (opts, params, vars) {
                var coverage = params.group.pValue;
                var profileSelected = ColorProfileEnum.COPPER;
                if (coverage !== undefined && coverage >= 0 && coverage <= 0.05) {
                    vars.groupColor.h = ColorProfileEnum.properties[profileSelected].min_h + (ColorProfileEnum.properties[profileSelected].max_h - ColorProfileEnum.properties[profileSelected].min_h) * (coverage / 0.05 );
                    vars.groupColor.s = ColorProfileEnum.properties[profileSelected].min_s + (ColorProfileEnum.properties[profileSelected].max_s - ColorProfileEnum.properties[profileSelected].min_s) * (coverage / 0.05 );
                    vars.groupColor.l = ColorProfileEnum.properties[profileSelected].min_l + (ColorProfileEnum.properties[profileSelected].max_l - ColorProfileEnum.properties[profileSelected].min_l) * (coverage / 0.05 );

                } else if (coverage !== undefined && coverage >= 0.05 ) {
                    // Coverage defined, but greater than range
                    vars.groupColor = ColorProfileEnum.properties[profileSelected].hit;
                }
                else {
                    //coverage not defined
                    vars.groupColor = ColorProfileEnum.properties[profileSelected].fadeout;
                }
            }
        });
    }

    //switching views
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
    window.addEventListener("resize", (function() {
        var timeout;
        return function() {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(foamtree.resize, 300);
        }
    })());


}