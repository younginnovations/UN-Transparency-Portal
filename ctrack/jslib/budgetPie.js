$(function(){
        var dataset = [{
                "value":total_budget,
                "title":"Total Budget"
            },{
                "value":total_expenditure,
                "title":"Total Expenses"
	}];
	var pie = d3.layout.pie();
    var margin = { top:5, right: 5, bottom: 5, left: 5};
	var w = 110;
	var h = 110;
	var divNode = d3.select("#overlay").node();
	var color = d3.scale.quantize()
					.range(["#0067B1","#fff"]);
	var outerRadius = w / 2;
	var innerRadius = 0;
	var center = outerRadius + 5;

	var arc = d3.svg.arc()
				.innerRadius(innerRadius)
				.outerRadius(outerRadius);

	var arcOutter = d3.svg.arc()
			    .innerRadius(outerRadius)
			    .outerRadius(outerRadius + 5);

	var pie = d3.layout.pie()
				.value(function(d){
					return d.value;
				});

	var svg = d3.select("#pie1")
				.append("svg")
				.attr("width", w + margin.bottom + margin.right)
				.attr("height", h + margin.top + margin.left);

	var arcs = svg.selectAll("g.arc")
					.data(pie(dataset))
					.enter()
					.append("g")
					.attr("class", "arc")
					.attr("transform", "translate(" + center + "," + center + ")rotate(-120)");

	var outterArcs = svg.selectAll("g.outter-arc")
						.data(pie(dataset))
						.enter()
						.append("g")
						.attr("class","outter-arc")
						.attr("transform", "translate(" + center + "," + center + ")rotate(-120)");

		arcs.append("path")
			.attr("fill", function(d,i){
				return color(i);
			})
			.attr("d", arc)
			.on("mousemove", function(d){
				var mousePos = d3.mouse(divNode);
				d3.select("#mainTooltip")
					.style("left", mousePos[0] - 65 + "px")
					.style("top", mousePos[1] - 60 + "px")
					.select("#value")
					.attr("text-anchor", "middle")
					.html("$" + Math.ceil(d.value).toLocaleString());

				d3.select("#mainTooltip").classed("hidden", false);
			})
			.on("mouseout", function(d) {
				d3.select("#mainTooltip").classed("hidden", true);
			});

	outterArcs.append("path")
			.attr("fill","#3385C0")
			.attr("d",arcOutter);

});
