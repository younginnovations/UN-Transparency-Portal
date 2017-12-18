// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_sector_budgets=exports;
exports.name="view_sector_budgets";

var ctrack=require("./ctrack.js")
var views=require("./views.js")

var iati_codes=require("../../dstore/json/iati_codes.json")

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_sector_budgets.chunks=[
	"sector_budgets_datas",
];

//
// display the view
//
view_sector_budgets.view=function()
{
	ctrack.chunk("alerts","");
		
	view_sector_budgets.chunks.forEach(function(n){ctrack.chunk(n,"{spinner_in_table_row}");});
	ctrack.setcrumb(2);
	ctrack.change_hash();
	
	var year=ctrack.hash.year || parseInt(ctrack.hash.year) || ctrack.year;
	ctrack.year_chunks(year);

	var sector=ctrack.hash.sector_group || "111";
	
	var args={};
	args.zerodata="{alert_no_data3}";
	
	args.plate="{sector_budgets_data}";
	args.chunk="sector_budgets_datas";
	
	args.q={
		"year":year,
//		"sector_group":sector,
//		"from":"act,country,sector,budget",
	};
	args.q["budget_day_start_gteq"]=year+"-"+ctrack.args.newyear;
	args.q["budget_day_start_lt"]=(parseInt(year)+1)+"-"+ctrack.args.newyear;
				
	args.callback=function(data){

		ctrack.chunk("sector",iati_codes.sector_category[sector] );
		ctrack.chunk("year",year);
	};
	
	views.list_budgets.ajax(args);
};
