// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var cmd = exports;

var fs = require('fs');
var util = require('util');
var path = require('path');

var fetch = require('../../dstore/js/dstore_sqlite.js');

var json_iati_codes = require("../../dstore/json/iati_codes.json");
var un_agencies_data = require("../../dstore/json/un_agencies_data.json");
var un_org = require('../../dstore/json/un_org.json');
var geojson = require("../../dstore/json/countries.geo.json");
var sendgrid = require('sendgrid')('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');

var plate = require("../../ctrack/js/plate.js");

var ls = function (a) {
    console.log(util.inspect(a, {depth: null}));
}

cmd.run = function (argv) {
    if (argv._[0] == "build") {
        return cmd.build();
    }


    // help text
    console.log(
        "\n" +
        ">	dportal build \n" +
        "Build all output into static.\n" +
        "Use --root=/dirname/ to set a diferent rootdir than / eg for github pages." +
        "\n" +
        "\n" +
        "");
};

cmd.build = function () {
    var chunkopts = {};
    var sqlite3 = require("sqlite3").verbose();
    console.log("===============");
    var path = '../dstore/db/dstore.sqlite';
    var sipac = new sqlite3.Database(path);

    sipac.serialize(function () {
        var d = new Date();
        var year = parseInt(d.getFullYear());
        var month = parseInt(d.getMonth());
        var day = parseInt(d.getDate());
        var r = Date.UTC(year, month, day) / (1000 * 60 * 60 * 24);

        //fetch Total Budget
        sipac.get("SELECT TOTAL(budget_value) FROM act JOIN budget USING (aid) WHERE budget =?", ['budget'], function (err, row) {
            console.log(row["TOTAL(budget_value)"]);
            un_agencies_data['total_budget'] = row["TOTAL(budget_value)"];
        });

        //fetch Total activities and expenditure
        var sql = "SELECT COUNT(DISTINCT aid) , TOTAL(spend) FROM act where reporting_ref NOTNULL";
        sipac.get(sql, function (err, data) {
            console.log(data);
            un_agencies_data['total_projects'] = data['COUNT(DISTINCT aid)'];
            un_agencies_data['total_expenditure'] = data['TOTAL(spend)'];
        });

        //fetch Total active activities
        sql = "SELECT  COUNT(DISTINCT aid) AS count_aid FROM act  WHERE day_start <= " + r + "  AND  ( day_end >= " + r + " OR day_end IS NULL )  AND  day_length IS NOT NULL";
        sipac.get(sql, function (err, data) {
            console.log(data);
            un_agencies_data["active_projects"] = data['count_aid'];
        });

        //fetch Total countries
        sql = "Select Distinct country_code from country";
        var arr = {};
        arr['global-regional'] = {};
        sipac.all(sql, function (err, data) {
            for (var code in data) {
                if (json_iati_codes['country'].hasOwnProperty(data[code]['country_code'])) {
                    arr[data[code]['country_code']] = json_iati_codes['country'][data[code]['country_code']];
                } else {
                    arr['global-regional'][data[code]['country_code']] = data[code]['country_code'];
                }
            }
            un_agencies_data['countries'] = arr;
            console.log(Object.keys(arr).length)
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
                }
                else {
                    currentProjectTrend[year] = 1;
                }
            }
        }
        return currentProjectTrend;
    };

    sipac.close();
    setTimeout(function () {
        fs.writeFile(__dirname + "/../../dstore/json/un_agencies_data.json", JSON.stringify(un_agencies_data, null, '\t'));
        deleteFolderRecursive = function (path) {
            var files = [];
            if (fs.existsSync(path)) {
                files = fs.readdirSync(path);
                files.forEach(function (file, index) {
                    var curPath = path + "/" + file;
                    if (fs.lstatSync(curPath).isDirectory()) { // recurse
                        deleteFolderRecursive(curPath);
                    } else { // delete file
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(path);
            }
        };
        deleteFolderRecursive("static");
        try {
            fs.mkdirSync("static");
        } catch (e) {
        }

        var tongues = [];
        var chunks = {};
        var blogs = {};

        chunkopts.root = "/";  //

        if (argv.root) {
            chunkopts.root = argv.root;
        }

        var dirname = "text";
        var ff = fs.readdirSync(dirname);
        for (var i = 0; i < ff.length; i++) {
            var v = ff[i];
            if (v.length == 7 && ( v.slice(-4) == ".txt")) // xxx.txt tongue files
            {
                var t = v.slice(0, 3);
                tongues[t] = tongues[t] || {};
                plate.fill_chunks(fs.readFileSync(dirname + "/" + t + ".txt", 'utf8'), tongues[t]);
                console.log("Adding " + t + " tongue");
            }
            else // normal chunks
            {
                console.log("Reading " + "/" + v);
                plate.fill_chunks(fs.readFileSync(dirname + "/" + v, 'utf8'), chunks);
            }
        }
        var pages = {};
        var get_page_chunk = function (fname) {
            if (pages[fname]) {
                return pages[fname];
            }
            var s
            try {
                s = fs.readFileSync("html/" + fname, 'utf8');
            } catch (e) {
            }
            if (s) {
                pages[fname] = plate.fill_chunks(s);
            }
            return pages[fname];
        }

        var find_pages = function (dir, blog) {
            var dirs = dir.split("/");
            while (dirs[dirs.length - 1] == "") {
                dirs.pop();
            }
            var ff = fs.readdirSync("html/" + dir);

            plate.reset_namespace();
            plate.push_namespace(chunkopts);
            plate.push_namespace(chunks);

//		console.log("namespace /");
            plate.push_namespace(get_page_chunk("index.html"));
            for (var i = 0; i < dirs.length; i++) {
                var dd = [];
                for (var j = 0; j <= i; j++) {
                    dd.push(dirs[j]);
                }
                var ds = dd.join("/");
                if (ds != "") // skip ""
                {
//				console.log("namespace /"+dd);
                    plate.push_namespace(get_page_chunk(dd + "/index.html"));
                }
            }


            var dodir = function (tongue) {
                var tonguedir = tongue;

                if (tongue == "eng") {
                    tonguedir = "";
                }
                else {
                    tonguedir = tongue + "/";
                }

                chunkopts.tongue = tongue;
                chunkopts.tongue_root = chunkopts.root + tonguedir;

                try {
                    fs.mkdirSync("static/" + tonguedir + dir);
                } catch (e) {
                }
                for (var i = 0; i < ff.length; i++) //parse
                {
                    var name = ff[i];
                    if (!fs.lstatSync("html/" + dir + name).isDirectory()) {
                        var blogdate = false;
                        var namedash = name.split('-');
                        if (namedash[0] && namedash[1] && namedash[2] && namedash[3]) // looks like a date?
                        {
                            blogdate = Date(namedash[0], namedash[1] - 1, namedash[2]);
                        }
                        if ((!blog) || (blog && blogdate)) // in blogmode, only parse files with a date at the start
                        {
                            console.log("parseing " + tonguedir + dir + name + (blog ? " as blogpost" : ""));
                            var page = get_page_chunk(dir + name);
                            page._extension = name.split('.').pop();
                            ;
                            page._filename = name;
                            page._fullfilename = dir + name;
                            if (blog) {
                                page._date = namedash[0] + "-" + namedash[1] + "-" + namedash[2];
                                page._name = "";
                                for (var pi = 3; pi < namedash.length; pi++) {
                                    page._name += " " + namedash[pi];
                                }
                                blogs[dir + name] = page;
                            }
                            else {
                                page.it = page;
                                var html = plate.replace("{" + page._extension + "}", page);
                                fs.writeFileSync("static/" + tonguedir + dir + name, html);
                            }
                        }
                    }
                }
            }

            if (tongues.eng) {
                plate.push_namespace(tongues.eng);
            }
            dodir("eng");
            if (tongues.eng) {
                plate.pop_namespace();
            }

            if (!blog) // not on blog scan
            {
                for (var n in tongues) {
                    if (n != "eng") // english is special default dealt with above
                    {
                        try {
                            fs.mkdirSync("static/" + n);
                        } catch (e) {
                        }
                        plate.push_namespace(tongues[n]);
                        dodir(n);
                        plate.pop_namespace();
                    }
                }
            }

            for (var i = 0; i < ff.length; i++) // recurse
            {
                var name = ff[i];

                if (fs.lstatSync("html/" + dir + name).isDirectory()) {
//				console.log("scan  "+dir+name);
                    find_pages(dir + name + "/", blog);
                }
            }

        }

        find_pages("", true); // find blogs first, blogs begin with a 2000-12-31-title.html style

        var bloglist = [];
        for (var n in blogs) {
            bloglist.push(blogs[n]);
        }
        bloglist.sort(function (a, b) {
            return a._fullfilename < b._fullfilename ? 1 : -1;
        });

        var b5 = [];
//	for(var i=bloglist.length-1; (i>=0) && (i>=(bloglist.length-5)) ;i--)
        for (var i = 0; i < 5; i++) {
            if (bloglist[i]) {
                b5.push(bloglist[i])
            }
        }

        chunkopts["bloglist"] = bloglist;
        chunkopts["bloglist_last5"] = b5;

// auto update the publisher chunk
        var pubs = [];
        for (var id in un_agencies_data["sectors"]) {
            var name = un_agencies_data["sectors"][id];
            var d = {name: name}
            pubs.push(d);
        }
        for (var id in json_iati_codes["un_publisher_names"]) {
            var name = json_iati_codes["un_publisher_names"][id];
            var d = {name: name, id: id};
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
                var d = {name: name, id: id};
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
                var s = {name: json_iati_codes["sector_category"][cat], id: cat};
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
        chunkopts["un_org"] = JSON.stringify(un_org);

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

        find_pages("");

// copy raw files into static

        var copyraw = function (root, dir) {
            try {
                fs.mkdirSync("static/" + dir);
            } catch (e) {
            }

            var ff = fs.readdirSync(root + dir);
            for (var i = 0; i < ff.length; i++) // recurse
            {
                var name = ff[i];

                if (fs.lstatSync(root + dir + name).isDirectory()) {
                    copyraw(root, dir + name + "/");
                }
                else {
                    console.log("rawfile " + root + dir + name);
                    fs.writeFileSync("static/" + dir + name, fs.readFileSync(root + dir + name));
                }
            }
        }
        copyraw("../ctrack/", "art/");
        copyraw("../ctrack/", "jslib/");
        copyraw("./raw/", "");
        copyraw("./", "art/");

    }, 5000);


};

// if global.argv is set then we are inside another command so do nothing
if (!global.argv) {
    var argv = require('yargs').argv;
    global.argv = argv;
    cmd.run(argv);
}
