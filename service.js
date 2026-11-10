/* TizenBrew TV-local catalog transport. Compatible with its Node 4 runtime. */
'use strict';
var http=require('http'),https=require('https'),url=require('url');
var PORT=39971,LIMIT=5*1024*1024;
function allowed(value){var p=url.parse(value);return p.protocol==='https:'&&!p.auth&&!p.port&&['tamilgun.now','www.1tamilblasters.blog','1tamilblasters.blog'].indexOf((p.hostname||'').toLowerCase())!==-1;}
function retrieve(value,depth,done){
    if(!allowed(value))return done(new Error('Unsupported catalog host'),403);
    var called=false;function finish(error,status,body){if(called)return;called=true;done(error,status,body);}
    var options=url.parse(value);options.rejectUnauthorized=true;options.headers={'User-Agent':'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.5) CinemaTV/1.0','Accept':'text/html,application/xhtml+xml','Accept-Encoding':'identity'};
    var request=https.get(options,function(response){
        if(response.statusCode>=300&&response.statusCode<400&&response.headers.location){response.resume();if(depth>=4)return finish(new Error('Too many redirects'),502);return retrieve(url.resolve(value,response.headers.location),depth+1,finish);}
        var chunks=[],length=0;response.on('data',function(chunk){length+=chunk.length;if(length>LIMIT){response.destroy();finish(new Error('Page too large'),502);return;}chunks.push(chunk);});response.on('end',function(){finish(null,response.statusCode,Buffer.concat(chunks).toString('utf8'));});response.on('error',function(e){finish(e,502);});
    });request.setTimeout(18000,function(){request.abort();finish(new Error('Catalog timeout'),504);});request.on('error',function(e){finish(e,502);});
}
var server=http.createServer(function(req,res){
    var origin=req.headers.origin;if(origin==='http://127.0.0.1:8081'||origin==='http://localhost:8081'||origin==='null')res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Vary','Origin');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    if(req.method!=='GET'){res.statusCode=405;res.end('GET only');return;}
    var p=url.parse(req.url,true);if(p.pathname==='/health'){res.setHeader('Content-Type','application/json');res.end('{"app":"cinema-tv","version":"1.0.0"}');return;}
    if(p.pathname!=='/page'||typeof p.query.url!=='string'||!allowed(p.query.url)){res.statusCode=403;res.end('Unsupported catalog URL');return;}
    retrieve(p.query.url,0,function(error,status,body){if(res.finished)return;res.statusCode=status||502;res.setHeader('Content-Type','text/html; charset=utf-8');res.end(error?'Catalog request failed':body);});
});
server.on('error',function(error){console.error('Cinema TV catalog service:',error.message);});server.listen(PORT,'127.0.0.1');
module.exports={server:server,allowed:allowed};
