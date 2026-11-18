/* تنظیمات اتصال به Supabase و Cloudinary
   - SUPABASE_KEY باید کلید عمومی (publishable / anon) باشد، نه service_role.
   - این کلید عمومی است و امنیت داده‌ها با RLS در دیتابیس تأمین می‌شود. */
window.ALPHA_CONFIG = {
  SUPABASE_URL: 'https://ptyktvgdbabvcxnhgpql.supabase.co',
  SUPABASE_KEY: 'sb_publishable_GN8YfpkA5eu6TUvp-9oQDg_QEejh6Hv',
  CLOUDINARY_CLOUD_NAME: 'soycdeg8',
  CLOUDINARY_UPLOAD_PRESET: 'alpha_motor_unsigned'
};
