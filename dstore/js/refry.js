// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var refry=exports;

var util=require('util');

var htmlparser=require('htmlparser');

var entities = require("entities");



var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


//
// Refry an XML string into json ( JML ) via htmlparser.
// Returns a json dumpable object.
// Each object is either a literal string or an object comprised of an
// entities supplied attributes plus two special attributes
// [0] is the name of the entity
// [1] is an array of child entities if any exist.
//
// This gives a rather compact xml representation in json format.
//
refry.xml=function(data,filename)
{
var expat = require('node-expat');
	
	var json=[];
	var stack=[];
	var top={};stack.push(top);
	var cdata=false;

	var parser = new expat.Parser('UTF-8');

	parser.on('startElement', function (name, attrs) {
		var parent=top;
		top={};stack.push(top);
		for(n in attrs) { top[n]=attrs[n]; }
		top[0]=name;
		if(!parent[1]){ parent[1]=[]; }
		parent[1].push(top);
	});

	parser.on('endElement', function (name) {
		stack.pop();
		top=stack[stack.length-1];
	});

	parser.on('text', function (text) {
		text=text.trim();
		if(text!="") // ignore white space
		{
			if(!top[1]) {	top[1]=[];	}
			if(cdata)	{ 	top[1].push( (text) );	}
			else		{	top[1].push( (text) );	}
		}
	});

// maintain cdata text flag
	parser.on('startCdata', function () { cdata=true; });
	parser.on('endCdata', function () { cdata=false; });

//error?
	parser.on('error', function (error) {
		console.error("\n XML ERROR "+error+" : "+filename);
	});

	parser.write(data);

	return stack[0][1];
	
}

// turn json back into xml
refry.json=function(data)
{
	if("string"==typeof data)
	{
		data=JSON.parse(data);
	}
	
	var ss=[];

	if(!data){ return; }
	var f; f=function(it)
	{
		if("string" == typeof it)
		{
			ss.push(entities.encodeXML(it));
		}
		else
		if("object" == typeof it)
		{
			ss.push("<"+it[0]);
			for(var n in it) // attributes
			{
				if(n!=0 && n!=1)
				{
					ss.push(" "+n+"="+"\""+entities.encodeXML( String(it[n]) )+"\"");
				}
			}
			if(it[1]) // child entities
			{
				ss.push(">");
				it[1].forEach(f);
				ss.push("</"+it[0]+">");
			}
			else // nothing inside so just close
			{
				ss.push("></"+it[0]+">");
			}
		}
	};
	if(data.forEach) { data.forEach(f); }
	else { f(data); }
	
	return ss.join("");
}

// return the first tag of the given name that we find (walking down the tree) or null
refry.tag=function(json,name)
{
	if(!json){ return; }
	var ret;
	var f; f=function(it)
	{
		if(!ret)
		{
			if(typeof it == "object")
			{
				if("string" == typeof name)
				{
					if(it[0]==name) {
						ret=it
					}
				}
				else // check attrs
				{
					var found=true;
					for( var a in name)
					{
						var v=name[a];
						if( it[a] != v ) // all attributes must match ([0]==tagname)
						{
							found=false;
							break;
						}
					}
					if(found)
					{
						ret=it
					}
				}
				if(it[1]) { it[1].forEach(f); }
			}
		}
	};
	if(json.forEach) { json.forEach(f); }
	else { f(json); }
	
	return ret;
}
// return the enclosed value string of the first tag we find of the given name
refry.tagval=function(json,name)
{
	var t=refry.tag(json,name); // find
	if( t && t[1] && t[1][0] && ( "string" == typeof t[1][0] ) ) // check
	{
		return entities.decodeXML(t[1][0]);
	}
}

// as above but trimed
refry.tagval_trim=function(json,name)
{
	var t=refry.tag(json,name); // find
	if( t && t[1] && t[1][0] && ( "string" == typeof t[1][0] ) ) // check
	{
		return entities.decodeXML(t[1][0].trim());
	}
}

// as above but prefer *english* narrative subtag if it exists 
refry.tagval_narrative=function(json,name)
{
	var t=refry.tag(json,name); // find first
	if(t)
	{
		var n=refry.tagval_en(t,"narrative");
		if(n) { return n; }
	}
	return refry.tagval_en(json,name);
}

// return the attr string of the first tag we find of the given name
refry.tagattr=function(json,name,attr)
{
	var t=refry.tag(json,name); // find
	if( t && t[attr] ) // check
	{
		return t[attr];
	}
}

// callback for all tags of the given name, walking down the tree
refry.tags=function(json,name,cb)
{
	if(!json){ return; }
	var f; f=function(it)
	{
		if(typeof it == "object")
		{
			if("string" == typeof name)
			{
				if(it[0]==name) {
					cb(it);
				}
			}
			else // check attrs
			{
				var found=true;
				for( var a in name)
				{
					var v=name[a];
					if( it[a] != v ) // all attributes must match ([0]==tagname)
					{
						found=false;
						break;
					}
				}
				if(found)
				{
					cb(it);
				}
			}
			if(it[1]) { it[1].forEach(f); }
		}
	};
	if(json.forEach) { json.forEach(f); }
	else { f(json); }
}


// return the enclosed value string of the first tag we find of the given name
// but *prefer* english if it is an option so multiple tags will be consdered
refry.tagval_en=function(json,name)
{
	var ret;
	var ret_en;
	
	if(!json){ return; }
	var f; f=function(it)
	{
		if(typeof it == "object")
		{
			if(it[0]==name) {
				var l=it["xml:lang"]; if(l) { l=l.toLowerCase(); }
				if((!ret_en)&&((l=="en")||(!l))) { ret=it; ret_en=it } // the first english tag we found
				else if(!ret) { ret=it; } // the first tag we found
			}
			if(!ret) // only recurse if not found anything at this level yet
			{
				if(it[1]) { it[1].forEach(f); }
			}
		}
	};	
	if(json.forEach) { json.forEach(f); }
	else { f(json); }
	
	var t=ret;
	if( t && t[1] && t[1][0] && ( "string" == typeof t[1][0] ) ) // check
	{
		return entities.decodeXML(t[1][0].trim());
	}
}
