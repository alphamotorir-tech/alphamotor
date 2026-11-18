/* شماره تماس‌های قابل ویرایش از پنل مدیریت (Supabase، جدول site_settings).
   شماره‌ها و عنوان‌های پیش‌فرض داخل خود HTML هستند؛ اگر چیزی ذخیره نشده باشد یا اتصال برقرار نشود، همان‌ها نمایش داده می‌شوند.
   با ذخیرهٔ شماره در پنل، این اسکریپت در همهٔ صفحه‌ها این‌ها را عوض می‌کند:
   لینک‌های tel:، متن دکمه‌ها و نوار تماس پایین، برچسب‌های aria-label، شماره‌های داخل متن (مثل سؤال‌های متداول) و داده‌های ساختاریافتهٔ JSON-LD.
   کلیدها: phone1_name, phone1_number, phone2_name, phone2_number (اسلات اول = مهدی آذری، دوم = بهرام گوزلی در حالت پیش‌فرض). */
(function () {
  'use strict';
  var C = window.ALPHA_CONFIG || {};
  if (!C.SUPABASE_URL || !C.SUPABASE_KEY) return;

  // باید با همان چیزی که در HTML نوشته شده یکی باشد (همان مقدارهای پیش‌فرض پنل).
  var DEFAULTS = [
    { name: 'مهدی آذری', number: '09142446456' },
    { name: 'بهرام گوزلی', number: '09306530399' }
  ];

  var keys = [];
  DEFAULTS.forEach(function (d, i) { keys.push('phone' + (i + 1) + '_name', 'phone' + (i + 1) + '_number'); });

  var url = C.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/site_settings?select=key,value&key=in.(' + keys.join(',') + ')';
  var headers = { apikey: C.SUPABASE_KEY };
  if (C.SUPABASE_KEY.indexOf('sb_') !== 0) headers.Authorization = 'Bearer ' + C.SUPABASE_KEY;

  function normDigits(s) {
    return String(s)
      .replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); })
      .replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); });
  }
  function cleanNumber(s) {
    var t = normDigits(s).replace(/[\s\-().]/g, '');
    return /^\+?\d{8,15}$/.test(t) ? t : '';
  }
  // 09142446456 → +989142446456 (برای JSON-LD)
  function intl(n) {
    if (n.charAt(0) === '+') return n;
    if (n.slice(0, 2) === '00') return '+' + n.slice(2);
    if (n.charAt(0) === '0') return '+98' + n.slice(1);
    return '+' + n;
  }
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function run(rows) {
    var map = {};
    rows.forEach(function (r) { map[r.key] = r.value; });

    var slots = [];
    DEFAULTS.forEach(function (d, i) {
      var n = typeof map['phone' + (i + 1) + '_number'] === 'string' ? cleanNumber(map['phone' + (i + 1) + '_number']) : '';
      var nm = typeof map['phone' + (i + 1) + '_name'] === 'string' ? map['phone' + (i + 1) + '_name'].trim() : '';
      if (nm.length < 2 || nm.length > 40) nm = '';
      var s = { oldName: d.name, oldNumber: d.number, newName: nm || d.name, newNumber: n || d.number };
      if (s.newName !== s.oldName || s.newNumber !== s.oldNumber) slots.push(s);
    });
    if (!slots.length) return;

    function fixText(str) {
      slots.forEach(function (s) {
        if (s.newNumber !== s.oldNumber) str = str.split(s.oldNumber).join(s.newNumber);
      });
      return str;
    }
    function fixLabel(str, s) {
      if (s.newName !== s.oldName) str = str.split(s.oldName).join(s.newName);
      if (s.newNumber !== s.oldNumber) str = str.split(s.oldNumber).join(s.newNumber);
      return str;
    }

    // ۱) لینک‌های تماس: href، متن دکمه و aria-label (عنوان فقط داخل همین لینک‌ها عوض می‌شود)
    document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
      var num = a.getAttribute('href').replace(/^tel:/, '');
      var s = null;
      for (var i = 0; i < slots.length; i++) { if (slots[i].oldNumber === num) { s = slots[i]; break; } }
      if (!s) return;
      a.setAttribute('href', 'tel:' + s.newNumber);
      var label = a.getAttribute('aria-label');
      if (label) a.setAttribute('aria-label', fixLabel(label, s));
      var walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
      var node;
      while ((node = walker.nextNode())) node.nodeValue = fixLabel(node.nodeValue, s);
    });

    // ۲) شماره‌های داخل متن‌های دیگر (مثلاً پاسخ سؤال «چطور تماس بگیرم؟»)
    var any = new RegExp(slots.filter(function (s) { return s.newNumber !== s.oldNumber; })
      .map(function (s) { return esc(s.oldNumber); }).join('|'));
    if (any.source !== '(?:)') {
      var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          var p = n.parentNode && n.parentNode.nodeName;
          if (p === 'SCRIPT' || p === 'STYLE' || p === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
          return any.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      var list = [], nd;
      while ((nd = w.nextNode())) list.push(nd);
      list.forEach(function (n) { n.nodeValue = fixText(n.nodeValue); });
    }

    // ۳) داده‌های ساختاریافته (JSON-LD)
    var swaps = {};
    slots.forEach(function (s) { if (s.newNumber !== s.oldNumber) swaps[intl(s.oldNumber)] = intl(s.newNumber); });
    function walk(v) {
      if (typeof v === 'string') return Object.prototype.hasOwnProperty.call(swaps, v) ? swaps[v] : v;
      if (Array.isArray(v)) return v.map(walk);
      if (v && typeof v === 'object') { Object.keys(v).forEach(function (k) { v[k] = walk(v[k]); }); return v; }
      return v;
    }
    if (Object.keys(swaps).length) {
      document.querySelectorAll('script[type="application/ld+json"]').forEach(function (scr) {
        try { scr.textContent = JSON.stringify(walk(JSON.parse(scr.textContent))); } catch (e) { /* ignore */ }
      });
    }
  }

  function start() {
    fetch(url, { headers: headers }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(run).catch(function () { /* سایت با مقدارهای پیش‌فرض کار می‌کند */ });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
