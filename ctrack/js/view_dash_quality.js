// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_dash_quality=exports;
exports.name="view_dash_quality";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")
var iati_codes=require("../../dstore/json/iati_codes.json")

var commafy=function(s) { return (""+s).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
		return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// the chunk names this view will fill with new data
view_dash_quality.chunks=[
	"dash_quality_pub",
	"dash_quality_country_total_invalid",
	"dash_quality_act_count",
	"dash_quality_budget_count",
	"dash_quality_trans_count",
	"dash_quality_country_count",
	"dash_quality_dataset_count",
	"dash_list_country_datas",
	"dash_list_slug_datas",
];

view_dash_quality.view=function()
{
	view_dash_quality.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});

	ctrack.setcrumb(1);
	ctrack.change_hash();
	view_dash_quality.ajax({});
}

view_dash_quality.calc=function()
{
//	var s=(new Date).toUTCString();	
//	ctrack.chunk("dash_updated_date",s);
}

//
// Perform ajax call to get numof data
//
view_dash_quality.ajax=function(args)
{
	args=args || {};
	args.pub=ctrack.hash.pub;
	args.country=ctrack.hash.country;
	
	ctrack.chunk("dash_quality_pub",args.pub || "N/A");
	ctrack.chunk("dash_quality_pub_name",iati_codes.publisher_names[args.pub] || "N/A");	
	
	view_dash_quality.ajax1(args); // chain
}

view_dash_quality.ajax1=function(args)
{
	args=args || {};
	var dat={
			"country_code":(args.country),
			"reporting_ref":(args.pub),
			"select":"stats",
			"from":"act",
			"limit":-1
		};
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log("view_dash_quality.ajax1");
//		console.log(data);
			
		if(data.rows.length==1)
		{
			var v=data.rows[0];
			var count=v["COUNT(DISTINCT aid)"];
			ctrack.chunk("dash_quality_act_count_num",Math.floor(count));
			ctrack.chunk("dash_quality_act_count",commafy(Math.floor(count)));
		}
		
		view_dash_quality.calc();
		ctrack.display(); // every fetch.ajax must call display once

		view_dash_quality.ajax2(args);
	});
}

view_dash_quality.ajax2=function(args)
{
	args=args || {};
	var dat={
			"country_code":(args.country),
			"reporting_ref":(args.pub),
			"select":"count",
			"from":"budget,act",
			"limit":-1
		};
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log("view_dash_quality.ajax2");
//		console.log(data);
			
		if(data.rows.length==1)
		{
			var v=data.rows[0];
			var count=v.count;
			ctrack.chunk("dash_quality_budget_count",commafy(Math.floor(count)));
		}
		
		view_dash_quality.calc();
		ctrack.display(); // every fetch.ajax must call display once

		view_dash_quality.ajax3(args);
	});
}

view_dash_quality.ajax3=function(args)
{
	args=args || {};
	var dat={
			"country_code":(args.country),
			"reporting_ref":(args.pub),
			"select":"count",
			"from":"trans,act",
			"limit":-1
		};
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log("view_dash_quality.ajax3");
//		console.log(data);
			
		if(data.rows.length==1)
		{
			var v=data.rows[0];
			var count=v.count;
			ctrack.chunk("dash_quality_trans_count",commafy(Math.floor(count)));
		}
		
		view_dash_quality.calc();
		ctrack.display(); // every fetch.ajax must call display once

		view_dash_quality.ajax4(args);
	});
}

view_dash_quality.ajax4=function(args)
{
	args=args || {};
	var dat={
			"country_code":(args.country),
			"reporting_ref":(args.pub),
			"select":"count,country_code",
			"from":"country,act",
			"groupby":"country_code",
			"orderby":"1-",
			"limit":-1
		};
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log("view_dash_quality.ajax4");
//		console.log(data);

// push bad data to the top
		data.rows.sort(function(a,b){
			var av=(iati_codes.country[a.country_code]) && 1 || 0;
			var bv=(iati_codes.country[b.country_code]) && 1 || 0;
			if(av!=bv) { return av-bv; }
			if(a.count!=b.count) { return b.count-a.count; }
			if(a.country_code<b.country_code){ return -1; }
			if(a.country_code>b.country_code){ return  1; }
			return 0;
		});

		var s=[];
		var total=0;
		var bad=0;
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			d.num=i+1;
			d.count=v.count;
			d.country_code=v.country_code;
			d.country_name=iati_codes.country[d.country_code] || "N/A";
			d.country_valid=iati_codes.country[d.country_code] && "valid" || "invalid";

			if(!iati_codes.country[d.country_code]) { bad+=d.count; }
			total+=d.count;
			s.push( plate.replace(args.plate || "{dash_list_country_data}",d) );
		}
		ctrack.chunk(args.chunk || "dash_list_country_datas",s.join(""));


		ctrack.chunk("dash_quality_country_total",commafy(total));
		ctrack.chunk("dash_quality_country_total_invalid",commafy(bad));
		ctrack.chunk("dash_quality_country_total_invalid_pct",Math.ceil(100*bad/total));
		ctrack.chunk("dash_quality_country_count",commafy(data.rows.length));
		
		view_dash_quality.calc();
		ctrack.display(); // every fetch.ajax must call display once

		view_dash_quality.ajax5(args);
	});
}

view_dash_quality.ajax5=function(args)
{
	args=args || {};
	var dat={
			"country_code":(args.country),
			"reporting_ref":(args.pub),
			"select":"count,slug",
			"from":"act",
			"groupby":"slug",
			"orderby":"1-",
			"limit":-1
		};
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log("view_dash_quality.ajax5");
//		console.log(data);
			
		var s=[];
		var total=0;
		for(var i=0;i<data.rows.length;i++)
		{
			var v=data.rows[i];
			var d={};
			d.num=i+1;
			d.count=v.count;
			d.slug=v.slug;

			total+=d.count;
			s.push( plate.replace(args.plate || "{dash_list_slug_data}",d) );
		}
		ctrack.chunk(args.chunk || "dash_list_slug_datas",s.join(""));

		ctrack.chunk( "dash_quality_dataset_count",data.rows.length);
		
		view_dash_quality.calc();
		ctrack.display(); // every fetch.ajax must call display once

		view_dash_quality.ajax6(args);
	});
}


view_dash_quality.ajax6=function(args)
{
	var today=fetch.get_today();
	args=args || {};
	var dat={
			"country_code":(args.country),
			"reporting_ref":(args.pub),
			"select":"count",
			"from":"act",
			"limit":-1,
			"day_end_lt":today,
			"day_length_not_null":1,
		};
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log(data);
		
		ctrack.chunk("dash_list_actdate_act_ended",data.rows[0].count);
		
		view_dash_quality.calc();
		ctrack.display(); // every fetch.ajax must call display once
		view_dash_quality.ajax7(args);
	});
}

view_dash_quality.ajax7=function(args)
{
	var today=fetch.get_today();
	args=args || {};
	var dat={
			"country_code":(args.country),
			"reporting_ref":(args.pub),
			"select":"count",
			"from":"act",
			"limit":-1,
			"day_start_gt":today,
			"day_length_not_null":1,
		};
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log(data);
		
		ctrack.chunk("dash_list_actdate_act_planned",data.rows[0].count);
		
		view_dash_quality.calc();
		ctrack.display(); // every fetch.ajax must call display once
		view_dash_quality.ajax8(args);
	});
}


view_dash_quality.ajax8=function(args)
{
	var today=fetch.get_today();
	args=args || {};
	var dat={
			"country_code":(args.country),
			"reporting_ref":(args.pub),
			"select":"count",
			"from":"act",
			"limit":-1,
			"day_end_gteq":today,
			"day_start_lteq":today,
			"day_length_not_null":1,
		};
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log(data);
		
		ctrack.chunk("dash_list_actdate_act_active",data.rows[0].count);
		
		var n=ctrack.chunk("dash_list_actdate_act_ended")+ctrack.chunk("dash_list_actdate_act_planned")+ctrack.chunk("dash_list_actdate_act_active");

		ctrack.chunk("dash_list_actdate_act_missing",ctrack.chunk("dash_quality_act_count_num")-n);

		
		view_dash_quality.calc();
		ctrack.display(); // every fetch.ajax must call display once
		view_dash_quality.ajax9(args);
	});
}


view_dash_quality.ajax9=function(args)
{
	var today=fetch.get_today();
	args=args || {};
	var dat={
			"country_code":(args.country),
			"reporting_ref":(args.pub),
			"select":"count",
			"from":"act",
			"limit":-1,
			"day_start_not_null":1,
			"day_end_null":1,
		};
	fetch.ajax(dat,args.callback || function(data)
	{
//		console.log(data);
		
		ctrack.chunk("dash_list_actdate_act_missing_end",data.rows[0].count);
		
		view_dash_quality.calc();
		ctrack.display(); // every fetch.ajax must call display once
//		view_dash_quality.ajax9(args);
	});
}


