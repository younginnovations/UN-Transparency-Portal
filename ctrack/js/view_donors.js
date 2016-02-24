// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_donors=exports;
exports.name="view_donors";

var csvw=require("./csvw.js")

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var tables=require("./tables.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs_2013.json")

var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_donors.chunks=[
	"table_donors_rows",
	"table_donors",
];

//
// display the view
//
view_donors.view=function(args)
{
	view_donors.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	ctrack.setcrumb(1);
	ctrack.change_hash();
	view_donors.ajax(args);
};

view_donors.show=function()
{
	var year=parseInt(ctrack.hash.year) || ctrack.year;
	if(year!=view_donors.year) // new year update?
	{
		view_donors.ajax()
	}
	ctrack.div.master.html( plate.replace( "{view_donors}" ) );
};

//
// Perform ajax call to get data
//
view_donors.ajax=function(args)
{
	args=args || {};

	var year=args.year || parseInt(ctrack.hash.year) || ctrack.year;
	ctrack.year_chunks(year);	
	view_donors.year=year;

	ctrack.donors_data={};

	ctrack.sortby="t2"; // reset sortby
	var display=function(sortby)
	{
		var s=[];
		var a=[];
		for(var n in ctrack.donors_data) { a.push( ctrack.donors_data[n] ); }
		if(!sortby)
		{
			sortby=tables.sortby();
		}
		a.sort(sortby);
		a.forEach(function(v){
			if(!v.crs){v.crs="-";}
			if(!v.t1){v.t1="0";}
			if(!v.t2){v.t2="0";}
			if(!v.t3){v.t3="0";}
			if(!v.b1){v.b1="0";}
			if(!v.b2){v.b2="0";}

			if( iati_codes.crs_no_iati[v.funder] )
			{
				if(v.t1=="0") { v.t1="-"; }
				if(v.t2=="0") { v.t2="-"; }
				if(v.t3=="0") { v.t3="-"; }
				if(v.b1=="0") { v.b1="-"; }
				if(v.b2=="0") { v.b2="-"; }
			}

			v.donor=iati_codes.funder_names[v.funder] || iati_codes.publisher_names[v.funder] || iati_codes.country[v.funder] || v.funder;
			s.push( plate.replace(args.plate || "{table_donors_row}",v) );
		});
		ctrack.chunk(args.chunk || "table_donors_rows",s.join(""));

		ctrack.chunk_clear("table_donors");

	var p=function(s)
	{
		s=s || "";
		s=s.replace(/[,]/g,"");
		return parseInt(s);
	}
		var cc=[];
		cc[0]=["crs","donor","t"+(year-1),"t"+(year),"t"+(year+1),"b"+(year+1),"b"+(year+2)];
		a.forEach(function(v){
			cc[cc.length]=[p(v.crs),v.donor,p(v.t1),p(v.t2),p(v.t3),p(v.b1),p(v.b2)];
		});
		ctrack.chunk("csv_data","data:text/csv;charset=UTF-8,"+encodeURIComponent(csvw.arrayToCSV(cc)));
 
		ctrack.display();

	};
	view_donors.display=display;
	
	var fadd=function(d)
	{
		var it=ctrack.donors_data[d.funder];
		if(!it) { it={}; ctrack.donors_data[d.funder]=it; }
		
		for(var n in d)
		{
			if(d[n])
			{
				it[n]=d[n];
			}
		}
	}

// insert crs data if we have it
	var crs=crs_year[ (args.country || ctrack.args.country || "" ).toUpperCase() ];
	for(var n in crs)
	{
		var d={};
		d.funder=n;
		d.crs=commafy(""+Math.floor(crs[n]*ctrack.convert_usd));
		d.order=crs[n];
		fadd(d);
	}

	var years=[year-1,year,year+1];
	years.forEach(function(y)
	{
		var dat={
				"from":"act,trans,country",
				"limit":args.limit || -1,
				"select":"funder_ref,"+ctrack.convert_str("sum_of_percent_of_trans"),
				"funder_ref_not_null":"",
				"groupby":"funder_ref",
				"trans_code":"D|E",
				"trans_day_gteq":y+"-"+ctrack.args.newyear,"trans_day_lt":(parseInt(y)+1)+"-"+ctrack.args.newyear,
//				"country_code":(args.country || ctrack.args.country_select),
//				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
//				"title_like":(args.search || ctrack.args.search),
			};
		fetch.ajax_dat_fix(dat,args);
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		fetch.ajax(dat,function(data){
//			console.log("fetch transactions donors "+year);
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				var num=ctrack.convert_num("sum_of_percent_of_trans",v);
				d.funder=v.funder_ref;
				d["t"+(2+y-year)]=commafy(""+Math.floor(num));
				if(year==ctrack.year)
				{
					if( num > (d.order||0) ) { d.order=num; } // use ctrack.year transaction value for sort if bigger
				}
				fadd(d);
			}
//			console.log(ctrack.donors_data);
			
			display();
		});
	});
	
	var years=[year+1,year+2];
	years.forEach(function(y)
	{
		var dat={
				"from":"act,budget,country",
				"limit":args.limit || -1,
				"select":"funder_ref,"+ctrack.convert_str("sum_of_percent_of_budget"),
				"budget_priority":1, // has passed some validation checks serverside
				"funder_ref_not_null":"",
				"groupby":"funder_ref",
				"budget_day_start_gteq":y+"-"+ctrack.args.newyear,"budget_day_start_lt":(parseInt(y)+1)+"-"+ctrack.args.newyear,
//				"country_code":(args.country || ctrack.args.country_select),
//				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
//				"title_like":(args.search || ctrack.args.search),
			};
		fetch.ajax_dat_fix(dat,args);
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		fetch.ajax(dat,function(data){
			
//			console.log("fetch budget donors "+year);			
//			console.log(data);
			
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.funder=v.funder_ref;
				d["b"+(y-year)]=commafy(""+Math.floor(ctrack.convert_num("sum_of_percent_of_budget",v)));
				fadd(d);
			}
//			console.log(ctrack.donors_data);
			
			display();
		});
	});
}
