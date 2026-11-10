(function(){'use strict';
var C=window.CinemaCore,$=function(id){return document.getElementById(id);},feeds={},active=null,source=read('source','gun'),tab='Home',category='All',query='',delay=null,detailMovie=null,detailOrigin=null,detailToken=0,playerToken=0,players=[],playing=null,playerIndex=0,gridNodes={},gridMetric=null,toastTimer=null,saved=read('saved',[]),lastFocus=null;
if(!C.sources[source])source='gun';
function read(key,fallback){try{return JSON.parse(localStorage.getItem('cinemaTV:'+key))||fallback;}catch(e){return fallback;}}
function write(key,value){try{localStorage.setItem('cinemaTV:'+key,JSON.stringify(value));}catch(e){}}
function element(tag,className,value){var n=document.createElement(tag);if(className)n.className=className;if(value!==undefined)n.textContent=value;return n;}
function button(label,fn,className){var n=element('button',className||'',label);n.addEventListener('click',fn);return n;}
function namedButton(label,fn,className,key){var n=button(label,fn,className);n.setAttribute('data-focus',key);return n;}
function focusKey(){return document.activeElement&&document.activeElement.getAttribute('data-focus');}
function restoreFocus(key){if(key){var n=document.querySelector('[data-focus="'+key+'"]');if(n)n.focus();}}
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(function(){$('toast').classList.remove('visible');},4500);}
function requestText(url){return new Promise(function(resolve,reject){var xhr=new XMLHttpRequest();xhr.open('GET',url,true);xhr.timeout=18000;xhr.onload=function(){if(xhr.status>=200&&xhr.status<300){if(xhr.responseText.length>5000000)return reject(Error('Page too large'));resolve(xhr.responseText);}else reject(Error('HTTP '+xhr.status));};xhr.onerror=function(){reject(Error('Network request failed'));};xhr.ontimeout=function(){reject(Error('Connection timed out'));};xhr.send();});}
var bridgeReady=null;
function ensureBridge(){if(bridgeReady)return bridgeReady;bridgeReady=new Promise(function(resolve,reject){var attempts=0;function check(){requestText('http://127.0.0.1:39971/health').then(function(body){var info=JSON.parse(body);if(info.app!=='cinema-tv')throw Error('Unexpected TV service');resolve();}).catch(function(){if(++attempts>=20){bridgeReady=null;reject(Error('TV service unavailable'));}else setTimeout(check,500);});}check();});return bridgeReady;}
function getHtml(url){if(location.hostname==='127.0.0.1'||location.hostname==='localhost')return ensureBridge().then(function(){return requestText('http://127.0.0.1:39971/page?url='+encodeURIComponent(url));});return requestText(url);}
function movieSource(m){return C.sources[m.source]||C.sourceOf(m.url);}
function meta(m){return [movieSource(m).name,m.year,m.category,m.quality].filter(Boolean).join('  •  ');}
function isSaved(m){return saved.some(function(x){return x.url===m.url;});}
function toggleSaved(m){if(isSaved(m))saved=saved.filter(function(x){return x.url!==m.url;});else saved.unshift(m);write('saved',saved);$('detail-save').textContent=isSaved(m)?'✓ In My List':'＋ My List';toast(isSaved(m)?'Added to My List':'Removed from My List');if(tab==='My List')renderLibrary();}
function feed(){var first=query?C.sources[source].root+'?s='+encodeURIComponent(query):C.catalogUrl(source,category),key=source+'|'+category+'|'+query;if(!feeds[key])feeds[key]=new C.Feed(first);return feeds[key];}
function drawChrome(){
    $('sources').textContent='';Object.keys(C.sources).forEach(function(id){$('sources').appendChild(namedButton(C.sources[id].name,function(){if(source===id)return;source=id;write('source',id);category='All';query='';$('search').value='';showCatalog();},source===id?'selected':'','source:'+id));});
    $('navigation').textContent='';['Home','Search','My List'].forEach(function(name){$('navigation').appendChild(namedButton((name==='Home'?'⌂  ':name==='Search'?'⌕  ':'♡  ')+name,function(){tab=name;if(name==='Home'){query='';$('search').value='';}if(name==='My List')renderLibrary();else showCatalog();if(name==='Search')$('search').focus();},tab===name?'selected':'','tab:'+name));});
    $('source-caption').textContent=C.sources[source].name.toUpperCase()+'  /  SAMSUNG TV';$('heading').textContent=tab==='My List'?'My List':query?'Search results':'Discover';$('search').placeholder='Search '+C.sources[source].name;
    $('filters').textContent='';if(tab!=='My List'&&!query)C.sources[source].categories.forEach(function(name){$('filters').appendChild(namedButton(name,function(){category=name;showCatalog();},category===name?'selected':'','filter:'+name));});
}
function showCatalog(){
    var focused=focusKey();clearTimeout(delay);if(tab==='My List')tab='Home';active=feed();drawChrome();$('list-title').textContent=query?'Results for “'+query+'”':category==='All'?'Explore all titles':category;
    clearGrid();renderHero();renderGrid();$('scroller').scrollTop=active.scroll||0;renderGrid();updateMore();restoreFocus(focused);if(!active.pages&&!active.busy&&!active.error)loadNext();
}
function renderLibrary(){var focused=focusKey();active={items:saved,next:'',busy:false,error:'',pages:1};drawChrome();$('list-title').textContent='Saved from both catalogs';$('hero').textContent='';clearGrid();$('scroller').scrollTop=0;renderGrid();updateMore();restoreFocus(focused);}
function renderHero(){
    $('hero').textContent='';if(query||tab==='My List'||!active.items.length)return;
    var m=active.items[0],box=element('div','feature');if(m.image){var art=element('img');art.src=m.image;art.alt='';art.onerror=function(){art.remove();};box.appendChild(art);}
    var content=element('div','feature-content');content.appendChild(element('div','eyebrow','FEATURED IN '+C.sources[source].name.toUpperCase()));content.appendChild(element('h2','',m.title));content.appendChild(element('p','',meta(m)));content.appendChild(button('▶  Play',function(){openPlayer(m);},'primary'));content.appendChild(button('More info',function(){openDetail(m);}));box.appendChild(content);$('hero').appendChild(box);
}
function clearGrid(){$('grid').textContent='';gridNodes={};gridMetric=null;}
function metrics(){var width=$('grid').clientWidth,cols=window.innerWidth>=1550?5:4,gap=24,w=(width-gap*(cols-1))/cols,h=Math.round(w*1.27)+92;return {cols:cols,gap:gap,w:w,h:h,row:h+24};}
function makeCard(m,index,g){
    var card=button('',function(){openDetail(m);},'card');card.dataset.index=index;card.setAttribute('aria-label',m.title+', '+meta(m));card.style.width=g.w+'px';card.style.height=g.h+'px';
    var poster=element('div','poster');poster.style.height=Math.round(g.w*1.27)+'px';if(m.image){var img=element('img');img.alt='';img.src=m.image;img.onerror=function(){img.style.display='none';};poster.appendChild(img);}if(m.quality)poster.appendChild(element('span','badge',m.quality));card.appendChild(poster);card.appendChild(element('strong','card-title',m.title));card.appendChild(element('span','card-meta',meta(m)));return card;
}
function renderGrid(focusIndex){
    if(!active)return;var g=metrics(),total=active.items.length,rows=Math.ceil(total/g.cols),scroller=$('scroller'),grid=$('grid');
    var changed=!gridMetric||g.cols!==gridMetric.cols||Math.abs(g.w-gridMetric.w)>1;if(changed){grid.textContent='';gridNodes={};}gridMetric=g;grid.style.height=rows*g.row+'px';
    var gridTop=grid.getBoundingClientRect().top-scroller.getBoundingClientRect().top+scroller.scrollTop;
    var row=Math.max(0,Math.floor((scroller.scrollTop-gridTop)/g.row)-2);if(typeof focusIndex==='number')row=Math.max(0,Math.floor(focusIndex/g.cols)-2);
    var end=Math.min(rows,row+Math.ceil(scroller.clientHeight/g.row)+6),start=row*g.cols,limit=Math.min(total,end*g.cols),focused=document.activeElement;
    Object.keys(gridNodes).forEach(function(key){var index=Number(key),node=gridNodes[key];if((index<start||index>=limit)&&node!==focused){node.remove();delete gridNodes[key];}});
    for(var i=start;i<limit;i++)if(!gridNodes[i]){var n=makeCard(active.items[i],i,g);n.style.left=(i%g.cols)*(g.w+g.gap)+'px';n.style.top=Math.floor(i/g.cols)*g.row+'px';gridNodes[i]=n;grid.appendChild(n);}
}
function focusMovie(index){if(!active||index<0||index>=active.items.length)return;renderGrid(index);var n=gridNodes[index];if(n){n.focus();n.scrollIntoView({block:'nearest',inline:'nearest'});}}
function updateMore(){if(!active)return;var message=active.busy?(active.pages?'Loading more titles…':query?'Searching the source…':'Loading titles…'):active.error?active.error+'  ·  Select to retry':!active.next?(active.items.length?'End of catalog  •  '+active.items.length+' titles':tab==='My List'?'Save titles using ＋ My List.':'No titles found. Try another search.'):'Keep scrolling  •  '+active.items.length+' titles loaded';$('more').textContent=message;$('more').disabled=active.busy||(!active.next&&!active.error);}
function loadNext(){
    if(!active||tab==='My List')return Promise.resolve();var f=active,r=f.begin();if(!r)return Promise.resolve();updateMore();
    return getHtml(r.url).then(function(html){return f.complete(r,C.parsePage(html,r.url));}).catch(function(e){return f.fail(r,/403/.test(e.message)?'The source denied this request. You can browse another catalog or retry later.':'Couldn’t load this page. Check your connection and retry.');}).then(function(accepted){
        if(!accepted||active!==f)return;var first=f.pages===1;if(first)renderHero();renderGrid();updateMore();if(!f.error)requestAnimationFrame(maybeMore);
    });
}
function maybeMore(){if(!active||active.busy||active.error||!active.next||tab==='My List'||!$('details').hidden||!$('player').hidden)return;var s=$('scroller');if(s.scrollTop+s.clientHeight>=s.scrollHeight-350)loadNext();}
$('scroller').addEventListener('scroll',function(){if(active)active.scroll=$('scroller').scrollTop;requestAnimationFrame(function(){renderGrid();maybeMore();});});
function submitSearch(){tab=query?'Search':'Home';category='All';showCatalog();}
$('search').addEventListener('input',function(){clearTimeout(delay);var value=this.value.trim();delay=setTimeout(function(){query=value;submitSearch();},500);});
$('search-go').onclick=function(){clearTimeout(delay);query=$('search').value.trim();submitSearch();$('search').blur();};
$('refresh').onclick=function(){if(tab==='My List'){renderLibrary();return;}active.reset();active.scroll=0;$('scroller').scrollTop=0;clearGrid();renderHero();renderGrid();loadNext();};$('more').onclick=loadNext;
function openDetail(m){
    lastFocus=document.activeElement;detailOrigin=m;detailMovie=m;var token=++detailToken;$('details').hidden=false;$('detail-title').textContent=m.title;$('detail-source').textContent=movieSource(m).name.toUpperCase();$('detail-meta').textContent=meta(m);$('detail-image').src=m.image||'';$('detail-image').onerror=function(){this.style.opacity='0';};$('detail-image').style.opacity='';$('detail-description').textContent='Loading description…';$('detail-save').textContent=isSaved(m)?'✓ In My List':'＋ My List';$('detail-play').focus();
    getHtml(m.url).then(function(html){if(token!==detailToken)return;var d=C.parseDetail(html,m.url);$('detail-description').textContent=d.description||'Open the player to explore this title.';m._players=d.sources;}).catch(function(){if(token===detailToken)$('detail-description').textContent='Description unavailable. You can still try Play in app.';});
}
function closeDetail(){++detailToken;$('details').hidden=true;detailMovie=null;if(lastFocus&&lastFocus.isConnected)lastFocus.focus();}
$('detail-back').onclick=closeDetail;$('detail-save').onclick=function(){if(detailMovie)toggleSaved(detailMovie);};$('detail-play').onclick=function(){if(detailMovie)openPlayer(detailMovie);};
function stopPlayback(){var video=$('player-stage').querySelector('video');if(video){try{write('position:'+playing.url,video.currentTime);video.pause();video.removeAttribute('src');video.load();}catch(e){}}$('player-stage').textContent='';try{if(window.webapis&&webapis.appcommon)webapis.appcommon.setScreenSaver(0);}catch(e){}}
function openPlayer(m){
    if($('details').hidden)lastFocus=document.activeElement;++playerToken;var token=playerToken;playing=m;players=[];playerIndex=0;$('player').hidden=false;$('player-title').textContent=m.title;$('player-sources').textContent='';$('player-status').textContent='Finding available players…';$('player-back').focus();
    function prepared(list){if(token!==playerToken)return;players=list.slice();players.push({url:m.url,video:false,website:true});$('player-sources').textContent='';players.forEach(function(p,i){$('player-sources').appendChild(button(p.website?'Website':p.video?'Video '+(i+1):'Player '+(i+1),function(){choosePlayer(i);},i===0?'selected':''));});choosePlayer(0);}
    if(m._players)prepared(m._players);else getHtml(m.url).then(function(html){var d=C.parseDetail(html,m.url);m._players=d.sources;prepared(d.sources);}).catch(function(){prepared([]);});
}
function choosePlayer(index){
    stopPlayback();playerIndex=index;var p=players[index];if(!p)return;Array.prototype.forEach.call($('player-sources').children,function(n,i){n.classList.toggle('selected',i===index);});
    if(p.video){var video=element('video');video.controls=true;video.autoplay=true;video.src=p.url;video.addEventListener('loadedmetadata',function(){var position=read('position:'+playing.url,0);if(position>0&&position<video.duration-10)video.currentTime=position;});video.addEventListener('error',function(){$('player-status').textContent='This source could not play. Choose another player.';});$('player-stage').appendChild(video);$('player-status').textContent='OK / Play-Pause to control playback · Return to go back';}
    else{var frame=element('iframe');frame.src=p.url;frame.title=playing.title;frame.allow='autoplay; fullscreen; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.tabIndex=0;$('player-stage').appendChild(frame);$('player-status').textContent='Select Enter player, then use its Play control. The Rii pointer can help with mouse-only players.';}
    try{if(window.webapis&&webapis.appcommon)webapis.appcommon.setScreenSaver(1);}catch(e){}
}
$('player-retry').onclick=function(){choosePlayer(playerIndex);};$('player-enter').onclick=function(){var media=$('player-stage').firstElementChild;if(media){media.focus();if(media.tagName==='VIDEO')media.play().catch(function(){});}};
function closePlayer(){++playerToken;stopPlayback();$('player').hidden=true;playing=null;if(!$('details').hidden)$('detail-play').focus();else if(lastFocus&&lastFocus.isConnected)lastFocus.focus();else $('search-go').focus();}
$('player-back').onclick=closePlayer;
function leave(){try{if(location.pathname.indexOf('/module/')!==-1||window.__CINEMA_TV_PREVIEW__){location.href='file:///tizenbrew-ui/dist/index.html/';return;}if(window.tizen){tizen.application.getCurrentApplication().exit();return;}}catch(e){}history.back();}
$('leave').onclick=function(){$('exit-dialog').hidden=false;$('exit-cancel').focus();};$('exit-cancel').onclick=function(){$('exit-dialog').hidden=true;$('leave').focus();};$('exit-confirm').onclick=leave;
function back(){if(!$('exit-dialog').hidden){$('exit-dialog').hidden=true;$('leave').focus();}else if(!$('player').hidden)closePlayer();else if(!$('details').hidden)closeDetail();else if(tab!=='Home'||query){tab='Home';query='';category='All';$('search').value='';showCatalog();$('sources').firstElementChild.focus();}else $('leave').click();}
function candidates(){var scope=!$('exit-dialog').hidden?$('exit-dialog'):!$('player').hidden?$('player-toolbar'):!$('details').hidden?$('details'):document;return Array.prototype.filter.call(scope.querySelectorAll('button,input,iframe,video'),function(n){var r=n.getBoundingClientRect();return !n.disabled&&r.width>0&&r.height>0;});}
function spatial(code){var current=document.activeElement,rect=current.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2,best=null,score=Infinity;candidates().forEach(function(n){if(n===current)return;var r=n.getBoundingClientRect(),dx=r.left+r.width/2-cx,dy=r.top+r.height/2-cy,primary=code===37?-dx:code===39?dx:code===38?-dy:dy,cross=(code===37||code===39)?Math.abs(dy):Math.abs(dx);if(primary<5)return;var s=primary+cross*3;if(s<score){score=s;best=n;}});if(best){best.focus();if(best.classList.contains('card'))best.scrollIntoView({block:'nearest'});}}
document.addEventListener('keydown',function(e){
    var code=e.keyCode;
    if(code===10009||code===27||code===8&&document.activeElement!==$('search')){e.preventDefault();back();return;}
    if(document.activeElement===$('search')){if(code===13){e.preventDefault();$('search-go').click();$('search-go').focus();}else if(code===40){e.preventDefault();$('search').blur();if(active.items.length)focusMovie(0);else $('search-go').focus();}return;}
    if(![37,38,39,40,13,415,19,10252,413,417,412].includes(code))return;
    if(code===415||code===19||code===10252||code===413||code===417||code===412){var v=$('player-stage').querySelector('video');if(v){e.preventDefault();if(code===417||code===412)v.currentTime=Math.max(0,v.currentTime+(code===417?10:-10));else if(code===19||code===413)v.pause();else if(v.paused)v.play();else v.pause();}return;}
    if(code===13){if(document.activeElement.tagName!=='VIDEO'){e.preventDefault();document.activeElement.click();}return;}
    e.preventDefault();var current=document.activeElement;if(current.classList.contains('card')&&$('details').hidden&&$('player').hidden){var index=Number(current.dataset.index),cols=gridMetric.cols,next=index+(code===40?cols:code===38?-cols:code===39?1:-1);if(code===37&&index%cols===0){$('navigation').firstElementChild.focus();return;}if(next<0){if($('filters').firstElementChild)$('filters').firstElementChild.focus();else $('search-go').focus();return;}if(next<active.items.length)focusMovie(next);else if(active.next&&!active.error)loadNext().then(function(){focusMovie(Math.min(next,active.items.length-1));});return;}spatial(code);
},true);
document.addEventListener('tizenhwkey',function(e){if(e.keyName==='back')back();});
document.addEventListener('visibilitychange',function(){if(document.hidden&&!$('player').hidden)closePlayer();});
window.addEventListener('resize',function(){renderGrid();});
try{if(window.tizen&&tizen.tvinputdevice)['MediaPlay','MediaPause','MediaPlayPause','MediaStop','MediaRewind','MediaFastForward'].forEach(function(k){try{tizen.tvinputdevice.registerKey(k);}catch(e){}});}catch(e){}
window.CinemaTV={state:function(){return {source:source,tab:tab,query:query,pages:active?active.pages:0,loaded:active?active.items.length:0,next:active?active.next:'',busy:active?active.busy:false,error:active?active.error:'',visibleCards:Object.keys(gridNodes).length,details:!$('details').hidden,player:!$('player').hidden};},selectSource:function(id){source=id;query='';category='All';$('search').value='';tab='Home';showCatalog();},loadNext:loadNext,search:function(value){query=value;$('search').value=value;submitSearch();},focusMovie:focusMovie,openDetail:function(index){openDetail(active.items[index]);},closeDetail:closeDetail,closePlayer:closePlayer};
showCatalog();$('sources').querySelector('.selected').focus();
})();
