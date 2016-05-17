$(function(){
    var width = 520;
	var height = 120;
	var divNode = d3.select("#overlay").node();
	var svg = d3.select("#linegraph")
				.append("svg")
				.attr("width", width)
				.attr("height", height)
				.attr("id", "trendLineChart");
	var vis = d3.select("#trendLineChart"),
				margin = {
					top: 20, right:20, bottom:20, left: 60
				};

	var xScale = d3.scale.ordinal().rangeRoundBands([0,width - 30], 0);
	var yScale = d3.scale.linear()
				.range([height - margin.top, margin.bottom]);
	var xAxis = d3.svg.axis()
					.orient("bottom")
					.scale(xScale);
	var yAxis = d3.svg.axis()
					.orient("left")
					.scale(yScale)
					.ticks(5);

	function make_x_axis(){
		return d3.svg.axis()
				.scale(xScale)
				.orient("bottom")
				.ticks(5)
	}
	function make_y_axis(){
		return d3.svg.axis()
				.scale(yScale)
				.orient("left")
				.ticks(5)
	}
    // console.log(un_current_trends," trendChart");
		var mainData = [];
		for(var key in un_current_trends){
			mainData.push({'year': key, 'value': un_current_trends[key]})
		}
		mainData.forEach(function(d){
			d.year = d.year;
			d.value = +d.value;
		});
		var maxValue = d3.max(mainData, function(d){ return d.value; });
		//var minValue = d3.min(mainData, function(d){ return d.value; });

		xScale.domain(mainData.map(function (d) {return d.year; }));
		yScale.domain([0,maxValue]);

		vis.append("svg:g")
			.attr("class","axis")
			.attr("transform", "translate(" + (margin.left-15) + "," + (height - margin.bottom)+ ")")
			.call(xAxis);

		vis.append("svg:g")
			.attr("class"," y axis")
			.attr("transform", "translate(" + margin.left + ",0)")
			.call(yAxis);

		vis.append("svg:g")
			.attr("class","grid")
			.attr("transform", "translate(" + margin.left + ",0)")
			.call(make_y_axis()
					.tickSize(-width,0,0)
					.tickFormat("")
				);

		var lineGen = d3.svg.line()
					.x(function(d){
						return xScale(d.year);
					})
					.y(function (d) {
						return yScale(d.value);
					});

		vis.append('svg:path')
			.attr('d', lineGen(mainData))
			.attr("transform", "translate(" + (((xScale(mainData[0].year) + xScale(mainData[1].year))/2) + margin.left-15) + ",0)")
			.attr("stroke", "#fff")
			.attr("stroke-width", 1)
			.attr("fill", "none");

		vis.selectAll("dot")
			.data(mainData)
			.enter()
			.append("circle")
			.filter(function (d) {
				return d.value;
			})
			.attr("r", 3.5)
			.attr("fill", "#fff")
			.attr("cx", function (d){
				return xScale(d.year) + (((xScale(mainData[0].year) + xScale(mainData[1].year))/2) + margin.left-15);
			})
			.attr("cy", function (d){
				return yScale(d.value);
			})
			.on("mousemove",function(d){
				var mousePos = d3.mouse(divNode);
				d3.select("#mainTooltip")
					.style("left", mousePos[0] - 60 + "px")
					.style("top", mousePos[1] - 60 + "px")
					.select("#value")
					.attr("text-anchor",'middle')
					.html(d.value.toLocaleString());

				d3.select("#mainTooltip").classed("hidden", false);
			})
			.on("mouseout", function(d) {
				d3.select("#mainTooltip").classed("hidden", true);
			});
});
