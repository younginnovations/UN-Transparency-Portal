$(function () {
    var data = {
        "total_sector": total_sector,
        "sector_un_operates": sector_un_operates
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
