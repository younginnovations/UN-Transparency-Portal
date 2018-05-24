// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_list_budgets=exports;
exports.name="view_list_budgets";

var csvw=require("./csvw.js")

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var refry=require("../../dstore/js/refry.js")
var iati_codes=require("../../dstore/json/iati_codes.json")
var crs_year=require("../../dstore/json/crs.js").donors

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

function html_encode(value){ return $('<div/>').text(value).html(); }

// the chunk names this view will fill with new data
view_list_budgets.chunks=[
	"list_budgets_datas",
	"list_budgets_count",
];

//
// display the view
//
view_list_budgets.view=function()
{
	view_list_budgets.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(3);
	ctrack.change_hash();
	view_list_budgets.ajax({year:ctrack.hash.year,funder:ctrack.hash.funder});
};

//
// Perform ajax call to get data
//
view_list_budgets.ajax=function(args)
{
	args=args || {};
	args.zerodata=args.zerodata||"{alert_no_data1}";

    var url_link = window.location.href;
    url_link = url_link.replace("#", "&");
    var url = new URL(url_link);
    var refFilter = url.searchParams.get("refFilter");
    var sectFilter = url.searchParams.get("sectFilter");

	var dat={
			"from":"act,budget",
			"limit":args.limit || -1,
			"select":ctrack.convert_str("sum_of_percent_of_budget")+",aid,funder_ref,title,reporting,reporting_ref",
			"groupby":"aid",
			"orderby":"1-",
			"budget_priority":1, // has passed some validation checks serverside
			"reporting_ref":refFilter,
			"sector_code" : sectFilter,
		};
	
	var year=dat.year || ctrack.hash.year;
	if(year)
	{
		dat["budget_day_start_gteq"]=(parseInt(year)+0)+"-"+ctrack.args.newyear;
		dat["budget_day_start_lt"]=(parseInt(year)+1)+"-"+ctrack.args.newyear;
	}
	fetch.ajax_dat_fix(dat,args);

	if(args.output=="count") // just count please
	{
		dat.select="count";
		delete dat.limit;
		delete dat.orderby;
		delete dat.groupby;
	}
	fetch.ajax(dat,function(data){
		if(args.output=="count")
		{
			ctrack.chunk(args.chunk || "list_budgets_count",data.rows[0]["count"]);
			view_stats.calc();
		}
		else
		{
			var s=[];
			var total=0;
			ctrack.args.chunks["table_header_amount"]=undefined;
			if((data.rows.length==0)&&(args.zerodata))
			{
				s.push( plate.replace(args.zerodata,{}) );
				ctrack.args.chunks["table_header_amount"]="";
			}
			ctrack.chunk("list_budgets_count",data.rows.length);
			var a=[];
			for(var i=0;i<data.rows.length;i++)
			{
				var v=data.rows[i];
				var d={};
				d.num=i+1;
				d.funder_ref=v.funder_ref;
				d.aid=encodeURIComponent(v.aid);
				d.title=html_encode(v.title || v.aid || "N/A");
				d.reporting=iati_codes.publisher_names[v.reporting_ref] || v.reporting || v.reporting_ref;
				total+=ctrack.convert_num("sum_of_percent_of_budget",v);
				d.amount_num=Math.floor(ctrack.convert_num("sum_of_percent_of_budget",v));
				d.amount=commafy(""+d.amount_num);
				d.currency=ctrack.display_usd;
				a.push(d);
				s.push( plate.replace(args.plate || "{list_budgets_data}",d) );
			}
			ctrack.chunk(args.chunk || "list_budgets_datas",s.join(""));
			ctrack.chunk("total",commafy(""+Math.floor(total)));

			var p=function(s)
			{
				s=s || "";
				s=s.replace(/[,]/g,"");
				return parseInt(s);
			}
			var cc=[];
			cc[0]=["activity-identifier","title","reporting-org","amount","currency","link"];
			a.forEach(function(v){
				cc[cc.length]=[v.aid,v.title,v.reporting,v.amount_num,v.currency,"http://d-portal.org/ctrack.html#view=act&aid="+v.aid];
			});
			ctrack.chunk((args.chunk || "list_budgets_datas")+"_csv","data:text/csv;charset=UTF-8,"+encodeURIComponent(csvw.arrayToCSV(cc)));

		}
		if(args.callback){args.callback(data);}
		ctrack.display();
	});
}
