/* آدرس و موقعیت مکانی قابل ویرایش از پنل مدیریت (Supabase، جدول site_settings).
   آدرس و نقشهٔ پیش‌فرض داخل خود HTML هستند؛ اگر چیزی ذخیره نشده باشد یا اتصال برقرار نشود، همان‌ها نمایش داده می‌شوند.
   عناصر هدف با data-loc مشخص شده‌اند: address، map-embed، map-link. */
(function () {
  'use strict';
  var C = window.ALPHA_CONFIG || {};
  if (!C.SUPABASE_URL || !C.SUPABASE_KEY) return;
  if (!document.querySelector('[data-loc]')) return;

  var url = C.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/site_settings?select=key,value&key=in.(address,map_lat,map_lng)';
  var headers = { apikey: C.SUPABASE_KEY };
  if (C.SUPABASE_KEY.indexOf('sb_') !== 0) headers.Authorization = 'Bearer ' + C.SUPABASE_KEY;

  fetch(url, { headers: headers }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (rows) {
    var map = {};
    rows.forEach(function (r) { map[r.key] = r.value; });

    var addr = typeof map.address === 'string' ? map.address.trim() : '';
    if (addr && addr.length <= 300) {
      document.querySelectorAll('[data-loc="address"]').forEach(function (el) { el.textContent = addr; });
    }

    // مختصات فقط وقتی عدد معتبر باشد وارد آدرس نقشه می‌شود
    var lat = parseFloat(map.map_lat), lng = parseFloat(map.map_lng);
    if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      var q = lat + ',' + lng;
      var embed = 'https://www.google.com/maps?q=' + q + '&output=embed';
      var link = 'https://www.google.com/maps/search/?api=1&query=' + q;
      document.querySelectorAll('iframe[data-loc="map-embed"]').forEach(function (el) {
        if (el.getAttribute('src') !== embed) el.setAttribute('src', embed);
      });
      document.querySelectorAll('a[data-loc="map-link"]').forEach(function (el) { el.setAttribute('href', link); });
    }
  }).catch(function () { /* سایت با مقدارهای پیش‌فرض کار می‌کند */ });
})();
