// Ödev Odaları – ortak yardımcılar
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_ANAHTAR } from './ayar.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANAHTAR, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const TZ = 'Europe/Istanbul';
export const GUN_ADLARI = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
export const GUN_KISA = ['', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const ODA_SUTUN = 'id,ad,tur,gunler,baslangic,bitis,kapasite,sinif_min,sinif_max,ogretmen,renk,aktif,sira';
// Yalnızca gerçek Google Meet bağlantıları gösterilir
export const guvenliMeet = (u) => (/^https:\/\/meet\.google\.com\/[a-z0-9-]+$/.test(String(u || '')) ? u : '');
// Kullanıcının görmeye yetkili olduğu Meet bağlantıları: { oda_id: url }
export async function baglantilar() {
  const { data } = await sb.from('oda_baglanti').select('oda_id,meet_linki');
  return Object.fromEntries((data || []).map((b) => [b.oda_id, guvenliMeet(b.meet_linki)]));
}

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export const $ = (s, k = document) => k.querySelector(s);
export const $$ = (s, k = document) => [...k.querySelectorAll(s)];

export const tl = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(Number(n || 0));
export const saat = (d) => new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(d));
export const tarih = (d) => new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, day: 'numeric', month: 'long' }).format(new Date(d));
export const tarihKisa = (d) => new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d));
export const gunAdi = (d) => new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, weekday: 'long' }).format(new Date(d));
export const gunKisa = (d) => new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, weekday: 'short' }).format(new Date(d));
export const gunNo = (d) => new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, day: 'numeric' }).format(new Date(d));
export const tarihSaat = (d) => `${tarih(d)} ${gunAdi(d)}, ${saat(d)}`;
export const saatKes = (t) => String(t || '').slice(0, 5);

// İstanbul'a göre YYYY-AA-GG
export function bugunISO(eklenecekGun = 0) {
  const d = new Date(Date.now() + eklenecekGun * 864e5);
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
// "2026-10-12" + "17:00" → İstanbul saatiyle ISO (Türkiye sabit UTC+3)
export const istanbulISO = (gun, s) => new Date(`${gun}T${s}:00+03:00`).toISOString();
export function haftaBasi(iso = bugunISO()) {
  const d = new Date(`${iso}T12:00:00+03:00`);
  const g = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - g);
  return d.toISOString().slice(0, 10);
}
export function gunEkle(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const DURUM_ADI = {
  bekliyor: 'Ödeme bekleniyor', bildirildi: 'Kontrol ediliyor', onaylandi: 'Onaylandı',
  reddedildi: 'Ödeme bulunamadı', iptal: 'İptal edildi', planli: 'Planlı', tamamlandi: 'Tamamlandı', aktif: 'Aktif',
};
export const etiket = (d) => `<span class="etiket ${esc(d)}">${esc(DURUM_ADI[d] || d)}</span>`;
export const odaNokta = (renk) => `<span class="oda-nokta" style="background:${esc(renk || '#1F5F6B')}"></span>`;
export const basHarf = (ad) => esc((ad || '?').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR'));

export function toast(metin, hata = false) {
  let t = $('#bildirim-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'bildirim-toast';
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    document.body.append(t);
  }
  t.textContent = metin;
  t.classList.toggle('hata', hata);
  t.classList.add('goster');
  clearTimeout(t._z);
  t._z = setTimeout(() => t.classList.remove('goster'), 4200);
}

// Supabase hata mesajlarını anlaşılır Türkçeye çevir
export function hataMetni(e) {
  const m = e?.message || String(e || 'Bilinmeyen hata');
  const tablo = [
    [/Invalid login credentials/i, 'E-posta veya şifre hatalı.'],
    [/Email not confirmed/i, 'E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzdaki bağlantıya tıklayın.'],
    [/User already registered/i, 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.'],
    [/Password should be at least/i, 'Şifre en az 6 karakter olmalı.'],
    [/rate limit/i, 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin.'],
    [/row-level security/i, 'Bu işlem için yetkiniz yok.'],
    [/Failed to fetch|NetworkError/i, 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.'],
    [/mime type|not supported/i, 'Bu dosya türü desteklenmiyor. Fotoğraf (JPG, PNG) veya PDF yükleyin.'],
    [/check constraint .*uzunluk|value too long/i, 'Yazdığınız metin çok uzun. Lütfen kısaltın.'],
    [/JWT expired|invalid JWT|refresh_token/i, 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.'],
    [/timeout|timed out|\b50[234]\b/i, 'Sunucu şu an yanıt vermiyor. Biraz sonra tekrar deneyin.'],
    [/exceeded the maximum allowed size|Payload too large/i, 'Dosya 10 MB sınırını aşıyor.'],
  ];
  for (const [r, t] of tablo) if (r.test(m)) return t;
  return m;
}

// İşlemi düğmeyi kilitleyerek çalıştır
export async function islem(dugme, fn) {
  const eski = dugme?.innerHTML;
  if (dugme) { dugme.disabled = true; dugme.innerHTML = 'Bekleyin…'; }
  try { return await fn(); }
  catch (e) { toast(hataMetni(e), true); console.error(e); return undefined; }
  finally { if (dugme) { dugme.disabled = false; dugme.innerHTML = eski; } }
}

// Sorgu sonucu: hata varsa fırlat
export async function al(sorgu) {
  const { data, error } = await sorgu;
  if (error) throw error;
  return data;
}

export async function oturum() {
  const { data } = await sb.auth.getSession();
  return data.session;
}
export async function profil() {
  const s = await oturum();
  if (!s) return null;
  const { data, error } = await sb.from('profiller').select('*').eq('id', s.user.id).maybeSingle();
  if (error) throw error;
  return data;
}

function girisSayfasinaGit() {
  location.replace('/giris?d=' + encodeURIComponent(location.pathname + location.hash));
}

// Sayfa hiç açılamadığında gösterilen ekran (sunucuya ulaşılamadı vb.)
export function cokmeEkrani(metin) {
  document.body.innerHTML = `<main class="kap" style="padding:64px 0;max-width:560px" role="alert">
    <h1 style="font-size:1.8rem">Sayfa şu an açılamadı</h1>
    <p class="soluk">${esc(metin)}</p>
    <p style="display:flex;gap:.5rem;flex-wrap:wrap"><button class="dugme" id="cokme-tekrar">Tekrar dene</button> <a class="dugme ikincil" href="/">Ana sayfa</a></p></main>`;
  document.getElementById('cokme-tekrar').onclick = () => location.reload();
}

// Panel sayfaları için koruma: giriş yoksa /giris, yanlış roldeyse doğru panele
export async function koru(beklenenRol) {
  let s;
  try { s = await oturum(); } catch { s = null; }
  if (!s) { girisSayfasinaGit(); return null; }
  let p;
  try { p = await profil(); }
  catch (e) {
    // Oturum süresi dolmuş ya da token geçersiz: tekrar giriş
    if (/JWT|token|expired/i.test(e?.message || '') || e?.code === 'PGRST301') { await sb.auth.signOut().catch(() => {}); girisSayfasinaGit(); return null; }
    cokmeEkrani(hataMetni(e) + ' Bilgileriniz güvende; bağlantı düzelince sayfayı yenileyin.');
    return null;
  }
  if (!p) { await sb.auth.signOut().catch(() => {}); girisSayfasinaGit(); return null; }
  if (beklenenRol === 'admin' && p.rol !== 'admin') { location.replace('/panel'); return null; }
  // Başka sekmede çıkış yapılırsa ya da oturum yenilenemezse bu sekme de girişe döner
  sb.auth.onAuthStateChange((olay) => { if (olay === 'SIGNED_OUT') girisSayfasinaGit(); });
  return p;
}

// ---------- Çökme ve bağlantı dayanıklılığı ----------
window.addEventListener('unhandledrejection', (e) => { console.error(e.reason); toast(hataMetni(e.reason), true); });
function baglantiDurumu() {
  let b = document.getElementById('cevrimdisi');
  if (navigator.onLine) { b?.remove(); return; }
  if (b) return;
  b = document.createElement('div');
  b.id = 'cevrimdisi';
  b.setAttribute('role', 'alert');
  b.textContent = 'İnternet bağlantınız kesildi. Bağlantı gelince işlemlerinize devam edebilirsiniz.';
  b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:200;background:#A8620E;color:#fff;padding:10px 16px;text-align:center;font-weight:700';
  document.body.append(b);
}
window.addEventListener('offline', baglantiDurumu);
window.addEventListener('online', () => { baglantiDurumu(); toast('Bağlantı geri geldi'); });

export async function cikis() {
  await sb.auth.signOut();
  location.href = '/';
}

export async function imzaliUrl(kova, yol, sure = 600) {
  const { data, error } = await sb.storage.from(kova).createSignedUrl(yol, sure);
  if (error) throw error;
  return data.signedUrl;
}

export function guvenliDosyaAdi(ad) {
  const tr = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'C', Ğ: 'G', İ: 'I', Ö: 'O', Ş: 'S', Ü: 'U' };
  return ad.replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => tr[c]).replace(/[^\w.\-]+/g, '_').slice(-80);
}

export function dialogAc(html, kur) {
  const d = document.createElement('dialog');
  d.innerHTML = html;
  document.body.append(d);
  d.addEventListener('close', () => d.remove());
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  $$('[data-kapat]', d).forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); d.close(); }));
  kur?.(d);
  d.showModal();
  return d;
}

export function onayla(metin, eylem = 'Evet', tehlike = false) {
  return new Promise((coz) => {
    let sonuc = false;
    const d = dialogAc(`<div class="dialog-ic"><p style="font-size:1.05rem">${esc(metin)}</p>
      <div class="dialog-eylem"><button class="dugme ikincil" data-kapat>Vazgeç</button>
      <button class="dugme ${tehlike ? 'tehlike' : ''}" data-evet>${esc(eylem)}</button></div></div>`, (d) => {
      $('[data-evet]', d).addEventListener('click', () => { sonuc = true; d.close(); });
    });
    d.addEventListener('close', () => coz(sonuc));
  });
}

export function kopyala(metin) {
  navigator.clipboard?.writeText(metin).then(() => toast('Kopyalandı')).catch(() => toast('Kopyalanamadı, elle seçin', true));
}

// Form verisini nesneye çevir
export function formVeri(form) {
  const o = {};
  for (const [k, v] of new FormData(form)) {
    if (k in o) o[k] = [].concat(o[k], v); else o[k] = v;
  }
  return o;
}

export const LOGO_SVG = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="8" fill="currentColor" opacity=".12"/><circle cx="11" cy="11" r="4.2" fill="#1F5F6B"/><circle cx="21" cy="11" r="4.2" fill="#2E7D5B"/><circle cx="11" cy="21" r="4.2" fill="#C46A1A"/><circle cx="21" cy="21" r="4.2" fill="none" stroke="#F2B930" stroke-width="2.4"/></svg>`;
