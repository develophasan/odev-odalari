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


const tarayici = await chromium.launch();
const sonuc = [];
async function sayfa(url, veri, gen = 1280) {
  const c = await tarayici.newContext({ viewport: { width: gen, height: 900 }, locale: 'tr-TR', timezoneId: 'Europe/Istanbul' });
  const s = await c.newPage();
  s._hatalar = [];
  s.on('pageerror', (e) => s._hatalar.push(e.message));
  await s.route('https://cdn.jsdelivr.net/**', (r) => r.fulfill({ contentType: 'text/javascript', body: sahte }));
  await s.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await s.addInitScript((v) => { window.__SAHTE = v; }, veri);
  await s.goto('http://localhost:4173' + url);
  await s.waitForTimeout(600);
  return s;
}
const yazilar = (s) => s.evaluate(() => window.__YAZ || []);
async function dene(ad, fn) {
  try { const d = await fn(); sonuc.push(`[GEÇTİ] ${ad}${d ? ' — ' + d : ''}`); }
  catch (e) { sonuc.push(`[KALDI] ${ad} — ${e.message.split('\n')[0]}`); }
}
const bekle = (k, m) => { if (!k) throw new Error(m); };

await dene('Ziyaretçi /panel açarsa girişe yönlenir', async () => {
  const s = await sayfa('/panel', {}); await s.waitForTimeout(500);
  bekle(s.url().includes('/giris?d=%2Fpanel'), s.url()); return s.url().replace('http://localhost:4173', '');
});
await dene('Veli /yonetim açarsa kendi paneline yönlenir', async () => {
  const s = await sayfa('/yonetim', veli); await s.waitForTimeout(500);
  bekle(s.url().endsWith('/panel'), s.url());
});
await dene('Üye ol: KVKK onayı olmadan form gönderilmez', async () => {
  const s = await sayfa('/giris?kayit=1', {});
  await s.fill('#k-ad', 'Test'); await s.fill('#k-tel', '0500'); await s.fill('#k-eposta', 'a@b.co'); await s.fill('#k-sifre', '123456');
  await s.click('#form-kayit button[type=submit]');
  const gecerli = await s.evaluate(() => document.querySelector('#form-kayit').checkValidity());
  bekle(!gecerli, 'form geçerli sayıldı');
  await s.check('#form-kayit [name=kvkk]'); await s.click('#form-kayit button[type=submit]'); await s.waitForTimeout(400);
  const m = await s.textContent('#mesaj'); bekle(/doğrulama/.test(m), m); return m;
});
await dene('Giriş hatası Türkçe gösterilir', async () => {
  const s = await sayfa('/giris', {});
  await s.fill('#g-eposta', 'a@b.co'); await s.fill('#g-sifre', 'yanlis'); await s.click('#form-giris button[type=submit]'); await s.waitForTimeout(300);
  const m = await s.textContent('#mesaj'); bekle(/hatalı/.test(m), m); return m;
});
await dene('Veli çocuk ekler (KVKK onaylı kayıt)', async () => {
  const s = await sayfa('/panel#cocuklar', veli);
  await s.click('#yeni-cocuk'); await s.fill('#c-ad', 'Zeynep Test'); await s.selectOption('#c-sinif', '2'); await s.check('dialog [name=kvkk]');
  await s.click('dialog button[type=submit]'); await s.waitForTimeout(400);
  const y = (await yazilar(s)).find((x) => x[0] === 'insert' && x[1] === 'ogrenciler');
  bekle(y && y[2].sinif === 2 && y[2].kvkk_onay === true && y[2].veli_id === 'u1', JSON.stringify(y)); return `${y[2].ad_soyad}, ${y[2].sinif}. sınıf`;
});
await dene('Paket al: aylık pakette saat tercihi görünür, kredide gizlenir', async () => {
  const s = await sayfa('/panel#paket', veli);
  const a = await s.isVisible('#tercih-alan');
  await s.check('input[value=p5]'); const b = await s.isVisible('#tercih-alan');
  bekle(a && !b, `aylık:${a} kredi:${b}`);
  await s.check('input[value=p2]'); await s.selectOption('#p-oda', 'ob');
  await s.evaluate(() => { window.__SAHTE.siparisler = [{ id: 'yeni1' }]; });
  await s.click('#paket-form button[type=submit]'); await s.waitForTimeout(500);
  const y = (await yazilar(s)).find((x) => x[0] === 'insert' && x[1] === 'siparisler');
  bekle(y && y[2].paket_id === 'p2' && y[2].tercih_oda_id === 'ob' && !('tutar' in y[2]), JSON.stringify(y));
  bekle(s.url().includes('#odemeler/yeni1'), s.url()); return 'sipariş oluştu, ödeme sayfasına geçti; tutar istemciden gönderilmiyor';
});
await dene('Ödemeyi bildir: dekont yükleme + bildirim', async () => {
  const s = await sayfa('/panel#odemeler', veli);
  const iban = await s.textContent('.iban-kutu'); bekle(/OD-4F2A9C/.test(iban) && /TR12/.test(iban), 'IBAN kutusu eksik');
  await s.setInputFiles('#d-s1', { name: 'dekont ğüş.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await s.click('.bildir-form button[type=submit]'); await s.waitForTimeout(500);
  const y = (await yazilar(s)).find((x) => x[0] === 'rpc' && x[1] === 'odeme_bildir');
  bekle(y && y[2].p_siparis === 's1' && /^u1\/c1\/\d+-dekont_gus\.pdf$/.test(y[2].p_dekont), JSON.stringify(y)); return y[2].p_dekont;
});
await dene('En erken seansa yerleş', async () => {
  const s = await sayfa('/panel#ozet', { ...veli, rpc: { ...veli.rpc, en_erken_seansa_kaydet: { oda: 'Oda A', baslangic: new Date(Date.now() + 864e5).toISOString(), meet: 'https://meet.google.com/x', seans_id: 'x', rezervasyon_id: 'y' } } });
  await s.click('[data-en-erken="c1"]'); await s.waitForTimeout(500);
  const d = await s.textContent('dialog'); bekle(/Seansınız hazır/.test(d), d); return 'onay penceresi ve Meet bağlantısı gösterildi';
});
await dene('Seansa katılamayacak (iptal) onay sorar ve iptal eder', async () => {
  const s = await sayfa('/panel#ozet', { ...veli, rpc: { ...veli.rpc, rezervasyon_iptal: 'İptal edildi, kredi iade edildi.' } });
  await s.click('[data-iptal="r2"]'); await s.click('dialog [data-evet]'); await s.waitForTimeout(500);
  const y = (await yazilar(s)).find((x) => x[0] === 'rpc' && x[1] === 'rezervasyon_iptal'); bekle(y?.[2].p_rez === 'r2', JSON.stringify(y));
});
await dene('Ödev yükleme', async () => {
  const s = await sayfa('/panel#odevler', veli);
  await s.setInputFiles('#o-dosya', [{ name: 'sayfa1.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([255, 216, 255]) }, { name: 'sayfa2.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([255, 216, 255]) }]);
  await s.fill('#o-not', 'Mat 34'); await s.click('#odev-form button[type=submit]'); await s.waitForTimeout(500);
  const y = (await yazilar(s)).filter((x) => x[0] === 'insert' && x[1] === 'odevler'); bekle(y.length === 2, `${y.length} kayıt`); return '2 sayfa yüklendi';
});
await dene('Yönetici ödeme onaylar', async () => {
  const s = await sayfa('/yonetim#odemeler', { ...yonetici, rpc: { ...yonetici.rpc, siparis_onayla: { sonuc: 'Oda B (18:15) odasına yerleştirildi.' } } });
  await s.click('[data-onayla="s1"]'); await s.fill('#on-not', 'Ziraat 11.10'); await s.click('dialog button[type=submit]'); await s.waitForTimeout(500);
  const y = (await yazilar(s)).find((x) => x[0] === 'rpc' && x[1] === 'siparis_onayla'); bekle(y?.[2].p_siparis === 's1' && y[2].p_not === 'Ziraat 11.10', JSON.stringify(y));
  return (await s.textContent('#bildirim-toast'));
});
await dene('Yönetici ödemeyi reddeder (açıklama zorunlu)', async () => {
  const s = await sayfa('/yonetim#odemeler', yonetici);
  await s.click('[data-reddet="s3"]'); await s.click('dialog button[type=submit]');
  bekle(!(await yazilar(s)).some((x) => x[1] === 'siparis_reddet'), 'açıklamasız gönderildi');
  await s.fill('#red-not', 'Havale görünmüyor'); await s.click('dialog button[type=submit]'); await s.waitForTimeout(400);
  bekle((await yazilar(s)).some((x) => x[1] === 'siparis_reddet'), 'gönderilmedi');
});
await dene('Yoklama kaydı', async () => {
  const s = await sayfa('/yonetim#seanslar/11111111-1111-1111-1111-111111111111', { ...yonetici, seanslar: seanslar[0] });
  const fs = s.locator('[data-ogrenci="c1"]');
  await fs.locator('[name=odev_durumu]').selectOption('Kısmen'); await fs.locator('[name=yardim_sayisi]').fill('3'); await fs.locator('[name=ders]').fill('Türkçe');
  await fs.locator('[name=ogretmen_notu]').fill('Okuma'); await fs.locator('[name=veliye_ilet]').check();
  await s.click('#yoklama-form button[type=submit]'); await s.waitForTimeout(400);
  const y = (await yazilar(s)).find((x) => x[0] === 'upsert' && x[1] === 'devam');
  const e = y?.[2].find((r) => r.ogrenci_id === 'c1');
  bekle(e && e.odev_durumu === 'Kısmen' && e.yardim_sayisi === 3 && e.veliye_ilet === true && y[2].length === 2, JSON.stringify(y)); return '2 öğrenci kaydedildi';
});
await dene('Seans iptali ve telafi', async () => {
  const s = await sayfa('/yonetim#seanslar', { ...yonetici, rpc: { seans_iptal: 2, telafi_olustur: 'x' } });
  await s.click('[data-iptal="11111111-1111-1111-1111-111111111111"]'); await s.fill('#ip-neden', 'Elektrik kesintisi'); await s.click('dialog button[type=submit]'); await s.waitForTimeout(400);
  await s.click('[data-telafi="33333333-3333-3333-3333-333333333333"]'); await s.fill('#tf-gun', '2026-10-17'); await s.fill('#tf-saat', '11:00'); await s.click('dialog button[type=submit]'); await s.waitForTimeout(400);
  const w = await yazilar(s); const t = w.find((x) => x[1] === 'telafi_olustur');
  bekle(w.some((x) => x[1] === 'seans_iptal') && t?.[2].p_baslangic === '2026-10-17T08:00:00.000Z', JSON.stringify(t)); return 'telafi 17.10 11:00 (TR) olarak gönderildi';
});
await dene('Öğrenciyi odaya yerleştir ve kredi ekle', async () => {
  const s = await sayfa('/yonetim#ogrenciler', yonetici);
  await s.click('[data-yerlestir="c2"]'); await s.selectOption('#y-oda', 'ob'); await s.uncheck('#y-gunler input[value="4"]'); await s.click('dialog button[type=submit]'); await s.waitForTimeout(400);
  await s.click('[data-kredi="c1"]'); await s.fill('#kr-m', '2'); await s.click('dialog button[type=submit]'); await s.waitForTimeout(400);
  const w = await yazilar(s); const y = w.find((x) => x[1] === 'yonetici_kayit_ekle'); const k = w.find((x) => x[1] === 'kredi_hareketleri');
  bekle(y?.[2].p_oda === 'ob' && y[2].p_gunler.join() === '1,2,3' && k?.[2].miktar === 2, JSON.stringify([y, k])); return 'Pzt-Sal-Çar ile Oda B, +2 kredi';
});
await dene('Öğrenci arama süzgeci', async () => {
  const s = await sayfa('/yonetim#ogrenciler', yonetici);
  await s.fill('#ara', 'can'); const g = await s.locator('#ogr-govde tr:not([hidden])').count(); bekle(g === 1, `${g} satır`);
});
await dene('Oda düzenle (gün/saat/kapasite)', async () => {
  const s = await sayfa('/yonetim#odalar', yonetici);
  await s.click('[data-duzenle="oa"]'); await s.fill('#od-kap', '5'); await s.uncheck('dialog [name=gunler][value="4"]'); await s.click('dialog button[type=submit]'); await s.waitForTimeout(400);
  const y = (await yazilar(s)).find((x) => x[0] === 'update' && x[1] === 'odalar'); bekle(y?.[2].kapasite === 5 && y[2].gunler.join() === '1,2,3', JSON.stringify(y));
});
await dene('Paket ekle (kredi türü)', async () => {
  const s = await sayfa('/yonetim#paketler', yonetici);
  await s.click('#yeni-paket'); await s.fill('#pk-ad', '10 Seanslık Kart'); await s.fill('#pk-fiyat', '3000'); await s.selectOption('#pk-tur', 'kredi'); await s.fill('#pk-kredi', '10');
  await s.click('dialog button[type=submit]'); await s.waitForTimeout(400);
  const y = (await yazilar(s)).find((x) => x[0] === 'insert' && x[1] === 'paketler'); bekle(y?.[2].kredi === 10 && y[2].hafta_ici_gunler.length === 0, JSON.stringify(y));
});
await dene('Duyuru yayınla (oda hedefli)', async () => {
  const s = await sayfa('/yonetim#duyurular', yonetici);
  await s.click('#yeni-duyuru'); await s.fill('#du-b', 'Yarın Meet değişiyor'); await s.fill('#du-i', 'Yeni bağlantı panelde'); await s.selectOption('#du-o', 'ob');
  await s.click('dialog button[type=submit]'); await s.waitForTimeout(400);
  const y = (await yazilar(s)).find((x) => x[0] === 'insert' && x[1] === 'duyurular'); bekle(y?.[2].oda_id === 'ob' && y[2].yayinda === true, JSON.stringify(y));
});
await dene('Rapor yayınla', async () => {
  const s = await sayfa('/yonetim#raporlar', yonetici);
  await s.fill('[data-rapor="h1"] [name=iyi_gidenler]', 'Harika hafta'); await s.click('[data-rapor="h1"] button[value=yayinla]'); await s.waitForTimeout(400);
  const y = (await yazilar(s)).find((x) => x[0] === 'update' && x[1] === 'haftalik_raporlar'); bekle(y?.[2].yayinda === true && y[2].iyi_gidenler === 'Harika hafta', JSON.stringify(y));
});
await dene('Ayarlar: IBAN biçimlenir, tatil ekleyince o günün seansları iptal edilir', async () => {
  const s = await sayfa('/yonetim#ayarlar', { ...yonetici, seanslar: [{ id: 'z1' }, { id: 'z2' }] });
  await s.fill('#a-iban', 'tr330006100519786457841326'); await s.click('#odeme-form button[type=submit]'); await s.waitForTimeout(400);
  await s.fill('#t-g', '2026-11-02'); await s.fill('#t-a', 'Ara tatil'); await s.click('#tatil-form button[type=submit]'); await s.waitForTimeout(500);
  const w = await yazilar(s); const a = w.find((x) => x[0] === 'update' && x[1] === 'ayarlar'); const ip = w.filter((x) => x[1] === 'seans_iptal');
  bekle(a?.[2].iban === 'TR33 0006 1005 1978 6457 8413 26' && ip.length === 2, JSON.stringify([a?.[2].iban, ip.length])); return a[2].iban;
});
await dene('Telefon: yönetim menüsü açılır ve sayfa değiştirir', async () => {
  const s = await sayfa('/yonetim#bugun', yonetici, 390);
  await s.click('#menu-ac'); bekle(await s.locator('#yan.acik').count() === 1, 'menü açılmadı');
  await s.click('.yan nav a[href="#odalar"]'); await s.waitForTimeout(400);
  bekle((await s.textContent('h1')).includes('Odalar') && (await s.locator('#yan.acik').count()) === 0, 'geçiş olmadı');
});
await dene('Telefonda yatay taşma yok (tüm sayfalar)', async () => {
  const sayfalar = [['/', ortak], ['/giris', {}], ['/panel#ozet', veli], ['/panel#paket', veli], ['/panel#odemeler', veli], ['/panel#odevler', veli], ['/panel#raporlar', veli], ['/panel#duyurular', veli], ['/panel#profil', veli], ['/panel#cocuklar', veli],
    ['/yonetim#bugun', yonetici], ['/yonetim#odemeler', yonetici], ['/yonetim#seanslar', yonetici], ['/yonetim#ogrenciler', yonetici], ['/yonetim#veliler', yonetici], ['/yonetim#odevler', yonetici], ['/yonetim#raporlar', yonetici], ['/yonetim#duyurular', yonetici], ['/yonetim#odalar', yonetici], ['/yonetim#paketler', yonetici], ['/yonetim#ayarlar', yonetici]];
  const tasan = [];
  for (const [u, v] of sayfalar) {
    const s = await sayfa(u, v, 360);
    const w = await s.evaluate(() => document.documentElement.scrollWidth);
    if (w > 362) tasan.push(`${u} (${w}px)`);
    if (s._hatalar.length) tasan.push(`${u} hata: ${s._hatalar[0]}`);
  }
  bekle(!tasan.length, tasan.join(', ')); return `${sayfalar.length} sayfa 360px genişlikte sorunsuz`;
});
await tarayici.close();
console.log(sonuc.join('\n'));
