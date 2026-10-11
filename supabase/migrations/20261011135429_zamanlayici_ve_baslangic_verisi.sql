-- zamanlayici_ve_baslangic_verisi
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule('seans-uret', '30 21 * * *', $$select public.seanslari_uret(35); select public.suresi_dolanlari_kapat();$$);
select cron.schedule('haftalik-rapor', '0 12 * * 5', $$select public.haftalik_raporlari_uret();$$);

insert into yonetici_epostalari (eposta) values ('gamzehasanozdemir@gmail.com') on conflict do nothing;

insert into tatiller (tarih, aciklama) values
  ('2026-10-29', 'Cumhuriyet Bayramı'),
  ('2027-01-01', 'Yılbaşı')
on conflict do nothing;

insert into paketler (ad, aciklama, fiyat, tur, hafta_ici_gunler, hafta_sonu, kredi, sure_gun, sira) values
 ('Tam Paket', 'Pazartesi–Perşembe 4×60 dk ödev odası + Cumartesi 2 saat Genel Tekrar + Cuma gelişim raporu', 6250, 'abonelik', '{1,2,3,4}', true, 0, 30, 1),
 ('Günlük Ödev Odası', 'Pazartesi–Perşembe 4×60 dk, 3–4 kişilik grup + Cuma gelişim raporu', 4750, 'abonelik', '{1,2,3,4}', false, 0, 30, 2),
 ('Yarım Paket', 'Pazartesi ve Çarşamba ödev odası + Cuma gelişim raporu', 2900, 'abonelik', '{1,3}', false, 0, 30, 3),
 ('Hafta Sonu Genel Tekrar', 'Cumartesi 2 saat haftalık konu tekrarı, en fazla 6 kişilik grup', 1900, 'abonelik', '{}', true, 0, 30, 4),
 ('Tek Seans', 'İhtiyaç anında 1 ödev seansı – en erken boş odaya otomatik yerleşim', 350, 'kredi', '{}', false, 1, 60, 5),
 ('5 Seanslık Kart', '5 ödev seansı – istediğiniz gün kullanın (60 gün geçerli)', 1600, 'kredi', '{}', false, 5, 60, 6);

insert into odalar (ad, tur, gunler, baslangic, bitis, kapasite, sinif_min, sinif_max, meet_linki, renk, sira) values
 ('Oda A', 'hafta_ici', '{1,2,3,4}', '17:00', '18:00', 4, 1, 4, 'https://meet.google.com/hje-cseg-tbb', '#1F5F6B', 1),
 ('Oda B', 'hafta_ici', '{1,2,3,4}', '18:15', '19:15', 4, 1, 4, 'https://meet.google.com/ydc-gtdy-xvz', '#2E7D5B', 2),
 ('Oda C', 'hafta_ici', '{1,2,3,4}', '19:30', '20:30', 4, 1, 4, 'https://meet.google.com/fua-tocb-hdo', '#C46A1A', 3),
 ('Cumartesi Genel Tekrar', 'hafta_sonu', '{6}', '10:00', '12:00', 6, 1, 4, 'https://meet.google.com/mks-gjri-vyo', '#6B4FA0', 4);
;
