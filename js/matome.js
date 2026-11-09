/* 浄土真宗本願寺派matome 表示スクリプト */
(function(){
'use strict';
var DEFAULT_DATA_URL='https://raw.githubusercontent.com/senmyouji/hongwanji-matome/main/data/items.json';
var MEIKAN_URL='https://senmyouji.or.jp/shinshu-hp/';
var CONTACT_URL='https://senmyouji.or.jp/contact/';
var TOP_PER_CAT=3;               /* トップの各欄の件数（1寺1件） */
var NO_TEMPLE_PREFS=['秋田県','山形県']; /* 名鑑に県見出しが無い（寺が無い）県 */
/* ?data= で差し替えてよい取得元（同じオリジンと、以下のもの） */
var DATA_ALLOW=[
  {origin:'https://raw.githubusercontent.com',path:'/senmyouji/'},
  {origin:'https://cdn.jsdelivr.net',path:'/gh/senmyouji/'}
];

var REGIONS=[
  {label:'北海道・東北',prefs:['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県']},
  {label:'関東',prefs:['茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県']},
  {label:'中部',prefs:['新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県']},
  {label:'近畿',prefs:['三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県']},
  {label:'中国',prefs:['鳥取県','島根県','岡山県','広島県','山口県']},
  {label:'四国',prefs:['徳島県','香川県','愛媛県','高知県']},
  {label:'九州・沖縄',prefs:['福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県']}
];
/* 県番号は temple-list.js と同じ（北海道=01 … 沖縄県=47） */
var ALL_PREFS=[];
REGIONS.forEach(function(r){ALL_PREFS=ALL_PREFS.concat(r.prefs);});
var PREF_SHORT={};
ALL_PREFS.forEach(function(p){if(p!=='北海道')PREF_SHORT[p.replace(/[都府県]$/,'')]=p;});

var NOW=new Date(); /* 試験のときだけ ?today= で差し替える */

var CSS=[
  '#hm-unofficial{margin:0 0 1.2em;padding:.8em 1em;border:1px solid #d8d2c4;border-radius:6px;background:#faf8f3;font-size:.88em;line-height:1.7;color:#444}',
  '#hm-unofficial a{text-decoration:underline}',
  '#hm-regions{margin:2em 0 0;padding:1em 1.1em;border:1px solid #e3ded2;border-radius:8px}',
  '#hm-regions .hmg-title{font-weight:bold;font-size:1.05em;margin:0 0 .3em}',
  '#hm-regions .hmg-lead{font-size:.85em;color:#666;margin:0 0 .8em}',
  '#hm-regions .hmg-region{margin:0 0 .7em}',
  '#hm-regions .hmg-label{font-size:.85em;font-weight:bold;color:#555;margin:0 0 .3em}',
  '#hm-regions ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:.4em}',
  '#hm-regions li{margin:0;padding:0;list-style:none}',
  '#hm-regions li a{display:inline-block;padding:.25em .75em;border:1px solid #d8d2c4;border-radius:999px;font-size:.88em;text-decoration:none}'
].join('');

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function pad2(n){return ('0'+n).slice(-2);}
function ymd(t){return t.getFullYear()+'-'+pad2(t.getMonth()+1)+'-'+pad2(t.getDate());}
function todayStr(){return ymd(NOW);}
function isYmd(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s);}
function fmtD(d){return d?String(d).replace(/-/g,'.'):'';}
function daysAgo(d){var t=new Date(d+'T00:00:00');return (NOW-t)/86400000;}
function isNew(d){return d&&daysAgo(d)<=3;}
function jpDate(d){if(!d)return'';var t=new Date(d+'T00:00:00');return (t.getMonth()+1)+'月'+t.getDate()+'日('+'日月火水木金土'.charAt(t.getDay())+')';}
function within(d,n){return d&&daysAgo(d)<=n;}
function bySortNew(a,b){return a.post_date<b.post_date?1:(a.post_date>b.post_date?-1:0);}
function blank(s){return String(s==null?'':s).replace(/[\s　]+/g,'')==='';}

/* 県名の略記（「富山」など）を正式名にそろえる */
function normPref(p){
  var s=String(p==null?'':p).replace(/[\s　]+/g,'');
  if(ALL_PREFS.indexOf(s)>=0)return s;
  if(PREF_SHORT.hasOwnProperty(s))return PREF_SHORT[s];
  return s;
}
/* 名鑑（shinshu-hp）の県見出しのid。寺の無い県・不明な県は '' */
function prefAnchor(pref){
  var i=ALL_PREFS.indexOf(pref);
  if(i<0||NO_TEMPLE_PREFS.indexOf(pref)>=0)return'';
  return 'hpj-p'+pad2(i+1);
}
/* 寺の判定：tid → 行 → 寺名＋県 */
function templeKey(it){
  if(it.tid!=null&&String(it.tid)!=='')return 'r:'+String(it.tid);
  if(it['行']!=null&&String(it['行'])!=='')return 'r:'+String(it['行']);
  return 'n:'+String(it.temple||'')+'|'+normPref(it.pref);
}
function normTitle(t){return String(t==null?'':t).replace(/[\s　]+/g,' ').replace(/^ | $/g,'');}

/* 取得したデータの下ごしらえ：今日より後の post_date を除き、県名をそろえる */
function prepareItems(items,today){
  var out=[];
  (items||[]).forEach(function(it){
    if(!it||typeof it!=='object')return;
    if(!isYmd(it.post_date))return;
    if(it.post_date>today)return;
    var c={};
    for(var k in it){if(Object.prototype.hasOwnProperty.call(it,k))c[k]=it[k];}
    c.pref=normPref(it.pref);
    out.push(c);
  });
  return out;
}
/* 新しい順に並べた配列から、1寺1件で n 件まで */
function onePerTemple(arr,n){
  var seen={},out=[];
  for(var i=0;i<arr.length&&out.length<n;i++){
    var k=templeKey(arr[i]);
    if(seen[k])continue;
    seen[k]=true;out.push(arr[i]);
  }
  return out;
}
/* 新しい順に並べた配列から、同じ寺の同じ題を1件（最新）にまとめる */
function dedupSameTitle(arr){
  var seen={},out=[];
  arr.forEach(function(it){
    var k=templeKey(it)+'\n'+normTitle(it.title);
    if(seen[k])return;
    seen[k]=true;out.push(it);
  });
  return out;
}
function eventEnd(it){return it.event_until||it.event_date||'';}
/* 並べ替えの鍵。始まっている長い会期（8日以上。「11月の行事予定」など）は終わりの日で並べ、
   ひと月のあいだ先頭に居座らないようにする。短い会期中の行事は今日の扱い（2026-11-09） */
function eventSortKey(it,ts){
  var d=it.event_date;if(!d)return '';
  if(d<ts&&it.event_until&&daysBetween(d,it.event_until)>=7)return it.event_until;
  return d<ts?ts:d;
}
function daysBetween(a,b){return Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000);}
/* 開催の表示: 会期中なら「開催中（11月30日(月)まで）」、複数日なら「11月1日(日)〜11月3日(火) 開催」 */
function whenText(it){
  if(it.event_label)return it.event_label+' 開催';
  var d=it.event_date,u=it.event_until;
  if(u&&u!==d){
    if(d<todayStr())return '開催中（'+jpDate(u)+'まで）';
    return jpDate(d)+'〜'+jpDate(u)+' 開催';
  }
  return jpDate(d)+' 開催';
}
/* リンク先は http(s) だけ。それ以外（javascript: など）は '#' */
function safeUrl(u){var s=String(u==null?'':u).replace(/^[\s\x00-\x1f]+/,'');return /^https?:\/\//i.test(s)?s:'#';}

function itemHTML(it,opts){
  opts=opts||{};
  var h='<div class="hmi"><div class="hmi-meta">';
  h+='<span class="hmi-date">'+(opts.postLabel?'掲載 ':'')+fmtD(it.post_date)+'</span>';
  if(isNew(it.post_date))h+='<span class="hmi-new">NEW</span>';
  if(!blank(it.pref)||!blank(it.city))h+='<span class="hmi-area">'+esc(it.pref)+' '+esc(it.city)+'</span>';
  h+='<span class="hmi-temple">'+esc(it.temple)+'</span>';
  if(opts.when&&(it.event_label||it.event_date))h+='<span class="hmi-when">&#128197; '+esc(whenText(it))+'</span>';
  h+='</div><h3><a href="'+esc(safeUrl(it.url))+'" target="_blank" rel="noopener">'+esc(it.title)+'</a></h3>';
  if(!blank(it.desc))h+='<p class="hmi-desc">'+esc(it.desc)+'</p>';
  return h+'</div>';
}
function setText(id,t){var e=document.getElementById(id);if(e)e.textContent=t;}
function showCommon(data,testMode){
  if(data.notice){var n=document.getElementById('hm-notice');if(n){n.textContent=data.notice;n.style.display='block';}}
  setText('hm-updated','最終更新：'+data.updated+(testMode?'（試験用データ）':''));
  var l=document.getElementById('hm-loading');if(l)l.style.display='none';
}

/* ---- 各ページのHTMLを作る（DOMに触れない） ---- */
function buildMain(items){
  var out={};
  ['houwa','event','houkoku','jihou'].forEach(function(cat){
    /* 行事は開催日の近い順（今日以降・会期中を含む。日付未定は後ろ）、他は掲載日の新しい順 */
    var sorted=(cat==='event')?eventsForPref(items,'ALL'):items.filter(function(i){return i.cat===cat;}).sort(bySortNew);
    var arr=onePerTemple(sorted,TOP_PER_CAT);
    out[cat]=arr.length?arr.map(function(i){return itemHTML(i,{when:cat==='event'});}).join('')
      :'<p class="hm-empty" style="color:#999;">現在、新しいお知らせはありません。<a href="#hm-regions">地域からお寺を探す</a></p>';
  });
  return out;
}
function buildList(items,cat,days){
  var arr=dedupSameTitle(items.filter(function(i){return i.cat===cat&&within(i.post_date,days);}).sort(bySortNew));
  return arr.length?arr.map(function(i){return itemHTML(i);}).join(''):'<p style="color:#999;">直近'+days+'日の新着はありません。</p>';
}
function buildEventsNew(items){
  var arr=items.filter(function(i){return i.cat==='event';}).sort(bySortNew).slice(0,50);
  return arr.length?arr.map(function(i){return itemHTML(i,{when:true,postLabel:true});}).join(''):'<p style="color:#999;">現在、掲載中のイベントはありません。</p>';
}
function buildEventsDate(items){
  var today=new Date(NOW.getTime());today.setHours(0,0,0,0);
  var ts=todayStr();
  var arr=items.filter(function(i){return i.cat==='event'&&i.event_date&&eventEnd(i)>=ts;});
  arr.sort(function(a,b){return a.event_date<b.event_date?-1:(a.event_date>b.event_date?1:0);});
  var h='',cur='';
  arr.forEach(function(it){
    var t=new Date(it.event_date+'T00:00:00');
    var mkey=t.getFullYear()+'年'+(t.getMonth()+1)+'月';
    if(mkey!==cur){h+='<div class="hmv-month">'+mkey+'</div>';cur=mkey;}
    var soon=(t-today)/86400000<=7;
    h+='<div class="hmv"><div class="hmv-box"><div class="m">'+(t.getMonth()+1)+'月</div><div class="d">'+t.getDate()+'</div><div class="w">('+'日月火水木金土'.charAt(t.getDay())+')</div></div><div class="hmv-body"><div class="hmi-meta">';
    if(soon)h+='<span class="hmv-soon">まもなく</span>';
    if(!blank(it.pref)||!blank(it.city))h+='<span class="hmi-area">'+esc(it.pref)+' '+esc(it.city)+'</span>';
    h+='<span class="hmi-temple">'+esc(it.temple)+'</span>';
    if(it.event_label)h+='<span class="hmi-when">'+esc(it.event_label)+'</span>';
    h+='</div><h3><a href="'+esc(safeUrl(it.url))+'" target="_blank" rel="noopener">'+esc(it.title)+'</a></h3>';
    if(!blank(it.desc))h+='<p class="hmi-desc">'+esc(it.desc)+'</p>';
    h+='</div></div>';
  });
  return h||'<p style="color:#999;">現在、開催予定のイベントはありません。</p>';
}

/* ---- 非公式の表示と連絡先（全ページ・取得の前に出す） ---- */
function unofficialHTML(){
  return '専明寺が運営する非公式の新着案内です。本願寺派（本山）とは関係ありません。'
    +'著作権は各寺院にあり、本文は各寺院のHPでお読みください。'
    +'掲載停止・訂正は<a href="'+CONTACT_URL+'">専明寺のお問い合わせ</a>へ（3日以内に対応）。';
}
/* ---- 地域の入口（44都道府県 → 名鑑の県見出し） ---- */
function regionNavHTML(){
  var h='<p class="hmg-title">地域からお寺を探す</p>'
    +'<p class="hmg-lead">ホームページのある本願寺派寺院の一覧（都道府県別）へ移動します。</p>';
  REGIONS.forEach(function(region){
    var lis='';
    region.prefs.forEach(function(pref){
      var a=prefAnchor(pref);
      if(!a)return;
      lis+='<li><a href="'+MEIKAN_URL+'#'+a+'">'+esc(pref)+'</a></li>';
    });
    if(lis)h+='<div class="hmg-region"><p class="hmg-label">'+esc(region.label)+'</p><ul>'+lis+'</ul></div>';
  });
  return h;
}

/* ---- ?data= の取り扱い ---- */
function resolveDataUrl(param,baseHref){
  if(!param)return DEFAULT_DATA_URL;
  if(/[\u0000- \\]/.test(param))return DEFAULT_DATA_URL;
  var u,base;
  try{u=new URL(param,baseHref);base=new URL(baseHref);}catch(e){return DEFAULT_DATA_URL;}
  if(u.protocol!=='https:'&&u.protocol!=='http:')return DEFAULT_DATA_URL;
  if(u.origin===base.origin&&base.origin!=='null')return u.href;
  if(/^(localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname))return u.href;
  for(var i=0;i<DATA_ALLOW.length;i++){
    if(u.protocol==='https:'&&u.origin===DATA_ALLOW[i].origin&&u.pathname.indexOf(DATA_ALLOW[i].path)===0)return u.href;
  }
  return DEFAULT_DATA_URL;
}

/* ---- 都道府県別（erea） ---- */
function eventsForPref(items,pref){
  var ts=todayStr();
  return items.filter(function(i){
    if(i.cat!=='event')return false;
    if(pref&&pref!=='ALL'&&i.pref!==pref)return false;
    if(i.event_date&&eventEnd(i)<ts)return false;
    return true;
  }).sort(function(a,b){
    var da=eventSortKey(a,ts)||('9999-'+a.post_date.slice(5));
    var db=eventSortKey(b,ts)||('9999-'+b.post_date.slice(5));
    return da<db?-1:(da>db?1:0);
  });
}
/* 県ボタンの実リンク（他のクエリ、例えば ?data= は残す） */
function prefHref(pref,search,pathname){
  var p=new URLSearchParams(search||'');
  if(!pref||pref==='ALL')p['delete']('pref');else p.set('pref',pref);
  var q=p.toString();
  return pathname+(q?'?'+q:'');
}
function renderPrefNav(navEl,activePref){
  if(!navEl)return;
  var h='<div class="hmp-allrow"><a class="hmp-pill-all'+(activePref==='ALL'?' is-active':'')+'" href="'+esc(prefHref('ALL',location.search,location.pathname))+'" data-pref="ALL">すべてのエリアを表示</a></div>';
  REGIONS.forEach(function(region){
    h+='<div class="hmp-region"><div class="hmp-region-label">'+esc(region.label)+'</div><div class="hmp-pills">';
    region.prefs.forEach(function(pref){
      h+='<a class="hmp-pill'+(pref===activePref?' is-active':'')+'" href="'+esc(prefHref(pref,location.search,location.pathname))+'" data-pref="'+esc(pref)+'">'+esc(pref)+'</a>';
    });
    h+='</div></div>';
  });
  navEl.innerHTML=h;
}
function ereaListHTML(items,pref){
  var arr=eventsForPref(items,pref);
  var title=(!pref||pref==='ALL')?'すべてのエリアの行事予定':esc(pref)+' の行事予定';
  var h='<p class="hmp-results-title">'+title+'（'+arr.length+'件）</p>';
  h+=arr.length?arr.map(function(i){return itemHTML(i,{when:true});}).join(''):'<p style="color:#999;text-align:center;padding:30px 0;">現在、開催予定のイベント情報はありません。</p>';
  return h;
}
function currentPref(){
  var p=new URLSearchParams(window.location.search).get('pref');
  return p?normPref(p):'ALL';
}
function renderErea(data){
  var navEl=document.getElementById('pref-nav');
  var listEl=document.getElementById('list');
  if(!listEl)return;
  var activePref=currentPref();
  renderPrefNav(navEl,activePref);
  listEl.innerHTML=ereaListHTML(data.items,activePref);

  if(navEl&&!navEl._hmBound){
    navEl._hmBound=true;
    navEl.addEventListener('click',function(ev){
      var el=ev.target.closest?ev.target.closest('.hmp-pill,.hmp-pill-all'):null;
      if(!el)return;
      ev.preventDefault();
      var pref=el.getAttribute('data-pref');
      var url=prefHref(pref,location.search,location.pathname);
      if(window.history&&window.history.pushState)window.history.pushState({pref:pref},'',url);
      renderPrefNav(navEl,pref);
      listEl.innerHTML=ereaListHTML(data.items,pref);
      listEl.scrollIntoView({behavior:'smooth',block:'start'});
    });
    window.addEventListener('popstate',function(){
      var pref=currentPref();
      renderPrefNav(navEl,pref);
      listEl.innerHTML=ereaListHTML(data.items,pref);
    });
  }
}

/* ---- DOM への差し込み ---- */
function injectStyle(){
  if(document.getElementById('hm-matome-style'))return;
  var s=document.createElement('style');
  s.id='hm-matome-style';s.textContent=CSS;
  (document.head||document.documentElement).appendChild(s);
}
function byIds(ids){
  var out=[];
  ids.forEach(function(id){var e=document.getElementById(id);if(e)out.push(e);});
  return out;
}
function docOrder(a,b){return a===b?0:(a.compareDocumentPosition(b)&4?-1:1);}
function isHeading(e){return !!e&&/^H[1-4]$/.test(e.tagName);}
function placeUnofficial(marker){
  var box=document.getElementById('hm-unofficial');
  if(!box){
    var cands=[marker].concat(byIds(['hm-notice','hm-updated','hm-loading','list-houwa','pref-nav','list'])).sort(docOrder);
    var target=cands[0];
    if(target!==marker&&/^(list-houwa|pref-nav|list)$/.test(target.id)&&isHeading(target.previousElementSibling))target=target.previousElementSibling;
    box=document.createElement('p');
    box.id='hm-unofficial';
    target.parentNode.insertBefore(box,target);
  }
  box.innerHTML=unofficialHTML();
}
function placeRegionNav(pageType){
  if(pageType==='erea')return; /* erea は県ボタン（行事の絞り込み）を持つので出さない */
  var nav=document.getElementById('hm-regions');
  if(!nav){
    var cands=byIds(['list-houwa','list-event','list-houkoku','list-jihou','list']).sort(docOrder);
    if(!cands.length)return;
    var last=cands[cands.length-1];
    nav=document.createElement('nav');
    nav.id='hm-regions';
    nav.setAttribute('aria-label','地域からお寺を探す');
    /* 最後の一覧を含むブロックの末尾（「一覧へ」のリンクより後ろ）に置く */
    last.parentNode.appendChild(nav);
  }
  nav.innerHTML=regionNavHTML();
}

function boot(){
  var marker=document.getElementById('hm-page');
  if(!marker)return;
  var pageType=marker.getAttribute('data-page');
  var params=new URLSearchParams(window.location.search);
  var src=resolveDataUrl(params.get('data'),window.location.href);
  var testMode=src!==DEFAULT_DATA_URL;
  if(testMode&&isYmd(params.get('today')))NOW=new Date(params.get('today')+'T12:00:00');

  try{injectStyle();placeUnofficial(marker);placeRegionNav(pageType);}catch(e){}

  fetch(src,{cache:'no-cache'}).then(function(r){
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.json();
  }).then(function(raw){
    if(!raw||!Array.isArray(raw.items))throw new Error('bad data');
    var data={updated:raw.updated,notice:raw.notice,items:prepareItems(raw.items,todayStr())};
    showCommon(data,testMode);
    var el;
    if(pageType==='main'){
      var m=buildMain(data.items);
      ['houwa','event','houkoku','jihou'].forEach(function(cat){var e=document.getElementById('list-'+cat);if(e)e.innerHTML=m[cat];});
    }
    else if(pageType==='houwa'||pageType==='houkoku'||pageType==='jihou'){
      el=document.getElementById('list');
      if(el)el.innerHTML=buildList(data.items,pageType,pageType==='jihou'?60:30);
    }
    else if(pageType==='events-new'){el=document.getElementById('list');if(el)el.innerHTML=buildEventsNew(data.items);}
    else if(pageType==='events-date'){el=document.getElementById('list');if(el)el.innerHTML=buildEventsDate(data.items);}
    else if(pageType==='erea')renderErea(data);
  }).catch(function(e){
    setText('hm-loading','新着情報の読み込みに失敗しました。時間をおいて再度お開きください。');
  });
}

/* 試験用（Node から関数を読む）。ブラウザでは module が無いので何もしない */
if(typeof module==='object'&&module&&module.exports){
  module.exports={
    setNow:function(d){NOW=d;},todayStr:todayStr,
    normPref:normPref,prefAnchor:prefAnchor,templeKey:templeKey,normTitle:normTitle,
    prepareItems:prepareItems,onePerTemple:onePerTemple,dedupSameTitle:dedupSameTitle,
    itemHTML:itemHTML,safeUrl:safeUrl,buildMain:buildMain,buildList:buildList,buildEventsNew:buildEventsNew,
    buildEventsDate:buildEventsDate,eventsForPref:eventsForPref,ereaListHTML:ereaListHTML,
    prefHref:prefHref,unofficialHTML:unofficialHTML,regionNavHTML:regionNavHTML,
    resolveDataUrl:resolveDataUrl,DEFAULT_DATA_URL:DEFAULT_DATA_URL,ALL_PREFS:ALL_PREFS,
    REGIONS:REGIONS,NO_TEMPLE_PREFS:NO_TEMPLE_PREFS,whenText:whenText,eventSortKey:eventSortKey
  };
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
}
})();
