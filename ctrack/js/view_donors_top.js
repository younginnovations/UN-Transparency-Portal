// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_donors_top = exports;
exports.name = "view_donors_top";

var ctrack = require("./ctrack.js")
var plate = require("./plate.js")
var iati = require("./iati.js")
var fetch = require("./fetch.js")

var refry = require("../../dstore/js/refry.js")
var iati_codes = require("../../dstore/json/iati_codes.json")
var crs_year = require("../../dstore/json/crs_2013.json")

var commafy = function (s) {
    return ("" + s).replace(/(^|[^\w.])(\d{4,})/g, function ($0, $1, $2) {
        return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,");
    })
};

// the chunk names this view will fill with new data
view_donors_top.chunks = [];


view_donors_top.ajax = function (args) {
    args = args || {};
    var limit = args.limit || 5;

    var year = args.year || parseInt(ctrack.hash.year) || ctrack.year;
    ctrack.year_chunks(year);

    var dat = {
        "from": "act,trans,country",
        "limit": -1,
        "select": "funder_ref," + ctrack.convert_str("sum_of_percent_of_trans"),
        "funder_ref_not_null": "",
        "groupby": "funder_ref",
        "trans_code": "D|E",
        "trans_day_gteq": year + "-" + ctrack.args.newyear, "trans_day_lt": (parseInt(year) + 1) + "-" + ctrack.args.newyear,
    };
    fetch.ajax_dat_fix(dat, args);
    if (!dat.reporting_ref) {
        dat.flags = 0;
    }
    fetch.ajax(dat, function (data) {
        var list = [];

        for (var i = 0; i < data.rows.length; i++) {
            var v = data.rows[i];
            var d = {};
            d.funder = v.funder_ref;
            d.usd = Math.floor(ctrack.convert_num("sum_of_percent_of_trans", v));
            list.push(d);
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
        var secondTotal = 0;
        list.forEach(function (v) {
            var d = {};
            d.num = v.usd;
            d.prevPct = (secondTotal * 100) / total;
            secondTotal += v.usd;
            var initialPct = 100 * d.num / total;
            if (initialPct < 1) {
                d.pct = "<1";
            }
            else {
                d.pct = initialPct.toFixed(1);
            }
            if (d.num < 0) {
                d.num = -d.num;
            }
            var regExp = /\(([^)]+)\)/;

            try {
                d.str_lab = iati_codes.funder_names[v.funder] || (regExp.exec(iati_codes.un_publisher_names[v.funder]))[1];
            } catch (err) {
                // console.log(v.funder, err);
            }
            dd.push(d);
        });

        ctrack.chunk("data_chart_donors", dd);
        ctrack.display();

    });
}
