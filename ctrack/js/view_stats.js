// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var view_stats = exports;
exports.name = "view_stats";

var ctrack = require("./ctrack.js");
var plate = require("./plate.js");
var iati = require("./iati.js");
var fetch = require("./fetch.js");

var views = require("./views.js");

// the chunk names this view will fill with new data
view_stats.chunks = [
  "total_projects",
  "missing_projects",
  "active_projects",
  "ended_projects",
  "planned_projects",
  "numof_publishers",
  "total_budget",
  "total_expenditure",
  "percent_of_activities_with_location"
];

view_stats.calc = function() {
  var tot = ctrack.chunk("total_projects") || 0;
  var num = ctrack.chunk("total_activities_with_location") || 0;
 
  if (num < 1 || tot < 1) {
    ctrack.chunk("percent_of_activities_with_location", 0);
  } else {
    var pct = Math.ceil(100 * num / tot);
    ctrack.chunk("percent_of_activities_with_location", pct);
  }

  /*

     var pt=parseInt(ctrack.chunk("total_projects"))||0;
     var pa=parseInt(ctrack.chunk("active_projects"))||0;
     var pe=parseInt(ctrack.chunk("ended_projects"))||0;
     var pp=parseInt(ctrack.chunk("planned_projects"))||0;

     var pm=pt - (pa+pe+pp)
     if(pm>0)
     {
     ctrack.chunk("missing_projects",pm);
     }
     else
     {
     ctrack.chunk("missing_projects",0);
     }
     */

  //	console.log(pm);
};

//
// Perform ajax call to get numof data
//
view_stats.ajax = function(args) {
  args = args || {};
  let y = ctrack.args.selected_year; //Date.UTC(ctrack.args.selected_year, 1, 1) / (1000 * 60 * 60 * 24);
  
  var dat = {
    select: "sum_budget_value",
    from: "act,budget",
    budget: "budget",
  };

  if(y !== 'all'){
    dat.between =  [y, "budget_day_start", "budget_day_end"];
  }

  fetch.ajax_dat_fix(dat, args);
  // console.log('==================dat==================',JSON.stringify(dat))
  fetch.ajax(
    dat,
    args.callback ||
      function(data) {
        // console.log("Fetching Budget");
        // console.log(dat);
        // console.log(JSON.stringify(data));

        if (data.rows[0]) {
          ctrack.chunk(
            "total_budget",
            changeToMillions(
              data.rows[0]["sum_budget_value"],
              ctrack.convert_usd
            )
          );
        }
        ctrack.display(); // every fetch.ajax must call display once
      }
  );

  var dat = {
    select: "stats",
    from: "act"
  };

  if(y !== 'all'){
    dat.between =  [y, "day_start", "day_end"];
  }

  fetch.ajax_dat_fix(dat, args);
  fetch.ajax(
    dat,
    args.callback ||
      function(data) {
        if (data.rows[0]) {
          ctrack.chunk("total_projects", data.rows[0]["distinct_aid"]);
          ctrack.chunk(
            "numof_publishers",
            data.rows[0]["distinct_reporting_ref"]
          );
          //ctrack.chunk("total_budget", changeToMillions(data.rows[0]["budget_value)"], ctrack.convert_usd));
          ctrack.chunk(
            "total_expenditure",
            changeToMillions(data.rows[0]["sum_spend"], ctrack.convert_usd)
          );
        }

        view_stats.calc();

        ctrack.display(); // every fetch.ajax must call display once
      }
  );

  var dat = {
    select: "stats",
    from: "act,location",
    limit: -1,
    location_longitude_not_null: 1, // must have a location
    location_latitude_not_null: 1 // must have a location
  };
  fetch.ajax_dat_fix(dat, args);
  if (dat.country_code) {
    dat.country_percent = 100;
  }
    if(y !== 'all'){
        dat.between = [y, "day_start", "day_end"];
    }

  fetch.ajax(
    dat,
    args.callback ||
      function(data) {
        console.log('map location % is calculated in this page');
        if (data.rows[0]) {
          ctrack.chunk(
            "total_activities_with_location",
            data.rows[0]["distinct_aid"]
          );
        }
        view_stats.calc();

        ctrack.display(); // every fetch.ajax must call display once
      }
  );

  views.planned.ajax({ output: "count" });
  views.active.ajax({ output: "count" });
  views.ended.ajax({ output: "count" });
  views.missing.ajax({ output: "count" });
};

var changeToMillions = function(number, currencyVal) {
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  var prettyNumber = "?";
  number = Math.round(number * currencyVal);

  var digits = new Number(number).toString().length;

  if (digits > 6) {
    number = number / 1000000;
    var roundedNumber = Math.round(number);
    prettyNumber = numberWithCommas(roundedNumber) + " M";
  } else {
    prettyNumber = new Number(number).toString();
  }

  return prettyNumber;
};
