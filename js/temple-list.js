/* 「HPを持つ浄土真宗本願寺派の紹介」 表示スクリプト
 *
 * ワードプレス側には <div id="hpj-list"></div> と、この読み込みタグだけを置きます。
 * 中身は data/temples.json から読み込むので、寺院の増減や住所の訂正は
 * JSONを差し替えるだけで反映されます。ページの貼り直しは要りません。
 */
(function () {
  'use strict';

  var DATA_URL = 'https://raw.githubusercontent.com/senmyouji/hongwanji-matome/main/data/temples.json';

  var REGIONS = [
    { label: '北海道', prefs: ['北海道'] },
    { label: '東北', prefs: ['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'] },
    { label: '関東', prefs: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'] },
    { label: '中部', prefs: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'] },
    { label: '近畿', prefs: ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'] },
    { label: '中国', prefs: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'] },
    { label: '四国', prefs: ['徳島県', '香川県', '愛媛県', '高知県'] },
    { label: '九州・沖縄', prefs: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'] }
  ];
  var ALL_PREFS = [];
  REGIONS.forEach(function (r) { ALL_PREFS = ALL_PREFS.concat(r.prefs); });

  var SNS_ORDER = ['X', 'Instagram', 'Facebook', 'YouTube', 'note', 'LINE', 'TikTok'];
  var SNS_CLASS = { X: 'x', Instagram: 'ig', Facebook: 'fb', YouTube: 'yt', note: 'nt', LINE: 'ln', TikTok: 'tt' };

  var CONTACT_URL = 'https://senmyouji.or.jp/contact/';

  var CSS = [
    '#hpj-list{--hpj-ink:#2b2622;--hpj-sub:#7a706a;--hpj-line:#e3ddd6;--hpj-bg:#fdfbf8;',
    '--hpj-accent:#8a6f3e;--hpj-accent-bg:#f5efe4;color:var(--hpj-ink);line-height:1.8;',
    'font-size:16px;-webkit-font-smoothing:antialiased;max-width:100%;box-sizing:border-box}',
    '#hpj-list *{box-sizing:border-box}',
    '#hpj-list .hpj-lead{margin:0 0 1.2em;color:var(--hpj-sub);font-size:.95em}',
    '#hpj-list .hpj-count{font-weight:700;color:var(--hpj-accent)}',
    '#hpj-list .hpj-loading{padding:2.5em 0;text-align:center;color:var(--hpj-sub)}',
    '#hpj-list .hpj-tools{background:var(--hpj-bg);border:1px solid var(--hpj-line);',
    'border-radius:10px;padding:1em 1.1em;margin:0 0 2em}',
    '#hpj-list .hpj-search{width:100%;padding:.65em .9em;font-size:1em;border:1px solid var(--hpj-line);',
    'border-radius:8px;background:#fff;color:inherit}',
    '#hpj-list .hpj-search:focus{outline:2px solid var(--hpj-accent);outline-offset:1px}',
    '#hpj-list .hpj-hint{margin:.5em 0 1.1em;font-size:.82em;color:var(--hpj-sub)}',
    '#hpj-list .hpj-reg{margin:0 0 .85em}#hpj-list .hpj-reg:last-child{margin-bottom:0}',
    '#hpj-list .hpj-reg-name{display:block;font-size:.78em;font-weight:700;letter-spacing:.08em;',
    'color:var(--hpj-sub);margin:0 0 .35em}',
    '#hpj-list .hpj-prefs{display:flex;flex-wrap:wrap;gap:.4em}',
    '#hpj-list .hpj-prefs a{display:inline-flex;align-items:baseline;gap:.35em;padding:.3em .7em;',
    'background:#fff;border:1px solid var(--hpj-line);border-radius:999px;text-decoration:none;',
    'color:var(--hpj-ink);font-size:.9em}',
    '#hpj-list .hpj-prefs a:hover{background:var(--hpj-accent-bg);border-color:var(--hpj-accent);',
    'color:var(--hpj-accent)}',
    '#hpj-list .hpj-prefs a i{font-style:normal;font-size:.8em;color:var(--hpj-sub)}',
    '#hpj-list .hpj-sec{margin:0 0 2.6em;scroll-margin-top:80px}',
    '#hpj-list .hpj-sec h2{font-size:1.25em;margin:0 0 .9em;padding:.35em 0 .35em .7em;',
    'border-left:5px solid var(--hpj-accent);background:linear-gradient(90deg,var(--hpj-accent-bg),transparent);',
    'border-radius:2px;text-align:left!important}',
    /* テーマ（AFFINGER）が見出しの中にタグを差し込み左右に線を引くため、この一覧の中だけ止める */
    '#hpj-list .hpj-sec h2 .st-dash-design{display:inline!important;padding:0!important;',
    'margin:0!important;position:static!important}',
    '#hpj-list .hpj-sec h2 .st-dash-design::before,#hpj-list .hpj-sec h2 .st-dash-design::after{',
    'content:none!important;display:none!important}',
    '#hpj-list .hpj-sec h2 .hpj-n{font-size:.7em;font-weight:400;color:var(--hpj-sub);margin-left:.6em}',
    '#hpj-list .hpj-items{list-style:none;margin:0;padding:0}',
    '#hpj-list .hpj-item{padding:1.1em 0;border-bottom:1px dotted var(--hpj-line)}',
    '#hpj-list .hpj-item:first-child{border-top:1px dotted var(--hpj-line)}',
    '#hpj-list .hpj-name{font-size:1.1em;font-weight:700;text-decoration:none;color:var(--hpj-accent);',
    'border-bottom:1px solid transparent}',
    '#hpj-list .hpj-name:hover{border-bottom-color:var(--hpj-accent)}',
    '#hpj-list .hpj-name::after{content:"↗";font-size:.7em;margin-left:.25em;vertical-align:.35em;opacity:.6}',
    '#hpj-list .hpj-noweb{font-size:1.1em;font-weight:700}',
    '#hpj-list .hpj-meta{margin:.15em 0 .5em;font-size:.86em;color:var(--hpj-sub)}',
    '#hpj-list .hpj-zip{margin-right:.5em;white-space:nowrap}',
    '#hpj-list .hpj-desc,#hpj-list .hpj-full{margin:0 0 .5em}',
    '#hpj-list .hpj-more{background:none;border:none;padding:0 0 0 .4em;cursor:pointer;',
    'color:var(--hpj-accent);font-size:.85em;font-family:inherit;text-decoration:underline}',
    '#hpj-list .hpj-more:hover{opacity:.75}',
    '#hpj-list .hpj-nodesc{margin:0 0 .5em;font-size:.88em;color:var(--hpj-sub)}',
    '#hpj-list .hpj-sns{display:flex;flex-wrap:wrap;gap:.4em;margin:.5em 0 0}',
    '#hpj-list .hpj-sns a{display:inline-block;padding:.15em .6em;border-radius:4px;font-size:.78em;',
    'text-decoration:none;color:#fff;letter-spacing:.02em}',
    '#hpj-list .hpj-sns a:hover{opacity:.82}',
    '#hpj-list .hpj-sns .x{background:#111}#hpj-list .hpj-sns .ig{background:#c13584}',
    '#hpj-list .hpj-sns .fb{background:#1877f2}#hpj-list .hpj-sns .yt{background:#e00000}',
    '#hpj-list .hpj-sns .nt{background:#2cb696}#hpj-list .hpj-sns .ln{background:#06c755}',
    '#hpj-list .hpj-sns .tt{background:#333}',
    '#hpj-list .hpj-back{margin:.9em 0 0;font-size:.85em;text-align:right}',
    '#hpj-list .hpj-back a{color:var(--hpj-sub);text-decoration:none}',
    '#hpj-list .hpj-back a:hover{color:var(--hpj-accent)}',
    '#hpj-list .hpj-none{padding:2em 0;text-align:center;color:var(--hpj-sub)}',
    '#hpj-list .hpj-note{margin:2.5em 0 0;padding:1.2em 1.3em;background:var(--hpj-bg);',
    'border:1px solid var(--hpj-line);border-radius:10px;font-size:.9em;line-height:1.9}',
    '#hpj-list .hpj-note a{color:var(--hpj-accent)}',
    '#hpj-list .hpj-foot{margin:1.2em 0 0;font-size:.8em;color:var(--hpj-sub);text-align:right}',
    '@media (max-width:600px){#hpj-list{font-size:15px}',
    '#hpj-list .hpj-meta{font-size:.82em}#hpj-list .hpj-zip{display:block;margin:0}}'
  ].join('');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* 一覧に出す短い紹介。文の区切りで切るだけで、言葉は足さない。 */
  function shortDesc(text, target, hard) {
    target = target || 80; hard = hard || 110;
    var t = (text || '').trim();
    if (!t) return '';
    // 「。」で切る。区切りの「。」は残す。
    var parts = [];
    var buf = '';
    for (var i = 0; i < t.length; i++) {
      buf += t[i];
      if (t[i] === '。') { parts.push(buf); buf = ''; }
    }
    if (buf) parts.push(buf);
    var out = '';
    for (var j = 0; j < parts.length; j++) {
      if (out && out.length + parts[j].length > hard) break;
      out += parts[j];
      if (out.length >= target) break;
    }
    return (out || t.slice(0, target) + '…').trim();
  }

  function anchorId(pref) {
    var i = ALL_PREFS.indexOf(pref);
    return 'hpj-p' + (i >= 0 ? ('0' + (i + 1)).slice(-2) : 'x');
  }

  function itemHtml(t) {
    var find = (t.n + ' ' + t.a + ' ' + t.p).toLowerCase();
    var h = '<li class="hpj-item" data-find="' + esc(find) + '">';
    if (t.u) {
      h += '<a class="hpj-name" href="' + esc(t.u) + '" target="_blank" rel="noopener noreferrer">' + esc(t.n) + '</a>';
    } else {
      h += '<span class="hpj-noweb">' + esc(t.n) + '</span>';
    }
    h += '<p class="hpj-meta">';
    if (t.z) h += '<span class="hpj-zip">〒' + esc(t.z) + '</span>';
    h += '<span class="hpj-addr">' + esc(t.a) + '</span></p>';

    var full = t.d || '';
    var s = shortDesc(full);
    if (s) {
      if (full.length > s.length) {
        h += '<p class="hpj-desc">' + esc(s) + '<button type="button" class="hpj-more">続きを読む</button></p>';
        h += '<p class="hpj-full" hidden>' + esc(full) + '<button type="button" class="hpj-more">閉じる</button></p>';
      } else {
        h += '<p class="hpj-desc">' + esc(s) + '</p>';
      }
    } else {
      h += '<p class="hpj-nodesc">ホームページに沿革の記載が見当たりませんでした。</p>';
    }

    var sns = t.sns || {}, chips = '';
    SNS_ORDER.forEach(function (k) {
      (sns[k] || []).forEach(function (u) {
        chips += '<a class="' + SNS_CLASS[k] + '" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(k) + '</a>';
      });
    });
    if (chips) h += '<div class="hpj-sns">' + chips + '</div>';
    return h + '</li>';
  }

  function render(root, data) {
    var temples = data.temples || [];
    var byPref = {};
    temples.forEach(function (t) {
      (byPref[t.p] = byPref[t.p] || []).push(t);
    });

    var nSns = temples.filter(function (t) {
      return t.sns && Object.keys(t.sns).length;
    }).length;

    var h = '<style>' + CSS + '</style>';
    h += '<p class="hpj-lead">全国の浄土真宗本願寺派寺院のうち、ホームページをお持ちの'
      + '<span class="hpj-count">' + temples.length.toLocaleString() + 'か寺</span>をご紹介します。'
      + '寺院名をクリックすると、そのお寺のホームページが開きます。'
      + '紹介文は各寺院のホームページに記された沿革をもとにしています。</p>';

    h += '<div class="hpj-tools"><label><input type="search" class="hpj-search" '
      + 'placeholder="寺院名・住所でさがす（例：専明寺、下松市）" aria-label="寺院名・住所でさがす"></label>'
      + '<p class="hpj-hint">都道府県を選ぶと、その地域まで移動します。</p>';
    REGIONS.forEach(function (r) {
      var avail = r.prefs.filter(function (p) { return byPref[p] && byPref[p].length; });
      if (!avail.length) return;
      h += '<div class="hpj-reg"><span class="hpj-reg-name">' + esc(r.label) + '</span><div class="hpj-prefs">';
      avail.forEach(function (p) {
        h += '<a href="#' + anchorId(p) + '">' + esc(p) + '<i>' + byPref[p].length + '</i></a>';
      });
      h += '</div></div>';
    });
    h += '</div>';
    h += '<p class="hpj-none" style="display:none">該当するお寺が見つかりませんでした。</p>';

    ALL_PREFS.forEach(function (p) {
      var list = byPref[p];
      if (!list || !list.length) return;
      h += '<section class="hpj-sec" id="' + anchorId(p) + '"><h2>' + esc(p)
        + '<span class="hpj-n">' + list.length + 'か寺</span></h2><ul class="hpj-items">';
      list.forEach(function (t) { h += itemHtml(t); });
      h += '</ul><p class="hpj-back"><a href="#hpj-list">▲ 都道府県を選び直す</a></p></section>';
    });

    h += '<div class="hpj-note"><strong>掲載内容についてのお願い</strong><br>'
      + 'この一覧は各寺院のホームページに書かれている内容をもとに作成しておりますが、'
      + '思い違いや誤りがあるかもしれません。お気づきの点がございましたら、どうぞお教えください。'
      + 'また、掲載を望まれない場合も、お手数ですが'
      + '<a href="' + CONTACT_URL + '">こちら</a>よりご連絡ください。'
      + 'すみやかに訂正・削除いたします。</div>';
    h += '<p class="hpj-foot">掲載 ' + temples.length.toLocaleString() + 'か寺／'
      + 'SNS掲載 ' + nSns.toLocaleString() + 'か寺／最終更新 ' + esc(data.updated || '') + '</p>';

    root.innerHTML = h;
    bind(root);
  }

  function bind(root) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.hpj-more') : null;
      if (!b) return;
      e.preventDefault();
      var item = b.closest('.hpj-item');
      var s = item.querySelector('.hpj-desc'), f = item.querySelector('.hpj-full');
      if (!f) return;
      if (f.hasAttribute('hidden')) { f.removeAttribute('hidden'); s.setAttribute('hidden', ''); }
      else { f.setAttribute('hidden', ''); s.removeAttribute('hidden'); }
    });

    var box = root.querySelector('.hpj-search');
    var items = [].slice.call(root.querySelectorAll('.hpj-item'));
    var secs = [].slice.call(root.querySelectorAll('.hpj-sec'));
    var none = root.querySelector('.hpj-none');
    var timer = null;
    function apply() {
      var q = (box.value || '').trim().toLowerCase(), hit = 0;
      items.forEach(function (it) {
        var ok = !q || (it.getAttribute('data-find') || '').indexOf(q) >= 0;
        it.style.display = ok ? '' : 'none';
        if (ok) hit++;
      });
      secs.forEach(function (s) {
        var any = [].slice.call(s.querySelectorAll('.hpj-item')).some(function (i) {
          return i.style.display !== 'none';
        });
        s.style.display = any ? '' : 'none';
      });
      if (none) none.style.display = hit ? 'none' : '';
    }
    if (box) box.addEventListener('input', function () {
      clearTimeout(timer); timer = setTimeout(apply, 120);
    });
  }

  function start() {
    var root = document.getElementById('hpj-list');
    if (!root) return;
    root.innerHTML = '<p class="hpj-loading">寺院の一覧を読み込んでいます…</p>';
    fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) { render(root, d); })
      .catch(function (err) {
        root.innerHTML = '<p class="hpj-loading">一覧を読み込めませんでした。'
          + 'お手数ですが、しばらくしてから再読み込みをお願いいたします。<br>'
          + '<small>' + esc(err && err.message) + '</small></p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
