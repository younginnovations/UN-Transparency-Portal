// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_sector=exports;
exports.name="view_sector";

var ctrack=require("./ctrack.js")
var plate=require("./plate.js")
var iati=require("./iati.js")
var fetch=require("./fetch.js")

var views=require("./views.js")

// the chunk names this view will fill with new data
view_sector.chunks=[
	"table_active_datas",
	"table_ended_datas",
];

// called on view display to fix html in place
view_sector.fixup=function()
{
	views.map.fixup();
}
//
// Perform ajax call to get numof data
//
view_sector.view=function(args)
{

	views.sector.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	views.planned.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	views.active.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	views.ended.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	views.stats.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	// views.donors_top.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	// views.sectors_top.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");});
	views.sector_publisher_top.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");})
	views.sector_category.chunks.forEach(function(n){ctrack.chunk(n,"{spinner}");})

	ctrack.setcrumb(1);
	ctrack.change_hash();

/*
	views.planned.ajax({output:"count"});
	views.active.ajax({output:"count"});
	views.ended.ajax({output:"count"});
	views.missing.ajax({output:"count"});
*/
	views.stats.ajax();

	views.active.ajax({limit:5,plate:"{table_active_data}",chunk:"table_active_datas",notnull:true});
	views.ended.ajax({limit:5,plate:"{table_ended_data}",chunk:"table_ended_datas"});

	// views.donors_top.ajax();
	// views.sectors_top.ajax();
	views.sector_publisher_top.ajax();
	views.sector_category.ajax();

	ctrack.map.pins=undefined;
	views.map.ajax_heat({limit:200});
}
