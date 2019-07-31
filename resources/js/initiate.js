/**
 * Created by Chuqiao on 19/3/26.
 */
window.addEventListener("load", function(){

    var analysisToken =  getUrlVars()["analysis"];
    if (typeof analysisToken !== "undefined" ){
        foamtreeAnalysis(analysisToken);
    } else {
        foamtreeLoading();
    }
});

function foamtreeLoading(){

    $(".waiting").show();
    foamtreeWithFlg(flag,speciesDataLocation,topSpeciesDataLocation);
};

function foamtreeAnalysis(analysisToken){

    var getEnrichmentDataFromToken = function (type, response) {

        // Read external Token data and save to key=>value pair R-HSA-5653656 =>1.1102230246251565e-16
        var responseFromToken = {};

        $.each(response.pathways, function (key, val) {
            responseFromToken[val.stId] = val.entities.pValue;
        });

        foamtreeEnricmentAnahWithFlag(type, flag, speciesDataLocation, topSpeciesDataLocation, responseFromToken, analysisToken );
    };

    var getExpressionDataFromToken = function (type, response) {

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

        foamtreeExpAnaWithFlag(type, flag, speciesDataLocation, topSpeciesDataLocation, columnNameResponse, pvalueResponse, analysisToken, min, max, columnArray);
    };

    $.ajax({
        // TODO PARSE FILTER PARAM -- FILTER=pValue:0.88$species:9606
        url: "https://dev.reactome.org/AnalysisService/token/" + analysisToken + "/filter/species/"+ speciesIdFromUrl +"?sortBy=ENTITIES_PVALUE&order=ASC&resource="+ getUrlVars()["resource"],
        dataType: "json",
        type: "GET",
        beforeSend:  function() {
            $(".waiting").show()
        },
        success: function (json) {
            var type = json.type;
            switch (type) {
                case "OVERREPRESENTATION":
                    getEnrichmentDataFromToken(type, json);
                    break;
                case "EXPRESSION":
                case "GSA_REGULATION":
                    getExpressionDataFromToken(type, json);
                    break;
                default:
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
