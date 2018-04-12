// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var fetch = exports;

var ctrack = require("./ctrack.js")
var plate = require("./plate.js")
var iati = require("./iati.js")

var iati_codes = require("../../dstore/json/iati_codes.json")
var crs_year = require("../../dstore/json/crs_2013.json")


var refry = require("../../dstore/js/refry.js")
//var iati_xml=require("../../dstore/js/iati_xml.js")

//var fetch=require("./fetch.js")


fetch.get_today = function () {
    var now = new Date();
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var today = now.getFullYear() + "-" + (month) + "-" + (day);
    return today;
}

fetch.get_nday = function (n) {
    var now = new Date(n * 1000 * 60 * 60 * 24);
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    var nday = now.getFullYear() + "-" + (month) + "-" + (day);
    return nday;
}

fetch.ajax = function (dat, callback) {
// we may queue a bunch of requests, this makes us wait for the last one before updating the view
    ctrack.display_wait += 1;
    // console.log(JSON.stringify(ctrack.args.q));
    // console.log('==============budget================');
    $.ajax({
        dataType: "json",
        url: ctrack.args.q + "?callback=?",
        data: dat,
        success: callback
    });
}

//modify dat so it reflects the args or base settings (eg limit to a publisher)
fetch.ajax_dat_fix = function (dat, args) {
// possibly do not need...
    

    dat["country_code"] = dat["country_code"] || args.country;
    dat["reporting_ref"] = dat["reporting_ref"] || args.publisher;
    dat["sector_ref"] = dat["sector_ref"] || args.sector;
    
// check for globals
    dat["country_code"] = dat["country_code"] || ctrack.args.country_select;
    dat["sector_ref"] = dat["sector_ref"] || ctrack.args.sector;
    dat["reporting_ref"] = dat["reporting_ref"] || ctrack.args.publisher_select;
    dat["title_like"] = dat["title_like"] || ctrack.args.search;
    dat["sector_code"] = dat["sector_code"] || ctrack.args.sector_code_select || ctrack.args.sector;
    dat["sector_group"] = dat["sector_group"] || ctrack.args.sector_group_select;
    dat["funder_ref"] = dat["funder_ref"] || ctrack.args.funder_ref_select;
    // dat["selected_year"] = dat["selected_year"] || ctrack.args.selected_year;
   

    if (dat["country_code"] === 'global-regional') {
        dat["country_code"] = "89|679|889|ww|-1|global";
    }

    if (!dat["day_start_lteq"]) {
        if (ctrack.args.year_max) {
            dat["day_start_lteq"] = (ctrack.args.year_max + 1) + "-01-01"
        }
    }

    if (!dat["day_end_gt"]) {
        if (ctrack.args.year_min) {
            dat["day_end_gt"] = (ctrack.args.year_min) + "-01-01"
        }
    }


//	dat["day_start_lt"]		=	dat["day_start_lt"]		||	(args.date_max 		|| ctrack.args.date_max);
//	dat["day_end_gteq"]		=	dat["day_end_gteq"]		||	(args.date_min 		|| ctrack.args.date_min);

// allow hash overide what we have
    for (var n in ctrack.hash) {
        dat[n] = ctrack.hash[n];
    }

// then allow passed in args to overide that
    for (var n in args.q) {
        dat[n] = args.q[n];
    }

// join any extra tables we might now need due to extra restrictions
    if (dat.sector_code || dat.sector_group) {
        if (dat.from.indexOf("sector") == -1) {
            dat.from += ",sector";
        }
    }
    if (dat.country_code) {
        if (dat.from.indexOf("country") == -1) {
            dat.from += ",country";
        }
    }
    if (dat.location_latitude || dat.location_longitude) {
        if (dat.from.indexOf("location") == -1) {
            dat.from += ",location";
        }
    }
//console.log('==================dat==================',JSON.stringify(dat))
    return dat;
}
