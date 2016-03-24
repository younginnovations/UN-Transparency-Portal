$(function(){
    var w =180;
	var h = 150;
			var canvas = d3.select("#worldMap")
							.attr("preserveAspectRatio","xMinYMin meet")
							.append("svg")
							.attr("width",w)
							.attr("height", h)
							.attr("viewBox", "0 0 804 621")
							.classed("svg-content-resonsive", true);

			var group = canvas.selectAll("g")
								.data(geojson.features)
								.enter()
								.append("g");

			var projection = d3.geo.mercator()
								.scale(120)
								.translate([400,400]);

			var geoPath = d3.geo.path().projection(projection);

			var plotMap = group.append("path")
							.attr("d", geoPath)
							.style("fill",function(d){
								if(country_names[d.id2] != undefined)
								return "#B3D1E7";

								else
								return "#3385C0";
							})
							.attr("stroke","#fff")

							.attr("stroke-width","0.5px")
							.attr("countries", function(d){
								return d.id2;
							});
});
