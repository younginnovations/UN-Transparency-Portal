$(function(){
    var data = {
    "total_un_agencies":   total_un_agencies,
    "un_agencies_in_iati": un_agencies_in_iati
	};
	var mainWidth = $("#progressBox2").width();
    var dataWidth = (data.un_agencies_in_iati/data.total_un_agencies) * mainWidth,
	maxWidth = mainWidth - 5;

	if(dataWidth >= (maxWidth)){
		$("#progressBar2").css("width", dataWidth);
		$("#progressBar2").css("border-radius", 5);
	}
	else{
		$("#progressBar2").css("width", dataWidth);
	}
});
