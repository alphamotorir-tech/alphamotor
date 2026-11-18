/* دکمهٔ «پنل مدیریت» فقط برای مدیری که در همین مرورگر وارد پنل شده است.
   پرچم را صفحهٔ /admin/ بعد از تأیید مدیر بودن می‌گذارد و هنگام خروج پاک می‌کند.
   این فقط یک میان‌بر ظاهری است؛ امنیت اصلی پنل با ورود و قفل دیتابیس است. */
(function () {
  'use strict';
  try { if (localStorage.getItem('alpha_admin_ui') !== '1') return; } catch (e) { return; }
  var me = document.querySelector('script[src$="admin-link.js"]');
  if (!me) return;
  var url;
  try { url = new URL('../admin/', me.src).href; } catch (e) { return; }

  function add() {
    if (document.getElementById('alpha-admin-link')) return;
    var a = document.createElement('a');
    a.id = 'alpha-admin-link';
    a.href = url;
    a.textContent = '⚙️ پنل مدیریت';
    a.setAttribute('aria-label', 'ورود به پنل مدیریت');
    a.style.cssText = 'position:fixed;top:calc(10px + env(safe-area-inset-top,0px));left:10px;z-index:9999;' +
      'background:#3E4A52;color:#fff;font:600 13px/1 Vazirmatn,Tahoma,sans-serif;padding:10px 14px;' +
      'border-radius:24px;text-decoration:none;box-shadow:0 2px 10px rgba(0,0,0,.25)';
    document.body.appendChild(a);
  }
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
})();
