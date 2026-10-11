# Ödev Odaları

İlkokul öğrencileri için online ödev odaları: tanıtım sitesi, veli paneli ve yönetim paneli.

- **Ön yüz:** derleme gerektirmeyen statik HTML + CSS + JavaScript modülleri (`index.html`, `giris.html`, `panel.html`, `yonetim.html`). Telefon, tablet ve masaüstüne uyumlu.
- **Arka uç:** Supabase (Postgres, kimlik doğrulama, depolama, zamanlanmış görevler). Tüm iş kuralları veritabanı fonksiyonlarında; şema `supabase/migrations` klasöründe.
- **Ödeme:** sanal POS yok. Veli sipariş oluşturur, sipariş koduyla IBAN'a havale yapar, dekontu yükler; yönetici onaylayınca öğrenci otomatik odaya yerleşir ya da kredisi yüklenir.

## Yayınlama (Vercel)

1. Vercel'de **Add New → Project** ile bu depoyu içe aktarın.
2. Framework Preset: **Other**. Build komutu ve çıktı klasörü boş kalsın.
3. Deploy. Ortam değişkeni gerekmez; Supabase adresi ve herkese açık anahtar `assets/js/ayar.js` içinde.

## Supabase ayarları (bir kez)

Authentication → URL Configuration:
- **Site URL:** Vercel adresiniz (ör. `https://odev-odalari.vercel.app`)
- **Redirect URLs:** `https://odev-odalari.vercel.app/giris` ve `https://odev-odalari.vercel.app/giris?yenile=1`

`gamzehasanozdemir@gmail.com` ile üye olan hesap otomatik yönetici olur.

## Otomasyonlar

| Ne | Ne zaman |
|---|---|
| Seansları 5 hafta ileriye üret, süresi dolan kayıtları kapat | Her gece 00:30 |
| Haftalık rapor taslakları | Her Cuma 15:00 |
| Ödeme onayında odaya yerleştirme / kredi yükleme | Onay anında |
| Anlık kayıt: en az 1 saat sonraki ilk boş koltuk | Veli istediğinde |
| Seans iptalinde kredi iadesi ve veli bildirimi | İptal anında |
