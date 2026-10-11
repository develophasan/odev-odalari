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
fs.mkdirSync('ciktilar', { recursive: true });
const hatalar = [];
async function cek(ad, url, veri, gen, yuk = 900, eylem) {
  const c = await tarayici.newContext({ viewport: { width: gen, height: yuk }, deviceScaleFactor: 1, locale: 'tr-TR', timezoneId: 'Europe/Istanbul' });
  const s = await c.newPage();
  s.on('pageerror', (e) => hatalar.push(`${ad}: ${e.message}`));
  s.on('console', (m) => { if (m.type() === 'error' && !/fonts|ERR_FAILED|net::/.test(m.text())) hatalar.push(`${ad} konsol: ${m.text()}`); });
  await s.route('https://cdn.jsdelivr.net/**', (r) => r.fulfill({ contentType: 'text/javascript', body: sahte }));
  await s.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await s.addInitScript((v) => { window.__SAHTE = v; }, veri);
  await s.goto('http://localhost:4173' + url);
  await s.waitForTimeout(700);
  if (eylem) { try { await eylem(s); } catch (e) { hatalar.push(`${ad} eylem: ${e.message.split("\n")[0]}`); } await s.waitForTimeout(400); }
  await s.screenshot({ path: `ciktilar/${ad}.png`, fullPage: true });
  await c.close();
}
const bos = {};
await cek('01-anasayfa-masaustu', '/', ortak, 1280);
await cek('02-anasayfa-telefon', '/', ortak, 390, 844);
await cek('03-giris-telefon', '/giris?kayit=1', bos, 390, 844);
await cek('04-giris-masaustu', '/giris', bos, 1280, 800);
await cek('05-veli-ozet', '/panel#ozet', veli, 1280);
await cek('06-veli-ozet-telefon', '/panel#ozet', veli, 390, 844);
await cek('07-veli-paket', '/panel#paket', veli, 1280);
await cek('08-veli-odemeler-telefon', '/panel#odemeler', veli, 390, 844);
await cek('09-veli-raporlar', '/panel#raporlar', veli, 1280);
await cek('10-veli-odevler', '/panel#odevler', veli, 1280);
await cek('11-yonetim-bugun', '/yonetim#bugun', yonetici, 1280);
await cek('12-yonetim-odemeler', '/yonetim#odemeler', yonetici, 1280);
await cek('13-yonetim-odemeler-telefon', '/yonetim#odemeler', yonetici, 390, 844);
await cek('14-yonetim-seanslar', '/yonetim#seanslar', yonetici, 1280);
await cek('15-yonetim-yoklama', '/yonetim#seanslar/11111111-1111-1111-1111-111111111111', { ...yonetici, seanslar: seanslar[0] }, 1280);
await cek('16-yonetim-ogrenciler', '/yonetim#ogrenciler', yonetici, 1280);
await cek('17-yonetim-odalar', '/yonetim#odalar', yonetici, 1280, 900, (s) => s.click('[data-duzenle="oa"]', { timeout: 3000 }));
await cek('18-yonetim-raporlar', '/yonetim#raporlar', yonetici, 1280);
await cek('19-yonetim-ayarlar', '/yonetim#ayarlar', yonetici, 1280);
await cek('20-yonetim-paketler', '/yonetim#paketler', yonetici, 1280);
await cek('21-yonetim-menu-telefon', '/yonetim#bugun', yonetici, 390, 844, (s) => s.click('#menu-ac', { timeout: 3000 }));
await cek('22-veli-onay', '/yonetim#odemeler', yonetici, 1280, 900, (s) => s.click('[data-onayla="s1"]', { timeout: 3000 }));
await tarayici.close();
console.log(hatalar.length ? hatalar.join('\n') : 'HATA YOK');
