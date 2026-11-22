(function () {
  'use strict';

  /* ===== 設定區 ===== */
  // 春節公休（除夕～初四）。每年請更新一次。
  var CLOSED = ['2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20'];
  // 預設的「到店人次推估係數」與「到店率」，管理者可在頁面內修改並存到雲端
  var DEFAULT_PARAMS = {
    coef: { '台北仁愛': 0.30, '桃園中正': 0.31, '新竹光明': 0.30, '台中向上': 0.35, '台中崇德': 0.29, '高雄巨蛋': 0.31 },
    rate: { '台北仁愛': 0.73, '桃園中正': 0.77, '新竹光明': 0.80, '台中向上': 0.80, '台中崇德': 0.74, '高雄巨蛋': 0.75 }
  };
  var FALLBACK = { coef: 0.30, rate: 0.75 };
  // 尚未連接雲端時顯示的內建範例資料
  var SEED = {"asOf": "2026-11-21", "fileName": "內建範例資料", "branches": [{"name": "台北仁愛", "target": 120000000, "rev": 107449385, "card": 97624955, "visitors": 3165, "newV": 1317, "newDeals": 795, "newAmt": 32112054, "oldDeals": 1083, "oldAmt": 75337331, "burn": 113295074}, {"name": "桃園中正", "target": 80000000, "rev": 56219811, "card": 51258843, "visitors": 2034, "newV": 804, "newDeals": 513, "newAmt": 21832900, "oldDeals": 652, "oldAmt": 34386911, "burn": 60147512}, {"name": "台中向上", "target": 80000000, "rev": 72978312, "card": 64683823, "visitors": 3054, "newV": 1118, "newDeals": 726, "newAmt": 22724588, "oldDeals": 1002, "oldAmt": 50253724, "burn": 78490680}, {"name": "高雄巨蛋", "target": 100000000, "rev": 109206912, "card": 93592028, "visitors": 3454, "newV": 1466, "newDeals": 994, "newAmt": 35107151, "oldDeals": 1133, "oldAmt": 74099761, "burn": 109295787}, {"name": "新竹光明", "target": 37000000, "rev": 26652503, "card": 21627612, "visitors": 950, "newV": 594, "newDeals": 369, "newAmt": 11484743, "oldDeals": 210, "oldAmt": 15167760, "burn": 24642614}, {"name": "台中崇德", "target": 80000000, "rev": 59842711, "card": 52164366, "visitors": 1993, "newV": 995, "newDeals": 667, "newAmt": 21079623, "oldDeals": 583, "oldAmt": 38763088, "burn": 61591220}]};

  var FB_APP = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
  var FB_FS = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
  var DAY = 864e5;

  var S = { data: null, params: null, adj: {}, branch: null, status: 'loading', fb: null, pwd: null, parsed: null, banner: '' };

  /* ===== 小工具 ===== */
  var $ = function (s) { return document.querySelector(s); };
  var nf = function (v) { return Math.round(v).toLocaleString('en-US'); };
  var pc = function (v) { return (v * 100).toFixed(1) + '%'; };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var UP = '#3F7078', DOWN = '#8C5E4B', FLAT = '#556677';

  function P(kind, name) {
    var p = (S.params && S.params[kind]) || {};
    if (p[name] != null) return p[name];
    if (DEFAULT_PARAMS[kind][name] != null) return DEFAULT_PARAMS[kind][name];
    return FALLBACK[kind];
  }

  /* ===== 日期：營業日、經過月數 ===== */
  function timeInfo(asOf) {
    var p = asOf.split('-').map(Number), y = p[0], m = p[1], d = p[2];
    var t0 = Date.UTC(y, 0, 1), t1 = Date.UTC(y, m - 1, d), t2 = Date.UTC(y, 11, 31);
    function work(from, to) {
      var c = 0;
      for (var t = from; t <= to; t += DAY) {
        var dt = new Date(t);
        if (dt.getUTCDay() !== 0 && CLOSED.indexOf(dt.toISOString().slice(0, 10)) < 0) c++;
      }
      return c;
    }
    var dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return { y: y, m: m, d: d, elapsed: work(t0, t1), remain: work(t1 + DAY, t2), months: (m - 1) + d / dim };
  }

  /* ===== 計算 ===== */
  function baseOf(b) {
    var oldV = b.visitors - b.newV;
    return {
      visitors: b.visitors,
      newV: b.newV,
      newRate: b.newV ? b.newDeals / b.newV : 0,
      newAov: b.newDeals ? b.newAmt / b.newDeals : 0,
      oldRate: oldV ? b.oldDeals / oldV : 0,
      oldAov: b.oldDeals ? b.oldAmt / b.oldDeals : 0
    };
  }
  function calc(b, a) {
    var newDeals = a.newV * a.newRate, newAmt = newDeals * a.newAov;
    var oldV = a.visitors - a.newV, oldDeals = oldV * a.oldRate, oldAmt = oldDeals * a.oldAov;
    var rev = newAmt + oldAmt, deals = newDeals + oldDeals;
    return {
      newDeals: newDeals, newAmt: newAmt, oldV: oldV, oldDeals: oldDeals, oldAmt: oldAmt, rev: rev, deals: deals,
      ach: rev / b.target, cardRate: b.card / b.rev,
      closeRate: a.visitors ? deals / a.visitors : 0, aov: deals ? rev / deals : 0
    };
  }
  function model() {
    var b = S.data.branches.filter(function (x) { return x.name === S.branch; })[0];
    var base = baseOf(b);
    var a = Object.assign({}, base, S.adj[b.name] || {});
    var coef = P('coef', b.name), rate = P('rate', b.name);
    var t = timeInfo(S.data.asOf);
    var f = coef * rate * t.months;
    var addV = base.visitors / t.elapsed * t.remain, addN = base.newV / t.elapsed * t.remain;
    var vmax = Math.max(Math.round(base.visitors * 1.6), Math.round((base.visitors + addV) * 1.3));
    return { b: b, base: base, a: a, o: calc(b, base), n: calc(b, a), coef: coef, rate: rate, t: t, f: f, addV: addV, addN: addN, vmax: vmax };
  }
  function defsOf(m) {
    var base = m.base, a = m.a;
    var vmin = Math.max(a.newV, Math.round(base.visitors * 0.5));
    return [
      { k: 'book', name: '預約數（月平均）', kind: 'n', unit: ' 筆／月', step: 10, min: vmin / m.f, max: m.vmax / m.f, get: function (x) { return x.visitors / m.f; },
        note: '到店服務人次 ÷ 到店率 ' + Math.round(m.rate * 100) + '% ÷ ' + m.t.months.toFixed(1) + ' 個月 ＝ 平均每月預約數（到店率固定）' },
      { k: 'svc', name: '到店服務人次', kind: 'n', unit: ' 人次', step: 50, min: vmin / m.coef, max: m.vmax / m.coef, get: function (x) { return x.visitors / m.coef; },
        note: '到店來客數 ÷ 係數 ' + Math.round(m.coef * 100) + '% ＝ 到店服務人次（係數固定）' },
      { k: 'visitors', name: '到店來客數', kind: 'n', unit: ' 人', step: 10, min: vmin, max: m.vmax, get: function (x) { return x.visitors; } },
      { k: 'newV', name: '到店新客數', kind: 'n', unit: ' 人', step: 5, min: Math.round(base.newV * 0.5),
        max: Math.min(Math.max(Math.round(base.newV * 1.6), Math.round((base.newV + m.addN) * 1.3)), a.newV + (m.vmax - a.visitors)), get: function (x) { return x.newV; } },
      { k: 'newRate', name: '新客成交率', kind: 'p', step: 0.01, min: Math.max(0.05, base.newRate - 0.25), max: Math.min(1, base.newRate + 0.25), get: function (x) { return x.newRate; } },
      { k: 'newAov', name: '新客平均客單', kind: 'm', step: 1000, min: Math.round(base.newAov * 0.6), max: Math.round(base.newAov * 1.6), get: function (x) { return x.newAov; } },
      { k: 'oldRate', name: '舊客成交率', kind: 'p', step: 0.01, min: Math.max(0.05, base.oldRate - 0.25), max: Math.min(1, base.oldRate + 0.25), get: function (x) { return x.oldRate; } },
      { k: 'oldAov', name: '舊客平均客單', kind: 'm', step: 1000, min: Math.round(base.oldAov * 0.6), max: Math.round(base.oldAov * 1.6), get: function (x) { return x.oldAov; } }
    ];
  }
  function show(d, v) {
    if (d.kind === 'm') return 'NT$ ' + nf(v);
    if (d.kind === 'p') return pc(v);
    return nf(v) + d.unit;
  }
  function apply(k, x) {
    var m = model();
    var d = defsOf(m).filter(function (z) { return z.k === k; })[0];
    if (!d || isNaN(x)) return;
    x = Math.min(d.max, Math.max(d.min, x));
    var adj = Object.assign({}, S.adj[m.b.name] || {});
    if (k === 'newV') { adj.newV = x; adj.visitors = m.a.visitors + (x - m.a.newV); }
    else if (k === 'svc') adj.visitors = x * m.coef;
    else if (k === 'book') adj.visitors = x * m.f;
    else adj[k] = x;
    S.adj[m.b.name] = adj;
    update();
  }

  /* ===== 畫面 ===== */
  function renderPills() {
    var el = $('#pills');
    el.innerHTML = S.data.branches.map(function (b) {
      return '<button type="button" class="pill" data-name="' + esc(b.name) + '" aria-pressed="' + (b.name === S.branch) + '">' + esc(b.name) + '</button>';
    }).join('');
  }
  function buildControls() {
    var m = model();
    $('#controls').innerHTML = defsOf(m).map(function (d) {
      return '<div class="ctl">' +
        '<div class="ctl-top"><label for="ctl-' + d.k + '">' + d.name + '</label><span class="tag-adj">可調整</span></div>' +
        '<div class="ctl-val"><button type="button" class="step" data-act="dec" data-k="' + d.k + '" aria-label="' + d.name + '減少">−</button>' +
        '<span class="val" id="val-' + d.k + '"></span>' +
        '<button type="button" class="step" data-act="inc" data-k="' + d.k + '" aria-label="' + d.name + '增加">＋</button></div>' +
        '<input id="ctl-' + d.k + '" data-k="' + d.k + '" type="range" step="any">' +
        '<p class="note" id="note-' + d.k + '" hidden></p>' +
        '<div class="ctl-foot"><span class="o" id="orig-' + d.k + '"></span><span class="chip" id="chip-' + d.k + '"></span></div>' +
        '</div>';
    }).join('');
  }
  function dText(kind, ov, nv) {
    var d = nv - ov;
    if (Math.abs(d) < (kind === 'p' ? 0.0005 : 0.5)) return '—';
    var ad = Math.abs(d);
    return (d > 0 ? '+' : '−') + (kind === 'p' ? (ad * 100).toFixed(1) + ' pt' : nf(ad));
  }
  function dColor(kind, ov, nv) {
    var d = nv - ov;
    if (Math.abs(d) < (kind === 'p' ? 0.0005 : 0.5)) return FLAT;
    return d > 0 ? UP : DOWN;
  }
  function forecastText(m) {
    return '依 1/1–' + m.t.m + '/' + m.t.d + ' 營業日共 ' + m.t.elapsed + ' 天（排除週日與春節公休 2/16–2/20）的日平均（來客 ' +
      (m.base.visitors / m.t.elapsed).toFixed(1) + ' 人、新客 ' + (m.base.newV / m.t.elapsed).toFixed(1) + ' 人），推算剩餘 ' + m.t.remain +
      ' 個營業日約增加來客 ' + nf(m.addV) + ' 人、新客 ' + nf(m.addN) + ' 人。成交率與客單維持報表原值。';
  }
  function resultsHTML(m) {
    var o = m.o, n = m.n, b = m.b, base = m.base, a = m.a;
    var asShort = m.t.m + '/' + m.t.d;
    var revD = n.rev - o.rev, revFlat = Math.abs(revD) < 0.5;
    var revDelta = revFlat ? '與報表相同' : (revD > 0 ? '+' : '−') + ' NT$ ' + nf(Math.abs(revD)) + '（' + (revD > 0 ? '+' : '−') + (Math.abs(revD / o.rev) * 100).toFixed(1) + '%）';
    var revColor = revFlat ? FLAT : (revD > 0 ? UP : DOWN);
    var S_ = Math.max(1.5, n.ach * 1.05, o.ach * 1.05);
    var gap = n.rev - b.target;
    var gapText = gap >= 0 ? '已達成年度目標，超出 NT$ ' + nf(gap) : '距離年度目標還差 NT$ ' + nf(-gap);
    var newShare = n.rev ? n.newAmt / n.rev : 0;

    var fmt = { m: nf, n: nf, p: pc };
    var tagText = { adj: '可調', link: '連動', fix: '固定' };
    function row(label, t, kind, ov, nv) {
      return '<div class="tr"><span class="lbl">' + label + '<span class="t t-' + t + '">' + tagText[t] + '</span></span>' +
        '<span class="r" style="color:#556677">' + fmt[kind](ov) + '</span>' +
        '<span class="r" style="font-weight:700">' + fmt[kind](nv) + '</span>' +
        '<span class="r" style="font-weight:600;color:' + (t === 'fix' ? FLAT : dColor(kind, ov, nv)) + '">' + (t === 'fix' ? '—' : dText(kind, ov, nv)) + '</span></div>';
    }
    var rows = [
      row('營收月目標', 'fix', 'm', b.target, b.target),
      row('營收月達成', 'link', 'm', o.rev, n.rev),
      row('營收達成率', 'link', 'p', o.ach, n.ach),
      row('當月開卡比率', 'fix', 'p', o.cardRate, o.cardRate),
      row('預約數（月平均）', 'adj', 'n', base.visitors / m.f, a.visitors / m.f),
      row('到店服務人次', 'adj', 'n', base.visitors / m.coef, a.visitors / m.coef),
      row('到店來客數', 'adj', 'n', base.visitors, a.visitors),
      row('到店新客數', 'adj', 'n', base.newV, a.newV),
      row('到店舊客數', 'link', 'n', o.oldV, n.oldV),
      row('到店消費人數', 'link', 'n', o.deals, n.deals),
      row('平均成交率', 'link', 'p', o.closeRate, n.closeRate),
      row('總平均客單', 'link', 'm', o.aov, n.aov),
      row('新客成交率', 'adj', 'p', base.newRate, a.newRate),
      row('新客成交數', 'link', 'n', o.newDeals, n.newDeals),
      row('新客平均客單', 'adj', 'm', base.newAov, a.newAov),
      row('新客消費金額', 'link', 'm', o.newAmt, n.newAmt),
      row('舊客成交率', 'adj', 'p', base.oldRate, a.oldRate),
      row('舊客成交數', 'link', 'n', o.oldDeals, n.oldDeals),
      row('舊客平均客單', 'adj', 'm', base.oldAov, a.oldAov),
      row('舊客消費金額', 'link', 'm', o.oldAmt, n.oldAmt),
      row('當月消耗金額', 'fix', 'm', b.burn, b.burn)
    ].join('');

    return '' +
      '<div class="row">' +
        '<div class="card kpi"><p class="label">推算年度營收達成</p><p class="big">NT$ ' + nf(n.rev) + '</p>' +
          '<p class="small">報表目前 NT$ ' + nf(o.rev) + '（資料截至 ' + asShort + '）</p>' +
          '<p class="kchip" style="color:' + revColor + '">' + revDelta + '</p></div>' +
        '<div class="card kpi"><p class="label">推算年度營收達成率</p><p class="big">' + pc(n.ach) + '</p>' +
          '<div class="bar" role="img" aria-label="年度達成率 ' + pc(n.ach) + '，報表目前 ' + pc(o.ach) + '">' +
            '<div class="fill" style="width:' + (Math.min(n.ach / S_, 1) * 100).toFixed(2) + '%"></div>' +
            '<div class="orig" style="left:' + (Math.min(o.ach / S_, 1) * 100).toFixed(2) + '%"></div>' +
            '<div class="goal" style="left:' + (Math.min(1 / S_, 1) * 100).toFixed(2) + '%"></div></div>' +
          '<p class="small13">淺線為報表目前 ' + pc(o.ach) + '，虛線為年度目標 NT$ ' + nf(b.target) + '</p>' +
          '<p class="status">' + gapText + '</p></div>' +
      '</div>' +
      '<div class="row">' +
        '<div class="card mini"><p class="label">當月開卡比率</p><p class="num">' + pc(o.cardRate) + '</p><p class="foot">獨立係數，不隨調整連動</p></div>' +
        '<div class="card mini"><p class="label">平均成交率</p><p class="num">' + pc(n.closeRate) + '</p><p class="foot">報表目前 ' + pc(o.closeRate) + '</p></div>' +
        '<div class="card mini"><p class="label">總平均客單</p><p class="num">NT$ ' + nf(n.aov) + '</p><p class="foot">報表目前 NT$ ' + nf(o.aov) + '</p></div>' +
      '</div>' +
      '<div class="card panel"><h2>新客與舊客的營收組成</h2>' +
        '<div class="comp" role="img" aria-label="新客營收占 ' + pc(newShare) + '，舊客營收占 ' + pc(1 - newShare) + '"><div class="n" style="width:' + (newShare * 100).toFixed(2) + '%"></div><div class="o"></div></div>' +
        '<div class="legend"><span><span class="sw" style="background:#7C9BB2"></span>新客 NT$ ' + nf(n.newAmt) + '（' + pc(newShare) + '）</span>' +
        '<span><span class="sw" style="background:#3F5A70"></span>舊客 NT$ ' + nf(n.oldAmt) + '（' + pc(1 - newShare) + '）</span></div></div>' +
      '<div class="card panel"><h2>連動明細</h2><p class="sub">金額單位為元；標示「固定」的項目維持報表原值，不隨調整變動</p>' +
        '<div class="tablewrap"><div class="tbl"><div class="tr th"><span>指標</span><span class="r">報表目前</span><span class="r">推算後</span><span class="r">差異</span></div>' + rows + '</div></div></div>';
  }
  function update() {
    var m = model();
    defsOf(m).forEach(function (d) {
      var v = d.get(m.a), bv = d.get(m.base), id = function (p) { return document.getElementById(p + '-' + d.k); };
      id('val').textContent = show(d, v);
      id('orig').textContent = '報表目前 ' + show(d, bv);
      var inp = id('ctl'); inp.min = d.min; inp.max = d.max; inp.value = v;
      var txt = '未調整', color = FLAT;
      if (d.kind === 'p') {
        var dd = (v - bv) * 100;
        if (Math.abs(dd) >= 0.05) { txt = (dd > 0 ? '+' : '−') + Math.abs(dd).toFixed(1) + ' pt'; color = dd > 0 ? UP : DOWN; }
      } else if (bv) {
        var r = v / bv - 1;
        if (Math.abs(r) >= 0.0005) { txt = (r > 0 ? '+' : '−') + (Math.abs(r) * 100).toFixed(1) + '%'; color = r > 0 ? UP : DOWN; }
      }
      var chip = id('chip'); chip.textContent = txt; chip.style.color = color;
      var note = id('note');
      if (d.note) { note.textContent = d.note; note.hidden = false; }
    });
    $('#forecastText').textContent = forecastText(m);
    $('#results').innerHTML = resultsHTML(m);
  }
  function fmtDate(s) { var p = s.split('-'); return p[0] + '/' + Number(p[1]) + '/' + Number(p[2]); }
  function render(full) {
    var state = $('#state'), main = $('#main');
    var banner = $('#banner');
    banner.hidden = !S.banner;
    $('#bannerText').textContent = S.banner;
    if (!S.data || !S.data.branches || !S.data.branches.length) {
      main.hidden = true; $('#pills').innerHTML = ''; $('#asof').textContent = '';
      state.hidden = false;
      state.textContent = S.status === 'loading' ? '資料載入中…' : (S.status === 'error' ? '無法讀取雲端資料，請稍後重新整理或聯絡管理者。' : '尚未上傳報表資料，請管理者登入後上傳。');
      return;
    }
    state.hidden = true; main.hidden = false;
    if (!S.branch || !S.data.branches.some(function (b) { return b.name === S.branch; })) { S.branch = S.data.branches[0].name; full = true; }
    var up = S.data.uploadedAtText ? '（上傳時間 ' + S.data.uploadedAtText + '）' : '';
    $('#asof').textContent = '報表資料截至 ' + fmtDate(S.data.asOf) + up;
    if (full) { renderPills(); buildControls(); }
    update();
  }

  /* ===== 報表解析（.xls / .xlsx） ===== */
  var KEYS = { '營收月目標': 'target', '營收月達成': 'rev', '當月開卡業績': 'card', '到店來客數': 'visitors', '到店新客數': 'newV', '新客成交數': 'newDeals', '新客消費金額': 'newAmt', '舊客成交數': 'oldDeals', '舊客消費金額': 'oldAmt', '當月消耗金額': 'burn' };
  function parseReport(wb) {
    var ws = wb.Sheets[wb.SheetNames[0]];
    var rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
    var hr = -1, ac = -1;
    rows.forEach(function (r, i) {
      if (hr >= 0) return;
      r.forEach(function (v, j) { if (hr < 0 && typeof v === 'string' && v.indexOf('年度') >= 0) { hr = i; ac = j; } });
    });
    if (hr < 0) throw new Error('找不到「年度」欄位，請確認是「營運績效報表」。');
    var out = [], cur = null;
    for (var i = hr + 1; i < rows.length; i++) {
      var r = rows[i], bn = r[1], lab = r[2];
      if (typeof bn === 'string' && bn.trim()) { cur = { name: bn.trim() }; out.push(cur); }
      if (cur && typeof lab === 'string') {
        var k = KEYS[lab.trim()];
        if (k) cur[k] = Number(r[ac]);
      }
    }
    var need = Object.keys(KEYS).map(function (x) { return KEYS[x]; });
    out.forEach(function (b) {
      need.forEach(function (k) { if (typeof b[k] !== 'number' || isNaN(b[k])) throw new Error('「' + b.name + '」缺少或無法讀取欄位：' + k); });
      if (b.visitors < b.newV) throw new Error('「' + b.name + '」到店新客數大於到店來客數，請確認報表。');
    });
    if (!out.length) throw new Error('沒有讀到任何分院資料。');
    return out;
  }

  /* ===== 雲端（Firebase） ===== */
  function configured() {
    var c = window.FIREBASE_CONFIG;
    return !!(c && c.apiKey && !/YOUR/i.test(c.apiKey) && c.projectId && !/YOUR/i.test(c.projectId));
  }
  function stampText(ts) {
    try {
      var d = ts && ts.toDate ? ts.toDate() : null;
      if (!d) return '';
      var z = function (x) { return String(x).padStart(2, '0'); };
      return d.getFullYear() + '/' + z(d.getMonth() + 1) + '/' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes());
    } catch (e) { return ''; }
  }
  async function initCloud() {
    if (!configured()) {
      S.data = SEED; S.status = 'ready';
      S.banner = '尚未連接雲端資料庫（Firebase），目前顯示內建範例資料，管理功能暫時無法使用。';
      render(true); return;
    }
    try {
      var app = await import(FB_APP), fs = await import(FB_FS);
      var db = fs.getFirestore(app.initializeApp(window.FIREBASE_CONFIG));
      S.fb = { fs: fs, db: db };
      fs.onSnapshot(fs.doc(db, 'pub', 'data'), function (snap) {
        var d = snap.exists() ? snap.data() : null;
        if (d) d.uploadedAtText = stampText(d.uploadedAt);
        S.data = d; S.status = 'ready'; S.adj = {}; S.banner = '';
        render(true);
      }, function () { S.status = 'error'; S.data = null; render(true); });
      fs.onSnapshot(fs.doc(db, 'pub', 'params'), function (snap) {
        S.params = snap.exists() ? snap.data() : null;
        if (S.data && S.data.branches) render(true);
      }, function () {});
    } catch (e) {
      S.status = 'error'; render(true);
    }
  }
  async function gateBatch(pwd, writes) {
    var fs = S.fb.fs, db = S.fb.db, batch = fs.writeBatch(db);
    batch.set(fs.doc(db, 'gate', pwd), { ts: fs.serverTimestamp() });
    writes(batch, fs, db);
    await batch.commit();
  }

  /* ===== 管理視窗 ===== */
  function branchNames() {
    if (S.data && S.data.branches) return S.data.branches.map(function (b) { return b.name; });
    return Object.keys(DEFAULT_PARAMS.coef);
  }
  function fillParams(useDefault) {
    $('#ptbody').innerHTML = branchNames().map(function (n, i) {
      var c = useDefault ? (DEFAULT_PARAMS.coef[n] != null ? DEFAULT_PARAMS.coef[n] : FALLBACK.coef) : P('coef', n);
      var r = useDefault ? (DEFAULT_PARAMS.rate[n] != null ? DEFAULT_PARAMS.rate[n] : FALLBACK.rate) : P('rate', n);
      return '<tr><td>' + esc(n) + '</td><td><input type="number" step="0.1" min="1" max="100" data-kind="coef" data-name="' + esc(n) + '" value="' + (c * 100).toFixed(1).replace(/\.0$/, '') + '" aria-label="' + esc(n) + ' 人次推估係數"></td>' +
        '<td><input type="number" step="0.1" min="1" max="100" data-kind="rate" data-name="' + esc(n) + '" value="' + (r * 100).toFixed(1).replace(/\.0$/, '') + '" aria-label="' + esc(n) + ' 到店率"></td></tr>';
    }).join('');
  }
  function setMsg(id, text, cls) { var el = $(id); el.textContent = text; el.className = 'msg' + (cls ? ' ' + cls : ''); }
  function localDate(ms) {
    var d = new Date(ms), z = function (x) { return String(x).padStart(2, '0'); };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  }

  function bind() {
    $('#pills').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-name]'); if (!b) return;
      S.branch = b.dataset.name; renderPills(); buildControls(); update();
    });
    $('#controls').addEventListener('input', function (e) {
      if (e.target.matches('input[type=range]')) apply(e.target.dataset.k, parseFloat(e.target.value));
    });
    $('#controls').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-act]'); if (!b) return;
      var m = model(), d = defsOf(m).filter(function (z) { return z.k === b.dataset.k; })[0];
      apply(d.k, d.get(m.a) + (b.dataset.act === 'inc' ? d.step : -d.step));
    });
    $('#resetBtn').addEventListener('click', function () { S.adj[S.branch] = {}; update(); });
    $('#forecastBtn').addEventListener('click', function () {
      var m = model(); var adj = Object.assign({}, S.adj[m.b.name] || {});
      adj.visitors = m.base.visitors + m.addV; adj.newV = m.base.newV + m.addN;
      S.adj[m.b.name] = adj; update();
    });

    var dlg = $('#adminDlg');
    $('#adminBtn').addEventListener('click', function () {
      if (!S.fb) { alert('尚未連接雲端資料庫（Firebase），請先完成 firebase-config.js 設定。'); return; }
      if (S.pwd) { $('#adminLock').hidden = true; $('#adminBody').hidden = false; fillParams(false); }
      else { $('#adminLock').hidden = false; $('#adminBody').hidden = true; $('#pwd').value = ''; setMsg('#lockMsg', ''); }
      dlg.showModal();
    });
    $('#adminClose').addEventListener('click', function () { dlg.close(); });
    async function unlock() {
      var pwd = $('#pwd').value.trim();
      if (!pwd || pwd.indexOf('/') >= 0) { setMsg('#lockMsg', '請輸入管理密碼。', 'err'); return; }
      setMsg('#lockMsg', '驗證中…');
      try {
        var fs = S.fb.fs;
        await fs.setDoc(fs.doc(S.fb.db, 'gate', pwd), { ts: fs.serverTimestamp() });
        S.pwd = pwd; $('#adminLock').hidden = true; $('#adminBody').hidden = false; fillParams(false);
      } catch (e) { setMsg('#lockMsg', '密碼錯誤，或無法連線到雲端。', 'err'); }
    }
    $('#unlockBtn').addEventListener('click', unlock);
    $('#pwd').addEventListener('keydown', function (e) { if (e.key === 'Enter') unlock(); });

    $('#file').addEventListener('change', async function (e) {
      var f = e.target.files[0]; S.parsed = null; $('#publishBtn').disabled = true; setMsg('#upMsg', '');
      if (!f) { $('#upPreview').textContent = ''; return; }
      try {
        var wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
        var branches = parseReport(wb);
        S.parsed = { branches: branches, fileName: f.name };
        $('#upAsOf').value = localDate(f.lastModified);
        $('#upPreview').innerHTML = '讀到 ' + branches.length + ' 間分院：' + branches.map(function (b) { return esc(b.name) + '（年度營收 ' + nf(b.rev) + '）'; }).join('、');
        $('#publishBtn').disabled = false;
      } catch (err) { $('#upPreview').textContent = ''; setMsg('#upMsg', '讀取失敗：' + err.message, 'err'); }
    });
    $('#publishBtn').addEventListener('click', async function () {
      var asOf = $('#upAsOf').value;
      if (!S.parsed) return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) { setMsg('#upMsg', '請選擇資料截至日期。', 'err'); return; }
      setMsg('#upMsg', '發布中…');
      try {
        var payload = { asOf: asOf, fileName: S.parsed.fileName, branches: S.parsed.branches };
        await gateBatch(S.pwd, function (batch, fs, db) {
          payload.uploadedAt = fs.serverTimestamp();
          batch.set(fs.doc(db, 'pub', 'data'), payload);
        });
        setMsg('#upMsg', '已發布。所有人開啟頁面即可看到新資料。', 'ok');
        $('#publishBtn').disabled = true; S.parsed = null; $('#file').value = '';
      } catch (err) { setMsg('#upMsg', '發布失敗，請確認密碼與雲端規則設定。', 'err'); }
    });
    $('#paramDefault').addEventListener('click', function () { fillParams(true); setMsg('#paramMsg', '已帶入預設值，按「儲存參數」才會生效。'); });
    $('#paramSave').addEventListener('click', async function () {
      var coef = {}, rate = {}, bad = false;
      document.querySelectorAll('#ptbody input').forEach(function (i) {
        var v = parseFloat(i.value);
        if (isNaN(v) || v < 1 || v > 100) { bad = true; return; }
        (i.dataset.kind === 'coef' ? coef : rate)[i.dataset.name] = v / 100;
      });
      if (bad) { setMsg('#paramMsg', '請輸入 1 到 100 之間的百分比。', 'err'); return; }
      setMsg('#paramMsg', '儲存中…');
      try {
        await gateBatch(S.pwd, function (batch, fs, db) { batch.set(fs.doc(db, 'pub', 'params'), { coef: coef, rate: rate, updatedAt: fs.serverTimestamp() }); });
        setMsg('#paramMsg', '已儲存，所有人的頁面會即時套用。', 'ok');
      } catch (err) { setMsg('#paramMsg', '儲存失敗，請確認密碼與雲端規則設定。', 'err'); }
    });
  }

  if (typeof document !== 'undefined' && document.getElementById('main')) {
    bind();
    initCloud();
  }
  if (typeof window !== 'undefined') window.__App = { parseReport: parseReport, timeInfo: timeInfo, S: S, model: model, defsOf: defsOf, apply: apply, render: render };
})();
