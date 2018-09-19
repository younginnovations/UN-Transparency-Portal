$(function () {
    var data = {
        "total_sector": total_sector,
        "sector_un_operates":  $("#total_sectors").text()
    };
    var mainWidth = $("#sectorProgressBox").width();
    var dataWidth = (data.sector_un_operates / data.total_sector) * mainWidth,
        maxWidth = mainWidth - 5;

    if (dataWidth >= (maxWidth)) {
        $("#sectorProgressBar").css("width", dataWidth);
        $("#sectorProgressBar").css("border-radius", 5);
    }
    else {
        $("#sectorProgressBar").css("width", dataWidth);
    }
});
