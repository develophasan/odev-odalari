-- temel_sema
create extension if not exists pgcrypto;

create type rol as enum ('admin', 'veli');
create type paket_turu as enum ('abonelik', 'kredi');
create type oda_turu as enum ('hafta_ici', 'hafta_sonu');
create type siparis_durumu as enum ('bekliyor', 'bildirildi', 'onaylandi', 'reddedildi', 'iptal');
create type seans_durumu as enum ('planli', 'iptal', 'tamamlandi');
create type rezervasyon_kaynagi as enum ('abonelik', 'kredi', 'yonetici');
create type rezervasyon_durumu as enum ('aktif', 'iptal');
create type devam_durumu as enum ('V', 'Y', 'M');
create type bitis_durumu as enum ('Bitti', 'Kısmen', 'Bitmedi');

create table ayarlar (
  id int primary key default 1 check (id = 1),
  marka text not null default 'Ödev Odaları',
  iban text not null default 'TR00 0000 0000 0000 0000 0000 00',
  banka text not null default '[Banka adı]',
  hesap_sahibi text not null default '[Ad Soyad]',
  odeme_notu text not null default 'Açıklama kısmına mutlaka sipariş kodunuzu yazın.',
  iletisim_telefon text default '',
  iletisim_eposta text default '',
  rezervasyon_min_dakika int not null default 60,
  kredi_iade_saat int not null default 2,
  guncellendi timestamptz not null default now()
);
insert into ayarlar (id) values (1);

create table yonetici_epostalari (eposta text primary key);

create table profiller (
  id uuid primary key references auth.users on delete cascade,
  rol rol not null default 'veli',
  ad_soyad text not null default '',
  telefon text default '',
  eposta text default '',
  olusturuldu timestamptz not null default now()
);

create or replace function yonetici_mi() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiller where id = auth.uid() and rol = 'admin');
$$;

create or replace function yeni_kullanici() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiller (id, ad_soyad, telefon, eposta, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'ad_soyad', ''),
    coalesce(new.raw_user_meta_data->>'telefon', ''),
    new.email,
    case when exists (select 1 from yonetici_epostalari where lower(eposta) = lower(new.email))
         then 'admin'::rol else 'veli'::rol end
  );
  return new;
end $$;
create trigger auth_yeni_kullanici after insert on auth.users
  for each row execute function yeni_kullanici();

create or replace function rol_koru() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.rol is distinct from old.rol and not yonetici_mi() then
    new.rol := old.rol;
  end if;
  return new;
end $$;
create trigger profiller_rol_koru before update on profiller
  for each row execute function rol_koru();

create table ogrenciler (
  id uuid primary key default gen_random_uuid(),
  veli_id uuid not null references profiller(id) on delete cascade,
  ad_soyad text not null,
  sinif int not null check (sinif between 1 and 8),
  okul text default '',
  notlar text default '',
  kvkk_onay boolean not null default false,
  kvkk_onay_tarihi timestamptz,
  aktif boolean not null default true,
  olusturuldu timestamptz not null default now()
);
create index on ogrenciler (veli_id);

create table paketler (
  id uuid primary key default gen_random_uuid(),
  ad text not null,
  aciklama text not null default '',
  fiyat numeric(10,2) not null check (fiyat >= 0),
  tur paket_turu not null,
  hafta_ici_gunler int[] not null default '{}',
  hafta_sonu boolean not null default false,
  kredi int not null default 0,
  sure_gun int not null default 30,
  sira int not null default 0,
  aktif boolean not null default true,
  olusturuldu timestamptz not null default now()
);

create table odalar (
  id uuid primary key default gen_random_uuid(),
  ad text not null,
  tur oda_turu not null default 'hafta_ici',
  gunler int[] not null,
  baslangic time not null,
  bitis time not null,
  kapasite int not null default 4 check (kapasite > 0),
  sinif_min int not null default 1,
  sinif_max int not null default 8,
  meet_linki text default '',
  ogretmen text default 'Kurucu',
  renk text default '#1F5F6B',
  aktif boolean not null default true,
  sira int not null default 0,
  olusturuldu timestamptz not null default now(),
  check (bitis > baslangic)
);

create table tatiller (
  tarih date primary key,
  aciklama text not null default ''
);

create table seanslar (
  id uuid primary key default gen_random_uuid(),
  oda_id uuid not null references odalar(id) on delete cascade,
  tarih date not null,
  baslangic timestamptz not null,
  bitis timestamptz not null,
  durum seans_durumu not null default 'planli',
  iptal_nedeni text,
  telafi_mi boolean not null default false,
  olusturuldu timestamptz not null default now(),
  unique (oda_id, tarih, telafi_mi)
);
create index on seanslar (baslangic);

create table kayitlar (
  id uuid primary key default gen_random_uuid(),
  ogrenci_id uuid not null references ogrenciler(id) on delete cascade,
  oda_id uuid not null references odalar(id),
  paket_id uuid references paketler(id),
  siparis_id uuid,
  gunler int[] not null,
  baslangic date not null,
  bitis date not null,
  aktif boolean not null default true,
  olusturuldu timestamptz not null default now()
);
create index on kayitlar (ogrenci_id);
create index on kayitlar (oda_id);

create table rezervasyonlar (
  id uuid primary key default gen_random_uuid(),
  seans_id uuid not null references seanslar(id) on delete cascade,
  ogrenci_id uuid not null references ogrenciler(id) on delete cascade,
  kaynak rezervasyon_kaynagi not null,
  kayit_id uuid references kayitlar(id) on delete set null,
  durum rezervasyon_durumu not null default 'aktif',
  olusturuldu timestamptz not null default now(),
  unique (seans_id, ogrenci_id)
);
create index on rezervasyonlar (ogrenci_id);

create table siparisler (
  id uuid primary key default gen_random_uuid(),
  kod text not null unique,
  veli_id uuid not null references profiller(id) on delete cascade,
  ogrenci_id uuid not null references ogrenciler(id) on delete cascade,
  paket_id uuid not null references paketler(id),
  tercih_oda_id uuid references odalar(id),
  tutar numeric(10,2) not null default 0,
  durum siparis_durumu not null default 'bekliyor',
  dekont_yolu text,
  gonderen_ad text,
  bildirim_tarihi timestamptz,
  onaylayan uuid references profiller(id),
  onay_tarihi timestamptz,
  yonetici_notu text,
  sonuc_notu text,
  olusturuldu timestamptz not null default now()
);
create index on siparisler (veli_id);
create index on siparisler (durum);
alter table kayitlar add constraint kayitlar_siparis_fk foreign key (siparis_id) references siparisler(id) on delete set null;

create table kredi_hareketleri (
  id uuid primary key default gen_random_uuid(),
  ogrenci_id uuid not null references ogrenciler(id) on delete cascade,
  miktar int not null,
  neden text not null,
  siparis_id uuid references siparisler(id) on delete set null,
  rezervasyon_id uuid references rezervasyonlar(id) on delete set null,
  olusturuldu timestamptz not null default now()
);
create index on kredi_hareketleri (ogrenci_id);

create table odevler (
  id uuid primary key default gen_random_uuid(),
  ogrenci_id uuid not null references ogrenciler(id) on delete cascade,
  seans_id uuid references seanslar(id) on delete set null,
  dosya_yolu text not null,
  dosya_adi text not null default '',
  not_metni text default '',
  geri_bildirim text default '',
  olusturuldu timestamptz not null default now()
);
create index on odevler (ogrenci_id);
create index on odevler (seans_id);

create table devam (
  id uuid primary key default gen_random_uuid(),
  seans_id uuid not null references seanslar(id) on delete cascade,
  ogrenci_id uuid not null references ogrenciler(id) on delete cascade,
  durum devam_durumu not null default 'V',
  odev_durumu bitis_durumu,
  yardim_sayisi int default 0,
  ders text default '',
  ogretmen_notu text default '',
  ekran_goruntusu boolean not null default false,
  veliye_ilet boolean not null default false,
  guncellendi timestamptz not null default now(),
  unique (seans_id, ogrenci_id)
);

create table duyurular (
  id uuid primary key default gen_random_uuid(),
  baslik text not null,
  icerik text not null,
  oda_id uuid references odalar(id) on delete cascade,
  yayinda boolean not null default true,
  sabit boolean not null default false,
  olusturan uuid references profiller(id),
  olusturuldu timestamptz not null default now()
);

create table haftalik_raporlar (
  id uuid primary key default gen_random_uuid(),
  ogrenci_id uuid not null references ogrenciler(id) on delete cascade,
  hafta_baslangic date not null,
  istatistik jsonb not null default '{}',
  iyi_gidenler text default '',
  takildigi_konular text default '',
  evde_destek text default '',
  gelecek_hafta text default '',
  yayinda boolean not null default false,
  yayin_tarihi timestamptz,
  olusturuldu timestamptz not null default now(),
  unique (ogrenci_id, hafta_baslangic)
);

create table bildirimler (
  id uuid primary key default gen_random_uuid(),
  kullanici_id uuid not null references profiller(id) on delete cascade,
  baslik text not null,
  icerik text not null default '',
  baglanti text,
  okundu boolean not null default false,
  olusturuldu timestamptz not null default now()
);
create index on bildirimler (kullanici_id, okundu);

create or replace view oda_doluluk with (security_invoker = true) as
select s.id as seans_id, s.oda_id, s.baslangic, s.bitis, s.durum, o.kapasite,
       (select count(*) from rezervasyonlar r where r.seans_id = s.id and r.durum = 'aktif') as dolu
from seanslar s join odalar o on o.id = s.oda_id;
;
