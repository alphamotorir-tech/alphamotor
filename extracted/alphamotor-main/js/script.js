if (!('IntersectionObserver' in window)) {
  document.querySelectorAll('.reveal-io').forEach(el => el.classList.add('in-view'));
}
const items = document.querySelectorAll('.reveal-io');

const io = !('IntersectionObserver' in window) ? { observe(){}, unobserve(){} } : new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

items.forEach(el => io.observe(el));

/* ---------- تب‌های خدمات: خودرو / موتورسیکلت ---------- */
const tabs = document.querySelectorAll('.service-tab');
const panels = document.querySelectorAll('.service-panel');

function showServiceTab(name) {
  tabs.forEach(t => {
    const on = t.dataset.target === name;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  panels.forEach(p => { p.hidden = p.id !== 'panel-' + name; });
}

tabs.forEach(t => t.addEventListener('click', () => showServiceTab(t.dataset.target)));

// باز کردن مستقیم تب موتورسیکلت با /#moto
if (location.hash === '#moto') showServiceTab('moto');
