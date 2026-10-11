import { sb, $, LOGO_SVG, hataMetni, islem, profil } from './ortak.js';

$('#logo-yer').outerHTML = LOGO_SVG;
const q = new URLSearchParams(location.search);
if (q.get('paket')) { try { sessionStorage.setItem('secilen_paket', q.get('paket')); } catch {} }

const mesaj = $('#mesaj');
const yaz = (metin, tur = 'hata') => { mesaj.className = `mesaj ${tur}`; mesaj.textContent = metin; };
const formlar = ['#form-giris', '#form-kayit', '#form-unuttum', '#form-yeni'];
function goster(id) {
  formlar.forEach((f) => { $(f).hidden = f !== id; });
  $('.sekmeler').hidden = !(id === '#form-giris' || id === '#form-kayit');
  $('#sekme-giris').setAttribute('aria-selected', id === '#form-giris');
  $('#sekme-kayit').setAttribute('aria-selected', id === '#form-kayit');
  yaz('', 'bilgi');
}
$('#sekme-giris').onclick = () => goster('#form-giris');
$('#sekme-kayit').onclick = () => goster('#form-kayit');
$('#unuttum').onclick = (e) => { e.preventDefault(); goster('#form-unuttum'); };
$('[data-geri]').onclick = (e) => { e.preventDefault(); goster('#form-giris'); };
if (q.has('kayit')) goster('#form-kayit');

async function yonlendir() {
  let p = null;
  try { p = await profil(); } catch {}
  const hedef = q.get('d') || '';
  // Yalnızca sitenin kendi panellerine dönülür (başka siteye yönlendirme engeli)
  if (/^\/(panel|yonetim)(#[\w\-/]*)?$/.test(hedef)) {
    if (p?.rol === 'admin' || !hedef.startsWith('/yonetim')) { location.replace(hedef); return; }
  }
  location.replace(p?.rol === 'admin' ? '/yonetim' : '/panel');
}

// Şifre sıfırlama bağlantısıyla gelindiyse yeni şifre formu
let kurtarma = location.hash.includes('type=recovery') || q.has('yenile');
sb.auth.onAuthStateChange((olay) => {
  if (olay === 'PASSWORD_RECOVERY') { kurtarma = true; goster('#form-yeni'); }
});

const { data: { session } } = await sb.auth.getSession();
if (kurtarma && session) goster('#form-yeni');
else if (session) yonlendir();

$('#form-giris').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  islem(f.querySelector('button'), async () => {
    const { error } = await sb.auth.signInWithPassword({ email: f.eposta.value.trim(), password: f.sifre.value });
    if (error) { yaz(hataMetni(error)); return; }
    await yonlendir();
  });
});

$('#form-kayit').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  islem(f.querySelector('button'), async () => {
    const { data, error } = await sb.auth.signUp({
      email: f.eposta.value.trim(),
      password: f.sifre.value,
      options: {
        data: { ad_soyad: f.ad_soyad.value.trim(), telefon: f.telefon.value.trim() },
        emailRedirectTo: `${location.origin}/giris`,
      },
    });
    if (error) { yaz(hataMetni(error)); return; }
    if (data.session) { await yonlendir(); return; }
    f.reset();
    goster('#form-giris');
    yaz('Hesabınız oluşturuldu. E-posta adresinize gelen doğrulama bağlantısına tıklayın, sonra buradan giriş yapın.', 'iyi');
  });
});

$('#form-unuttum').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  islem(f.querySelector('button'), async () => {
    const { error } = await sb.auth.resetPasswordForEmail(f.eposta.value.trim(), { redirectTo: `${location.origin}/giris?yenile=1` });
    if (error) { yaz(hataMetni(error)); return; }
    yaz('Sıfırlama bağlantısı gönderildi. Gelen kutunuzu (ve gereksiz klasörünü) kontrol edin.', 'iyi');
  });
});

$('#form-yeni').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  islem(f.querySelector('button'), async () => {
    const { error } = await sb.auth.updateUser({ password: f.sifre.value });
    if (error) { yaz(hataMetni(error)); return; }
    yaz('Şifreniz güncellendi. Panelinize yönlendiriliyorsunuz.', 'iyi');
    setTimeout(yonlendir, 1200);
  });
});
