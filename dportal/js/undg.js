//TODO code quality
var fs = require('fs');
var sqlite3 = require("sqlite3").verbose();
var path = '../dstore/db/dstore.sqlite';
var sipac = new sqlite3.Database(path);

var chunkopts = {};
var json_iati_codes = require("../../dstore/json/iati_codes.json");
var un_agencies_data = require("../../dstore/json/un_agencies_data.json") || {};
var geojson = require("../../dstore/json/countries.geo.json");

sipac.serialize(function () {
    var d = new Date();
    var year = parseInt(d.getFullYear());
    var month = parseInt(d.getMonth());
    var day = parseInt(d.getDate());
    var r = Date.UTC(year, month, day) / (1000 * 60 * 60 * 24);

    un_agencies_data['total_un_agencies'] = Object.keys(json_iati_codes.un_publisher_names).length;
    un_agencies_data['un_agencies_in_iati'] = Object.keys(json_iati_codes.iati_un_publishers).length;
    un_agencies_data['totalSectors'] = Object.keys(json_iati_codes.sector).length;

    //fetch Total Budget
    let budget = {};
    let project = {};
    let expense = {};
    let activeProject = {};

    for (let y = year; y >= (year - 5); y--) {
        let start = Date.UTC(y, 1, 1) / (1000 * 60 * 60 * 24);
        let end = Date.UTC(y, 12, 31) / (1000 * 60 * 60 * 24);
        sipac.get("SELECT TOTAL(budget_value) FROM act JOIN budget USING (aid) WHERE budget =? AND ? BETWEEN budget_day_start AND budget_day_end", ['budget', start], function (err, row) {
            budget[y] = row["TOTAL(budget_value)"];
            un_agencies_data['total_budget'] = budget;
        });

        //fetch Total activities and expenditure
        var sql = "SELECT COUNT(DISTINCT aid) , TOTAL(spend) FROM act where reporting_ref NOTNULL AND ? BETWEEN day_start AND day_end";
        sipac.get(sql, [start], function (err, data) {
            project[y] = data['COUNT(DISTINCT aid)'];
            expense[y] = data['TOTAL(spend)'];
            un_agencies_data['total_projects'] = project;
            un_agencies_data['total_expenditure'] = expense;
        });

        //fetch Total active activities
        sql = "SELECT  COUNT(DISTINCT aid) AS count_aid FROM act  WHERE ? BETWEEN day_start AND day_end AND day_end >= ? AND day_length IS NOT NULL";
        sipac.get(sql, [start, r], function (err, data) {
            activeProject[y] = data['count_aid'];
            un_agencies_data["active_projects"] = activeProject;
        });
    }

    sipac.get("SELECT TOTAL(budget_value) FROM act JOIN budget USING (aid) WHERE budget =?", ['budget'], function (err, row) {
        budget['all'] = row["TOTAL(budget_value)"];
        un_agencies_data['total_budget'] = budget;
    });

    var sql = "SELECT COUNT(DISTINCT aid) , TOTAL(spend) FROM act where reporting_ref NOT NULL";
    sipac.get(sql, function (err, data) {
        project['all'] = data['COUNT(DISTINCT aid)'];
        expense['all'] = data['TOTAL(spend)'];
        un_agencies_data['total_projects'] = project;
        un_agencies_data['total_expenditure'] = expense;
    });

    sql = "SELECT  COUNT(DISTINCT aid) AS count_aid FROM act  WHERE day_start <= " + r + "  AND  ( day_end >= " + r + " OR day_end IS NULL )  AND  day_length IS NOT NULL";
    sipac.get(sql, function (err, data) {
        activeProject['all'] = data['count_aid'];
        un_agencies_data["active_projects"] = activeProject;
    });

    //fetch Total countries
    sql = "Select Distinct country_code from country";
    var arr = {};
    arr['global-regional'] = {};
    sipac.all(sql, function (err, data) {
        for (var code in data) {
            if (json_iati_codes['country'].hasOwnProperty(data[code]['country_code'])) {
                arr[data[code]['country_code']] = json_iati_codes['country'][data[code]['country_code']];
            } else if (json_iati_codes['region'].hasOwnProperty(data[code]['country_code'])) {
                arr[data[code]['country_code']] = json_iati_codes['region'][data[code]['country_code']];
            } else {
                arr['global-regional'][data[code]['country_code']] = data[code]['country_code'];
            }
        }
        un_agencies_data['countries'] = arr;
    });

    //fetch projects trends
    sql = "Select day_start,day_end from act";
    var currentProjectTrend = {};
    sipac.all(sql, function (err, data) {
        for (var i in data) {
            var start_year = getYearFromTimeStamp(parseInt(data[i]['day_start']) * (1000 * 60 * 60 * 24));
            var end_year = getYearFromTimeStamp(parseInt(data[i]['day_end']) * (1000 * 60 * 60 * 24));
            currentProjectTrend = getCurrentTrends(currentProjectTrend, [start_year, end_year]);
        }
        un_agencies_data['un_current_trends'] = currentProjectTrend;
    });

    //fetch projects sector_group

    sql = "Select Distinct sector_code from sector";
    var sectorGroupList = {};
    sipac.all(sql, function (err, data) {
        for (var i in data) {
            if (typeof json_iati_codes['sector'][data[i].sector_code] != 'undefined') {
                sectorGroupList[data[i].sector_code] = json_iati_codes['sector'][data[i].sector_code];
            }
        }
        un_agencies_data['sectors'] = sectorGroupList;

    });

});

var getYearFromTimeStamp = function (timeStamp) {
    var d = new Date(timeStamp);
    return d.getFullYear();
};

function getCurrentTrends(currentProjectTrend, yearly) {
    var year = 0;
    if (yearly != 0) {
        var diff = yearly[1] - yearly[0];
        for (var i = 0; i <= diff; i++) {
            year = parseInt(yearly[0]) + i;
            if (year in currentProjectTrend) {
                currentProjectTrend[year] = currentProjectTrend[year] + 1;
            } else {
                currentProjectTrend[year] = 1;
            }
        }
    }
    return currentProjectTrend;
};

sipac.close();

setTimeout(function generate() {
    fs.writeFileSync(__dirname + "/../../dstore/json/un_agencies_data.json", JSON.stringify(un_agencies_data, null, '\t'));
    //update the publisher chunk
    var pubs = [];
    for (var id in un_agencies_data["sectors"]) {
        var name = un_agencies_data["sectors"][id];
        var d = {
            name: name
        }
        pubs.push(d);
    }
    for (var id in json_iati_codes["un_publisher_names"]) {
        var name = json_iati_codes["un_publisher_names"][id];
        var d = {
            name: name,
            id: id
        };
        pubs.push(d);
    }
    pubs.sort(function (a, b) {
        var ta = a.name.toUpperCase();
        var tb = b.name.toUpperCase();
        return (ta < tb) ? -1 : (ta > tb) ? 1 : 0;
    });
    chunkopts["publishers"] = pubs;

    // auto update the countries chunk
    var ccs = [];
    for (var id in un_agencies_data["countries"]) {

        var name = un_agencies_data["countries"][id];

        if (id === 'global-regional') {
            name = 'Regional and global';
        }

        if (name) {
            var d = {
                name: name,
                id: id
            };
            ccs.push(d);
        }
    }
    ccs.sort(function (a, b) {
        var ta = a.name.toUpperCase();
        var tb = b.name.toUpperCase();
        return (ta < tb) ? -1 : (ta > tb) ? 1 : 0;
    });
    chunkopts["countries"] = ccs;

    var sec = [];
    var secId = [];
    for (var id in un_agencies_data["sectors"]) {
        var cat = id.substring(0, 3);

        if (secId.indexOf(cat) == -1) {
            var s = {
                name: json_iati_codes["sector_category"][cat],
                id: cat
            };
            sec.push(s);
            secId.push(cat);
        }
    }

    sec.sort(function (a, b) {
        var ta = a.name.toUpperCase();
        var tb = b.name.toUpperCase();

        return (ta < tb) ? -1 : (ta > tb) ? 1 : 0;
    });

    chunkopts["sector"] = JSON.stringify(sec);
    chunkopts["sector_un_operates"] = JSON.stringify(Object.keys(un_agencies_data["sectors"]).length);
    chunkopts["publisher_names_json"] = JSON.stringify(json_iati_codes["un_publisher_names"]);
    chunkopts["iati_un_publishers"] = JSON.stringify(json_iati_codes["iati_un_publishers"]);
    chunkopts["country_names_json"] = JSON.stringify(un_agencies_data["countries"]);
    chunkopts["crs_countries_json"] = JSON.stringify(un_agencies_data["countries"]);
    chunkopts["total_projects"] = JSON.stringify(un_agencies_data["total_projects"]);
    chunkopts["active_projects"] = JSON.stringify(un_agencies_data["active_projects"]);
    chunkopts["total_budget"] = JSON.stringify(un_agencies_data["total_budget"]);
    chunkopts["total_expenditure"] = JSON.stringify(un_agencies_data["total_expenditure"]);
    chunkopts["total_un_agencies"] = JSON.stringify(un_agencies_data["total_un_agencies"]);
    chunkopts["un_agencies_in_iati"] = JSON.stringify(un_agencies_data["un_agencies_in_iati"]);
    chunkopts["total_sector"] = JSON.stringify(un_agencies_data["totalSectors"]);


    var arr = Object.keys(un_agencies_data["un_current_trends"]).map(function (k) {
        return k;
    });
    var newYear = new Date();
    var currentYear = newYear.getFullYear();
    var currentYearStart = currentYear - 5;
    currentYearStart = currentYearStart.toString();
    var currentYearEnd = currentYear + 2;
    currentYearEnd = currentYearEnd.toString();
    var arr = arr.slice(arr.indexOf(currentYearStart), arr.indexOf(currentYearEnd));
    var un_trending = {};
    arr.forEach(function (year) {
        un_trending[year] = un_agencies_data["un_current_trends"][year];
    });
    chunkopts["un_current_trends"] = JSON.stringify(un_trending);

    chunkopts["geojson"] = JSON.stringify(geojson);

    generateText(chunkopts);

}, 5000);

function generateText(data) {

    let text = "";
    for (var key in data) {
        var value = data[key] instanceof Object ? JSON.stringify(data[key]) : data[key];
        text += "#^" + key + "\n" + value + "\n\n";
    }

    fs.writeFileSync(__dirname + "/../source/\^.undg.txt", text);
}
