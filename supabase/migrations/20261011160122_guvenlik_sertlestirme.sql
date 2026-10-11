-- Güvenlik sertleştirmesi (canlıda guv1…guv7 olarak sırayla uygulandı)
-- 1) Yöneticilik yalnızca e-postası doğrulanmış hesaba verilir
create or replace function yonetici_mi() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiller p join auth.users u on u.id = p.id
    where p.id = auth.uid() and p.rol = 'admin' and u.email_confirmed_at is not null);
$$;
create or replace function yeni_kullanici() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiller (id, ad_soyad, telefon, eposta, rol)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'ad_soyad', ''), 120), left(coalesce(new.raw_user_meta_data->>'telefon', ''), 40), new.email,
    case when new.email_confirmed_at is not null and exists (select 1 from yonetici_epostalari where lower(eposta) = lower(new.email))
         then 'admin'::rol else 'veli'::rol end);
  return new;
end $$;
create or replace function eposta_dogrulandi() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update profiller set rol = 'admin' where id = new.id and exists (select 1 from yonetici_epostalari where lower(eposta) = lower(new.email));
  end if;
  if new.email is distinct from old.email then update profiller set eposta = new.email where id = new.id; end if;
  return new;
end $$;
create or replace trigger auth_eposta_dogrulandi after update on auth.users for each row execute function eposta_dogrulandi();

-- 2) Profil: veli rol/e-posta değiştiremez (çağıranın yetkisiyle çalışır)
create or replace function rol_koru() returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and not yonetici_mi() then
    new.rol := old.rol; new.eposta := old.eposta; new.olusturuldu := old.olusturuldu;
  end if;
  return new;
end $$;

-- 3) Meet bağlantıları korumalı tabloda; odalar.meet_linki sütunu okunamaz
create table if not exists oda_baglanti (
  oda_id uuid primary key references odalar(id) on delete cascade,
  meet_linki text not null default '' check (meet_linki = '' or meet_linki ~ '^https://meet\.google\.com/[a-z0-9-]+$'));
insert into oda_baglanti (oda_id, meet_linki) select id, coalesce(meet_linki, '') from odalar
  on conflict (oda_id) do update set meet_linki = excluded.meet_linki;
alter table oda_baglanti enable row level security;
create policy "yonetici baglanti" on oda_baglanti for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "kayitli veli baglanti" on oda_baglanti for select to authenticated using (
  exists (select 1 from rezervasyonlar r join seanslar s on s.id = r.seans_id join ogrenciler o on o.id = r.ogrenci_id
          where s.oda_id = oda_baglanti.oda_id and r.durum = 'aktif' and s.bitis > now() and o.veli_id = auth.uid()));
revoke all on oda_baglanti from anon;
grant select, insert, update, delete on oda_baglanti to authenticated;
create or replace function oda_baglanti_olustur() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into oda_baglanti (oda_id) values (new.id) on conflict do nothing; return new; end $$;
create or replace trigger odalar_baglanti after insert on odalar for each row execute function oda_baglanti_olustur();
revoke select on odalar from anon, authenticated;
grant select (id, ad, tur, gunler, baslangic, bitis, kapasite, sinif_min, sinif_max, ogretmen, renk, aktif, sira, olusturuldu) on odalar to anon, authenticated;
-- en_erken_seansa_kaydet: öğrenci satırı kilitlenir, bağlantı oda_baglanti'dan okunur
-- rezervasyon_iptal: "for update of rz" ile eşzamanlı çift iade engellenir
-- (tam fonksiyon gövdeleri canlı veritabanındaki tanımlarla aynıdır)

-- 4) Sipariş: yönetici alanları taklit edilemez, en fazla 5 bekleyen sipariş, veli yalnızca iptal edebilir
--    siparis_hazirla (güncellendi), siparis_koru (yeni, before update, security invoker),
--    odeme_bildir: dekont yolu kendi klasörü olmalı, "../" yasak
-- 5) Ödev: odev_dogrula (before insert, security invoker) dosya yolu kontrolü, geri bildirim/seans taklidi engeli
-- 6) Öğrenci sınırı: ogrenci_sinir (hesap başına 10)
-- 7) Metin uzunluk sınırları
alter table profiller add constraint profiller_uzunluk check (length(ad_soyad) <= 120 and length(coalesce(telefon,'')) <= 40);
alter table ogrenciler add constraint ogrenciler_uzunluk check (length(ad_soyad) between 1 and 120 and length(coalesce(okul,'')) <= 200 and length(coalesce(notlar,'')) <= 2000);
alter table siparisler add constraint siparisler_uzunluk check (length(coalesce(gonderen_ad,'')) <= 120 and length(coalesce(yonetici_notu,'')) <= 1000);
alter table odevler add constraint odevler_uzunluk check (length(dosya_yolu) <= 400 and length(coalesce(dosya_adi,'')) <= 200 and length(coalesce(not_metni,'')) <= 1000 and length(coalesce(geri_bildirim,'')) <= 2000);
alter table duyurular add constraint duyurular_uzunluk check (length(baslik) <= 200 and length(icerik) <= 5000);
alter table devam add constraint devam_uzunluk check (length(coalesce(ders,'')) <= 100 and length(coalesce(ogretmen_notu,'')) <= 2000);
