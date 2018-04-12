// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_publishers=exports;
exports.name="view_publishers";

var csvw=require("./csvw.js")

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var tables=require("./tables.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var un_agencies_data=require("../../dstore/json/un_agencies_data.json")

var url_link = window.location.href;
url_link = url_link.replace("#", "&");
var url = new URL(url_link);
var paramCountry = url.searchParams.get("countryfilter");
var refFilter = url.searchParams.get("refFilter");
var sectFilter = url.searchParams.get("sectFilter");
var current_view = url.searchParams.get("view");
sessionStorage.country_code = null;
sessionStorage.refFilter = null;
sessionStorage.sectFilter = null;
if((paramCountry !== null || refFilter !== null || sectFilter !== null) && current_view === 'publishers')
{
    var redirect = '#view=publishers';
    window.location.href = redirect;
}

var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_publishers.chunks=[
	"table_publishers_count",
	"table_publishers_rows",
	"table_publishers",
];


// display the view
//
view_publishers.view=function(args)
{
	view_publishers.chunks.forEach(function(n){
		ctrack.chunk(n,"{spinner}");
	}
	);
	ctrack.setcrumb(1);
	ctrack.change_hash();

	view_publishers.ajax(args);
};

view_publishers.show = function(args){
    var url_link = window.location.href;
    url_link = url_link.replace("#", "&");
    var url = new URL(url_link);
    var paramCountry = url.searchParams.get("countryfilter");
    var refFilter = url.searchParams.get("refFilter");
    var sectFilter = url.searchParams.get("sectFilter");
    var newArgs = [];
    if((paramCountry !== null || refFilter !== null || sectFilter !== null) && (sessionStorage.country_code !== paramCountry || sessionStorage.refFilter !== refFilter || sessionStorage.sectFilter !== sectFilter))
    //if(sessionStorage.country_code !== paramCountry || sessionStorage.refFilter !== refFilter || sessionStorage.sectFilter !== sectFilter)
    {
        HoldOn.open({
            theme:"sk-bounce",
            message:""
        });
        sessionStorage.country_code = paramCountry;
        sessionStorage.refFilter = refFilter;
        sessionStorage.sectFilter = sectFilter;
        if(paramCountry !== null)
        {
            paramCountry = paramCountry.split(',').join('|');
            newArgs.country_code = paramCountry;
        }
        if(refFilter !== null)
        {
            var refFilter2 = refFilter.split(',');
            refFilter = refFilter.split(',').join('|');
            newArgs.reporting_ref = refFilter;
            if(refFilter !== "")
            {
                newArgs.reporting_ref_array = refFilter2;
            }
        }
        if(sectFilter !== null)
        {
            sectFilter = sectFilter.split(',').join('|');
            newArgs.sector_code = sectFilter;
        }
        view_publishers.ajax(newArgs);
    }
    ctrack.div.master.html(plate.replace("{view_publishers}"));
};

//
// Perform ajax call to get data
//
view_publishers.ajax=function(args)
{
	console.log("on change");
	console.log(args);
	args=args || {};
	var year=args.year || parseInt(ctrack.hash.year) || ctrack.year;
	ctrack.year_chunks(year);

	ctrack.publishers_data={};

	ctrack.sortby="order"; // reset sortby
	var display=function(sortby)
	{
		var s=[];
		var a=[];
		for(var n in ctrack.publishers_data) { a.push( ctrack.publishers_data[n] ); }
		if(!sortby)
		{
			sortby=tables.sortby();
		}
		a.sort(sortby);
		a.forEach(function(v){
			if(!v.t1){v.t1="0";}
			if(!v.t2){v.t2="0";}
			if(!v.t3){v.t3="0";}
			if(!v.b1){v.b1="0";}
			if(!v.b2){v.b2="0";}

			v.publisher=iati_codes.publisher_names[v.reporting_ref] || iati_codes.country[v.reporting_ref] || v.reporting_ref;
			if(v.publisher)
			{
				s.push( plate.replace(args.plate || "{table_publishers_row}",v) );
			}
		});
		ctrack.chunk(args.chunk || "table_publishers_rows",s.join(""));
		ctrack.chunk("table_publishers_count",un_agencies_data.un_agencies_in_iati);

		ctrack.chunk_clear("table_publishers");

	var p=function(s)
	{
		s=s || "";
		s=s.replace(/[,]/g,"");
		return parseInt(s);
	}
		var cc=[];
		cc[0]=["publisher","t"+(year-1),"t"+(year),"t"+(year+1),"b"+(year+1),"b"+(year+2)];
		a.forEach(function(v){
			cc[cc.length]=[v.publisher,p(v.t1),p(v.t2),p(v.t3),p(v.b1),p(v.b2)];
		});
		ctrack.chunk("csv_data","data:text/csv;charset=UTF-8,"+encodeURIComponent(csvw.arrayToCSV(cc)));

		ctrack.display();

	};
	view_publishers.display=display;

	var fadd=function(d)
	{
		var it=ctrack.publishers_data[d.reporting_ref];
		if(!it) { it={}; ctrack.publishers_data[d.reporting_ref]=it; }

		for(var n in d)
		{
			if(d[n])
			{
				it[n]=d[n];
			}
		}
	}

	var years=[year-1,year,year+1];
	years.forEach(function(y)
	{
		var dat={

				"from":"act,trans,country",
				"limit":args.limit || -1,
				"select":"reporting_ref,"+ctrack.convert_str("sum_of_percent_of_trans"),
				"groupby":"reporting_ref",
				"trans_code":"D|E",
				"trans_day_gteq":y+"-"+ctrack.args.newyear,"trans_day_lt":(parseInt(y)+1)+"-"+ctrack.args.newyear,
				//"country_code":(args.country || ctrack.args.country_select),
				"reporting_ref":args.reporting_ref,
				"sector_code":args.sector_code,
				"country_code":args.country_code
				//"reporting_ref":(args.publisher || ctrack.args.publisher_select),
//				"title_like":(args.search || ctrack.args.search),
			};
		console.log(args);
		fetch.ajax_dat_fix(dat,args);
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		fetch.ajax(dat,function(data){
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				var num=ctrack.convert_num("sum_of_percent_of_trans",v);

				d.reporting_ref=v.reporting_ref;
				d["t"+(2+y-year)]=commafy(""+Math.floor(num));
				if(y==year)
				{
					if( num > (d.order||0) ) { d.order=num; } // use ctrack.year transaction value for sort if bigger
				}
				fadd(d);
			}

			for(var key in iati_codes['iati_un_publishers']){
				if(typeof ctrack.publishers_data[key] == 'undefined'){

					ctrack.publishers_data[key]=[];
					ctrack.publishers_data[key]['b1']=0;
					ctrack.publishers_data[key]['b2']=0;
					ctrack.publishers_data[key]['order']=0;
					ctrack.publishers_data[key]['publisher']=iati_codes['iati_un_publishers'][key];
					ctrack.publishers_data[key]['reporting_ref']=key;
					ctrack.publishers_data[key]['t1']=0;
					ctrack.publishers_data[key]['t2']=0;
					ctrack.publishers_data[key]['t3']=0;
				}
			}

			display();
            setTimeout(function() {
                if(typeof args.reporting_ref_array !== "undefined")
                {
                    ctrack.filter_agency_test(args.reporting_ref_array);
                    HoldOn.close();
                }
                else{
                    HoldOn.close();
                }
            }, 2000);
		});
	});

	var years=[year+1,year+2];
	years.forEach(function(y)
	{
		var dat={
				"from":"act,budget,country",
				"limit":args.limit || -1,
				"select":"reporting_ref,"+ctrack.convert_str("sum_of_percent_of_budget"),
				"budget_priority":1, // has passed some validation checks serverside
				"groupby":"reporting_ref",
				"budget_day_start_gteq":y+"-"+ctrack.args.newyear,"budget_day_start_lt":(parseInt(y)+1)+"-"+ctrack.args.newyear,
            	"reporting_ref":args.reporting_ref,
            	"sector_code":args.sector_code,
            	"country_code":args.country_code
//				"country_code":(args.country || ctrack.args.country_select),
//				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
//				"title_like":(args.search || ctrack.args.search),
			};
		fetch.ajax_dat_fix(dat,args);
		if(!dat.reporting_ref){dat.flags=0;} // ignore double activities unless we are looking at a select publisher
		fetch.ajax(dat,function(data){

			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.reporting_ref=v.reporting_ref;
				d["b"+(y-year)]=commafy(""+Math.floor(ctrack.convert_num("sum_of_percent_of_budget",v)));
				fadd(d);
			}

			display();
		});
	});

}
