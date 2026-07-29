/* 浄土真宗本願寺派matome 表示スクリプト */
(function(){
'use strict';
var DATA_URL='https://raw.githubusercontent.com/senmyouji/hongwanji-matome/main/data/items.json';

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fmtD(d){return d?String(d).replace(/-/g,'.'):'';}
function daysAgo(d){var t=new Date(d+'T00:00:00');return (new Date()-t)/86400000;}
function isNew(d){return d&&daysAgo(d)<=3;}
function jpDate(d){if(!d)return'';var t=new Date(d+'T00:00:00');return (t.getMonth()+1)+'月'+t.getDate()+'日('+'日月火水木金土'.charAt(t.getDay())+')';}
function within(d,n){return d&&daysAgo(d)<=n;}
function bySortNew(a,b){return a.post_date<b.post_date?1:-1;}

function itemHTML(it,opts){
  opts=opts||{};
  var h='<div class="hmi"><div class="hmi-meta">';
  h+='<span class="hmi-date">'+(opts.postLabel?'掲載 ':'')+fmtD(it.post_date)+'</span>';
  if(isNew(it.post_date))h+='<span class="hmi-new">NEW</span>';
  h+='<span class="hmi-area">'+esc(it.pref)+' '+esc(it.city)+'</span>';
  h+='<span class="hmi-temple">'+esc(it.temple)+'</span>';
  if(opts.when&&(it.event_label||it.event_date))h+='<span class="hmi-when">&#128197; '+esc(it.event_label||jpDate(it.event_date))+' 開催</span>';
  h+='</div><h3><a href="'+esc(it.url)+'" target="_blank" rel="noopener">'+esc(it.title)+'</a></h3>';
  h+='<p class="hmi-desc">'+esc(it.desc)+'</p></div>';
  return h;
}
function setText(id,t){var e=document.getElementById(id);if(e)e.textContent=t;}
function showCommon(data){
  if(data.notice){var n=document.getElementById('hm-notice');if(n){n.textContent=data.notice;n.style.display='block';}}
  setText('hm-updated','最終更新：'+data.updated);
  var l=document.getElementById('hm-loading');if(l)l.style.display='none';
}

function renderMain(data){
  ['houwa','event','houkoku','jihou'].forEach(function(cat){
    var arr=data.items.filter(function(i){return i.cat===cat;}).sort(bySortNew).slice(0,5);
    var el=document.getElementById('list-'+cat);
    if(el)el.innerHTML=arr.length?arr.map(function(i){return itemHTML(i,{when:cat==='event'});}).join(''):'<p style="color:#999;">現在、新着はありません。</p>';
  });
}
function renderList(data,cat,days){
  var arr=data.items.filter(function(i){return i.cat===cat&&within(i.post_date,days);}).sort(bySortNew);
  var el=document.getElementById('list');
  if(el)el.innerHTML=arr.length?arr.map(function(i){return itemHTML(i);}).join(''):'<p style="color:#999;">直近'+days+'日の新着はありません。</p>';
}
function renderEventsNew(data){
  var arr=data.items.filter(function(i){return i.cat==='event';}).sort(bySortNew).slice(0,50);
  var el=document.getElementById('list');
  if(el)el.innerHTML=arr.length?arr.map(function(i){return itemHTML(i,{when:true,postLabel:true});}).join(''):'<p style="color:#999;">現在、掲載中のイベントはありません。</p>';
}
function renderEventsDate(data){
  var today=new Date();today.setHours(0,0,0,0);
  var arr=data.items.filter(function(i){return i.cat==='event'&&i.event_date&&new Date(i.event_date+'T00:00:00')>=today;});
  arr.sort(function(a,b){return a.event_date<b.event_date?-1:1;});
  var h='',cur='';
  arr.forEach(function(it){
    var t=new Date(it.event_date+'T00:00:00');
    var mkey=t.getFullYear()+'年'+(t.getMonth()+1)+'月';
    if(mkey!==cur){h+='<div class="hmv-month">'+mkey+'</div>';cur=mkey;}
    var soon=(t-today)/86400000<=7;
    h+='<div class="hmv"><div class="hmv-box"><div class="m">'+(t.getMonth()+1)+'月</div><div class="d">'+t.getDate()+'</div><div class="w">('+'日月火水木金土'.charAt(t.getDay())+')</div></div><div class="hmv-body"><div class="hmi-meta">';
    if(soon)h+='<span class="hmv-soon">まもなく</span>';
    h+='<span class="hmi-area">'+esc(it.pref)+' '+esc(it.city)+'</span><span class="hmi-temple">'+esc(it.temple)+'</span>';
    if(it.event_label)h+='<span class="hmi-when">'+esc(it.event_label)+'</span>';
    h+='</div><h3><a href="'+esc(it.url)+'" target="_blank" rel="noopener">'+esc(it.title)+'</a></h3><p class="hmi-desc">'+esc(it.desc)+'</p></div></div>';
  });
  var el=document.getElementById('list');
  if(el)el.innerHTML=h||'<p style="color:#999;">現在、開催予定のイベントはありません。</p>';
}

function boot(){
  var marker=document.getElementById('hm-page');
  if(!marker)return;
  var pageType=marker.getAttribute('data-page');
  fetch(DATA_URL,{cache:'no-cache'}).then(function(r){return r.json();}).then(function(data){
    showCommon(data);
    if(pageType==='main')renderMain(data);
    else if(pageType==='houwa')renderList(data,'houwa',30);
    else if(pageType==='houkoku')renderList(data,'houkoku',30);
    else if(pageType==='jihou')renderList(data,'jihou',60);
    else if(pageType==='events-new')renderEventsNew(data);
    else if(pageType==='events-date')renderEventsDate(data);
  }).catch(function(e){
    setText('hm-loading','新着情報の読み込みに失敗しました。時間をおいて再度お開きください。');
  });
}
/* 浄土真宗本願寺派matome 表示スクリプト */
(function(){
'use strict';
var DATA_URL='https://raw.githubusercontent.com/senmyouji/hongwanji-matome/main/data/items.json';

var REGIONS=[
  {label:'北海道・東北',prefs:['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県']},
  {label:'関東',prefs:['茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県']},
  {label:'中部',prefs:['新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県']},
  {label:'近畿',prefs:['三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県']},
  {label:'中国',prefs:['鳥取県','島根県','岡山県','広島県','山口県']},
  {label:'四国',prefs:['徳島県','香川県','愛媛県','高知県']},
  {label:'九州・沖縄',prefs:['福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県']}
];

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fmtD(d){return d?String(d).replace(/-/g,'.'):'';}
function daysAgo(d){var t=new Date(d+'T00:00:00');return (new Date()-t)/86400000;}
function isNew(d){return d&&daysAgo(d)<=3;}
function jpDate(d){if(!d)return'';var t=new Date(d+'T00:00:00');return (t.getMonth()+1)+'月'+t.getDate()+'日('+'日月火水木金土'.charAt(t.getDay())+')';}
function within(d,n){return d&&daysAgo(d)<=n;}
function bySortNew(a,b){return a.post_date<b.post_date?1:-1;}

function itemHTML(it,opts){
  opts=opts||{};
  var h='<div class="hmi"><div class="hmi-meta">';
  h+='<span class="hmi-date">'+(opts.postLabel?'掲載 ':'')+fmtD(it.post_date)+'</span>';
  if(isNew(it.post_date))h+='<span class="hmi-new">NEW</span>';
  h+='<span class="hmi-area">'+esc(it.pref)+' '+esc(it.city)+'</span>';
  h+='<span class="hmi-temple">'+esc(it.temple)+'</span>';
  if(opts.when&&(it.event_label||it.event_date))h+='<span class="hmi-when">&#128197; '+esc(it.event_label||jpDate(it.event_date))+' 開催</span>';
  h+='</div><h3><a href="'+esc(it.url)+'" target="_blank" rel="noopener">'+esc(it.title)+'</a></h3>';
  h+='<p class="hmi-desc">'+esc(it.desc)+'</p></div>';
  return h;
}
function setText(id,t){var e=document.getElementById(id);if(e)e.textContent=t;}
function showCommon(data){
  if(data.notice){var n=document.getElementById('hm-notice');if(n){n.textContent=data.notice;n.style.display='block';}}
  setText('hm-updated','最終更新：'+data.updated);
  var l=document.getElementById('hm-loading');if(l)l.style.display='none';
}

function renderMain(data){
  ['houwa','event','houkoku','jihou'].forEach(function(cat){
    var arr=data.items.filter(function(i){return i.cat===cat;}).sort(bySortNew).slice(0,5);
    var el=document.getElementById('list-'+cat);
    if(el)el.innerHTML=arr.length?arr.map(function(i){return itemHTML(i,{when:cat==='event'});}).join(''):'<p style="color:#999;">現在、新着はありません。</p>';
  });
}
function renderList(data,cat,days){
  var arr=data.items.filter(function(i){return i.cat===cat&&within(i.post_date,days);}).sort(bySortNew);
  var el=document.getElementById('list');
  if(el)el.innerHTML=arr.length?arr.map(function(i){return itemHTML(i);}).join(''):'<p style="color:#999;">直近'+days+'日の新着はありません。</p>';
}
function renderEventsNew(data){
  var arr=data.items.filter(function(i){return i.cat==='event';}).sort(bySortNew).slice(0,50);
  var el=document.getElementById('list');
  if(el)el.innerHTML=arr.length?arr.map(function(i){return itemHTML(i,{when:true,postLabel:true});}).join(''):'<p style="color:#999;">現在、掲載中のイベントはありません。</p>';
}
function renderEventsDate(data){
  var today=new Date();today.setHours(0,0,0,0);
  var arr=data.items.filter(function(i){return i.cat==='event'&&i.event_date&&new Date(i.event_date+'T00:00:00')>=today;});
  arr.sort(function(a,b){return a.event_date<b.event_date?-1:1;});
  var h='',cur='';
  arr.forEach(function(it){
    var t=new Date(it.event_date+'T00:00:00');
    var mkey=t.getFullYear()+'年'+(t.getMonth()+1)+'月';
    if(mkey!==cur){h+='<div class="hmv-month">'+mkey+'</div>';cur=mkey;}
    var soon=(t-today)/86400000<=7;
    h+='<div class="hmv"><div class="hmv-box"><div class="m">'+(t.getMonth()+1)+'月</div><div class="d">'+t.getDate()+'</div><div class="w">('+'日月火水木金土'.charAt(t.getDay())+')</div></div><div class="hmv-body"><div class="hmi-meta">';
    if(soon)h+='<span class="hmv-soon">まもなく</span>';
    h+='<span class="hmi-area">'+esc(it.pref)+' '+esc(it.city)+'</span><span class="hmi-temple">'+esc(it.temple)+'</span>';
    if(it.event_label)h+='<span class="hmi-when">'+esc(it.event_label)+'</span>';
    h+='</div><h3><a href="'+esc(it.url)+'" target="_blank" rel="noopener">'+esc(it.title)+'</a></h3><p class="hmi-desc">'+esc(it.desc)+'</p></div></div>';
  });
  var el=document.getElementById('list');
  if(el)el.innerHTML=h||'<p style="color:#999;">現在、開催予定のイベントはありません。</p>';
}

/* ▼▼▼ ここから追加：都道府県別（erea） ▼▼▼ */
function eventsForPref(data,pref){
  var today=new Date();today.setHours(0,0,0,0);
  return data.items.filter(function(i){
    if(i.cat!=='event')return false;
    if(pref&&pref!=='ALL'&&i.pref!==pref)return false;
    if(i.event_date&&new Date(i.event_date+'T00:00:00')<today)return false;
    return true;
  }).sort(function(a,b){
    var da=a.event_date||('9999-'+a.post_date.slice(5));
    var db=b.event_date||('9999-'+b.post_date.slice(5));
    return da<db?-1:(da>db?1:0);
  });
}
function renderPrefNav(navEl,activePref){
  if(!navEl)return;
  var h='<div class="hmp-allrow"><a class="hmp-pill-all'+(activePref==='ALL'?' is-active':'')+'" href="#" data-pref="ALL">すべてのエリアを表示</a></div>';
  REGIONS.forEach(function(region){
    h+='<div class="hmp-region"><div class="hmp-region-label">'+esc(region.label)+'</div><div class="hmp-pills">';
    region.prefs.forEach(function(pref){
      h+='<a class="hmp-pill'+(pref===activePref?' is-active':'')+'" href="#" data-pref="'+esc(pref)+'">'+esc(pref)+'</a>';
    });
    h+='</div></div>';
  });
  navEl.innerHTML=h;
}
function renderEreaList(listEl,data,pref){
  var arr=eventsForPref(data,pref);
  var title=(!pref||pref==='ALL')?'すべてのエリアの行事予定':esc(pref)+' の行事予定';
  var h='<p class="hmp-results-title">'+title+'（'+arr.length+'件）</p>';
  h+=arr.length?arr.map(function(i){return itemHTML(i,{when:true});}).join(''):'<p style="color:#999;text-align:center;padding:30px 0;">現在、開催予定のイベント情報はありません。</p>';
  listEl.innerHTML=h;
}
function renderErea(data){
  var navEl=document.getElementById('pref-nav');
  var listEl=document.getElementById('list');
  if(!listEl)return;

  var params=new URLSearchParams(window.location.search);
  var activePref=params.get('pref')||'ALL';

  renderPrefNav(navEl,activePref);
  renderEreaList(listEl,data,activePref);

  if(navEl&&!navEl._hmBound){
    navEl._hmBound=true;
    navEl.addEventListener('click',function(ev){
      var el=ev.target.closest?ev.target.closest('.hmp-pill,.hmp-pill-all'):null;
      if(!el)return;
      ev.preventDefault();
      var pref=el.getAttribute('data-pref');
      renderPrefNav(navEl,pref);
      renderEreaList(listEl,data,pref);
      if(window.history&&window.history.pushState){
        var url=(pref==='ALL')?location.pathname:(location.pathname+'?pref='+encodeURIComponent(pref));
        window.history.pushState({pref:pref},'',url);
      }
      listEl.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }
}
/* ▲▲▲ ここまで追加：都道府県別（erea） ▲▲▲ */

function boot(){
  var marker=document.getElementById('hm-page');
  if(!marker)return;
  var pageType=marker.getAttribute('data-page');
  fetch(DATA_URL,{cache:'no-cache'}).then(function(r){return r.json();}).then(function(data){
    showCommon(data);
    if(pageType==='main')renderMain(data);
    else if(pageType==='houwa')renderList(data,'houwa',30);
    else if(pageType==='houkoku')renderList(data,'houkoku',30);
    else if(pageType==='jihou')renderList(data,'jihou',60);
    else if(pageType==='events-new')renderEventsNew(data);
    else if(pageType==='events-date')renderEventsDate(data);
    else if(pageType==='erea')renderErea(data);
  }).catch(function(e){
    setText('hm-loading','新着情報の読み込みに失敗しました。時間をおいて再度お開きください。');
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
})();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
})();
