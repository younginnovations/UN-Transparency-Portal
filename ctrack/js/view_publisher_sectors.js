// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var view_publisher_sectors = exports;
exports.name = "view_publisher_sectors";

var csvw = require("./csvw.js")

var ctrack = require("./ctrack.js")
var plate = require("./plate.js")
var iati = require("./iati.js")
var fetch = require("./fetch.js")
var tables = require("./tables.js")

var refry = require("../../dstore/js/refry.js")
//var iati_codes=require("../../dstore/json/iati_codes.json");
var iati_codes=require("../../dstore/json/iati_codes.json")
var un_agencies_data = require("../../dstore/json/un_agencies_data.json");

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
if((paramCountry !== null || refFilter !== null || sectFilter !== null) && current_view === 'publisher_sectors')
{
    var redirect = '#view=publisher_sectors';
    window.location.href = redirect;
}

var commafy = function (s) {
    return s.replace(/(^|[^\w.])(\d{4,})/g, function ($0, $1, $2) {
        return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,");
    })
};

// the chunk names this view will fill with new data
view_publisher_sectors.chunks = [
    "table_publisher_sectors_rows",
    "table_publisher_sectors",
    "sectors_count",
];

//
// display the view
//
view_publisher_sectors.view = function (args) {
    view_publisher_sectors.chunks.forEach(function (n) {
        ctrack.chunk(n, "{spinner}");
    });
    ctrack.setcrumb(2);
    ctrack.change_hash();
    view_publisher_sectors.ajax(args);
};

view_publisher_sectors.show = function () {
    var year = parseInt(ctrack.hash.year) || ctrack.year;
    if (year != view_publisher_sectors.year) // new year update?
    {
        view_publisher_sectors.ajax()
    }
    var url_link = window.location.href;
    url_link = url_link.replace("#", "&");
    var url = new URL(url_link);
    var paramCountry = url.searchParams.get("countryfilter");
    var refFilter = url.searchParams.get("refFilter");
    var sectFilter = url.searchParams.get("sectFilter");
    var yearFilter = url.searchParams.get("year");

    var newArgs = [];
    if((paramCountry !== null || refFilter !== null || sectFilter !== null || yearFilter !== null) && (sessionStorage.country_code !== paramCountry || sessionStorage.refFilter !== refFilter || sessionStorage.sectFilter !== sectFilter || sessionStorage.yearFilter !== yearFilter))
    {
        HoldOn.open({
            theme:"sk-bounce",
            message:""
        });
        sessionStorage.country_code = paramCountry;
        sessionStorage.refFilter = refFilter;
        sessionStorage.sectFilter = sectFilter;
        sessionStorage.yearFilter = yearFilter;
        if(paramCountry !== null)
        {
            paramCountry = paramCountry.split(',').join('|');
            newArgs.country_code = paramCountry;
        }
        if(refFilter !== null)
        {
            refFilter = refFilter.split(',').join('|');
            newArgs.reporting_ref = refFilter;
        }
        if(sectFilter !== null)
        {
            var sectFilter2 = sectFilter.split(',');
            sectFilter = sectFilter.split(',').join('|');
            newArgs.sector_code = sectFilter;
            if(sectFilter !== "")
            {
                newArgs.sector_code_array = sectFilter2;
            }
        }
        if(yearFilter !== null)
        {
            yearFilter = parseInt(yearFilter);
            newArgs.year = yearFilter;
        }
        view_publisher_sectors.ajax(newArgs);
    }
    ctrack.div.master.html(plate.replace("{view_publisher_sectors}"));
};

//
// Perform ajax call to get data
//
view_publisher_sectors.ajax = function (args) {
    args = args || {};

    var year = args.year || parseInt(ctrack.hash.year) || ctrack.year;
    ctrack.year_chunks(year);
    view_publisher_sectors.year = year;

    ctrack.publisher_sectors_data = {};

    ctrack.sortby = "order"; // reset sortby
    var display = function (sortby) {
        var p = function (s) {
            s = s || "";
            s = s.replace(/[,]/g, "");
            return parseInt(s);
        }
        var s = [];
        var a = [];
        for (var n in ctrack.publisher_sectors_data) {
            a.push(ctrack.publisher_sectors_data[n]);
        }
        if (!sortby) {
            sortby = tables.sortby();
        }
        a.sort(sortby);
        a.forEach(function (v) {
            if (!v.t1) {
                v.t1 = "0";
            }
            if (!v.t2) {
                v.t2 = "0";
            }
            if (!v.t3) {
                v.t3 = "0";
            }
            if (!v.b1) {
                v.b1 = "0";
            }
            if (!v.b2) {
                v.b2 = "0";
            }

            s.push(plate.replace(args.plate || "{table_publisher_sectors_row}", v));
        });
        ctrack.chunk(args.chunk || "table_publisher_sectors_rows", s.join(""));

        ctrack.chunk("sectors_count", a.length);
        ctrack.chunk_clear("table_publisher_sectors");

        var p = function (s) {
            s = s || "";
            s = s.replace(/[,]/g, "");
            return parseInt(s);
        }
        var cc = [];
        cc[0] = ["sector", "t" + (year - 1), "t" + (year), "t" + (year + 1), "b" + (year + 1), "b" + (year + 2)];
        a.forEach(function (v) {
            cc[cc.length] = [v.sector_code, p(v.t1), p(v.t2), p(v.t3), p(v.b1), p(v.b2)];
        });
        ctrack.chunk("csv_data", "data:text/csv;charset=UTF-8," + encodeURIComponent(csvw.arrayToCSV(cc)));

        ctrack.display();

    };
    view_publisher_sectors.display = display;

    var fadd = function (d) {
        var it = ctrack.publisher_sectors_data[d.sector_code];
        if (!it) {
            it = {};
            ctrack.publisher_sectors_data[d.sector_code] = it;
        }

        for (var n in d) {
            if (d[n]) {
                it[n] = d[n];
            }
        }
    }


    var years = [year - 1, year, year + 1];
    console.log(args);
    years.forEach(function (y) {
        var dat = {
            "from": "act,trans,sector",
            "limit": args.limit || -1,
            "select": "sector_code," + ctrack.convert_str("sum_of_percent_of_trans"),
            "groupby": "sector_code",
            "trans_code": "D|E",
            "trans_day_gteq": y + "-" + ctrack.args.newyear,
            "trans_day_lt": (parseInt(y) + 1) + "-" + ctrack.args.newyear,
            "reporting_ref":args.reporting_ref,
            "sector_code":args.sector_code,
            "country_code":args.country_code
//				"country_code":(args.country || ctrack.args.country_select),
//				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
//				"title_like":(args.search || ctrack.args.search),
        };
        fetch.ajax_dat_fix(dat, args);
        if (!dat.reporting_ref) {
            dat.flags = 0;
        }
        fetch.ajax(dat, function (data) {
            for (var i = 0; i < data.rows.length; i++) {
                var v = data.rows[i];
                var d = {};
                var num = ctrack.convert_num("sum_of_percent_of_trans", v);

                if (un_agencies_data.sectors[v.sector_code] !== undefined) {
                    d.sector_code = v.sector_code;
                    d.sector_name = un_agencies_data.sectors[v.sector_code];
                    d["t" + (2 + y - year)] = commafy("" + Math.floor(num));
                    if (y == year) {
                        d.order = num; // default, use ctrack.year transaction value for sort
                    }
                    fadd(d);
                }

            }

            display();
            setTimeout(function() {
                if(typeof args.sector_code_array !== "undefined")
                {
                    ctrack.filter_sector_test(args.sector_code_array);
                    HoldOn.close();
                }
                else {
                    HoldOn.close();
                }
            }, 2000);
        });
    });

    var years = [year + 1, year + 2];
    years.forEach(function (y) {
        var dat = {
            "from": "act,budget,sector",
            "limit": args.limit || -1,
            "select": "sector_code," + ctrack.convert_str("sum_of_percent_of_budget"),
            "budget_priority": 1, // has passed some validation checks serverside
            "groupby": "sector_code",
            "budget_day_start_gteq": y + "-" + ctrack.args.newyear,
            "budget_day_start_lt": (parseInt(y) + 1) + "-" + ctrack.args.newyear,
            "reporting_ref":args.reporting_ref,
            "sector_code":args.sector_code,
            "country_code":args.country_code
//				"country_code":(args.country || ctrack.args.country_select),
//				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
//				"title_like":(args.search || ctrack.args.search),
        };
        fetch.ajax_dat_fix(dat, args);
        if (!dat.reporting_ref) {
            dat.flags = 0;
        }
        fetch.ajax(dat, function (data) {
            for (var i = 0; i < data.rows.length; i++) {
                var v = data.rows[i];
                var d = {};
                var num = ctrack.convert_num("sum_of_percent_of_budget", v);

                //d.sector_name=iati_codes.sector[v.sector_code] || iati_codes.sector_category[v.sector_code] || v.sector_code || "N/A";
                if (un_agencies_data.sectors[v.sector_code] !== undefined) {
                    d.sector_code = v.sector_code;
                    d.sector_name = un_agencies_data.sectors[v.sector_code];
                    d["b" + (y - year)] = commafy("" + Math.floor(num));
                    fadd(d);
                }
            }

            display();
        });
    });

}
