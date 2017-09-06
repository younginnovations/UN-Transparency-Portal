// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var express = require('express');
var express_fileupload = require('express-fileupload');

//var morgan = require('morgan');
var app = express();


<<<<<<< HEAD
argv.port=argv.port||1337;
argv.database=argv.database||"../dstore/db/dstore.sqlite";
=======
var argv=require('yargs').argv; global.argv=argv;
require("../../dstore/js/argv").parse(argv);
>>>>>>> dportal

express.static.mime.define({'text/plain': ['']});

//app.use(morgan('combined'));

app.use( express_fileupload() );

app.use(function(req, res, next) {
	var aa=req.path.split("/");
	var ab=aa && (aa[aa.length-1].split("."));

	if( ab && (ab.length==1) ) // no extension
	{
		res.contentType('text/html'); // set to html
	}
	
	if(req.get('user-agent'))
	{
		if( req.get('user-agent').indexOf("Trident/5.0") > -1 ) // only if IE9
		{
			res.set("X-UA-Compatible", "IE=9"); //This fixes IE9 iframes?
		}
	}
	
	next();
});

app.use(express.static(__dirname+"/../static"));

app.get('/feedback', function (req, res) {
	try {
		var name = req.query.name;
		var feedbackEmail = req.query.email;
		var message = req.query.message;
		var sendgrid = require("sendgrid")("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");
		var email = new sendgrid.Email();

		email.addTo("kit.doco@undp.org");
		email.addCc("aayush.rijal@yipl.com.np");
		email.setFrom(feedbackEmail);
		email.setSubject("About UNTP");
		email.setHtml(name + "," + "<br />" + message);

		sendgrid.send(email, function (err, json) {
			return res.json(json);
		});
	} catch (e) {
		return res.json(e.message);
	}
});

app.use(function(req, res, next) {
	var aa=req.path.split("/");
	var ab=aa && (aa[aa.length-1].split("."));

	if( ab && (ab[0]=="q") ) // data query endpoint, 
	{
		require("../../dstore/js/query").serv(req,res);
	}
	else
	if( ab && (ab[0]=="upload") ) // upload api endpoint, for testing xml files
	{
		require("../../dstore/js/upload").serv(req,res);
	}
	else
	{
		next();
	}
});


// redirect any unknown page to main homepage
app.get('*', function(req, res) {
    res.redirect('/ctrack.html#view=search');
});


console.log("Starting static server at http://localhost:"+argv.port+"/");

app.listen(argv.port);

