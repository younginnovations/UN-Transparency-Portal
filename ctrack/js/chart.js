// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var chart=exports;
exports.name="chart";

var csscolor=require("./csscolor.js")
var ctrack=require("./ctrack.js");
var d3 = require("d3");
var st =0;
var count = 0;
chart.draw=function(sel,data,options,barColor){
	function numberWithCommas(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
	if(typeof data === "object"){
		if(sel == "#donor_graph" || sel == "#sector_publisher_graph"){
			var width = 370,
				height = 330,
				radius = Math.min(width, height) / 2;
			var divNode = d3.select("#overlay").node();
			var subwidth = 130,
				subheight = 160,
				subradius = Math.min(subwidth, subheight) / 2;

			var color = d3.scale.ordinal()
				.range(["#008FFF","#08519C","#3182BD", "#6BAED6", "#9ECAE1", "#C6DBEF", "#DAE9F7"]);

			var arc = d3.svg.arc()
				.outerRadius(radius - 15)
				.innerRadius(radius - 80);

			var subarc = d3.svg.arc()
				.outerRadius(subradius - 10)
				.innerRadius(subradius - 35);
			//console.log(data);
			var pie = d3.layout.pie()
				.sort(null)
				.value(function(d) {
					return d.num; });

			d3.select(sel).append("div")
				.attr("id","mainPie")
				.attr("class","pieBox");

			d3.select(sel).append("div")
				.attr("id","subPie")
				.attr("class","pieBox");

			var svg = d3.select("#mainPie").append("svg")
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

			var defs = svg.append("defs");
			var filter = defs.append("filter")
				.attr("id", "drop-shadow")
				.attr("height","130%");

			filter.append("feGaussianBlur")
				.attr("in","SourceAlpha")
				.attr("stdDeviation", 3)
				.attr("result", "blur");

			filter.append("feOffset")
				.attr("in", "blur")
				.attr("dx", 3)
				.attr("dy", 3)
				.attr("result", "offsetBlur");
			var feMerge = filter.append("feMerge");

			feMerge.append("feMergeNode")
				.attr("in", "offsetBlur")
			feMerge.append("feMergeNode")
				.attr("in", "SourceGraphic");

			var subchart = function(arr,ide){
				var subsvg = d3.select(ide).append("svg")
					.attr("width", subwidth)
					.attr("height", subheight)
					.append("g")
					.attr("transform", "translate(" + subwidth / 2 + "," + ((subheight / 2)-13) + ")");

				arr.forEach(function(d){
					d.num = +d.num;
				});

				var gum = subsvg.selectAll(".arc")
					.data(pie(arr))
					.enter().append("g")
					.attr("class", "arc");

				gum.append("path")
					.attr("d", subarc)
					.attr("transform",function(d){
						count++;
						if(d.data.str_lab !== "Total"){
							if(count > 1)
							st = d.data.prevPct * 3.6;
						}
						return "rotate("+ st +")";
					})
					.style("fill", function(d) {
						if(d.data.str_lab == "Total"){
							return "#f2f2f2";
						}
						else{
							return color(d.data.num);
						}
					});
				gum.append("svg:text")
					.style("font-weight", "bold")
					.attr("transform", "translate(0," + 3 + ")")
					.html(function(d){
						if(d.data.str_lab !== "Total"){
							return d.data.pct + "%";
						}
					});
				subsvg.selectAll(ide)
					.data(pie(arr))
					.enter()
					.append("text")
					.attr("text-anchor", "middle")
					.attr("transform", "translate(0," + 73 + ")")
					.attr("font-size","13px")
					.style("font-weight", "bold")
					.style("fill","#344")
					.html(function(d){
						if(d.data.str_lab !== "Total"){
								return d.data.str_lab;
						}
					});

				subsvg.selectAll(ide)
					.data(pie(arr))
					.enter()
					.append("text")
					.attr("text-anchor", "middle")
					.style("fill","#8E8989")
					.attr("transform", "translate(0," + 90 + ")")
					.attr("font-size","12px")
					.html(function(d){
						if(d.data.str_lab !== "Total"){
							 return "$" + numberWithCommas(d.data.num);
						}
					});
			};
			var sum = 0;
			data.forEach(function(d){
				d.num = +d.num;
				sum = sum + d.num;
			});

			data.forEach(function(d,i){
				var arr = [];
				d3.select("#subPie").append('div')
					.attr("id","subchart"+i)
					.attr("class","subchart");
				var ide = "#subchart"+i;
				arr.push(d,{ "num": sum-d.num, "str_lab": "Total"});
				subchart(arr,ide);
			});

			data.forEach(function(d){
				d.num = +d.num;
			})
			var g = svg.selectAll(".arc")
				.data(pie(data))
				.enter().append("g")
				.attr("class", "arc");

			g.append("path")
				.attr("d", arc)
				.style("fill", function(d){ return color(d.data.num); })
				.on("mouseover", function(d) {
					d3.select(this)
						.attr("stroke","#fff")
						.attr("stroke-width","2px")
						.style("filter", "url(#drop-shadow)");
					d3.select(this)
						.transition()
						.duration(500)
						.ease('elastic')
						.attr('transform',function(d){
							var dist = 3;
							d.midAngle = ((d.endAngle - d.startAngle)/2) + d.startAngle;
							var x = Math.sin(d.midAngle) * dist;
							var y = Math.cos(d.midAngle) * dist;
							return 'translate(' + x + ',' + y + ')';
						});
					var mousePos = d3.mouse(divNode);
					d3.select("#mainTooltip")
						.style("left", mousePos[0] + "px")
						.style("top", mousePos[1] + "px")
						.select("#value")
						.attr("text-anchor", "middle")
						.html(d.data.pct+"%" + "<br />" + d.data.str_lab + "<br />" + "$" + numberWithCommas(d.data.num));

					d3.select("#mainTooltip").classed("hidden", false);
				})
				.on("mouseout", function(){
					d3.select(this)
						.attr("stroke","none")
						.style("filter","none");
					d3.select(this)
						.transition()
						.duration(500)
						.ease('bounce')
						.attr('transform','translate(0,0)');

					d3.select("#mainTooltip").classed("hidden", true);
				});

			var centerSvg = svg.append('circle')
				.attr('fill','#F2F2F2')
				.attr('r','77');

			svg.append('text')
				.style('fill', '#344')
				.style("font-size", "64px")
				.style("font-weight", "bold")
				.attr("transform", "translate(0," + 10 + ")")
				.attr("text-anchor", "middle")
				.html(data.length);

			svg.append("text")
				.attr("text-anchor", "middle")
				.style("fill","#344")
				.attr("transform", "translate(0," + 35 + ")")
				.style("font-size","18px")
				.html("UN Agencies");
		}
		else{
			var parentWidth = $(sel).parent().width();
			var barHeight = 30;
			var height = barHeight * data.length;
			var marginHorz = { top: 20, right: 120, bottom: 40, left: parentWidth/3},
				widthHorz = parentWidth - marginHorz.left - marginHorz.right,
				heightHorz = height;

			var labelSpace = 60;

			var dataRange = d3.max(data,function(d) { return d.num; });

			var total = d3.scale.linear().domain([0, dataRange]).range([0, widthHorz - labelSpace]);

			var yScale = d3.scale.ordinal().rangeRoundBands([0,heightHorz]);;
			var xScale = d3.scale.linear().range([0,widthHorz]);

			var  xAxisHorz = d3.svg.axis()
				.scale(xScale)
				.orient("bottom");

			var yAxisHorz = d3.svg.axis()
				.scale(yScale)
				.orient("left");

			xScale.domain([0, d3.max(data, function(d) { return d.num; })]);
			yScale.domain(data.map(function(d) {return d.str_lab; }));


			var svgHorz = d3.select(sel).append("svg")
				.attr("width", widthHorz + marginHorz.left + marginHorz.right)
				.attr("height", heightHorz + marginHorz.top + marginHorz.bottom)
				.append("g")
				.attr("transform", "translate(" + marginHorz.left + "," + marginHorz.top + ")");

			//var divNode = d3.select("#horizontalBarChart").node();

			// //vertical lines
			// svgHorz.selectAll(".vline").data(d3.range(10)).enter()
			// .append("line")
			// .attr("x1", function (d) {
			//   return d * (widthHorz/10);
			// })
			// .attr("x2", function (d) {
			//   return d * (widthHorz/10);
			// })
			// .attr("y1", function (d) {
			//   return 10;
			// })
			// .attr("y2", function (d) {
			//   return heightHorz;
			// })
			// .style("stroke", "#eee");

			data.forEach(function(d) {
				d.str_lab = d.str_lab;
				d.num = +d.num;
				//d.targets = +d.targets;
			});

			//svgHorz.append("g")
			//	.attr("class", "y axis")
			//	.call(yAxisHorz)
			//	.append("text")
			//	.attr("transform", "rotate(-90)")
			//	.attr("y", 5)
			//	.attr("dy", 200)
			//	.style("text-anchor", "end");

			svgHorz.selectAll("rect")
				.data(data)
				.enter().append("rect")
				.attr("class", "bar")
				.style("fill", barColor)
				.transition()
				.ease("quad-out")
				.duration(4000)
				.delay(0)
				.attr("x", 0)
				.attr("width", function (d){
					return total(d.num);
				})
				.attr("y", function (d, i){
					return i * (height / data.length);
				})
				.attr("height", barHeight-5);

			var textAlign = barHeight - 13;
			var valueText =	svgHorz.selectAll("text.value")
				.data(data)
				.enter()
				.append("text")
				.attr("class","bar")
				.attr("y", function(d,i){
					return i * (heightHorz / data.length);
				})
				.attr("dx",function (d){
					return total(d.num) + 10})
				.attr("dy", textAlign);

			valueText.append("tspan")
				.style("font-size", "14px")
				.style("font-weight", "bold")
				.text(function(d) {
					return "$"+numberWithCommas(d.num);
				});

			valueText.append("tspan")
				.style("font-size","14px")
				.style("fill", "#8C8989")
				.text(function(d) {
					if(d.pct !== undefined){
						return " (" + d.pct + "%)";
					}
				});

			if(sel === "#sector_category_graph"){
				svgHorz.selectAll("text.name")
					.data(data)
					.enter()
					.append("text")
					.text(function(d){
						if(d.str_lab !== undefined) {
							if (d.str_lab.length < 40)
								return d.str_lab;
							else
								return d.str_lab.slice(0, 40) + "...";
						}
						else{
							return "N/A"
						}
					})
					.style("font-size", "14px")
					.attr("y", function(d,i){
						return i * (height / data.length);
					})
					.attr("dx", -(parentWidth/3))
					.attr("dy", textAlign)
					.on("click",function(d){
						window.location.assign(window.location.origin+ "/ctrack.html?sector="+ d.sector_code+"&tongue=eng");
					})
					.style("cursor","pointer");
			}
			else if(sel == "#publisher_sectors_graph"){
				svgHorz.selectAll("text.name")
					.data(data)
					.enter()
					.append("text")
					.text(function(d){
						if(d.str_lab !== undefined) {
							if(typeof d.str_lab == "string"){
								if (d.str_lab.length < 40)
									return (d.str_lab);
								else
									return (d.str_lab).slice(0, 40) + "...";
							}
						}
						else{
							return "N/A"
						}
					})
					.style("font-size", "14px")
					.attr("y", function(d,i){
						return i * (height / data.length);
					})
					.attr("dx", -(parentWidth/3))
					.attr("dy", textAlign);
			}else{
				svgHorz.selectAll("text.name")
					.data(data)
					.enter()
					.append("text")
					.text(function(d){
						if(d.str_lab !== undefined) {
							if (d.str_lab.length < 40)
								return (d.str_lab);
							else
								return d.str_lab.slice(0, 40) + "...";
						}
						else{
							return "N/A"
						}
					})
					.style("font-size", "14px")
					.attr("y", function(d,i){
						return i * (height / data.length);
					})
					.attr("dx", -(parentWidth/3))
					.attr("dy", textAlign);
			}
		}
	}
}

//	var opt={			//	All stylings are in pixels
//		style:"donut", 	//	Style of chart - there is only donut flavour for now
//		layout:"right",	//	Caption placement - left, right, five
//		clockwise:1,    // if -1 then fill piechart in reverse
//		width:600,		//	Width of entire chart div
//		height:400,		//	Height of entire chart div
//		center_x:200,	//	Center of chart in div from the left
//		center_y:200,	//	Center of chart in div from the top
//		radius:140,		//	Size of chart
//		hole:70,		//	Size of hole in chart - how big is your donut?
//		color:["#0f0","#8f0","#4f0","#0f4","#0f8","#4f4"],	//	Add as many colours as you want for pie slices (5 max for now)
//		caption_css:{"width":160,"padding":"8px","borderStyle":"solid","borderWidth":4},	//	Styling for the caption div
//		caption_edge:4,	//	Margin of caption div from the edge of entire chart div depending on layout (left/right)
//		caption_fix:[0,0],		//	fix caption positions x,y for slight nudges
//		stroke_width:4,	//	Thickness of chart border
//		line_width:1,	//	Thickness of lines from caption to chart
//		tints:{						//	Changing the numbers below apart from [1,1,1,1] gives experimental effects
//			fill:[1,1,1,1],			//	Background color of chart - [1,1,1,1] gets you slice colors
//			line:[0,0,0,0.5],		//	Color of line from caption to chart - [1,1,1,1] gets you slice colors
//			stroke:[0.5,0.5,0.5,1],	//	Border color of chart - [2,2,2,2] gets you #fff border
//			text:[0,0,0,1],			//	Color of caption fonts
//			back:[1,1,1,1],			//	Background color of caption div
//			border:[0.5,0.5,0.5,1],	//	Border color of caption div
//		},
//	}
//	for(var n in options) { opt[n]=options[n]; }
//
//	var getdat=function(name,idx){
//		var v=data[idx]; // check data first
//		var r;
//		if("object"==typeof v)
//		{
//			r=v[name];
//		}
//		if(r===undefined)
//		{
//			if(name=="num") // allow single numerical data array
//			{
//				if("number"==typeof v)
//				{
//					r=v;
//				}
//			}
//		}
//		if(r===undefined) // allow opts to add labels/colors/etc
//		{
//			var vv=opt[name];
//			if("object"==typeof vv)
//			{
//				r=vv[idx%vv.length]; // extra values, with simple wraping
//			}
//		}
//
//		return r;
//	}
//
//	var div={};
//	opt.div=div;
//	div.master=$(sel);
//	div.canvas=$("<canvas width='"+opt.width+"' height='"+opt.height+"'></canvas>");
//	div.over=$("<div class='char_captions'></div>");
//
//	div.master.empty();
//	div.master.append(div.canvas);
//	div.master.append(div.over);
//
//	var css={"width":opt.width,"height":opt.height};
//	div.master.css(css);
//	div.canvas.css(css);
//	div.over.css(css);
//
//// slot div.over above the canvas
//	div.master.css({"position":"relative"});
//	div.canvas.css({"position":"absolute","top":0,"left":0});
//	div.over.css({"position":"absolute","top":0,"left":0});
//
//	var ctx = div.canvas[0].getContext('2d');
//
//	var	ang=-(Math.PI*1/2);
//	var max=0; for (var i=0; i<data.length; i++){ max+=getdat("num",i); }
//
//	opt.seg_rad=[];
//	for (var i=0; i<data.length; i++){
//
//		var seg = ( (getdat("num",i)/max) * (Math.PI*2) ) * opt.clockwise ;
//
//		opt.seg_rad[i]=ang+(seg/2);
//
//		ctx.beginPath();
//		ctx.arc(opt.center_x,opt.center_y,opt.radius,ang	,ang+seg, opt.clockwise<0 /*false*/);
//		ctx.arc(opt.center_x,opt.center_y,opt.hole	,ang+seg,ang	, opt.clockwise>0 /*true*/);
//		ctx.closePath();
//
//		var cc=csscolor.parseCSSColor( getdat("color",i) );
//
//		if(opt.tints.fill)
//		{
//			ctx.fillStyle = csscolor.rgba_to_str(cc,opt.tints.fill);
//			ctx.fill();
//		}
//
//		if(opt.tints.stroke)
//		{
//			ctx.lineWidth = opt.stroke_width;
//			ctx.strokeStyle = csscolor.rgba_to_str(cc,opt.tints.stroke);
//			ctx.stroke();
//		}
//		ang += seg;
//	}
//
//	div.over.empty();
//
//	opt.lines=[];
//	opt.pos=[];
//	opt.ds=[];
//
//	var ppx=0;
//	var ppy=0;
//
//	for (var i=0; i<data.length; i++){
//		var cc=csscolor.parseCSSColor( getdat("color",i) );
//
//		d=$("<div class='chart_caption'></div>").html(getdat("str",i))
//		if(opt.tints.text)   { d.css("color",           csscolor.rgba_to_str(cc,opt.tints.text));   }
//		if(opt.tints.back)   { d.css("background-color",csscolor.rgba_to_str(cc,opt.tints.back));   }
//		if(opt.tints.border) { d.css("border-color",    csscolor.rgba_to_str(cc,opt.tints.border)); }
//		if(opt.caption_css)  { d.css(opt.caption_css); }
//		div.over.append(d);
//		opt.ds[i]=d;
//
//		var w=d.outerWidth(true);
//		var h=d.outerHeight(true);
//		var hax=opt.caption_edge;
//		var px,py,lx,ly;
//		if(opt.layout=="five")
//		{
//			if(i==1) { px=opt.width-w-hax;	py=hax;					lx=px+(w/2);	ly=py+(h/2); } else
//			if(i==2) { px=opt.width-w-hax;	py=opt.height-h-hax;	lx=px+(w/2);	ly=py+(h/2); } else
//			if(i==3) { px=hax;				py=opt.height-h-hax;	lx=px+(w/2);	ly=py+(h/2); } else
//			if(i==4) { px=hax;				py=hax;					lx=px+(w/2);	ly=py+(h/2); } else
//			if(i==0) { px=(opt.width-w)/2;	py=(opt.height-h)/2;	lx=px+(w/2);	ly=py+(h/2); }
//		}
//		else
//		if(opt.layout=="left")
//		{
//			px=hax;
//			py=ppy; ppy+=h;
//			lx=px+w;
//			ly=py+(h/2);
//		}
//		else
//		if(opt.layout=="right")
//		{
//			px=opt.width-w-hax;
//			py=ppy; ppy+=h;
//			lx=px;
//			ly=py+(h/2);
//		}
//
//		if(px!==undefined) { opt.pos[i]=[px,py]; }
//		if(lx!==undefined) { opt.lines[i]=[lx,ly]; }
//	}
//
//	var fix;
//
//	if( (opt.layout=="left") || (opt.layout=="right") )
//	{
//		fix=[0, (opt.height-ppy)/2 ]; // center
//	}
//
//	if(opt.caption_fix)
//	{
//		if(!fix) { fix=[0,0]; }
//		fix[0]+=opt.caption_fix[0];
//		fix[1]+=opt.caption_fix[1];
//	}
//
//	if(fix)
//	{
//		for(i=0;i<data.length;i++)
//		{
//			var pos=opt.pos[i];
//			if(pos)
//			{
//				pos[0]+=fix[0];
//				pos[1]+=fix[1];
//			}
//			var line=opt.lines[i];
//			if(line)
//			{
//				line[0]+=fix[0];
//				line[1]+=fix[1];
//			}
//		}
//	}
//
//	for(i=0;i<data.length;i++)
//	{
//		var d=opt.ds[i];
//		if(d)
//		{
//			var pos=opt.pos[i];
//			if(pos)
//			{
//				d.css("position","absolute");
//				d.css("left",pos[0]);
//				d.css("top",pos[1]);
//			}
//		}
//	}
//
//	for(i=0;i<data.length;i++)
//	{
//		var line=opt.lines[i];
//		if(line)
//		{
//			if(opt.tints.line)
//			{
//				var cc=csscolor.parseCSSColor( getdat("color",i) );
//				var c=opt.hole+((opt.radius-opt.hole)/2);
//				var dx=Math.cos(opt.seg_rad[i])*c;
//				var dy=Math.sin(opt.seg_rad[i])*c;
//				dx+=opt.center_x;
//				dy+=opt.center_y;
//
//				ctx.beginPath();
//				ctx.moveTo(line[0],line[1]);
//				ctx.lineTo(dx,dy);
//				ctx.closePath();
//
//				ctx.lineWidth = opt.line_width;
//				ctx.strokeStyle = csscolor.rgba_to_str(cc,opt.tints.line);
//				ctx.stroke();
//			}
//		}
//	}
//
//	return opt;
//}
//
