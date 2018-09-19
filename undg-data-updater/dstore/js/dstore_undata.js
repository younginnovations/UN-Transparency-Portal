var dstore_undata = exports;


var wait = require("wait.for");

var fs = require('fs');
var util = require("util");
var path = require('path');
var http = require("http");
var https = require('https');
var request = require('request');
var async = require("./async");

dstore_undata.fetch = function () {

    var unOrganizations = require('../json/iati_codes');
    var overAllUNData = require('../json/un_agencies_data');

    overAllUNData['countries'] = {};
    overAllUNData['sectors'] = {};
    overAllUNData['total_budget'] = 0;
    overAllUNData['total_expenditure'] = 0;
    overAllUNData['total_projects'] = 0;
    overAllUNData['active_projects'] = 0;
    overAllUNData['un_trends'] = {};
    overAllUNData['un_current_trends'] = {};

    unOrganizations = unOrganizations['iati_un_publishers'];
    var codes = require('../json/un_org');

    for (var key in unOrganizations) {
        var countries = {};
        var sectors = {};
        var activeProjects = 0;
        var totalBudget = 0;
        var totalExpenditure = 0;
        var projectTrends = {};
        var currentProjectTrend = {};
        try {
            console.log("Fetching Start data for " + unOrganizations[key]);
            if (key == 41122) {
                var cnt = 0;
                for (var i = 1; i < 5; i++) {
                    var data = require("../un-json/datastore_" + key + i);
                    data = JSON.stringify(data);
                    data = JSON.parse(data);

                    data['iati-activities'].forEach(function (activity) {
                        countries = extend(countries, fillGivenData(countries, activity['iati-activity']['recipient-country'], 'country'));
                        sectors = extend(sectors, fillGivenData(sectors, activity['iati-activity']['sector'], 'sector'));
                        activeProjects = activeProjects + parseInt(getActiveProjects(activity['iati-activity']['activity-date'], 'active'));
                        totalBudget = totalBudget + parseFloat(getProjectBudget(activity['iati-activity']['budget']));
                        totalExpenditure = totalExpenditure + parseFloat(getProjectExpenditure(activity['iati-activity']['transaction']));
                        projectTrends = getProjectTrends(projectTrends, activity['iati-activity']['activity-date']);
                        currentProjectTrend = getCurrentTrends(currentProjectTrend, activity['iati-activity']['activity-date']);
                        cnt++;
                    });
                }
                console.log('Total : ', cnt);
                console.log("Fetching Finish data for " + unOrganizations[key]);
                overAllUNData['countries'] = extend(overAllUNData['countries'], countries);
                overAllUNData['sectors'] = extend(overAllUNData['sectors'], sectors);
                overAllUNData['total_budget'] = parseFloat(overAllUNData['total_budget']) + parseFloat(totalBudget);
                overAllUNData['total_expenditure'] = parseFloat(overAllUNData['total_expenditure']) + parseFloat(totalExpenditure);
                overAllUNData['total_projects'] = parseFloat(overAllUNData['total_projects']) + parseFloat(data['total-count']);
                overAllUNData['active_projects'] = parseFloat(overAllUNData['active_projects']) + parseFloat(activeProjects);
                overAllUNData['un_trends'] = mergeData(overAllUNData['un_trends'], projectTrends);
                overAllUNData['un_current_trends'] = mergeData(overAllUNData['un_current_trends'], currentProjectTrend);

                codes[key] = {
                    countries: countries,
                    sectors: sectors,
                    total_projects: data['total-count'],
                    active_projects: activeProjects,
                    total_budget: totalBudget,
                    total_expenditure: totalExpenditure,
                    un_trends: projectTrends,
                    un_current_trends: currentProjectTrend
                };
            } else if (key == 44000) {
                for (var i = 1; i < 3; i++) {
                    var data = require("../un-json/datastore_" + key + '-' + i);
                    data = JSON.stringify(data);
                    data = JSON.parse(data);

                    data['iati-activities'].forEach(function (activity) {
                        countries = extend(countries, fillGivenData(countries, activity['iati-activity']['recipient-country'], 'country'));
                        sectors = extend(sectors, fillGivenData(sectors, activity['iati-activity']['sector'], 'sector'));
                        activeProjects = activeProjects + parseInt(getActiveProjects(activity['iati-activity']['activity-date'], 'active'));
                        totalBudget = totalBudget + parseFloat(getProjectBudget(activity['iati-activity']['budget']));
                        totalExpenditure = totalExpenditure + parseFloat(getProjectExpenditure(activity['iati-activity']['transaction']));
                        projectTrends = getProjectTrends(projectTrends, activity['iati-activity']['activity-date']);
                        currentProjectTrend = getCurrentTrends(currentProjectTrend, activity['iati-activity']['activity-date']);
                    });
                }
                console.log("Fetching Finish data for " + unOrganizations[key]);
                overAllUNData['countries'] = extend(overAllUNData['countries'], countries);
                overAllUNData['sectors'] = extend(overAllUNData['sectors'], sectors);
                overAllUNData['total_budget'] = parseFloat(overAllUNData['total_budget']) + parseFloat(totalBudget);
                overAllUNData['total_expenditure'] = parseFloat(overAllUNData['total_expenditure']) + parseFloat(totalExpenditure);
                overAllUNData['total_projects'] = parseFloat(overAllUNData['total_projects']) + parseFloat(data['total-count']);
                overAllUNData['active_projects'] = parseFloat(overAllUNData['active_projects']) + parseFloat(activeProjects);
                overAllUNData['un_trends'] = mergeData(overAllUNData['un_trends'], projectTrends);
                overAllUNData['un_current_trends'] = mergeData(overAllUNData['un_current_trends'], currentProjectTrend);

                codes[key] = {
                    countries: countries,
                    sectors: sectors,
                    total_projects: data['total-count'],
                    active_projects: activeProjects,
                    total_budget: totalBudget,
                    total_expenditure: totalExpenditure,
                    un_trends: projectTrends,
                    un_current_trends: currentProjectTrend
                };

            } else {
                var data = require("../un-json/datastore_" + key);
                data = JSON.stringify(data);
                data = JSON.parse(data);

                data['iati-activities'].forEach(function (activity) {
                    countries = extend(countries, fillGivenData(countries, activity['iati-activity']['recipient-country'], 'country'));
                    sectors = extend(sectors, fillGivenData(sectors, activity['iati-activity']['sector'], 'sector'));
                    activeProjects = activeProjects + parseInt(getActiveProjects(activity['iati-activity']['activity-date'], 'active'));
                    totalBudget = totalBudget + parseFloat(getProjectBudget(activity['iati-activity']['budget']));
                    totalExpenditure = totalExpenditure + parseFloat(getProjectExpenditure(activity['iati-activity']['transaction']));
                    projectTrends = getProjectTrends(projectTrends, activity['iati-activity']['activity-date']);
                    currentProjectTrend = getCurrentTrends(currentProjectTrend, activity['iati-activity']['activity-date']);
                });

                console.log("Fetching Finish data for " + unOrganizations[key]);
                overAllUNData['countries'] = extend(overAllUNData['countries'], countries);
                overAllUNData['sectors'] = extend(overAllUNData['sectors'], sectors);
                overAllUNData['total_budget'] = parseFloat(overAllUNData['total_budget']) + parseFloat(totalBudget);
                overAllUNData['total_expenditure'] = parseFloat(overAllUNData['total_expenditure']) + parseFloat(totalExpenditure);
                overAllUNData['total_projects'] = parseFloat(overAllUNData['total_projects']) + parseFloat(data['total-count']);
                overAllUNData['active_projects'] = parseFloat(overAllUNData['active_projects']) + parseFloat(activeProjects);
                overAllUNData['un_trends'] = mergeData(overAllUNData['un_trends'], projectTrends);
                overAllUNData['un_current_trends'] = mergeData(overAllUNData['un_current_trends'], currentProjectTrend);
                codes[key] = {
                    countries: countries,
                    sectors: sectors,
                    total_projects: data['total-count'],
                    active_projects: activeProjects,
                    total_budget: totalBudget,
                    total_expenditure: totalExpenditure,
                    un_trends: projectTrends,
                    un_current_trends: currentProjectTrend
                };
            }
        } catch (e) {
            codes[key] = {};
            console.log(e);
        }
        console.log("=================================================================================================");
    }
    //console.log(codes);
    overAllUNData['countries'] = filterData(overAllUNData['countries'], 'country');
    overAllUNData['sectors'] = filterData(overAllUNData['sectors'], 'sector');

    fs.writeFile(__dirname + "/../json/un_org.json", JSON.stringify(codes, null, '\t'));
    fs.writeFile(__dirname + "/../json/un_agencies_data.json", JSON.stringify(overAllUNData, null, '\t'));
    console.log("Data has been successfully imported.");

}

function filterData(data, type) {
    var codes = require('../json/iati_codes');
    var regional = {};

    for (var key in data) {
        if (!codes[type][key]) {
            regional[key] = data[key];
            //console.log('================', regional);
            delete data[key];
        }
    }

    if (type === 'country') {
        data['global-regional'] = regional;
        console.log(data['global-regional']);
    }

    return data;
}

function mergeData(obj, src) {
    if (Object.keys(obj).length) {
        for (var y in src) {

            if (!(y in obj)) {
                obj[y] = src[y];

            } else {
                obj[y] = parseInt(obj[y]) + parseInt(src[y]);

            }
        }

    } else {
        obj = extend(obj, src);
    }
    return obj;
}

//for fetching number of projects per year
function getProjectTrends(projectTrends, activityDates) {

    var yy = getActiveProjects(activityDates, 'trends');

    if (yy != 0) {
        if (yy[0] in projectTrends) {
            projectTrends[yy[0]] = projectTrends[yy[0]] + 1;

        } else {
            projectTrends[yy[0]] = 1;
        }
    }

    return projectTrends;
}

// function to make an object of trending projects that persists in actual year
function getCurrentTrends(currentProjectTrend, activityDates) {
    var yearly = getCurrentProject(activityDates);
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
}
//to find expenditures per project
function getProjectExpenditure(transactions) {
    var expenses = 0;
    if (typeof transactions !== 'undefined') {

        if (transactions.length > 0) {
            transactions.forEach(function (transaction) {
                if ((typeof transaction['transaction-type']) !== 'undefined' && (transaction['transaction-type'].code === 'E' || transaction['transaction-type'].code == 4)) {
                    expenses = expenses + parseFloat(transaction['value'].text);
                } else if ((typeof transaction['transaction-type']) !== 'undefined' && (transaction['transaction-type'].code === 'D' || transaction['transaction-type'].code == 3)) {
                    expenses = expenses + parseFloat(transaction['value'].text);
                }
            });
        } else {
            if (typeof transactions === 'object') {
                if ((transactions['transaction-type'].code === 'E' || transactions['transaction-type'].code == 4))
                    expenses = transactions['value'].text;
            } else {
                expenses = transactions['value'].text;
            }
        }
    }
    // console.log(expenses);

    return expenses;
}

//to get the budget value per project
function getProjectBudget(budget) {
    if (typeof budget !== 'undefined') {
        var bdgt = 0;

        if (typeof budget.length !== 'undefined') {
            budget.forEach(function (b) {
                //if (b['type'] == 1 || b['type'].toLowerCase() === 'original') {
                bdgt = bdgt + Number(b['value'].text);
                //}
            });
        } else {
            //console.log(budget['value'].text);
            //if (budget['type'] == 1 || budget['type'].toLowerCase() === 'original') {
            bdgt = parseFloat(budget['value'].text);
            //}
        }

        return bdgt;
    } else {
        return 0;
    }
}

//to check for active projects
function getActiveProjects(activityDates, type) {
    var dt = 0;
    if (typeof activityDates !== 'undefined') {
        if (type === 'active') {
            if (typeof activityDates.length !== 'undefined') {
                activityDates.forEach(function (ad) {
                    if (dt == '' && (ad.type === 'end-actual' || ad.type == 4)) {
                        dt = active_project(ad['iso-date']);
                    } else if (dt == '' && (ad.type === 'end-planned' || ad.type == 3)) {
                        dt = active_project(ad['iso-date']);
                    }
                });
            } else {
                if (dt == '' && (activityDates.type === 'end-actual' || activityDates.type == 4)) {
                    dt = active_project(activityDates['iso-date']);
                } else if (dt == '' && (activityDates.type === 'end-planned' || activityDates.type == 3)) {
                    dt = active_project(activityDates['iso-date']);
                }
            }

            return dt;
        } else if (type === 'trends') {
            if (typeof activityDates.length !== 'undefined') {
                activityDates.forEach(function (ad) {
                    if (dt == '' && (ad.type === 'start-actual' || ad.type == 2)) {
                        dt = ad['iso-date'];
                    } else if (dt == '' && (ad.type === 'start-planned' || ad.type == 1)) {
                        dt = ad['iso-date'];
                    }
                });
            } else {
                if (dt == '' && (activityDates.type === 'end-actual' || activityDates.type == 4)) {
                    dt = activityDates['iso-date'];
                } else if (dt == '' && (activityDates.type === 'end-planned' || activityDates.type == 3)) {
                    dt = activityDates['iso-date'];
                }
            }

            return (dt != 0) ? dt.split("-") : dt;
        }
    }
    return dt;

}

//returns an array of the start date and end date of individual project, made by aayush
function    getCurrentProject(activityDates) {
    var dt = {};
    var mainDt = [];
    if (typeof activityDates !== 'undefined') {
        if (typeof activityDates.length != 'undefined') {
            activityDates.forEach(function (ad) {
                if (typeof dt["startDate"] == 'undefined' && (ad.type === 'start-actual' || ad.type == 2)) {
                    dt["startDate"] = ad['iso-date'];
                }
                else if (typeof dt["startDate"] == 'undefined' && (ad.type === 'start-planned' || ad.type == 1)) {
                    dt["startDate"] = ad['iso-date'];
                }
                else if (typeof dt["endDate"] == 'undefined' && (ad.type === 'end-actual' || ad.type == 4)) {
                    dt["endDate"] = ad['iso-date'];
                }
                else if (typeof dt["endDate"] == 'undefined' && (ad.type === 'end-planned' || ad.type == 3)) {
                    dt["endDate"] = ad['iso-date'];
                }
            });
        } else {
            if (typeof dt["startDate"] == 'undefined' && (activityDates.type === 'start-actual' || activityDates.type == 2)) {
                dt["startDate"] = activityDates['iso-date'];
            }
            else if (typeof dt["startDate"] == 'undefined' && (activityDates.type === 'start-planned' || activityDates.type == 1)) {
                dt["startDate"] = activityDates['iso-date'];
            }
            else if (typeof dt["endDate"] == 'undefined' && (activityDates.type === 'end-actual' || activityDates.type == 4)) {
                dt["endDate"] = activityDates['iso-date'];
            }
            else if (typeof dt["endDate"] == 'undefined' && (activityDates.type === 'end-planned' || activityDates.type == 3)) {
                dt["endDate"] = activityDates['iso-date'];
            }
        }
        if (typeof dt["startDate"] != 'undefined' && typeof dt["endDate"] != 'undefined') {
            dt["startDate"] = (dt["startDate"] != 0) ? dt["startDate"].split("-") : dt["startDate"];
            dt["endDate"] = (dt["endDate"] != 0) ? dt["endDate"].split("-") : dt["endDate"];
            mainDt.push(dt.startDate[0]);
            mainDt.push(dt.endDate[0]);
        }
    }
    return mainDt;
}

//validate if project is active
function active_project(end_date) {
    var cur_date = new Date();
    end_date = new Date(end_date);

    if (cur_date <= end_date) {
        return 1;
    }

    return 0;
}

//fill in the array of provided organization data
function fillGivenData(dataObject, orgData, fetch) {
    if (orgData !== undefined) {
        if (orgData.length) {
            orgData.forEach(function (data) {
                dataObject = extend(dataObject, getData(dataObject, data, fetch));
            });

        } else if (typeof orgData.length == 'undefined') {
            dataObject = extend(dataObject, getData(dataObject, orgData, fetch));
        }
    }

    return dataObject;
}

function getData(dataObject, data, fetch) {

    if ((data.code !== '' && (typeof data.code) !== 'undefined') && (data.text !== '' && (typeof data.text) !== 'undefined')) {
        dataObject[data.code] = data.text;

    } else if ((data.code != '' && (typeof data.code) !== 'undefined') && (data.text === '' || (typeof data.text) === 'undefined')) {
        dataObject[data.code] = getMissingValues(fetch, data.code, 'key');

    } else if ((data.code === '' || (typeof data.code) === 'undefined') && (data.text !== '' && (typeof data.text) !== 'undefined')) {
        var code = getMissingValues(fetch, data.text, 'value');
        if (code !== undefined && code !== '') {
            dataObject[code] = data.text;
        } else {
            dataObject[data.text] = data.text;
        }
    }

    return dataObject;
}

//Added by Biju for filling missing sector/country from xml
function getMissingValues(element, key, type) {
    var codes = require('../json/iati_codes');

    if (type === 'key') {
        if (codes[element][key]) {
            return codes[element][key];
        }
        return key;
    } else {
        for (var k in codes[element]) {

            if (codes[element][k].toLowerCase() === key.toLowerCase()) {
                return k;
            }
        }
    }
}

//merge two arrays
function extend(obj, src) {
    for (var key in src) {
        if (src.hasOwnProperty(key)) obj[key] = src[key];
    }
    return obj;
}
