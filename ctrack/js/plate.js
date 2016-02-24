// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var plate=exports;

var util=require('util');
var marked=require('marked');

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false
});
var nl_to_br=function(t) // lets break markdown
{
	return t.replace(/[\n]+/g,function(found)
		{
			if(found.length>=3) // 3 newlines in a row inserts two <br/> codes,
			{
				return "\n"+(new Array(found.length)).join("<br/>\n")+"\n";
			}
			return found;
		}
	);
}

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }


plate.chunks=[];

// break a string into chunks ( can be merged and overried other chunks )
plate.fill_chunks=function(str,chunks)
{
	var hashchar="#";
	var chunks=chunks || {};
	chunks.__flags__=chunks.__flags__ || {}; // special flags chunk chunk, if we have any flags

	var name="";
	var chunk=[];
	var flags; // associated with this chunk
	str.split("\n").forEach(function(l){
			if(l[0]==hashchar)
			{
				if(l[1]=="=") // change escape char
				{
					hashchar=l[2]; // use this escape char from now on
				}
				else
				if(l[1]==hashchar) // double hash escape?
				{
					chunk.push(l.slice(1)); // double ## escape, only keep one #
				}
				else
				{
					if(name)
					{					
						chunks[name]=chunk.join("\n");
					}
					var words=l.substring(1).replace(/\s+/g, " ").split(" "); // allow any type of whitespace
					name=words[0];
					if(name)
					{
						if(words[1] && (words[1]!="")) // have some flags
						{
							flags=chunks.__flags__[name];
							if(!flags) // create
							{
								flags={};
								chunks.__flags__[name]=flags;
								for(var i=1;i<words.length;i++)
								{
									var aa=words[i].split("="); // flags must be -> flag=value 
									if(aa[0]&&aa[1])
									{
										flags[aa[0]]=aa[1]; // add flags
									}
								}
							}
						}
						else
						{
							flags={}; // no flags
						}
						chunk=chunks[name];
						if(chunk==undefined) // create
						{
							chunk=[];
							chunks[name]="";
						}
						else // concat mutliple chunks
						{
							console.log("warning chunk name is used twice, "+name);
							chunk=[ chunks[name] ];
						}
					}
				}
			}
			else
			{
				chunk.push(l);
			}
		});
	if(name && chunk)
	{					
		chunks[name]=chunk.join("\n");
	}

	// apply flags to the formatting
	for( n in chunks.__flags__ )
	{
		var f=chunks.__flags__[n];
		
		if(f.trim) // trim=ends
		{
			chunks[n]=chunks[n].trim(); // remove whitespace from start/end
		}
		
		if(f.form) // special format
		{
			if(f.form=="json")
			{
				if( "string" == typeof (chunks[n]) )
				{
//					console.log("parsing json chunk "+n);
//					console.log(chunks[n]);
					chunks[n]=JSON.parse(chunks[n]);
				}
			}
			else
			if(f.form=="markdown")
			{
				
				chunks[n]=marked(nl_to_br(chunks[n]));
			}
		}
	}

	return chunks;
}

// turn all chunks back into a string
// this is broken :)
plate.out_chunks=function(chunks)
{
	var r=[];
	
	for(var n in chunks)
	{
		if(n=="__flags__") // special flags chunk name
		{
		}
		else
		{
			var v=chunks[n];
			var f=chunks.__flags__;
			if(f){f=f[n];}
			r.push("#"+n);
			if(f) // and we need to include flags
			{
				for(var fn in f)
				{
					if(fn && f[fn])
					{
						r.push(" "+fn+"="+f[fn]);
					}
				}
			}
			else
			{
				r.push("\n");
			}
			str.split("\n").forEach(function(l){
				if(l[0]=="#") { r.push("#"); } // use double escape
				r.push(l);
				r.push("\n");
			});
		}
	}

	return r.join("");
}

// break a string on {data} ready to replace
plate.prepare=function(str)
{
	if(!str) { return undefined; }

	var aa=str.split("{");
	var ar=[];
	
	ar.push(aa[0]);
	for(var i=1;i<aa.length;i++)
	{
		var av=aa[i].split("}");
		if(av.length>=2)
		{
			ar.push("{"); // this string is used to mark the following string as something to replace
			ar.push(av[0]);
			ar.push(av[1]);
			for(var j=2;j<av.length;j++) // multiple close tags?
			{
				ar.push("}"+av[j]); // then missing open so just leave it as it was
			}
		}
		else
		{
			ar.push("{"+aa[i]); // missing close so just leave it as it was
		}
	}
	return ar;
}



plate.namespaces=[]; // array of public namespaces to lookup in

// clear namespace
plate.reset_namespace=function()
{
	plate.namespaces=[];
}

// add this dat into the namespaces that we also check when filling in chunks
plate.push_namespace=function(dat)
{
	if(dat)
	{
		plate.namespaces.push(dat);
	}
}

// remove last namespace from top of stack
plate.pop_namespace=function()
{
	return plate.namespaces.pop();
}

// lookup a str in dat or namespace
plate.lookup=function(str,dat)
{
	var r;
	if(dat) { r=plate.lookup_single(str,dat); if(r!==undefined) { return r; } } // check dat first
	for(var i=plate.namespaces.length-1;i>=0;i--) // last added has priority
	{ 
		r=plate.lookup_single(str,plate.namespaces[i]); if(r!==undefined) { return r; } // then look in all namespaces
	}
}
// lookup only in dat
plate.lookup_single=function(str,dat)
{
	if( dat[str] !== undefined ) // simple check
	{
		return dat[str];
	}
	//todo add sub array . notation split and lookup
	var i=str.indexOf('.');
	if(i>=0)
	{
		var a1=str.substring(0,i);
		if("object" == typeof dat[a1] ) // try a sub lookup 
		{
			var a2=str.substring(i+1);
			return plate.lookup_single(a2,dat[a1])
		}
	}
}

// replace once only, using dat and any added namespaces
plate.replace_once=function(str,dat)
{
	var aa=plate.prepare(str);
	
	if(!aa) { return str; }
	
	var r=[];
	
	for(var i=0;i<aa.length;i++)
	{
		var v=aa[i];
		if( v=="{" ) // next string should be replaced
		{
			i++;
			v=aa[i];
			var v2 = v.split(":");
			if( v2[1] ) // have a : split, need both data and plate
			{
				var d=plate.lookup( v2[0],dat );
				var p=plate.lookup( v2[1],dat );
				if( ("object" == typeof d) && ("string" == typeof p) )
				{
					var dp=[];
					if(d.length) // apply plate to all objects in array
					{
						for(var ii=0;ii<d.length;ii++)
						{
							dp.push( plate.replace_once(p,{it:d[ii],idx:ii+1}) );
						}
					}
					else // just apply plate to this object
					{
						dp.push( plate.replace_once(p,{it:d,idx:1}) );
					}
					r.push( dp.join("") ); // join and push
				}
				else // fail lookup
				{
					r.push( "{"+v+"}" );
				}
			}
			else
			{
				var d=plate.lookup( v,dat );
				if( d == undefined )
				{
					r.push( "{"+v+"}" );
				}
				else // fail lookup
				{
					r.push( d );
				}
			}
		}
		else
		{
			r.push(v);
		}
	}

	return r.join("");
}

// repeatedly replace untill all things that can expand, have expanded, or we ran out of sanity
plate.replace=function(str,arr)
{
	var check="";
	var sanity=100;
	while( str != check) //nothing changed on the last iteration so we are done
	{
		check=str;
		str=plate.replace_once(str,arr);
		if(--sanity<0) { break; }
	}
	
	return str;
}


