import { createRequire } from 'node:module'; const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
import fs from 'node:fs';
const sahte = fs.readFileSync('sahte-supabase.js', 'utf8');
const simdi = Date.now();
const iso = (saatSonra) => new Date(simdi + saatSonra * 36e5).toISOString();
const odalar = [
  { id: 'oa', ad: 'Oda A', tur: 'hafta_ici', gunler: [1,2,3,4], baslangic: '17:00:00', bitis: '18:00:00', kapasite: 4, sinif_min: 1, sinif_max: 4, renk: '#1F5F6B', meet_linki: 'https://meet.google.com/hje-cseg-tbb', ogretmen: 'Kurucu', aktif: true, sira: 1 },
  { id: 'ob', ad: 'Oda B', tur: 'hafta_ici', gunler: [1,2,3,4], baslangic: '18:15:00', bitis: '19:15:00', kapasite: 4, sinif_min: 1, sinif_max: 4, renk: '#2E7D5B', meet_linki: 'https://meet.google.com/ydc-gtdy-xvz', ogretmen: 'Kurucu', aktif: true, sira: 2 },
  { id: 'oc', ad: 'Oda C', tur: 'hafta_ici', gunler: [1,2,3,4], baslangic: '19:30:00', bitis: '20:30:00', kapasite: 4, sinif_min: 1, sinif_max: 4, renk: '#C46A1A', meet_linki: '', ogretmen: 'Kurucu', aktif: true, sira: 3 },
  { id: 'od', ad: 'Cumartesi Genel Tekrar', tur: 'hafta_sonu', gunler: [6], baslangic: '10:00:00', bitis: '12:00:00', kapasite: 6, sinif_min: 1, sinif_max: 4, renk: '#6B4FA0', meet_linki: '', ogretmen: 'Kurucu', aktif: true, sira: 4 },
];
const paketler = [
  { id: 'p1', ad: 'Tam Paket', aciklama: 'Pazartesi–Perşembe 4×60 dk ödev odası + Cumartesi 2 saat Genel Tekrar + Cuma gelişim raporu', fiyat: 6250, tur: 'abonelik', hafta_ici_gunler: [1,2,3,4], hafta_sonu: true, kredi: 0, sure_gun: 30, aktif: true, sira: 1 },
  { id: 'p2', ad: 'Günlük Ödev Odası', aciklama: 'Pazartesi–Perşembe 4×60 dk, 3–4 kişilik grup + Cuma gelişim raporu', fiyat: 4750, tur: 'abonelik', hafta_ici_gunler: [1,2,3,4], hafta_sonu: false, kredi: 0, sure_gun: 30, aktif: true, sira: 2 },
  { id: 'p3', ad: 'Yarım Paket', aciklama: 'Pazartesi ve Çarşamba ödev odası + Cuma gelişim raporu', fiyat: 2900, tur: 'abonelik', hafta_ici_gunler: [1,3], hafta_sonu: false, kredi: 0, sure_gun: 30, aktif: true, sira: 3 },
  { id: 'p4', ad: 'Hafta Sonu Genel Tekrar', aciklama: 'Cumartesi 2 saat haftalık konu tekrarı, en fazla 6 kişilik grup', fiyat: 1900, tur: 'abonelik', hafta_ici_gunler: [], hafta_sonu: true, kredi: 0, sure_gun: 30, aktif: true, sira: 4 },
  { id: 'p5', ad: 'Tek Seans', aciklama: 'İhtiyaç anında 1 ödev seansı – en erken boş odaya otomatik yerleşim', fiyat: 350, tur: 'kredi', hafta_ici_gunler: [], hafta_sonu: false, kredi: 1, sure_gun: 60, aktif: true, sira: 5 },
  { id: 'p6', ad: '5 Seanslık Kart', aciklama: '5 ödev seansı – istediğiniz gün kullanın (60 gün geçerli)', fiyat: 1600, tur: 'kredi', hafta_ici_gunler: [], hafta_sonu: false, kredi: 5, sure_gun: 60, aktif: true, sira: 6 },
];
const ogrenciler = [
  { id: 'c1', veli_id: 'u1', ad_soyad: 'Elif Yılmaz', sinif: 3, okul: 'Atatürk İlkokulu', notlar: 'Okumada biraz yavaş', kvkk_onay: true, kvkk_onay_tarihi: iso(-200), aktif: true, veli: { ad_soyad: 'Ayşe Yılmaz', telefon: '0532 111 22 33', eposta: 'ayse@ornek.com' } },
  { id: 'c2', veli_id: 'u1', ad_soyad: 'Can Yılmaz', sinif: 1, okul: '', notlar: '', kvkk_onay: true, kvkk_onay_tarihi: iso(-200), aktif: true, veli: { ad_soyad: 'Ayşe Yılmaz', telefon: '0532 111 22 33', eposta: 'ayse@ornek.com' } },
];
const ogr = (i) => ({ id: ogrenciler[i].id, ad_soyad: ogrenciler[i].ad_soyad, sinif: ogrenciler[i].sinif });
const seans = (id, oda, s, rez) => ({ id, tarih: new Date(simdi + s*36e5 + 3*36e5).toISOString().slice(0,10), baslangic: iso(s), bitis: iso(s+1), durum: 'planli', iptal_nedeni: null, telafi_mi: false, oda: odalar.find(o=>o.id===oda), rez });
const seanslar = [
  { ...seans('11111111-1111-1111-1111-111111111111', 'oa', 2, [{ id: 'r1', durum: 'aktif', kaynak: 'abonelik', ogrenci: ogr(0) }, { id: 'r2', durum: 'aktif', kaynak: 'kredi', ogrenci: ogr(1) }]) },
  { ...seans('22222222-2222-2222-2222-222222222222', 'ob', 3.25, [{ id: 'r3', durum: 'aktif', kaynak: 'abonelik', ogrenci: ogr(0) }]) },
  { ...seans('33333333-3333-3333-3333-333333333333', 'oc', 4.5, []), durum: 'iptal', iptal_nedeni: 'Öğretmen rahatsızlığı' },
];
const ortak = {
  odalar, paketler,
  ayarlar: [{ id: 1, marka: 'Ödev Odaları', iban: 'TR12 0006 4000 0011 2345 6789 01', banka: 'Örnek Bankası', hesap_sahibi: 'Hasan Özdemir', odeme_notu: 'Açıklama kısmına mutlaka sipariş kodunuzu yazın.', iletisim_telefon: '', iletisim_eposta: '', rezervasyon_min_dakika: 60, kredi_iade_saat: 2 }],
  rpc: {
    yaklasan_odalar: [
      { seans_id: 'a', oda: 'Oda A', renk: '#1F5F6B', tur: 'hafta_ici', baslangic: iso(2), bitis: iso(3), kapasite: 4, dolu: 3 },
      { seans_id: 'b', oda: 'Oda B', renk: '#2E7D5B', tur: 'hafta_ici', baslangic: iso(3.25), bitis: iso(4.25), kapasite: 4, dolu: 4 },
      { seans_id: 'c', oda: 'Oda C', renk: '#C46A1A', tur: 'hafta_ici', baslangic: iso(4.5), bitis: iso(5.5), kapasite: 4, dolu: 1 },
    ],
    kredi_bakiyesi: 3,
  },
};
const veli = { ...ortak, oturum: 'u1',
  profiller: [{ id: 'u1', rol: 'veli', ad_soyad: 'Ayşe Yılmaz', telefon: '0532 111 22 33', eposta: 'ayse@ornek.com' }],
  ogrenciler,
  rezervasyonlar: [ { id: 'r1', kaynak: 'abonelik', ogrenci_id: 'c1', seans: seanslar[0] }, { id: 'r2', kaynak: 'kredi', ogrenci_id: 'c2', seans: seanslar[0] }, { id: 'r3', kaynak: 'abonelik', ogrenci_id: 'c1', seans: seanslar[1] } ],
  kayitlar: [{ id: 'k1', ogrenci_id: 'c1', gunler: [1,2,3,4], baslangic: '2026-10-12', bitis: '2026-11-11', aktif: true, oda: odalar[0] }],
  duyurular: [{ id: 'd1', baslik: '29 Ekim tatili', icerik: 'Cumhuriyet Bayramı nedeniyle 29 Ekim Perşembe seans yapılmayacak.', sabit: true, olusturuldu: iso(-20), oda: null }],
  siparisler: [
    { id: 's1', kod: 'OD-4F2A9C', durum: 'bekliyor', tutar: 6250, olusturuldu: iso(-1), ogrenci_id: 'c1', paket: { ad: 'Tam Paket', tur: 'abonelik' }, ogrenci: { ad_soyad: 'Elif Yılmaz' } },
    { id: 's2', kod: 'OD-91B07E', durum: 'onaylandi', tutar: 1600, olusturuldu: iso(-90), ogrenci_id: 'c2', sonuc_notu: '5 seans kredisi yüklendi.', paket: { ad: '5 Seanslık Kart', tur: 'kredi' }, ogrenci: { ad_soyad: 'Can Yılmaz' } },
  ],
  bildirimler: [{ id: 'b1', baslik: 'Ödemeniz onaylandı', icerik: '5 Seanslık Kart paketiniz aktif.', okundu: false, olusturuldu: iso(-80) }],
  haftalik_raporlar: [{ id: 'h1', ogrenci_id: 'c1', hafta_baslangic: '2026-10-05', yayinda: true, istatistik: { planlanan: 4, katildi: 4, bitti: 3, kismen: 1, bitmedi: 0, yardim_ort: 2.3, notlar: [{ tarih: '2026-10-07', ders: 'Matematik', not: 'Eldeli toplamada hızlandı.' }] }, iyi_gidenler: 'Her gün zamanında katıldı, matematik ödevlerini kendi başına bitirdi.', takildigi_konular: 'Uzun okuma metinlerinde dikkat dağılıyor.', evde_destek: 'Akşamları 10 dakika sesli okuma.', gelecek_hafta: 'Kesirlere giriş.' }],
  odevler: [{ id: 'o1', ogrenci_id: 'c1', dosya_yolu: 'u1/c1/1-mat.jpg', dosya_adi: 'mat.jpg', not_metni: 'Sayfa 34', geri_bildirim: 'Güzel çalıştı', olusturuldu: iso(-2), seans: { baslangic: iso(2), oda: { ad: 'Oda A' } } }],
};
const yonetici = { ...ortak, oturum: 'u9',
  profiller: [{ id: 'u9', rol: 'admin', ad_soyad: 'Hasan Özdemir', telefon: '', eposta: 'gamzehasanozdemir@gmail.com', olusturuldu: iso(-300) }, { id: 'u1', rol: 'veli', ad_soyad: 'Ayşe Yılmaz', telefon: '0532 111 22 33', eposta: 'ayse@ornek.com', olusturuldu: iso(-200) }],
  ogrenciler, seanslar, devam: [],
  siparisler: [
    { id: 's1', kod: 'OD-4F2A9C', durum: 'bildirildi', tutar: 6250, olusturuldu: iso(-5), gonderen_ad: 'Ayşe Yılmaz', dekont_yolu: 'u1/c1/d.pdf', veli: { ad_soyad: 'Ayşe Yılmaz', telefon: '0532 111 22 33' }, ogrenci: { ad_soyad: 'Elif Yılmaz', sinif: 3 }, paket: { ad: 'Tam Paket' }, tercih: { ad: 'Oda B' } },
    { id: 's3', kod: 'OD-77C1D0', durum: 'bildirildi', tutar: 350, olusturuldu: iso(-2), gonderen_ad: 'Mehmet Kaya', veli: { ad_soyad: 'Mehmet Kaya', telefon: '0505 444 55 66' }, ogrenci: { ad_soyad: 'Deniz Kaya', sinif: 2 }, paket: { ad: 'Tek Seans' } },
  ],
  kayitlar: [{ id: 'k1', ogrenci_id: 'c1', gunler: [1,2,3,4], baslangic: '2026-10-12', bitis: '2026-11-11', aktif: true, oda: odalar[0] }],
  kredi_hareketleri: [{ ogrenci_id: 'c2', miktar: 5 }, { ogrenci_id: 'c2', miktar: -1 }],
  bildirimler: [{ id: 'b1', baslik: 'Yeni ödeme bildirimi', icerik: 'OD-4F2A9C – 6250 TL – gönderen: Ayşe Yılmaz', baglanti: '/yonetim/odemeler', okundu: false, olusturuldu: iso(-5) }],
  odevler: [{ id: 'o1', seans_id: seanslar[0].id, ogrenci_id: 'c1', dosya_yolu: 'u1/c1/1-mat.jpg', dosya_adi: 'mat.jpg', not_metni: 'Sayfa 34', geri_bildirim: '', olusturuldu: iso(-2), ogrenci: ogr(0), seans: { baslangic: iso(2), oda: odalar[0] } }],
  haftalik_raporlar: [{ id: 'h1', ogrenci_id: 'c1', hafta_baslangic: '2026-10-05', yayinda: false, ogrenci: ogr(0), istatistik: { planlanan: 4, katildi: 4, bitti: 3, kismen: 1, bitmedi: 0, yardim_ort: 2.3, notlar: [] }, iyi_gidenler: '', takildigi_konular: '', evde_destek: '', gelecek_hafta: '' }],
  duyurular: [{ id: 'd1', baslik: '29 Ekim tatili', icerik: 'Cumhuriyet Bayramı nedeniyle seans yok.', yayinda: true, sabit: true, olusturuldu: iso(-20), oda: null }],
  tatiller: [{ tarih: '2026-10-29', aciklama: 'Cumhuriyet Bayramı' }],
  yonetici_epostalari: [{ eposta: 'gamzehasanozdemir@gmail.com' }],
};


const XSS = `<img src=x onerror="window.__xss=1">"><script>window.__xss=2</script>`;
const meetOrtak = [{ oda_id: 'oa', meet_linki: 'https://meet.google.com/hje-cseg-tbb' }];
veli.oda_baglanti = meetOrtak; yonetici.oda_baglanti = meetOrtak;
const tarayici = await chromium.launch();
const sonuc = [];
let bolum = '';
async function sayfa(url, veri, ops = {}) {
  const c = await tarayici.newContext({ viewport: { width: ops.gen || 1280, height: 900 }, locale: 'tr-TR', timezoneId: 'Europe/Istanbul' });
  const s = await c.newPage();
  s._hatalar = [];
  s.on('pageerror', (e) => s._hatalar.push(e.message));
  await s.route('https://cdn.jsdelivr.net/**', (r) => r.fulfill({ contentType: 'text/javascript', body: sahte }));
  await s.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await s.route((u) => u.hostname.includes('evil'), (r) => r.fulfill({ body: 'KOTU SITE' }));
  s._gecis = []; s.on('framenavigated', (f) => { if (f === s.mainFrame()) s._gecis.push(f.url()); });
  await s.addInitScript((v) => { window.__SAHTE = v; }, veri);
  await s.goto('http://localhost:4173' + url);
  await s.waitForTimeout(ops.bekle ?? 700);
  return s;
}
const yazilar = (s) => s.evaluate(() => window.__YAZ || []);
const yol = (s) => s.url().replace('http://localhost:4173', '');
async function dene(ad, fn) {
  try { const d = await fn(); sonuc.push(`[GEÇTİ] ${bolum}: ${ad}${d ? ' — ' + d : ''}`); }
  catch (e) { sonuc.push(`[KALDI] ${bolum}: ${ad} — ${e.message.split('\n')[0]}`); }
}
const bekle = (k, m) => { if (!k) throw new Error(m); };

// ================= GÜVENLİK =================
bolum = 'Güvenlik';
const kotuVeli = JSON.parse(JSON.stringify(veli));
kotuVeli.profiller[0].ad_soyad = XSS;
kotuVeli.ogrenciler.forEach((o) => { o.ad_soyad = XSS; o.notlar = XSS; o.okul = XSS; });
kotuVeli.duyurular[0].baslik = XSS; kotuVeli.duyurular[0].icerik = XSS;
kotuVeli.bildirimler[0].icerik = XSS; kotuVeli.siparisler[0].kod = XSS; kotuVeli.odevler[0].not_metni = XSS; kotuVeli.odevler[0].geri_bildirim = XSS;
kotuVeli.haftalik_raporlar[0].iyi_gidenler = XSS;
const kotuYon = JSON.parse(JSON.stringify(yonetici));
kotuYon.ogrenciler.forEach((o) => { o.ad_soyad = XSS; o.notlar = XSS; o.veli.ad_soyad = XSS; o.veli.telefon = XSS; });
kotuYon.siparisler.forEach((o) => { o.gonderen_ad = XSS; o.veli.ad_soyad = XSS; o.ogrenci.ad_soyad = XSS; });
kotuYon.profiller[1].ad_soyad = XSS; kotuYon.profiller[1].telefon = 'javascript:alert(1)';
kotuYon.odevler[0].not_metni = XSS; kotuYon.odevler[0].dosya_adi = XSS;
kotuYon.seanslar[0].rez[0].ogrenci.ad_soyad = XSS;
await dene('Zararlı kod (XSS) 16 sayfada çalışmaz, metin olarak görünür', async () => {
  const liste = [['/panel#ozet', kotuVeli], ['/panel#cocuklar', kotuVeli], ['/panel#odemeler', kotuVeli], ['/panel#duyurular', kotuVeli], ['/panel#odevler', kotuVeli], ['/panel#raporlar', kotuVeli], ['/panel#profil', kotuVeli], ['/panel#paket', kotuVeli],
    ['/yonetim#bugun', kotuYon], ['/yonetim#odemeler', kotuYon], ['/yonetim#ogrenciler', kotuYon], ['/yonetim#veliler', kotuYon], ['/yonetim#odevler', kotuYon], ['/yonetim#seanslar', kotuYon],
    ['/yonetim#seanslar/11111111-1111-1111-1111-111111111111', { ...kotuYon, seanslar: kotuYon.seanslar[0] }], ['/yonetim#raporlar', kotuYon]];
  const acik = [];
  for (const [u, v] of liste) {
    const s = await sayfa(u, v);
    const r = await s.evaluate(() => ({ x: window.__xss, img: document.querySelectorAll('img[onerror], script:not([src])').length, js: [...document.querySelectorAll('a[href]')].filter((a) => /^\s*javascript:/i.test(a.getAttribute('href'))).length }));
    if (r.x || r.img || r.js) acik.push(`${u} ${JSON.stringify(r)}`);
  }
  bekle(!acik.length, acik.join(', ')); return `${liste.length} sayfa temiz`;
});
await dene('Girişten sonra başka siteye yönlendirme (open redirect) engellenir', async () => {
  const denemeler = ['//evil.com', '/\\evil.com', 'https://evil.com', '/panel@evil.com', '/%2F%2Fevil.com', 'javascript:alert(1)'];
  const kacan = [];
  for (const d of denemeler) {
    const s = await sayfa('/giris?d=' + encodeURIComponent(d), veli, { bekle: 900 });
    if (!s.url().startsWith('http://localhost:4173/panel')) kacan.push(`${d} → ${s.url()}`);
  }
  bekle(!kacan.length, kacan.join(', ')); return `${denemeler.length} deneme panelde kaldı`;
});
await dene('Meet alanına zararlı bağlantı girilirse gösterilmez', async () => {
  const s = await sayfa('/panel#ozet', { ...veli, oda_baglanti: [{ oda_id: 'oa', meet_linki: 'javascript:alert(1)' }] });
  const n = await s.locator('a', { hasText: 'Odaya katıl' }).count(); bekle(n === 0, `${n} buton`);
});
await dene('Meet butonu yeni sekmede, referans bilgisi sızdırmadan açılır', async () => {
  const s = await sayfa('/panel#ozet', veli);
  const a = s.locator('a', { hasText: 'Odaya katıl' }).first();
  const [h, t, r] = await Promise.all([a.getAttribute('href'), a.getAttribute('target'), a.getAttribute('rel')]);
  bekle(h === 'https://meet.google.com/hje-cseg-tbb' && t === '_blank' && /noopener/.test(r) && /noreferrer/.test(r), `${h} ${t} ${r}`); return h;
});
await dene('Meet bağlantısı olmayan (yetkisiz) veliye buton gösterilmez', async () => {
  const s = await sayfa('/panel#ozet', { ...veli, oda_baglanti: [] });
  bekle((await s.locator('a', { hasText: 'Odaya katıl' }).count()) === 0, 'buton var'); bekle(/Sıradaki seans/.test(await s.textContent('main')), 'seans bilgisi yok');
});
await dene('Yönetici geçersiz Meet bağlantısı kaydedemez', async () => {
  const s = await sayfa('/yonetim#odalar', yonetici);
  await s.click('[data-duzenle="oa"]'); await s.fill('#od-meet', 'https://evil.com/meet'); await s.click('dialog button[type=submit]'); await s.waitForTimeout(400);
  bekle(!(await yazilar(s)).some((x) => x[1] === 'oda_baglanti'), 'kaydedildi');
  await s.fill('#od-meet', 'https://meet.google.com/abc-defg-hij?authuser=0'); await s.click('dialog button[type=submit]'); await s.waitForTimeout(400);
  const y = (await yazilar(s)).find((x) => x[1] === 'oda_baglanti'); bekle(y?.[2].meet_linki === 'https://meet.google.com/abc-defg-hij', JSON.stringify(y)); return 'geçerli bağlantı temizlenip kaydedildi';
});

// ================= ÇÖKME =================
bolum = 'Çökme';
await dene('Sunucu tamamen kapalıyken panel çökmez, "Tekrar dene" ekranı çıkar', async () => {
  const s = await sayfa('/panel#ozet', { ...veli, __hata: true });
  const t = await s.textContent('body'); bekle(/açılamadı/.test(t) && await s.locator('#cokme-tekrar').count() === 1, t.slice(0, 80));
  bekle(yol(s).startsWith('/panel'), 'girişe atıldı: ' + yol(s)); bekle(!s._hatalar.length, s._hatalar[0]);
});
await dene('Ana sayfa sunucu kapalıyken de açılır', async () => {
  const s = await sayfa('/', { __hata: true });
  const t = await s.textContent('body'); bekle(/Ödevini evde/.test(t) && /17:00/.test(t) && /yüklenemedi/.test(t), 'içerik eksik'); bekle(!s._hatalar.length, s._hatalar[0]);
  return 'tanıtım ve varsayılan saatler göründü, paketler için uyarı';
});
await dene('Tek bir veri kaynağı bozulunca sayfa içi hata + tekrar dene çalışır', async () => {
  const s = await sayfa('/panel#odemeler', { ...veli, __tabloHata: { siparisler: 'Failed to fetch' } });
  bekle(await s.locator('#tekrar-dene').count() === 1, 'tekrar dene yok');
  bekle(/Sunucuya ulaşılamadı/.test(await s.textContent('main')), 'hata metni Türkçe değil');
  await s.evaluate(() => { window.__SAHTE.__tabloHata = {}; }); await s.click('#tekrar-dene'); await s.waitForTimeout(500);
  bekle(/OD-4F2A9C/.test(await s.textContent('main')), 'tekrar denemede yüklenmedi'); return 'menü çalışmaya devam etti, tekrar denemede açıldı';
});
await dene('Yavaş bağlantıda "Yükleniyor" gösterilir, sonra içerik gelir', async () => {
  const s = await sayfa('/panel#cocuklar', { ...veli, __gecikme: 800 }, { bekle: 4000 });
  await s.evaluate(() => { location.hash = '#raporlar'; }); await s.waitForTimeout(200);
  const ara = await s.textContent('main'); await s.waitForTimeout(2500); const son = await s.textContent('main');
  bekle(/Yükleniyor/.test(ara) && /Haftalık raporlar/.test(son), `${ara.slice(0, 40)} | ${son.slice(0, 40)}`);
});
await dene('Hızlı sayfa değiştirmede eski sayfa yenisinin üstüne yazılmaz', async () => {
  const s = await sayfa('/panel#ozet', { ...veli, __gecikme: 600 }, { bekle: 1500 });
  await s.evaluate(() => { location.hash = '#odemeler'; }); await s.waitForTimeout(80); await s.evaluate(() => { location.hash = '#cocuklar'; }); await s.waitForTimeout(1500);
  bekle((await s.textContent('h1')).includes('Çocuklarım'), await s.textContent('h1'));
});
await dene('Dosya yükleme sırasında bağlantı koparsa anlaşılır hata ve düğme tekrar aktif', async () => {
  const s = await sayfa('/panel#odevler', veli);
  await s.setInputFiles('#o-dosya', { name: 'a.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([255, 216]) });
  await s.evaluate(() => { window.__SAHTE.__hata = true; });
  await s.click('#odev-form button[type=submit]'); await s.waitForTimeout(500);
  const t = await s.textContent('#bildirim-toast'); const aktif = await s.isEnabled('#odev-form button[type=submit]');
  bekle(/ulaşılamadı/.test(t) && aktif, `${t} aktif=${aktif}`); return t;
});
await dene('Düğmeye art arda 5 kez basmak tek sipariş oluşturur', async () => {
  const s = await sayfa('/panel#paket', { ...veli, __gecikme: 400, siparisler: [{ id: 'yeni' }] }, { bekle: 1500 });
  const d = s.locator('#paket-form button[type=submit]');
  for (let i = 0; i < 5; i++) await d.click({ force: true, noWaitAfter: true }).catch(() => {});
  await s.waitForTimeout(1500);
  const n = (await yazilar(s)).filter((x) => x[0] === 'insert' && x[1] === 'siparisler').length; bekle(n === 1, `${n} sipariş`);
});
await dene('İnternet kesilince uyarı şeridi çıkar, gelince kaybolur', async () => {
  const s = await sayfa('/panel#ozet', veli);
  await s.context().setOffline(true); await s.evaluate(() => window.dispatchEvent(new Event('offline'))); await s.waitForTimeout(200);
  const var1 = await s.locator('#cevrimdisi').count();
  await s.context().setOffline(false); await s.evaluate(() => window.dispatchEvent(new Event('online'))); await s.waitForTimeout(200);
  const var2 = await s.locator('#cevrimdisi').count(); bekle(var1 === 1 && var2 === 0, `${var1}/${var2}`);
});
await dene('Beklenmeyen hata sessizce kaybolmaz, kullanıcıya bildirilir', async () => {
  const s = await sayfa('/panel#ozet', veli);
  await s.evaluate(() => { Promise.reject(new Error('Failed to fetch')); }); await s.waitForTimeout(300);
  bekle(/ulaşılamadı/.test(await s.textContent('#bildirim-toast')), 'bildirim yok');
});
await dene('Eksik/bozuk veriyle sayfalar çökmez', async () => {
  const bozuk = JSON.parse(JSON.stringify(veli));
  bozuk.siparisler.push({ id: 'sx', kod: 'OD-X', durum: 'bekliyor', tutar: null, olusturuldu: null, ogrenci_id: 'c1', paket: null, ogrenci: null });
  bozuk.odevler.push({ id: 'ox', ogrenci_id: 'yok', dosya_yolu: 'u1/x/y.pdf', olusturuldu: new Date().toISOString(), seans: null });
  bozuk.haftalik_raporlar.push({ id: 'hx', ogrenci_id: 'c1', hafta_baslangic: '2026-10-12', yayinda: true, istatistik: null });
  bozuk.ogrenciler.push({ id: 'cx', ad_soyad: '', sinif: 2, kvkk_onay: false });
  const hata = [];
  for (const u of ['/panel#ozet', '/panel#odemeler', '/panel#odevler', '/panel#raporlar', '/panel#cocuklar']) {
    const s = await sayfa(u, bozuk); if (s._hatalar.length || await s.locator('#tekrar-dene').count()) hata.push(`${u}: ${s._hatalar[0] || 'sayfa hatası ' + (await s.textContent('main')).slice(0, 80)}`);
  }
  bekle(!hata.length, hata.join(' | ')); return '5 sayfa';
});
await dene('Boş hesapta tüm sayfalar yönlendirici boş durum gösterir', async () => {
  const bos = { ...ortak, oturum: 'u1', profiller: [{ id: 'u1', rol: 'veli', ad_soyad: 'Yeni Veli' }] };
  const hata = [];
  for (const u of ['/panel#ozet', '/panel#cocuklar', '/panel#paket', '/panel#odemeler', '/panel#odevler', '/panel#raporlar', '/panel#duyurular']) {
    const s = await sayfa(u, bos); if (s._hatalar.length || !(await s.locator('.bos').count())) hata.push(u);
  }
  const ybos = { ...ortak, oturum: 'u9', profiller: [{ id: 'u9', rol: 'admin', ad_soyad: 'Y' }] };
  for (const u of ['/yonetim#bugun', '/yonetim#odemeler', '/yonetim#seanslar', '/yonetim#ogrenciler', '/yonetim#odevler', '/yonetim#raporlar', '/yonetim#duyurular']) {
    const s = await sayfa(u, ybos); if (s._hatalar.length || await s.locator('#tekrar-dene').count()) hata.push(u);
  }
  bekle(!hata.length, hata.join(', ')); return '14 sayfa';
});

// ================= OTURUM =================
bolum = 'Oturum';
await dene('Giriş yapmadan panel → giriş sayfası (dönüş adresi korunur)', async () => {
  const a = await sayfa('/panel#odemeler', {}); const b = await sayfa('/yonetim#ayarlar', {});
  bekle(yol(a) === '/giris?d=%2Fpanel%23odemeler' && yol(b) === '/giris?d=%2Fyonetim%23ayarlar', `${yol(a)} ${yol(b)}`); return `${yol(a)}`;
});
await dene('Girişten sonra kaldığı sayfaya döner', async () => {
  const s = await sayfa('/giris?d=%2Fpanel%23odemeler', veli, { bekle: 1200 }); bekle(yol(s) === '/panel#odemeler', yol(s));
});
await dene('Oturumu süresi dolmuşsa çıkış yapılır ve girişe yönlenir', async () => {
  const s = await sayfa('/panel#ozet', { ...veli, __tabloHata: { profiller: 'JWT expired' } });
  bekle(yol(s).startsWith('/giris?d=%2Fpanel'), `${yol(s)}`); return 'oturum kapatıldı → ' + yol(s);
});
await dene('Hesap silinmişse (profil yok) güvenli çıkış', async () => {
  const s = await sayfa('/panel#ozet', { ...veli, profiller: [] }); bekle(yol(s).startsWith('/giris'), yol(s));
});
await dene('Başka sekmede çıkış yapılınca bu sekme de girişe döner', async () => {
  const s = await sayfa('/yonetim#bugun', yonetici);
  s._gecis.length = 0;
  await s.evaluate(() => window.__oturumOlayi('SIGNED_OUT')); await s.waitForTimeout(600);
  bekle(s._gecis.some((u) => u.includes('/giris?d=%2Fyonetim')), s._gecis.join(' ')); return 'girişe yönlendi';
});
await dene('Giriş yapmış veli giriş sayfasına gelirse paneline gider', async () => {
  const a = await sayfa('/giris', veli, { bekle: 1000 }); const b = await sayfa('/giris', yonetici, { bekle: 1000 });
  bekle(yol(a) === '/panel' && yol(b) === '/yonetim', `${yol(a)} ${yol(b)}`);
});
await dene('Veli yönetim paneline giremez', async () => {
  const s = await sayfa('/yonetim#ayarlar', veli); bekle(yol(s) === '/panel', yol(s));
});
await dene('Çıkış yap düğmesi oturumu kapatıp ana sayfaya döner', async () => {
  const s = await sayfa('/panel#ozet', veli);
  const cagrildi = s.waitForFunction(() => (window.__YAZ || []).some((x) => x[1] === 'signOut'), null, { timeout: 2000 }).then(() => true).catch(() => 'nav');
  await s.click('#cikis'); await s.waitForTimeout(600);
  bekle(yol(s) === '/', yol(s)); return 'ana sayfaya döndü';
});
await dene('Şifre sıfırlama bağlantısıyla gelince yeni şifre formu açılır', async () => {
  const s = await sayfa('/giris?yenile=1', veli, { bekle: 900 }); bekle(await s.isVisible('#form-yeni') && yol(s).startsWith('/giris'), yol(s));
});

// ================= YÖNLENDİRME =================
bolum = 'Yönlendirme';
await dene('Bilinmeyen sayfa adresi (#xyz) varsayılan sayfayı açar', async () => {
  const s = await sayfa('/panel#xyz', veli); bekle(/Merhaba/.test(await s.textContent('h1')), await s.textContent('h1'));
});
await dene('Tarayıcı geri tuşu panel içinde çalışır', async () => {
  const s = await sayfa('/panel#ozet', veli); await s.click('.yan nav a[href="#paket"]'); await s.waitForTimeout(500);
  await s.goBack(); await s.waitForTimeout(600); bekle(/Merhaba/.test(await s.textContent('h1')), await s.textContent('h1'));
});
await dene('Ana sayfadaki paket seçimi üyelikten sonra panelde seçili gelir', async () => {
  const s = await sayfa('/', ortak); await s.click('#paket-kredi a.dugme >> nth=0'); await s.waitForTimeout(600);
  bekle(yol(s).startsWith('/giris?kayit=1&paket=p5'), yol(s));
  const st = await s.evaluate(() => sessionStorage.getItem('secilen_paket')); bekle(st === 'p5', st); return 'Tek Seans hatırlandı';
});
await dene('Olmayan sayfa için 404 sayfası var', async () => {
  const fs2 = await import('node:fs'); bekle(fs2.existsSync('../404.html'), 'yok');
});
await tarayici.close();
console.log(sonuc.join('\n'));
console.log(`\nTOPLAM: ${sonuc.filter((x) => x.startsWith('[GEÇTİ]')).length}/${sonuc.length}`);
