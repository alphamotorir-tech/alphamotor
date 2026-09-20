/* بارگذاری محتوای قابل ویرایش از Supabase (متن‌ها، کارت خدمات، نظرات).
   متن‌های پیش‌فرض داخل خود HTML هستند؛ اگر اتصال برقرار نباشد سایت همان‌ها را نشان می‌دهد. */
(function () {
  'use strict';
  var C = window.ALPHA_CONFIG || {};
  if (!C.SUPABASE_URL || !C.SUPABASE_KEY) return;

  var BASE = C.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/';

  function headers(extra) {
    var h = { apikey: C.SUPABASE_KEY };
    if (C.SUPABASE_KEY.indexOf('sb_') !== 0) h.Authorization = 'Bearer ' + C.SUPABASE_KEY;
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }

  function get(path) {
    return fetch(BASE + path, { headers: headers() }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /* ---------- متن‌های سایت ---------- */
  function applySettings(rows) {
    var map = {};
    rows.forEach(function (r) { map[r.key] = r.value; });
    document.querySelectorAll('[data-setting]').forEach(function (el) {
      var v = map[el.getAttribute('data-setting')];
      if (typeof v === 'string' && v.trim()) el.textContent = v;
    });
  }

  /* ---------- کارت خدمات (موضوعات) ---------- */
  function applyServices(rows) {
    rows.forEach(function (s) {
      var link = null;
      var links = document.querySelectorAll('.card-body h3 a[href^="services/"]');
      for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute('href').replace(/\.html$/, '') === 'services/' + s.slug) { link = links[i]; break; }
      }
      if (!link) return;
      var card = link.closest('.card');
      if (!card) return;
      var wrap = card.closest('.reveal-io') || card;
      if (s.visible === false) { wrap.style.display = 'none'; return; }
      link.textContent = s.title;
      var p = card.querySelector('.card-body p');
      if (p && s.description) p.textContent = s.description;
      var img = card.querySelector('.card-media img');
      if (img) {
        if (s.image_url && img.getAttribute('src') !== s.image_url) img.src = s.image_url;
        if (s.image_alt) img.alt = s.image_alt;
      }
    });
  }

  /* ---------- نظرات ---------- */
  var list = document.getElementById('reviews-list');

  function renderReviews(rows) {
    if (!list) return;
    list.textContent = '';
    if (!rows.length) {
      var empty = document.createElement('p');
      empty.className = 'reviews-empty';
      empty.textContent = 'هنوز نظری ثبت نشده است. اولین نفر باشید.';
      list.appendChild(empty);
      return;
    }
    rows.forEach(function (r) {
      var art = document.createElement('article');
      art.className = 'review-card';

      var head = document.createElement('div');
      head.className = 'review-head';
      var name = document.createElement('strong');
      name.textContent = r.name;
      head.appendChild(name);
      if (r.rating) {
        var st = document.createElement('span');
        st.className = 'review-stars';
        st.setAttribute('aria-label', 'امتیاز ' + r.rating + ' از ۵');
        st.textContent = '★★★★★'.slice(0, r.rating) + '☆☆☆☆☆'.slice(0, 5 - r.rating);
        head.appendChild(st);
      }
      art.appendChild(head);

      if (r.service) {
        var svc = document.createElement('div');
        svc.className = 'review-service';
        svc.textContent = r.service;
        art.appendChild(svc);
      }

      var body = document.createElement('p');
      body.textContent = r.body;
      art.appendChild(body);

      list.appendChild(art);
    });
  }

  function loadReviews() {
    if (!list) return;
    get('reviews?select=id,name,service,rating,body,created_at&order=created_at.desc&limit=30')
      .then(renderReviews)
      .catch(function () { /* سایت بدون نظرات هم کار می‌کند */ });
  }

  var form = document.getElementById('review-form');
  var msg = document.getElementById('review-msg');

  function say(text, ok) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'review-msg ' + (ok ? 'ok' : 'err');
  }

  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var fd = new FormData(form);
      if (fd.get('website')) return; // ربات‌ها فیلد مخفی را پر می‌کنند

      var name = String(fd.get('name') || '').trim();
      var service = String(fd.get('service') || '').trim();
      var body = String(fd.get('body') || '').trim();
      var rating = parseInt(fd.get('rating'), 10);

      if (name.length < 2) return say('لطفاً نام خود را وارد کنید.', false);
      if (body.length < 10) return say('متن نظر حداقل ۱۰ حرف باشد.', false);

      try {
        var last = parseInt(localStorage.getItem('alpha_review_last'), 10) || 0;
        if (Date.now() - last < 60000) return say('لطفاً کمی بعد دوباره تلاش کنید.', false);
      } catch (e) { /* ignore */ }

      var payload = { name: name, body: body };
      if (service) payload.service = service;
      if (rating >= 1 && rating <= 5) payload.rating = rating;

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      fetch(BASE + 'reviews', {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        try { localStorage.setItem('alpha_review_last', String(Date.now())); } catch (e) { /* ignore */ }
        form.reset();
        say('ممنون! نظر شما ثبت شد.', true);
        loadReviews();
      }).catch(function () {
        say('ثبت نظر انجام نشد. لطفاً بعداً دوباره تلاش کنید.', false);
      }).then(function () { btn.disabled = false; });
    });
  }

  /* ---------- شروع ---------- */
  if (document.querySelector('[data-setting]')) {
    get('site_settings?select=key,value').then(applySettings).catch(function () {});
  }
  if (document.querySelector('.card-body h3 a[href^="services/"]')) {
    get('services?select=slug,title,description,image_url,image_alt,visible').then(applyServices).catch(function () {});
  }
  loadReviews();
})();
