function projectProgressBar(year) {

    var data = {
        "totalProjects": total_projects[year],
        "activeProjects": active_projects[year]
    };


    var mainWidth = $("#progressBox").width();
    var dataWidth = (data.activeProjects / data.totalProjects) * mainWidth,
        maxWidth = mainWidth - 5;

    if (dataWidth >= (maxWidth)) {
        $("#progressBar").css("width", dataWidth);
        $("#progressBar").css("border-radius", 5);
    }
    else {
        $("#progressBar").css("width", dataWidth);
    }
};
