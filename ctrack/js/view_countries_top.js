// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_publisher_countries_top = exports;
exports.name = "view_publisher_countries_top";

var ctrack = require("./ctrack.js");
var plate = require("./plate.js");
var iati = require("./iati.js");
var fetch = require("./fetch.js");

var refry = require("../../dstore/js/refry.js");
var iati_codes = require("../../dstore/json/iati_codes.json");
var un_agencies_codes = require("../../dstore/json/un_agencies_data.json");
var crs_year = require("../../dstore/json/crs_2013.json");

var commafy = function (s) {
    return ("" + s).replace(/(^|[^\w.])(\d{4,})/g, function ($0, $1, $2) {
        return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,");
    })
};

// the chunk names this view will fill with new data
view_publisher_countries_top.chunks = [
    "data_chart_publisher_countries",
    "countries_count",
];


//
// Perform fake ajax call to get data
//
view_publisher_countries_top.ajax = function (args) {
    args = args || {};
    var limit = args.limit || 5;

    var list = [];

    var year = args.year || parseInt(ctrack.hash.year) || ctrack.year;
    ctrack.year_chunks(year);

    var dat = {
        "from": "act,trans,country",
        "limit": -1,
        "select": "country_code," + ctrack.convert_str("sum_of_percent_of_trans"),
        "groupby": "country_code",
        "trans_code": "D|E",
        "trans_day_gteq": year + "-" + ctrack.args.newyear,
        "trans_day_lt": (parseInt(year) + 1) + "-" + ctrack.args.newyear,
    };
    fetch.ajax_dat_fix(dat, args);
    if (!dat.reporting_ref) {
        dat.flags = 0;
    }
    fetch.ajax(dat, function (data) {
        var gTotal = 0;
        for (var i = 0; i < data.rows.length; i++) {
            var v = data.rows[i];
            var d = {};
            if (v.country_code in un_agencies_codes['countries']) {
                d.country_code = v.country_code || "N/A";
                d.country_name = iati_codes.country[v.country_code] || v.country_code || "N/A";
                d.usd = Math.floor(ctrack.convert_num("sum_of_percent_of_trans", v));
                list.push(d);
            } else {
                gTotal = gTotal + Math.floor(ctrack.convert_num("sum_of_percent_of_trans", v));
            }
        }
        if (gTotal > 0) {
            var gR = {};
            gR.country_code = 'global-regional';
            gR.country_name = 'Regional and Global';
            gR.usd = gTotal;
            list.push(gR);
        }

        list.sort(function (a, b) {
            return ( (b.usd || 0) - (a.usd || 0) );
        });

        var total = 0;
        list.forEach(function (it) {
            total += it.usd;
        });
        var shown = 0;
        var top = list[0] && list[0].usd || 0;
        var dd = [];
        list.forEach(function (v) {
            var d = {};
            d.num = v.usd;
            var initialPct = 100 * d.num / total;
            if (initialPct < 1) {
                d.pct = "<1";
            }
            else {
                d.pct = Math.round(initialPct);
            }
            if (d.num < 0) {
                d.num = -d.num;
            }
            d.str_lab = v.country_name;
            dd.push(d);
        });

        ctrack.chunk("data_chart_publisher_countries", dd);
        ctrack.chunk("countries_count", list.length);

        ctrack.display();
    });

};
