// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var view_publisher_countries = exports;
exports.name = "view_publisher_countries";

var csvw = require("./csvw.js");

var ctrack = require("./ctrack.js");
var plate = require("./plate.js");
var iati = require("./iati.js");
var fetch = require("./fetch.js");
var tables = require("./tables.js");

var refry = require("../../dstore/js/refry.js");
var iati_codes = require("../../dstore/json/iati_codes.json");
var crs_year = require("../../dstore/json/crs_2013.json");
var un_agencies_data = require("../../dstore/json/un_agencies_data.json");
var view = "publisher_countries";
var showAllCountry = true;

var url_link = window.location.href;
url_link = url_link.replace("#", "&");
var url = new URL(url_link);
var paramCountry = url.searchParams.get("countryfilter");
var refFilter = url.searchParams.get("refFilter");
var sectFilter = url.searchParams.get("sectFilter");
var current_view = url.searchParams.get("view");
if((paramCountry !== null || refFilter !== null || sectFilter !== null) && current_view === 'publisher_countries')
{
    var redirect = '#view=publisher_countries';
    window.location.href = redirect;
}

var commafy = function(s) {
    return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
        return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,");
    });
};
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
// the chunk names this view will fill with new data
view_publisher_countries.chunks = [
    "table_publisher_countries_rows",
    "table_publisher_countries",
    "countries_count"
];
//
// display the view
//
view_publisher_countries.view = function(args) {
    view_publisher_countries.chunks.forEach(function(n) {
        ctrack.chunk(n, "{spinner}");
    });
    ctrack.setcrumb(2);
    ctrack.change_hash();
    view_publisher_countries.ajax(args);
};

view_publisher_countries.show = function() {
    var year = parseInt(ctrack.hash.year) || ctrack.year;
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
            var paramCountry2 = paramCountry.split(',');
            paramCountry = paramCountry.split(',').join('|');
            newArgs.country_code = paramCountry;
            if(paramCountry !== "")
            {
                newArgs.country_code_array = paramCountry2;
            }
        }
        if(refFilter !== null)
        {
            refFilter = refFilter.split(',').join('|');
            newArgs.reporting_ref = refFilter;
        }
        if(sectFilter !== null)
        {
            sectFilter = sectFilter.split(',').join('|');
            newArgs.sector_code = sectFilter;
        }
        if(yearFilter !== null)
        {
            yearFilter = parseInt(yearFilter);
            newArgs.year = yearFilter;
        }
        view_publisher_countries.ajax(newArgs);
    }

    if (year != view_publisher_countries.year) {
        // new year update?
        //view_publisher_countries.ajax(newArgs);
    }
    ctrack.div.master.html(plate.replace("{view_publisher_countries}"));
};

//
// Perform ajax call to get data
//
view_publisher_countries.ajax = function(args) {
    args = args || {};

    var gotcrs; // set this to the CRS publisher if we have a map
    var publisher = args.publisher || ctrack.args.publisher_select;
    if (publisher) {
        gotcrs = iati_codes.iati_funders[publisher];
        if (!gotcrs) {
            if (iati_codes.funder_names[publisher.toUpperCase()]) {
                gotcrs = publisher.toUpperCase(); // a country code
            }
        }
    }

    var year = args.year || parseInt(ctrack.hash.year) || ctrack.year;
    ctrack.year_chunks(year);
    view_publisher_countries.year = year;

    ctrack.publisher_countries_data = {};

    ctrack.sortby = "order"; // reset sortby
    var display = function(sortby) {
        var p = function(s) {
            s = s || "";
            s = s.replace(/[,]/g, "");
            return parseInt(s);
        };

        var pt = function(e) {
            e = e.replace(/\,/g, ""); // 1125, but a string, so convert it to number
            e = parseInt(e, 10);
            return e;
        };

        var s = [];
        var a = [];
        var b = {};
        b["b1"] = 0;
        b["b2"] = 0;
        b["country_code"] = "global-regional";
        b["country_name"] = "Regional and global";
        b["crs"] = 0;
        b["t1"] = 0;
        b["t2"] = 0;
        b["t3"] = 0;

        if (view !== "frame") {
            for (var nt in ctrack.publisher_countries_data) {
                if (!(nt in iati_codes["country"]) && nt !== "global-regional") {
                    b["b1"] = ctrack.publisher_countries_data[nt]["b1"]
                        ? b["b1"] + p(ctrack.publisher_countries_data[nt]["b1"])
                        : b["b1"];
                    b["b2"] = ctrack.publisher_countries_data[nt]["b2"]
                        ? b["b2"] + p(ctrack.publisher_countries_data[nt]["b2"])
                        : b["b2"];
                    b["crs"] = ctrack.publisher_countries_data[nt]["crs"]
                        ? b["crs"] + p(ctrack.publisher_countries_data[nt]["crs"])
                        : b["crs"];
                    b["t1"] = ctrack.publisher_countries_data[nt]["t1"]
                        ? b["t1"] + p(ctrack.publisher_countries_data[nt]["t1"])
                        : b["t1"];
                    b["t2"] = ctrack.publisher_countries_data[nt]["t2"]
                        ? b["t2"] + p(ctrack.publisher_countries_data[nt]["t2"])
                        : b["t2"];
                    b["t3"] = ctrack.publisher_countries_data[nt]["t3"]
                        ? b["t3"] + p(ctrack.publisher_countries_data[nt]["t3"])
                        : b["t3"];
                }
            }
            for (var n in un_agencies_data["countries"]) {
                if (n in ctrack.publisher_countries_data) {
                    a.push(ctrack.publisher_countries_data[n]);
                } else {
                    if (showAllCountry || (!showAllCountry && n === "global-regional")) {
                        ctrack.publisher_countries_data[n] = {};
                        ctrack.publisher_countries_data[n]["b1"] =
                            n === "global-regional" ? b["b1"] : 0;
                        ctrack.publisher_countries_data[n]["b2"] =
                            n === "global-regional" ? b["b2"] : 0;
                        ctrack.publisher_countries_data[n]["country_code"] = n;
                        ctrack.publisher_countries_data[n]["country_name"] =
                            n === "global-regional"
                                ? "Regional and global"
                                : un_agencies_data["countries"][n];
                        ctrack.publisher_countries_data[n]["crs"] =
                            n === "global-regional" ? b["crs"] : 0;
                        ctrack.publisher_countries_data[n]["t1"] =
                            n === "global-regional" ? b["t1"] : 0;
                        ctrack.publisher_countries_data[n]["t2"] =
                            n === "global-regional" ? b["t2"] : 0;
                        ctrack.publisher_countries_data[n]["t3"] =
                            n === "global-regional" ? b["t3"] : 0;
                        a.push(ctrack.publisher_countries_data[n]);
                    }
                }
            }


            for (var i = 0; i < a.length; i++) {
                if (a[i].country_code == "global-regional") {
                    a[i].b1 = numberWithCommas(b.b1);
                    a[i].b2 = numberWithCommas(b.b2);
                    a[i].t1 = numberWithCommas(b.t1);
                    a[i].t2 = numberWithCommas(b.t2);
                    a[i].t3 = numberWithCommas(b.t3);

                    if (
                        a[i].b1 == 0 &&
                        a[i].b2 == 0 &&
                        a[i].t1 == 0 &&
                        a[i].t2 == 0 &&
                        a[i].t3 == 0
                    ) {
                        a.splice(i, 1);
                    }
                }

                if (a.length > 0) {
                    if (
                        a[i].b1 == 0 &&
                        a[i].b2 == 0 &&
                        a[i].t1 == 0 &&
                        a[i].t2 == 0 &&
                        a[i].t3 == 0
                    ) {
                        a.splice(i, 1);
                    }
                }
            }
        } else {
            for (var n in ctrack.publisher_countries_data) {
                a.push(ctrack.publisher_countries_data[n]);
            }
        }


        if (!sortby) {
            sortby = tables.sortby();
        }
        a.sort(sortby);
        a.forEach(function(v) {
            if (!v.crs) {
                v.crs = "";
            }
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

            if (gotcrs) {
                s.push(
                    plate.replace(args.plate || "{table_publisher_countries_crs_row}", v)
                );
            } else {
                s.push(
                    plate.replace(args.plate || "{table_publisher_countries_row}", v)
                );
            }
        });
        if (gotcrs) {
            ctrack.chunk(
                args.chunk || "table_publisher_countries_crs_rows",
                s.join("")
            );
            ctrack.chunk(
                "table_publisher_countries",
                "{table_publisher_countries_crs}"
            ); // use CRS version
        } else {
            ctrack.chunk(args.chunk || "table_publisher_countries_rows", s.join(""));
            ctrack.chunk_clear("table_publisher_countries");
        }
        ctrack.chunk("countries_count", a.length); //Object.keys(un_agencies_data['countries']).length);

        var p = function(s) {
            s = s || "";
            s = s.replace(/[,]/g, "");
            return parseInt(s);
        };
        var cc = [];
        cc[0] = [
            "country",
            "t" + (year - 1),
            "t" + year,
            "t" + (year + 1),
            "b" + (year + 1),
            "b" + (year + 2)
        ];

        a.forEach(function(v) {
            cc[cc.length] = [
                v.country_name,
                p(v.t1),
                p(v.t2),
                p(v.t3),
                p(v.b1),
                p(v.b2)
            ];
        });
        ctrack.chunk(
            "csv_data",
            "data:text/csv;charset=UTF-8," + encodeURIComponent(csvw.arrayToCSV(cc))
        );

        ctrack.display();
        console.log(args.country_code_array);
        setTimeout(function() {
            if(typeof args.country_code_array !== "undefined")
            {
                ctrack.filter_country_test(args.country_code_array);
                HoldOn.close();
            }
            else{
                HoldOn.close();
            }
        }, 2000);

    };
    view_publisher_countries.display = display;

    var fadd = function(d) {
        var it = ctrack.publisher_countries_data[d.country_code];
        if (!it) {
            it = {};
            ctrack.publisher_countries_data[d.country_code] = it;
        }

        if (gotcrs) {
            var crs = crs_year[(d.country_code || "").toUpperCase()];
            if (crs) {
                if (crs[gotcrs]) {
                    d.crs = commafy("" + Math.floor(crs[gotcrs] * ctrack.convert_usd));
                }
            }
        }

        for (var n in d) {
            if (d[n]) {
                it[n] = d[n];
            }
        }
    };

    var years = [year - 1, year, year + 1];
    years.forEach(function(y) {
        var dat = {
            from: "act,trans,country",
            limit: args.limit || -1,
            select: "country_code,reporting_ref," + ctrack.convert_str("sum_of_percent_of_trans"),
            groupby: "country_code",
            trans_code: "D|E",
            trans_day_gteq: y + "-" + ctrack.args.newyear,
            trans_day_lt: parseInt(y) + 1 + "-" + ctrack.args.newyear,
            reporting_ref:args.reporting_ref,
            sector_code:args.sector_code,
            country_code:args.country_code
            //reporting_ref:"XM-DAC-41304|XM-DAC-928"
            //				"country_code":(args.country || ctrack.args.country_select),
            //				"reporting_ref":(args.publisher || ctrack.args.publisher_select),
            //				"title_like":(args.search || ctrack.args.search),
        };
        fetch.ajax_dat_fix(dat, args);
        if (!dat.reporting_ref) {
            dat.flags = 0;
        } // ignore double activities unless we are looking at a select publisher

        view = dat["view"];

        fetch.ajax(dat, function(data) {
            for (var i = 0; i < data.rows.length; i++) {
                var v = data.rows[i];

                //if (typeof un_agencies_data['countries'][v.country_code] != 'undefined') {
                var d = {};
                var num = ctrack.convert_num("sum_of_percent_of_trans", v);
                d.country_code = v.country_code || "N/A";
                d.country_name =
                    iati_codes.country[v.country_code] || v.country_code || "N/A";
                d["t" + (2 + y - year)] = commafy("" + Math.floor(num));
                if (y == year) {
                    d.order = num; // default, use ctrack.year transaction value for sort
                }
                fadd(d);
            }
            display();
        });
    });

    var years = [year + 1];
    years.forEach(function(y) {
        var dat = {
            from: "act,budget,country",
            limit: args.limit || -1,
            select: "country_code," + ctrack.convert_str("sum_of_percent_of_budget"),
            budget_priority: 1, // has passed some validation checks serverside
            groupby: "country_code",
            budget_day_start_gteq: y + "-" + ctrack.args.newyear,
            budget_day_start_lt: parseInt(y) + 1 + "-" + ctrack.args.newyear,
            reporting_ref:args.reporting_ref,
            sector_code:args.sector_code,
            country_code:args.country_code
        };
        fetch.ajax_dat_fix(dat, args);

        if (dat.reporting_ref || dat.sector_ref || dat.sector_code) {
            showAllCountry = false;
        }
        if (!dat.reporting_ref) {
            dat.flags = 0;
        } // ignore double activities unless we are looking at a select publisher

        fetch.ajax(dat, function(data) {
            for (var i = 0; i < data.rows.length; i++) {
                var v = data.rows[i];
                //if (typeof un_agencies_data['countries'][v.country_code] != 'undefined') {
                var d = {};
                d.country_code = v.country_code || "N/A";
                d.country_name =
                    iati_codes.country[v.country_code] || v.country_code || "N/A";
                d["b1"] = commafy(
                    "" + Math.floor(ctrack.convert_num("sum_of_percent_of_budget", v))
                );
                fadd(d);
                //}
            }

            display();
        });
    });

    var years = [year + 1];
    years.forEach(function(y) {
        var dat = {
            from: "budget",
            limit: args.limit || -1,
            select: "budget_country," + ctrack.convert_str("budget"),
            budget: "country", // only budgets for countries listed in org files
            groupby: "budget_country",
            budget_day_start_gteq: y + "-" + ctrack.args.newyear,
            budget_day_start_lt: parseInt(y) + 1 + "-" + ctrack.args.newyear,
/*            reporting_ref:args.reporting_ref,
            sector_code:args.sector_code,
            country_code:args.country_code*/
        };
        fetch.ajax_dat_fix(dat, args);
        dat.aid = dat.reporting_ref; // use fake reporting aid in budget data to choose a publisher
        delete dat.reporting_ref;
        fetch.ajax(dat, function(data) {
            for (var i = 0; i < data.rows.length; i++) {
                var v = data.rows[i];

                //if (typeof un_agencies_data['countries'][v.country_code] != 'undefined') {
                var d = {};
                d.country_code = v.budget_country || "N/A";
                d.country_name = iati_codes.country[d.country_code] || d.country_code;
                d["b2"] = commafy("" + Math.floor(ctrack.convert_num("budget", v)));
                fadd(d);
                //}
            }

            display();
        });
    });

};




