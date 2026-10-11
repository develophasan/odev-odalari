import { sb, esc, tl, saat, saatKes, gunAdi, tarih, bugunISO, GUN_ADLARI, LOGO_SVG, oturum, profil } from './ortak.js';

document.getElementById('logo-yer').outerHTML = LOGO_SVG;
document.getElementById('yil').textContent = new Date().getFullYear();

// Giriş yapmış kullanıcıya paneline giden düğme
oturum().then(async (s) => {
  if (!s) return;
  const p = await profil();
  const a = document.getElementById('ust-giris');
  a.textContent = 'Panelim';
  a.href = p?.rol === 'admin' ? '/yonetim' : '/panel';
}).catch(() => {});

// ---------- Bu akşamın odaları: canlı koltuk durumu ----------
async function aksamOdalari() {
  const { data, error } = await sb.rpc('yaklasan_odalar', { p_gun: 7 });
  if (error || !data?.length) return;
  const haftaIci = data.filter((s) => s.tur === 'hafta_ici' && new Date(s.bitis) > new Date());
  if (!haftaIci.length) return;
  const gunKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date(d));
  const ilkGun = gunKey(haftaIci[0].baslangic);
  const secilen = haftaIci.filter((s) => gunKey(s.baslangic) === ilkGun);
  const bugunMu = ilkGun === bugunISO();
  document.getElementById('aksam-baslik').textContent = bugunMu ? 'Bu akşamın odaları' : `${gunAdi(secilen[0].baslangic)} akşamının odaları`;
  document.getElementById('aksam-tarih').textContent = tarih(secilen[0].baslangic);
  document.getElementById('aksam-liste').innerHTML = secilen.map((s) => {
    const bos = Math.max(0, s.kapasite - s.dolu);
    const koltuk = Array.from({ length: s.kapasite }, (_, i) => `<span class="koltuk${i < s.dolu ? ' dolu' : ''}"></span>`).join('');
    return `<li style="--renk:${esc(s.renk)}">
      <span class="saat">${saat(s.baslangic)}</span>
      <div><div class="oda-ad">${esc(s.oda)}</div><div class="oda-alt">${bos ? `${bos} boş koltuk` : 'Bu seans dolu'}</div></div>
      <div class="koltuklar" role="img" aria-label="${s.kapasite} koltuktan ${s.dolu} dolu">${koltuk}</div></li>`;
  }).join('');
}

// ---------- Haftalık saat tablosu ----------
async function haftalik() {
  const kap = document.getElementById('haftalik');
  const { data: odalar, error } = await sb.from('odalar').select('ad,tur,gunler,baslangic,bitis,kapasite,sinif_min,sinif_max,renk,sira').eq('aktif', true).order('sira');
  if (error || !odalar?.length) { kap.innerHTML = '<p style="padding:16px">Saatler şu an yüklenemedi.</p>'; return; }
  const gunler = [1, 2, 3, 4, 5, 6].filter((g) => odalar.some((o) => o.gunler.includes(g)));
  kap.innerHTML = `<table><thead><tr><th scope="col">Oda</th>${gunler.map((g) => `<th scope="col">${GUN_ADLARI[g]}</th>`).join('')}</tr></thead><tbody>
    ${odalar.map((o) => `<tr><th scope="row"><span class="oda-nokta" style="background:${esc(o.renk)}"></span>${esc(o.ad)}<br><span class="soluk kucuk">${o.sinif_min}–${o.sinif_max}. sınıf, en fazla ${o.kapasite} kişi</span></th>
      ${gunler.map((g) => o.gunler.includes(g) ? `<td class="var">${saatKes(o.baslangic)}–${saatKes(o.bitis)}</td>` : '<td class="yok" aria-label="yok">—</td>').join('')}</tr>`).join('')}
  </tbody></table>`;
}

// ---------- Paketler ----------
async function paketler() {
  const { data, error } = await sb.from('paketler').select('*').eq('aktif', true).order('sira');
  const abon = document.getElementById('paket-abonelik');
  const kredi = document.getElementById('paket-kredi');
  if (error || !data) { abon.innerHTML = '<p>Paketler şu an yüklenemedi.</p>'; return; }
  const satir = (p, one) => `<div class="paket-satir${one ? ' one' : ''}">
    <div><h3>${esc(p.ad)}</h3><p>${esc(p.aciklama)}</p></div>
    <div class="paket-fiyat">${tl(p.fiyat)}<small>${p.tur === 'kredi' ? `${p.kredi} seans, ${p.sure_gun} gün geçerli` : 'aylık'}</small></div>
    <a class="dugme ${one ? '' : 'ikincil'}" href="/giris?kayit=1&paket=${esc(p.id)}">Seç</a></div>`;
  const a = data.filter((p) => p.tur === 'abonelik');
  abon.innerHTML = a.map((p, i) => satir(p, i === 0)).join('') || '<p>Şu an aylık paket yok.</p>';
  kredi.innerHTML = data.filter((p) => p.tur === 'kredi').map((p) => satir(p, false)).join('');
}

aksamOdalari();
haftalik();
paketler();
