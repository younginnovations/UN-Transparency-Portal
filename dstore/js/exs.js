// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var exs=exports;

var baby = require('babyparse');
var csv_write = undefined;//require('json2csv');
var csv=undefined;//require('csv');
var util=require('util');
var wait=require('wait.for');
var fs = require('fs');
var json_stringify = require('json-stable-stringify')

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var years=require('../json/usd_year.json');

var months=require('../json/xdr_month.json');

// exchange at the given years rate into usd
/*
exs.exchange_year=function(year,ex,val)
{
	if("number"!=typeof val) { val=1; } // default of 1
	ex=ex.toUpperCase();
	var ret;
	var best=9999;
	for(var y in years)
	{
		var v=years[y];
		if(v[ex]) // currency is available
		{
			var test=Math.abs(y-year);
			if(test<best)
			{
				ret=val/v[ex];
				best=test;
			}
		}
	}
	return ret;
}
*/

// exchange at the given years rate from ex currency into exto currency
exs.exchange_year=function(exto,yearmonth,ex,val)
{

	yearmonth=parseInt( (""+yearmonth).replace("-","").substring(0, 4) ,10); // turn into year
	
	if("number"!=typeof val) { val=1; } // default of 1
	exto=exto.toUpperCase();
	ex=ex.toUpperCase();
	var ret;
	var best=9999; // good for the next 8000 years
	for(var ym in years)
	{
		var v=years[ym];
		if(v[ex] && v[exto]) // both available
		{
			var ymi=parseInt( ym.replace("-","").substring(0, 4) ,10);
			var test=Math.abs(ymi-yearmonth);
			if(test<best)
			{
				ret=val*v[exto]/v[ex]; //these usd values are inverted compared to the xdr ones 
				best=test;
			}
		}
	}
if(ret)
{
//console.log("*using*usd*year*exchange*values*",exto,yearmonth,ex,val,ret);
}
	return ret;
}

// exchange at the given years rate from ex currency into exto currency
exs.exchange_yearmonth=function(exto,yearmonth,ex,val)
{
	if("number"!=typeof val) { val=1; } // default of 1
	exto=exto.toUpperCase();
	ex=ex.toUpperCase();
	var ret;
	var best=999912; // good for the next 8000 years
	for(var ym in months)
	{
		var v=months[ym];
		if(v[ex] && v[exto]) // both available
		{
			var ymi=parseInt( ym.replace("-","") ,10);
			var test=Math.abs(ymi-yearmonth);
			if(test<best)
			{
				ret=val*v[ex]/v[exto];
				best=test;
			}
		}
	}

	if((!ret)&&(val!=0)) // try the usd year table which may have more obscure but inaccurate values.
	{
		return exs.exchange_year(exto,yearmonth,ex,val) || 0; // no nulls please
	}

	return ret;
}

// download all vlaues from the IMF and create a CSV file that can later be loaded


exs.create_csv = function(){
	
	var http=require('http');
	var https=require('https');

	var http_getbody=function(url,cb)
	{
		http.get(url, function(res) {
			res.setEncoding('utf8');
			var s="";
			res.on('data', function (chunk) {
				s=s+chunk;
			});
			res.on('end', function() {
				cb(null,s);
			});
		}).on('error', function(e) {
			cb(e,null);
		});

	};
	
	var https_getbody=function(url,cb)
	{
		https.get(url, function(res) {
			res.setEncoding('utf8');
			var s="";
			res.on('data', function (chunk) {
				s=s+chunk;
			});
			res.on('end', function() {
				cb(null,s);
			});
		}).on('error', function(e) {
			cb(e,null);
		});

	};
	
// grab currated csv to use for missing values

	var x=wait.for(https_getbody,"https://docs.google.com/spreadsheets/d/1jpXHDNmJ1WPdrkidEle0Ig13zLlXw4eV6WkbSy6kWk4/pub?single=true&gid="+13+"&output=csv");
//	var lines=wait.for( function(cb){ csv().from.string(x).to.array( function(d){ cb(null,d); } ); } ); // so complex, much wow, very node
//	var lines=wait.for(csv_parse,x);
	var lines=baby.parse(x).data;



	var head={};
	for(var i=1;i<lines[0].length;i++)
	{
		head[i]=lines[0][i];
	}

	var csv_ys={};
	for(var i=1;i<lines.length;i++)
	{
		var line=lines[i];
		var year=line[0];
		var csv_y={};
		csv_ys[year]=csv_y;

		
		for(j=1;j<line.length;j++)
		{
			if( line[j] && (line[j]!="") )
			{
				csv_y[ head[j] ]=parseFloat(line[j]);
			}
		}
	}
//	fs.writeFileSync(__dirname+"/../json/csv_year.json",JSON.stringify(csv_ys,null,'\t'));
	
	
/*
	var xes={
		"ALGERIAN DINAR":"DZD",			"Australian dollar":"AUD",
		"Austrian schilling":"ATS",		"Bahrain dinar":"BHD",
		"Belgian franc":"BEF",			"Brazilian real":"BRL",
		"Canadian dollar":"CAD",		"Chilean peso":"CLP",
		"Chinese yuan":"CNY",			"Colombian peso":"COP",
		"Danish krone":"DKK",			"deutsche mark":"DEM",
		"euro":"EUR",					"Finnish markka":"FIM",
		"French franc":"FRF",			"Greek drachma":"GRD",
		"Icelandic krona":"ISK",		"Indian rupee":"INR",
		"Indonesian rupiah":"IDR",		"Iranian rial":"IRR",
		"Irish pound":"IEP",			"Italian lira":"ITL",
		"Japanese yen":"JPY",			"Korean won":"KRW",
		"KROON":"EEK",					"Kuwaiti dinar":"KWD",
		"Libyan dinar":"LYD",			"Luxembourg franc":"LUF",
		"Malaysian ringgit":"MYR",		"Maltese lira":"MTL",
		"Mexican peso":"MXN",			"Nepalese rupee":"NPR",
		"Netherlands guilder":"NLG",	"New Zealand dollar":"NZD",
		"Norwegian krone":"NOK",		"NUEVO SOL":"PEN",
		"Pakistani rupee":"PKR",		"PESO URUGUAYO":"UYU",
		"PHILIPPINE PESO":"PHP",		"Polish zloty":"PLN",
		"Portuguese escudo":"PTE",		"Qatar riyal":"QAR",
		"rial Omani":"OMR",				"Saudi Arabian riyal":"SAR",
		"Singapore dollar":"SGD",		"South African rand":"ZAR",
		"Spanish peseta":"ESP",			"Sri Lanka rupee":"LKR",
		"Swedish krona":"SEK",			"Swiss franc":"CHF",
		"Thai baht":"THB",				"Trinidad and Tobago dollar":"TTD",
		"TUNISIAN DINAR":"TND",			"U.A.E. dirham":"AED",
		"U.K. pound sterling":"GBP",	"U.S. dollar":"USD",
		"Venezuelan bolivar":"VEB",		"Bolivar Fuerte":"VEF",
		"Botswana Pula":"BWP",			"Brunei Dollar":"BND",
		"Czech Koruna":"CZK",			"Hungarian Forint":"HUF",
		"Israeli New Sheqel":"ILS",		"Kazakhstani Tenge":"KZT",
		"Mauritian Rupee":"MUR",		"Russian Ruble":"RUB"
	};
*/

	var xes={

"Chinese yuan"				:	"CNY",
"Euro"						:	"EUR",
"Japanese yen"				:	"JPY",
"U.K. pound"				:	"GBP",
"U.S. dollar"				:	"USD",
"Algerian dinar"			:	"DZD",
"Australian dollar"			:	"AUD",
"Bahrain dinar"				:	"BHD",
"Botswana pula"				:	"BWP",
"Brazilian real"			:	"BRL",
"Brunei dollar"				:	"BND",
"Canadian dollar"			:	"CAD",
"Chilean peso"				:	"CLP",
"Colombian peso"			:	"COP",
"Czech koruna"				:	"CZK",
"Danish krone"				:	"DKK",
"Hungarian forint"			:	"HUF",
"Icelandic krona"			:	"ISK",
"Indian rupee"				:	"INR",
"Indonesian rupiah"			:	"IDR",
"Iranian rial"				:	"IRR",
"Israeli New Shekel"		:	"ILS",
"Kazakhstani tenge"			:	"KZT",
"Korean won"				:	"KRW",
"Kuwaiti dinar"				:	"KWD",
"Libyan dinar"				:	"LYD",
"Malaysian ringgit"			:	"MYR",
"Mauritian rupee"			:	"MUR",
"Mexican peso"				:	"MXN",
"Nepalese rupee"			:	"NPR",
"New Zealand dollar"		:	"NZD",
"Norwegian krone"			:	"NOK",
"Omani rial"				:	"OMR",
"Pakistani rupee"			:	"PKR",
"Peruvian sol"				:	"PEN",
"Philippine peso"			:	"PHP",
"Polish zloty"				:	"PLN",
"Qatari riyal"				:	"QAR",
"Russian ruble"				:	"RUB",
"Saudi Arabian riyal"		:	"SAR",
"Singapore dollar"			:	"SGD",
"South African rand"		:	"ZAR",
"Sri Lankan rupee"			:	"LKR",
"Swedish krona"				:	"SEK",
"Swiss franc"				:	"CHF",
"Thai baht"					:	"THB",
"Trinidadian dollar"		:	"TTD",
"Tunisian dinar"			:	"TND",
"U.A.E. dirham"				:	"AED",
"Uruguayan peso"			:	"UYU",
"Bolivar Fuerte"			:	"VEF",

}


	var unknown={}

	var xes_low={};
	for(var n in xes) { xes_low[ n.toLowerCase() ]=xes[n]; } //fix case
	

	var dump_ys={};
	var dump_ms={};
	
	var this_year=(new Date()).getYear()+1900; // get this year

	for(var year=1995;year<=this_year;year++ )
	{
		var dump_y={};
		dump_ys[year]=dump_y;
		for(var month=1;month<=12;month++ )
		{
			var month0="0"+month; if(month0.length>2) { month0=month; }
			var dump_m={}
			dump_ms[year+"-"+month0]=dump_m;
			
			var csv_file=wait.for(http_getbody,"http://www.imf.org/external/np/fin/data/rms_mth.aspx?SelectDate="+year+"-"+month+"-01&reportType=CVSDR&tsvflag=Y");

			var csv_lines=baby.parse(csv_file,{delimiter:'\t'}).data;
console.log(year + " " + month );

			var active=false;
			csv_lines.forEach(function(line){
				var cid=xes_low[ line[0].toLowerCase() ];
				if( cid )
				{

					var dm=dump_m[cid] || {count:0,total:0}; dump_m[cid]=dm;
					var dy=dump_y[cid] || {count:0,total:0}; dump_y[cid]=dy;
					
					for(i=1;i<line.length;i++)
					{
						var pf=parseFloat( line[i].replace(",","") ); // deal with , in values
						if( line[i] && ( pf > 0 ) )
						{
							dm.total+=pf;
							dm.count++;
							dy.total+=pf;
							dy.count++;
						}
					}
				}
				else
				{
					unknown[ line[0] ]="???"
				}
			});
			
			for(var n in dump_m )
			{
				var d=dump_m[n];
				if(d.count>0)
				{
					dump_m[n] = 1/(d.total/d.count);
					dump_m["XDR"]=1;
				}
				else
				{
					delete dump_m[n];
				}
			}
		}
		for(var n in dump_y )
		{
			var d=dump_y[n];
			if(d.count>0)
			{
				dump_y[n] = 1/(d.total/d.count);
				dump_y["XDR"]=1;
			}
			else
			{
				delete dump_y[n];
			}
		}
	}

console.log("IF THIS DUMP CONTAINS ANY REAL CURRENCIES THEN THE CODE IS BROKEN")
console.log("YOU WILL NEED TO MANUALLY ADD IT TO THE LIST IN dstore/js/exs.js")
console.log(unknown)

// dump monthly averages

	fs.writeFileSync(__dirname+"/../json/xdr_year.json",json_stringify(dump_ys,{ space: ' ' }));
	fs.writeFileSync(__dirname+"/../json/xdr_month.json",json_stringify(dump_ms,{ space: ' ' }));


// start with csv_ys (which we grabbed from google docs) and replace with our imf values
// that way we have some values for everything we can and accurate values from the IMF


	for(var year in dump_ys)
	{
		var v=dump_ys[year];
		csv_ys[year]=csv_ys[year] || {}
		
		
		for(var x in v)
		{
			if( v[x] && (v[x]>0) && v.USD && (v.USD>0) )
			{
				csv_ys[year][x]=v.USD/v[x]; // make relative to usd
			}
		}

	}

	fs.writeFileSync(__dirname+"/../json/usd_year.json",json_stringify(csv_ys,{ space: ' ' }));

}

// load the exchange rates from a csv
//exs.load_csv();



