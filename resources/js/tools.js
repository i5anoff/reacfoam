/**
 * Created by Chuqiao on 19/4/1.
 */

// species map
/*
 <option value="48887">Homo sapiens</option><option value="48898">Bos taurus</option><option value="68320">Caenorhabditis elegans</option><option value="49646">Canis familiaris</option><option value="68323">Danio rerio</option><option value="170941">Dictyostelium discoideum</option><option value="56210">Drosophila melanogaster</option><option value="49591">Gallus gallus</option><option value="48892">Mus musculus</option><option value="176806">Mycobacterium tuberculosis</option><option value="170928">Plasmodium falciparum</option><option value="48895">Rattus norvegicus</option><option value="68322">Saccharomyces cerevisiae</option><option value="68324">Schizosaccharomyces pombe</option><option value="49633">Sus scrofa</option><option value="205621">Xenopus tropicalis</option>
 */

// Following same color profile from current Fireworks implementation. Note: For better look and feel we changed calcium salts hits (FFB2B2)
var ColorProfileEnum = {
    COPPER: 1,
    COPPER_PLUS: 2,
    BARIUM_LITHIUM: 3,
    CALCIUM_SALTS: 4,
    properties: {
        1: {group: "#58C3E5", label: "#000", fadeout: "#E6E6E6", hit: "#C2C2C2", selection: "#FF7700", flag: "#FF00FF", min: "#FDE233", stop: null, max: "#959000", min_exp: "#FFFF00", max_exp: "#0000FF" ,stop_exp: null} ,
        2: {group: "#58C3E5", label: "#000", fadeout: "#E6E6E6", hit: "#C2C2C2", selection: "#FF7700", flag: "#FF00FF", min: "#FDE233", stop: null, max: "#959000", min_exp: "#FFFF00", max_exp: "#0000FF", stop_exp:"#56D7EE" },
        3: {group: "#FF9999", label: "#000", fadeout: "#F8F8F8", hit: "#E0E0E0", selection: "#BBBBFF", flag: "#FF00FF", min: "#A0A0A0", stop: null, max: "#000000", min_exp: "#00FF00", max_exp: "#FF0000", stop_exp:"#000000"},
        4: {group: "#FF9999", label: "#000", fadeout: "#FFE4E1", hit: "#FFCCCC", selection: "#BBBBFF", flag: "#FF00FF", min: "#934A00", stop: null, max: "#FFAD33", min_exp: "#934A00", max_exp: "#FFAD33", stop_exp: null}
    }
};

var SPECIES_MAP = {
    "48887" : "Homo_sapiens"
    //"48898" : "Bos_taurus"
};

// Get parameters from URL and save data as key => value pair
function getUrlVars() {
    var vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m ,key, value) {
        vars[key] = value;
    });
    return vars
}

// Get species id from url and fetch the data file locally
var speciesData, topSpeciesData, datasetInFoamtree;
var speciesIdFromUrl = typeof getUrlVars()["species"] !== "undefined" ? getUrlVars()["species"] : 48887;
var speciesValue = SPECIES_MAP[speciesIdFromUrl];
var Homo_sapiens = "Homo_sapiens";

var speciesDataLocation =  typeof speciesValue !== "undefined" && speciesIdFromUrl in SPECIES_MAP ? "resources/dataset/fireworks/" + speciesValue + ".json" : "resources/dataset/fireworks/" + Homo_sapiens + ".json";
var topSpeciesDataLocation = typeof speciesValue !== "undefined" && speciesIdFromUrl in SPECIES_MAP ? "resources/dataset/toplevel/" + speciesValue + ".json" : "resources/dataset/toplevel/" + Homo_sapiens + ".json";

// Get color profile from url
var colorParam =  getUrlVars()["color"];
var profileSelected = typeof colorParam !== "undefined" && colorParam.toUpperCase().replace(/%20/g,"_") in ColorProfileEnum ? ColorProfileEnum[colorParam.toUpperCase().replace(/%20/g,"_")] : ColorProfileEnum.COPPER;
var colorMinExp = ColorProfileEnum.properties[profileSelected].min_exp;
var colorMaxExp = ColorProfileEnum.properties[profileSelected].max_exp;
var colorStopExp = ColorProfileEnum.properties[profileSelected].stop_exp;


var colorMin = ColorProfileEnum.properties[profileSelected].min;
var colorMax = ColorProfileEnum.properties[profileSelected].max;
var colorStop = ColorProfileEnum.properties[profileSelected].stop;

// Get selected stId from url
var sel = typeof getUrlVars()["sel"] !== "undefined" ? getUrlVars()["sel"] : null;
var flg = typeof getUrlVars()["flg"] !== "undefined" ? getUrlVars()["flg"] : null;
var countFlaggedItems;

/* Set the largest nesting level for debugging and color in red when there is no space to draw
 *  usage: data.forEach(setMaxLevel);
 * */
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

// Get color value in expression data analysis
function twoGradient(ratio, colorBottomInBar,colorTopInBar){

    colorBottomInBar = colorBottomInBar.replace(/#/g, "");
    colorTopInBar = colorTopInBar.replace(/#/g, "");

    var gradient;
    gradient = {
        red: Math.ceil(parseInt(colorBottomInBar.substring(0, 2), 16) * ratio + parseInt(colorTopInBar.substring(0, 2), 16) * (1 - ratio)),
        green: Math.ceil(parseInt(colorBottomInBar.substring(2, 4), 16) * ratio + parseInt(colorTopInBar.substring(2, 4), 16) * (1 - ratio)),
        blue: Math.ceil(parseInt(colorBottomInBar.substring(4, 6), 16) * ratio + parseInt(colorTopInBar.substring(4, 6), 16) * (1 - ratio))
    };

    return gradient
}

function threeGradient(ratio, ColorStart, ColorEnd, ColorMiddle) {

    // Do we have stop colors for the gradient? Need to adjust the params.
    var twoColor;
    if (ColorMiddle) {
        ColorMiddle = ColorMiddle.replace(/#/g, "");
        ratio = ratio * 2;
        var color;
        switch (true) {
            case  ratio < 1:
                color = twoGradient(ratio, ColorMiddle, ColorStart);
                break;
            case  ratio >= 1:
                ratio -= 1;
                var colorStartNew = ColorEnd;
                var colorEndNew = ColorMiddle;
                color = twoGradient(ratio, colorStartNew, colorEndNew);
                break;
        }
        return color
    }
    //
    twoColor = twoGradient(ratio, ColorEnd, ColorStart);
    return twoColor
}

// Add expression data analysis result to default data
function addExpAnaResult(columnNameResponse, pvalueResponse, token, defaultFoamtreeData){

    // Add Exp to group
    defaultFoamtreeData.forEach(addExpToGroup);
    function addExpToGroup(group) {
        // Add Exp to top 1 level
        columnNameResponse[group.stId] ? Object.assign(group, {'exp': columnNameResponse[group.stId]}) : Object.assign(group, {'exp': null});

        // Add Exp to child hierarchical level
        if (group.groups && group.groups.length > 0) {
            group.groups.forEach(addExpToGroup);

            for (var i = 0; i < group.groups.length; i++) {
                if (columnNameResponse[group.groups[i].stId]) {
                    group.groups[i] = Object.assign(group.groups[i], {'exp': columnNameResponse[group.groups[i].stId]});
                } else {
                    group.groups[i] = Object.assign(group.groups[i], {'exp': null});
                }
            }
        }
    }

    // Add pValue and analysis url to group
    defaultFoamtreeData.forEach(addPvalueAndUrlToGroup);
    function addPvalueAndUrlToGroup(group) {

        // Add pValue and analysis url top 1 level
        pvalueResponse[group.stId] ? Object.assign(group, {'pValue': pvalueResponse[group.stId], 'url': group.url + "&DTAB=AN&ANALYSIS=" + token}) : Object.assign(group, {'pValue': null, 'url': group.url + "&DTAB=AN&ANALYSIS=" + token});

        // Add pValue and analysis url to child hierarchical level
        if (group.groups && group.groups.length > 0) {
            group.groups.forEach(addPvalueAndUrlToGroup);

            for (var i =0; i < group.groups.length; i++){
                if (pvalueResponse[group.groups[i].stId]) {
                    group.groups[i] = Object.assign( group.groups[i],{'pValue': pvalueResponse[group.groups[i].stId], 'url': group.groups[i].url + "&DTAB=AN&ANALYSIS=" + token});
                } else {
                    group.groups[i] = Object.assign(group.groups[i],{'pValue': null });
                }
            }
        }
    }

    return defaultFoamtreeData

}

// Add overrepresentation data analysis result to default data
function addAnaResult(dataFromToken, token, defaultFoamtreeData){

    // Add Pvalue and analysis url to group
    defaultFoamtreeData.forEach(addPvalueAndUrlToGroup);
    function addPvalueAndUrlToGroup(group) {

        // Add pValue and analysis url top 1 level
        dataFromToken[group.stId] ?  Object.assign (group, {'pValue': dataFromToken[group.stId], 'url': group.url+ "&DTAB=AN&ANALYSIS=" + token }) :Object.assign (group, {'pValue': null, 'url': group.url+ "&DTAB=AN&ANALYSIS=" + token});

        // Add pValue and analysis url to child hierarchical level
        if (group.groups && group.groups.length > 0) {
            group.groups.forEach(addPvalueAndUrlToGroup);

            for (var i =0; i < group.groups.length; i++){
                if (dataFromToken[group.groups[i].stId]) {
                    Object.assign( group.groups[i], {'pValue': dataFromToken[group.groups[i].stId],'url': group.groups[i].url + "&DTAB=AN&ANALYSIS=" + token});
                } else {
                    Object.assign( group.groups[i], {'pValue': null, 'url': group.groups[i].url + "&DTAB=AN&ANALYSIS=" + token});
                }
            }
        }
    }

    return defaultFoamtreeData
}

// Add selected pathway
function addSel(defaultFoamtreeData){

    defaultFoamtreeData.forEach(addSelToGroup);

    function addSelToGroup(group) {
        // Add selected mark to level 1
        if (group.stId == sel){
            Object.assign (group, {'selected': true })
        }
        // Add selected mark to child level
        if (group.groups && group.groups.length > 0) {
            group.groups.forEach(addSelToGroup);
            for (var i =0; i < group.groups.length; i++){
                if ([group.groups[i].stId] == sel) {
                    Object.assign( group.groups[i], {'selected': true });
                }
            }
        }
    }
}

// Add overrepresentation data analysis result to default data
function addFlg(dataFromToken, defaultFoamtreeData){

    // Find all path by stId and generate a new array with all stIds
    var stIdArray = [];
    dataFromToken.forEach(function (item) {
       var array = findPathBystId(item, defaultFoamtreeData);
        stIdArray = stIdArray.concat(array)
    });

    // Remove duplicated item in array
    countFlaggedItems = Array.from(new Set(stIdArray)).length;

    // Create a stId object and save as key : value pair stId : stId
    var stIdObj = {};
    stIdArray.forEach(function (item) {
        stIdObj[item] = item
    });

    // Add flg to group
    defaultFoamtreeData.forEach(addFlgToGroup);
    function addFlgToGroup(group) {

        // Add flg mark to top 1 level
        if (stIdObj[group.stId]){
            Object.assign (group, {'flg': true})
        }

        // Add flg mark to child hierarchical level
        if (group.groups && group.groups.length > 0) {
            group.groups.forEach(addFlgToGroup);

            for (var i =0; i < group.groups.length; i++){
                if (stIdObj[group.groups[i].stId]) {
                    Object.assign( group.groups[i], {'flg': true });
                }
            }
        }
    }

    return defaultFoamtreeData
}

function findPathBystId(stId, obj, path) {

    // For recursive, do not assign value to it
    path =  path === undefined ? [] : path;

    for(var i = 0; i < obj.length; i++) {
        var tmpPath = path.concat();
        tmpPath.push(obj[i].stId);

        if(stId == obj[i].stId) {
            return tmpPath;
        }
        if(obj[i].groups) {
            var findResult = findPathBystId(stId, obj[i].groups, tmpPath);
            if(findResult) {
                return findResult;
            }
        }
    }
}

// Default foamtree
function foamtreeWithFlg(flg, speciesDataLocation, topSpeciesDataLocation ){

    var flagStId = [];
    // Ajax calls container
    var deferreds = [];

    var dfSpeciesData = $.getJSON(speciesDataLocation, function(data) {
        speciesData = data;
    });
    var dfTopSpeciesData =  $.getJSON(topSpeciesDataLocation, function(topData) {
        topSpeciesData = topData;
    });

    // Add flag pathways conditionally and push to Ajax calls array
    if(flg !== null){
        var dfFlag = $.getJSON("/ContentService/search/fireworks/flag?query=" + flg + "&species=" + speciesValue.replace("_"," "), function(data) {
            data.llps.forEach(function(val) {
                flagStId.push(val);
            });
        });
        deferreds.push(dfSpeciesData, dfTopSpeciesData, dfFlag);
    } else {
        deferreds.push(dfSpeciesData, dfTopSpeciesData);
    }
    $.when.apply( $, deferreds)// Same as $.when.apply( dfSpeciesData, dfTopSpeciesData, dfFlag )
        .then( function(){
            if ( typeof speciesData && topSpeciesData !== "undefined") {
                datasetInFoamtree = getData(speciesData, topSpeciesData);

                if(flg !== null){
                    var foamtreeDataWithFlg = addFlg(flagStId, datasetInFoamtree);
                    foamtreeStarts(foamtreeDataWithFlg);
                    $(".waiting").hide();
                } else {
                    foamtreeStarts( datasetInFoamtree);
                    $(".waiting").hide();
                }
            }
        }
    );
}

// Overrepresentation analysis
function foamtreeAnaWithFlg( flg, speciesDataLocation, topSpeciesDataLocation, responseFromToken , analysisParam){

    var flagStId = [];
    var deferreds = [];

    var dfSpeciesData = $.getJSON(speciesDataLocation, function(data) {
        speciesData = data;
    });
    var dfTopSpeciesData =  $.getJSON(topSpeciesDataLocation, function(topData) {
        topSpeciesData = topData;
    });

    if(flg !== null){
        var dfFlag = $.getJSON("/ContentService/search/fireworks/flag?query=" + flg + "&species=" + speciesValue.replace("_"," "), function(data) {
            data.llps.forEach(function(val) {
                flagStId.push(val);
            });
        });
        deferreds.push(dfSpeciesData, dfTopSpeciesData, dfFlag);
    } else{
        deferreds.push(dfSpeciesData, dfTopSpeciesData);
    }
    $.when.apply( $, deferreds)
        .then( function(){
            if ( typeof speciesData && topSpeciesData !== "undefined") {

                datasetInFoamtree = getData(speciesData, topSpeciesData);

                if(flg !== null){
                    var foamtreeDataWithFlg = addFlg(flagStId, datasetInFoamtree);
                    var anaData = addAnaResult(responseFromToken, analysisParam, foamtreeDataWithFlg);
                    foamtreeAnalysisStarts(anaData);
                    $(".waiting").hide();
                } else {
                    var anaDataNoFlg = addAnaResult(responseFromToken, analysisParam, datasetInFoamtree);
                    foamtreeAnalysisStarts(anaDataNoFlg);
                    $(".waiting").hide();
                }
            }
        }
    );
}

// Expression analysis
function foamtreeAnaExpWithFlg( flg, speciesDataLocation, topSpeciesDataLocation, columnNameResponse, pvalueResponse, analysisParam, min, max, columnArray){

    var flagStId = [];
    var deferreds = [];

    var dfSpeciesData = $.getJSON(speciesDataLocation, function(data) {
        speciesData = data;
    });
    var dfTopSpeciesData =  $.getJSON(topSpeciesDataLocation, function(topData) {
        topSpeciesData = topData;
    });

    if(flg){
        var dfFlag = $.getJSON("/ContentService/search/fireworks/flag?query=" + flg + "&species=" + speciesValue.replace("_"," "), function(data) {
            data.llps.forEach(function(val) {
                flagStId.push(val);
            });
        });
        deferreds.push(dfSpeciesData, dfTopSpeciesData, dfFlag);
    } else{
        deferreds.push(dfSpeciesData, dfTopSpeciesData);
    }

    $.when.apply( $, deferreds)
        .then( function(){
            if ( typeof speciesData && topSpeciesData !== "undefined") {

                datasetInFoamtree = getData(speciesData, topSpeciesData);

                if(flg !== null){
                    var foamtreeDataWithFlg = addFlg(flagStId, datasetInFoamtree);
                    var anaExpData = addExpAnaResult(columnNameResponse, pvalueResponse, analysisParam, foamtreeDataWithFlg);
                    foamtreeExpStarts( anaExpData, min, max, columnArray);
                    $(".waiting").hide();
                } else {
                    var anaExpDataNoFlg = addExpAnaResult(columnNameResponse, pvalueResponse, analysisParam, datasetInFoamtree);
                    foamtreeExpStarts( anaExpDataNoFlg, min, max, columnArray);
                    $(".waiting").hide();
                }
            }
        }
    );
}

function createCanvas(colorMin,colorStop,colorMax,min,max){

    var topLabel = max ? max.toExponential().replace("e+","E"):0;
    var bottomLabel= min? min.toExponential().replace("e+","E"):0.05;
    $(".inlineLabelTop").text(topLabel);
    $(".inlineLabelBottom").text(bottomLabel);

    var canvas = document.getElementById('legendCanvasGradient');
    var ctx = canvas.getContext('2d');
    var gradient = ctx.createLinearGradient(0,0,30,200);

    gradient.addColorStop(0, colorMin);
    gradient.addColorStop(1, colorMax);

    if (colorStop){
        gradient.addColorStop(0.5, colorStop);
    }
    ctx.clearRect(0, 0, 50,200);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.fillRect(0, 0, 30, 200);
    ctx.closePath();
}

function drawOver(p, selected,hovered){
    var canvas = document.getElementById('legendCanvas');
    var ctx = canvas.getContext('2d');
    var gradient = ctx.createLinearGradient(10,0,30,200);


    ctx.clearRect(0, 0, 50,210);
    ctx.fillStyle = gradient;

    var percentage = p / 0.05;
    var y = (percentage *200) + 5;


    if (selected !==null){
        if (p !== null && p >=0 && p <= 0.05){
            ctx.beginPath();
            ctx.fillRect(10, 0, 30, 200);
            ctx.closePath();
            ctx.beginPath();
            ctx.strokeStyle = '#ff7700';
            ctx.fillStyle = '#ff7700';

            ctx.moveTo(40, y);
            ctx.lineTo(45, y-5);
            ctx.lineTo(45, y+5);
            ctx.lineTo(40, y);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.moveTo(10, y);
            ctx.lineTo(40, y);
            ctx.stroke();
            ctx.closePath();
        }
    }

   if (hovered !==null ) {
       if (p !== null && p >= 0 && p <= 0.05) {
           ctx.beginPath();
           ctx.strokeStyle = 'blue';
           ctx.fillStyle = 'blue';
           ctx.moveTo(5, y - 5);
           ctx.lineTo(10, y);
           ctx.lineTo(5, y + 5);
           ctx.lineTo(5, y - 5);
           ctx.fill();
           ctx.stroke();
           ctx.closePath();

           ctx.beginPath();
           ctx.moveTo(10, y);
           ctx.lineTo(40, y);
           ctx.stroke();
           ctx.closePath();
       }
   }
}

function drawExp(p,coverage, selected,hovered,min,max){
    var canvas = document.getElementById('legendCanvas');
    var ctx = canvas.getContext('2d');
    var gradient = ctx.createLinearGradient(10,0,30,200);

    ctx.clearRect(0, 0, 50,210);
    ctx.fillStyle = gradient;

    var percentage = 1 - ((coverage - min) / (max - min));
    var y = (percentage *200) + 5;

    if (selected !==null) {
        if (coverage !== null &&  p >= 0 && p <= 0.05) {
            ctx.beginPath();
            ctx.fillRect(10, 0, 30, 200);
            ctx.closePath();
            ctx.beginPath();
            ctx.strokeStyle = '#ff7700';
            ctx.fillStyle = '#ff7700';

            ctx.moveTo(40, y);
            ctx.lineTo(45, y - 5);
            ctx.lineTo(45, y + 5);
            ctx.lineTo(40, y);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();


            ctx.beginPath();
            ctx.moveTo(10, y);
            ctx.lineTo(40, y);
            ctx.stroke();
            ctx.closePath();
        }
    }

    if (hovered !==null ) {
        if (coverage !== null && p >= 0 && p <= 0.05) {
            ctx.beginPath();
            ctx.strokeStyle = 'blue';
            ctx.fillStyle = 'blue';
            ctx.moveTo(5, y - 5);
            ctx.lineTo(10, y);
            ctx.lineTo(5, y + 5);
            ctx.lineTo(5, y - 5);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.moveTo(10, y);
            ctx.lineTo(40, y);
            ctx.stroke();
            ctx.closePath();
        }
    }
}


