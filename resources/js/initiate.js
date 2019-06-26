/**
 * Created by Chuqiao on 19/3/26.
 */
window.addEventListener("load", function(){

    var analysisParam =  getUrlVars()["analysis"];
    if (typeof analysisParam !== "undefined" ){
        foamtreeAnalysis(analysisParam);
    } else {
        foamtreeLoading();
    }
});

function foamtreeLoading(){

    $(".waiting").show();
    foamtreeWithFlg(flg,speciesDataLocation,topSpeciesDataLocation);
}

function foamtreeAnalysis(analysisParam){

    function extractDataFromToken(response) {

        // Read external Token data and save to key=>value pair R-HSA-5653656 =>1.1102230246251565e-16
        var responseFromToken = {};

        $.each(response.pathways, function (key, val) {
            responseFromToken[val.stId] = val.entities.pValue;
        });

        foamtreeAnaWithFlg(flg, speciesDataLocation, topSpeciesDataLocation, responseFromToken, analysisParam );
    }

    function extractExpDataFromToken(response) {

        // Create columnArray of expression data sets to be added
        var columnArray = [];
        var columnNames = response.expressionSummary.columnNames;
        for (var key in columnNames) {columnArray.push(columnNames[key])}

        // Get expression column data form token and save to key=>value pair R-HSA-5653656 => exp {...}
        // and save the pValue to key=>value pair R-HSA-5653656 => 1.1102230246251565e-16
        var columnNameResponse = {};
        var pvalueResponse = {};
        $.each(response.pathways, function (key, val) {
            pvalueResponse[val.stId] = val.entities.pValue;
            columnNameResponse[val.stId] = val.entities.exp;
            var exp = val.entities.exp;
            $.each(exp, function(key){
                exp[columnNames[key]] = exp[key];
                delete exp[key];
            });
        });

        // Min and max value from token, the min max value in color bar
        var min = response.expressionSummary.min;
        var max = response.expressionSummary.max;

        foamtreeAnaExpWithFlg( flg, speciesDataLocation, topSpeciesDataLocation, columnNameResponse, pvalueResponse, analysisParam, min, max, columnArray);
    }

    $.ajax({
        // TODO PARSE FILTER PARAM -- FILTER=pValue:0.88$species:9606
        url: "/AnalysisService/token/" + analysisParam + "/filter/species/"+ speciesIdFromUrl +"?sortBy=ENTITIES_PVALUE&order=ASC&resource=TOTAL",
        dataType: "json",
        type: "GET",
        beforeSend:  function() {
            $(".waiting").show()
        },
        success: function (json) {
            var type = json.type;
            if ( type == "OVERREPRESENTATION"){
                extractDataFromToken(json);
            } else if ( type == "EXPRESSION" || type == "GSA_REGULATION"){
                extractExpDataFromToken(json);
            } else {
                alert("Unable to load '" + type + "' analysis");
            }
        },
        error: function () {
            alert("data not found");

            // Remove color and analysis parameter in current url
            window.location.href = location.href.split("?")[0];

            foamtreeLoading();
        }
    });
}
