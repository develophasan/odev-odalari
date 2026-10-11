-- otomasyonlar
create or replace function bildir(p_kullanici uuid, p_baslik text, p_icerik text, p_baglanti text default null)
returns void language sql security definer set search_path = public as $$
  insert into bildirimler (kullanici_id, baslik, icerik, baglanti) values (p_kullanici, p_baslik, p_icerik, p_baglanti);
$$;

create or replace function yoneticilere_bildir(p_baslik text, p_icerik text, p_baglanti text default null)
returns void language sql security definer set search_path = public as $$
  insert into bildirimler (kullanici_id, baslik, icerik, baglanti)
  select id, p_baslik, p_icerik, p_baglanti from profiller where rol = 'admin';
$$;

create or replace function kredi_bakiyesi(p_ogrenci uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(miktar), 0)::int from kredi_hareketleri where ogrenci_id = p_ogrenci;
$$;

create or replace function ogrenciye_erisim(p_ogrenci uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select yonetici_mi() or exists (select 1 from ogrenciler where id = p_ogrenci and veli_id = auth.uid());
$$;

create or replace function seans_dolu(p_seans uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from rezervasyonlar where seans_id = p_seans and durum = 'aktif';
$$;

create or replace function seanslari_uret(p_gun int default 35) returns int
language plpgsql security definer set search_path = public as $$
declare v_adet int := 0; v_tarih date; o record; v_yeni uuid;
begin
  for o in select * from odalar where aktif loop
    for v_tarih in select d::date from generate_series(current_date, current_date + p_gun, interval '1 day') d loop
      if extract(isodow from v_tarih)::int = any (o.gunler)
         and not exists (select 1 from tatiller t where t.tarih = v_tarih) then
        insert into seanslar (oda_id, tarih, baslangic, bitis)
        values (o.id, v_tarih,
                (v_tarih + o.baslangic) at time zone 'Europe/Istanbul',
                (v_tarih + o.bitis) at time zone 'Europe/Istanbul')
        on conflict (oda_id, tarih, telafi_mi) do nothing
        returning id into v_yeni;
        if v_yeni is not null then
          v_adet := v_adet + 1;
          insert into rezervasyonlar (seans_id, ogrenci_id, kaynak, kayit_id)
          select v_yeni, k.ogrenci_id, 'abonelik', k.id
          from kayitlar k
          where k.oda_id = o.id and k.aktif
            and v_tarih between k.baslangic and k.bitis
            and extract(isodow from v_tarih)::int = any (k.gunler)
          on conflict do nothing;
          v_yeni := null;
        end if;
      end if;
    end loop;
  end loop;
  return v_adet;
end $$;

create or replace function kayit_rezervasyonlari(p_kayit uuid) returns int
language plpgsql security definer set search_path = public as $$
declare v_adet int;
begin
  insert into rezervasyonlar (seans_id, ogrenci_id, kaynak, kayit_id)
  select s.id, k.ogrenci_id, 'abonelik', k.id
  from kayitlar k join seanslar s on s.oda_id = k.oda_id
  where k.id = p_kayit and s.durum = 'planli'
    and s.tarih between k.baslangic and k.bitis
    and s.baslangic > now()
    and extract(isodow from s.tarih)::int = any (k.gunler)
  on conflict (seans_id, ogrenci_id) do update set durum = 'aktif', kaynak = 'abonelik', kayit_id = excluded.kayit_id;
  get diagnostics v_adet = row_count;
  return v_adet;
end $$;

create or replace function oda_bul(p_ogrenci uuid, p_tur oda_turu, p_gunler int[], p_tercih uuid,
                                   p_bas date, p_bit date) returns uuid
language plpgsql stable security definer set search_path = public as $$
declare v_sinif int; v_oda uuid;
begin
  select sinif into v_sinif from ogrenciler where id = p_ogrenci;
  select o.id into v_oda
  from odalar o
  where o.aktif and o.tur = p_tur
    and v_sinif between o.sinif_min and o.sinif_max
    and (p_tur = 'hafta_sonu' or o.gunler @> p_gunler)
    and (select count(*) from kayitlar k
         where k.oda_id = o.id and k.aktif and k.ogrenci_id <> p_ogrenci
           and k.baslangic <= p_bit and k.bitis >= p_bas
           and (p_tur = 'hafta_sonu' or k.gunler && p_gunler)) < o.kapasite
  order by (o.id = p_tercih) desc nulls last, o.baslangic, o.sira
  limit 1;
  return v_oda;
end $$;

create or replace function siparis_onayla(p_siparis uuid, p_not text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s record; p record; v_oda uuid; v_kayit uuid; v_bas date := current_date; v_bit date;
        v_sonuc text := ''; v_oda_ad text; v_hs_oda uuid;
begin
  if not yonetici_mi() then raise exception 'Yetkisiz işlem'; end if;
  select * into s from siparisler where id = p_siparis for update;
  if s.id is null then raise exception 'Sipariş bulunamadı'; end if;
  if s.durum = 'onaylandi' then raise exception 'Bu sipariş zaten onaylanmış'; end if;
  select * into p from paketler where id = s.paket_id;
  v_bit := v_bas + p.sure_gun;

  if p.tur = 'kredi' then
    insert into kredi_hareketleri (ogrenci_id, miktar, neden, siparis_id)
    values (s.ogrenci_id, p.kredi, p.ad || ' satın alındı', s.id);
    v_sonuc := p.kredi || ' seans kredisi yüklendi.';
  else
    if array_length(p.hafta_ici_gunler, 1) is not null then
      v_oda := oda_bul(s.ogrenci_id, 'hafta_ici', p.hafta_ici_gunler, s.tercih_oda_id, v_bas, v_bit);
      if v_oda is null then
        v_sonuc := 'Uygun hafta içi oda bulunamadı – öğrenci bekleme listesine alındı. ';
      else
        insert into kayitlar (ogrenci_id, oda_id, paket_id, siparis_id, gunler, baslangic, bitis)
        values (s.ogrenci_id, v_oda, p.id, s.id, p.hafta_ici_gunler, v_bas, v_bit) returning id into v_kayit;
        perform kayit_rezervasyonlari(v_kayit);
        select ad || ' (' || to_char(baslangic, 'HH24:MI') || ')' into v_oda_ad from odalar where id = v_oda;
        v_sonuc := v_oda_ad || ' odasına yerleştirildi. ';
      end if;
    end if;
    if p.hafta_sonu then
      v_hs_oda := oda_bul(s.ogrenci_id, 'hafta_sonu', '{}', null, v_bas, v_bit);
      if v_hs_oda is null then
        v_sonuc := v_sonuc || 'Hafta sonu grubu dolu – bekleme listesi.';
      else
        insert into kayitlar (ogrenci_id, oda_id, paket_id, siparis_id, gunler, baslangic, bitis)
        select s.ogrenci_id, v_hs_oda, p.id, s.id, o.gunler, v_bas, v_bit from odalar o where o.id = v_hs_oda
        returning id into v_kayit;
        perform kayit_rezervasyonlari(v_kayit);
        v_sonuc := v_sonuc || 'Hafta sonu genel tekrar grubuna eklendi.';
      end if;
    end if;
  end if;

  update siparisler set durum = 'onaylandi', onaylayan = auth.uid(), onay_tarihi = now(),
         yonetici_notu = coalesce(p_not, yonetici_notu), sonuc_notu = trim(v_sonuc)
  where id = s.id;

  perform bildir(s.veli_id, 'Ödemeniz onaylandı',
                 p.ad || ' paketiniz aktif. ' || trim(v_sonuc), '/panel');
  return jsonb_build_object('sonuc', trim(v_sonuc));
end $$;

create or replace function siparis_reddet(p_siparis uuid, p_not text) returns void
language plpgsql security definer set search_path = public as $$
declare s record;
begin
  if not yonetici_mi() then raise exception 'Yetkisiz işlem'; end if;
  update siparisler set durum = 'reddedildi', yonetici_notu = p_not, onaylayan = auth.uid(), onay_tarihi = now()
  where id = p_siparis returning * into s;
  perform bildir(s.veli_id, 'Ödeme bildiriminiz onaylanmadı',
                 coalesce(p_not, 'Lütfen bizimle iletişime geçin.'), '/panel/odemeler');
end $$;

create or replace function odeme_bildir(p_siparis uuid, p_gonderen text, p_dekont text default null) returns void
language plpgsql security definer set search_path = public as $$
declare s record;
begin
  update siparisler set durum = 'bildirildi', gonderen_ad = p_gonderen,
         dekont_yolu = coalesce(p_dekont, dekont_yolu), bildirim_tarihi = now()
  where id = p_siparis and veli_id = auth.uid() and durum in ('bekliyor', 'reddedildi')
  returning * into s;
  if s.id is null then raise exception 'Sipariş bulunamadı veya bildirilemez durumda'; end if;
  perform yoneticilere_bildir('Yeni ödeme bildirimi',
          s.kod || ' – ' || s.tutar || ' TL – gönderen: ' || p_gonderen, '/yonetim/odemeler');
end $$;

create or replace function siparis_hazirla() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_kod text;
begin
  if not ogrenciye_erisim(new.ogrenci_id) then raise exception 'Bu öğrenci için işlem yetkiniz yok'; end if;
  loop
    v_kod := 'OD-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (select 1 from siparisler where kod = v_kod);
  end loop;
  new.kod := v_kod;
  select fiyat into new.tutar from paketler where id = new.paket_id and aktif;
  if new.tutar is null then raise exception 'Paket bulunamadı'; end if;
  if not yonetici_mi() then
    new.veli_id := auth.uid();
    new.durum := 'bekliyor';
  end if;
  return new;
end $$;
create trigger siparis_hazirla before insert on siparisler for each row execute function siparis_hazirla();

create or replace function en_erken_seansa_kaydet(p_ogrenci uuid, p_oda uuid default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_sinif int; v_seans record; v_rez uuid; v_dk int;
begin
  if not ogrenciye_erisim(p_ogrenci) then raise exception 'Yetkisiz işlem'; end if;
  if kredi_bakiyesi(p_ogrenci) < 1 then raise exception 'Seans krediniz yok. Önce tek seans veya kredi paketi alın.'; end if;
  select sinif into v_sinif from ogrenciler where id = p_ogrenci and aktif;
  select rezervasyon_min_dakika into v_dk from ayarlar where id = 1;

  select s.id, s.baslangic, o.ad as oda_ad, o.meet_linki into v_seans
  from seanslar s join odalar o on o.id = s.oda_id
  where s.durum = 'planli' and o.aktif and o.tur = 'hafta_ici'
    and (p_oda is null or o.id = p_oda)
    and s.baslangic >= now() + make_interval(mins => v_dk)
    and v_sinif between o.sinif_min and o.sinif_max
    and not exists (select 1 from rezervasyonlar r where r.seans_id = s.id and r.ogrenci_id = p_ogrenci and r.durum = 'aktif')
    and (select count(*) from rezervasyonlar r where r.seans_id = s.id and r.durum = 'aktif') < o.kapasite
  order by s.baslangic
  limit 1
  for update of s skip locked;

  if v_seans.id is null then raise exception 'Önümüzdeki günlerde boş koltuk bulunamadı.'; end if;

  insert into rezervasyonlar (seans_id, ogrenci_id, kaynak)
  values (v_seans.id, p_ogrenci, 'kredi')
  on conflict (seans_id, ogrenci_id) do update set durum = 'aktif', kaynak = 'kredi'
  returning id into v_rez;
  insert into kredi_hareketleri (ogrenci_id, miktar, neden, rezervasyon_id)
  values (p_ogrenci, -1, 'Seans rezervasyonu', v_rez);

  perform bildir((select veli_id from ogrenciler where id = p_ogrenci), 'Seans rezervasyonunuz hazır',
                 v_seans.oda_ad || ' – ' || to_char(v_seans.baslangic at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI'),
                 '/panel');
  perform yoneticilere_bildir('Yeni anlık rezervasyon',
          (select ad_soyad from ogrenciler where id = p_ogrenci) || ' → ' || v_seans.oda_ad || ' ' ||
          to_char(v_seans.baslangic at time zone 'Europe/Istanbul', 'DD.MM HH24:MI'), '/yonetim/seanslar');
  return jsonb_build_object('rezervasyon_id', v_rez, 'seans_id', v_seans.id, 'oda', v_seans.oda_ad,
                            'baslangic', v_seans.baslangic, 'meet', v_seans.meet_linki);
end $$;

create or replace function rezervasyon_iptal(p_rez uuid) returns text
language plpgsql security definer set search_path = public as $$
declare r record; v_saat int; v_iade boolean;
begin
  select rz.id, rz.ogrenci_id, rz.kaynak, rz.durum, s.baslangic into r
  from rezervasyonlar rz join seanslar s on s.id = rz.seans_id where rz.id = p_rez;
  if r.id is null or not ogrenciye_erisim(r.ogrenci_id) then raise exception 'Yetkisiz işlem'; end if;
  if r.durum = 'iptal' then return 'Zaten iptal'; end if;
  select kredi_iade_saat into v_saat from ayarlar where id = 1;
  update rezervasyonlar set durum = 'iptal' where id = p_rez;
  v_iade := r.kaynak = 'kredi' and r.baslangic > now() + make_interval(hours => v_saat);
  if v_iade then
    insert into kredi_hareketleri (ogrenci_id, miktar, neden, rezervasyon_id) values (r.ogrenci_id, 1, 'İptal iadesi', p_rez);
    return 'İptal edildi, kredi iade edildi.';
  end if;
  return 'İptal edildi.';
end $$;

create or replace function seans_iptal(p_seans uuid, p_neden text) returns int
language plpgsql security definer set search_path = public as $$
declare r record; v_adet int := 0; v_s record;
begin
  if not yonetici_mi() then raise exception 'Yetkisiz işlem'; end if;
  update seanslar set durum = 'iptal', iptal_nedeni = p_neden where id = p_seans returning * into v_s;
  for r in select rz.id, rz.ogrenci_id, rz.kaynak, o.veli_id from rezervasyonlar rz join ogrenciler o on o.id = rz.ogrenci_id
           where rz.seans_id = p_seans and rz.durum = 'aktif' loop
    if r.kaynak = 'kredi' then
      insert into kredi_hareketleri (ogrenci_id, miktar, neden, rezervasyon_id) values (r.ogrenci_id, 1, 'Seans iptali iadesi', r.id);
    end if;
    perform bildir(r.veli_id, 'Seans iptal edildi',
      to_char(v_s.baslangic at time zone 'Europe/Istanbul', 'DD.MM HH24:MI') || ' seansı iptal edildi: ' || coalesce(p_neden, '') ||
      '. Telafi seansı planlanacaktır.', '/panel');
    v_adet := v_adet + 1;
  end loop;
  return v_adet;
end $$;

create or replace function telafi_olustur(p_seans uuid, p_baslangic timestamptz) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_s record; v_yeni uuid; v_sure interval;
begin
  if not yonetici_mi() then raise exception 'Yetkisiz işlem'; end if;
  select * into v_s from seanslar where id = p_seans;
  v_sure := v_s.bitis - v_s.baslangic;
  insert into seanslar (oda_id, tarih, baslangic, bitis, telafi_mi)
  values (v_s.oda_id, (p_baslangic at time zone 'Europe/Istanbul')::date, p_baslangic, p_baslangic + v_sure, true)
  returning id into v_yeni;
  insert into rezervasyonlar (seans_id, ogrenci_id, kaynak)
  select v_yeni, ogrenci_id, 'yonetici' from rezervasyonlar where seans_id = p_seans
  on conflict do nothing;
  perform bildir(o.veli_id, 'Telafi seansı planlandı',
                 to_char(p_baslangic at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI'), '/panel')
  from rezervasyonlar r join ogrenciler o on o.id = r.ogrenci_id where r.seans_id = v_yeni;
  return v_yeni;
end $$;

create or replace function odev_seansa_bagla() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.seans_id is null then
    select s.id into new.seans_id
    from rezervasyonlar r join seanslar s on s.id = r.seans_id
    where r.ogrenci_id = new.ogrenci_id and r.durum = 'aktif' and s.durum = 'planli'
      and s.bitis > now()
    order by s.baslangic limit 1;
  end if;
  return new;
end $$;
create trigger odev_seansa_bagla before insert on odevler for each row execute function odev_seansa_bagla();

create or replace function suresi_dolanlari_kapat() returns int
language plpgsql security definer set search_path = public as $$
declare v_adet int;
begin
  update kayitlar set aktif = false where aktif and bitis < current_date;
  get diagnostics v_adet = row_count;
  insert into bildirimler (kullanici_id, baslik, icerik, baglanti)
  select distinct o.veli_id, 'Paketinizin süresi doluyor',
         o.ad_soyad || ' için paketiniz ' || to_char(k.bitis, 'DD.MM.YYYY') || ' tarihinde bitiyor. Yenilemek için panelden yeni paket seçebilirsiniz.',
         '/panel/paketler'
  from kayitlar k join ogrenciler o on o.id = k.ogrenci_id
  where k.aktif and k.bitis = current_date + 3;
  return v_adet;
end $$;

create or replace function haftalik_raporlari_uret(p_hafta date default null) returns int
language plpgsql security definer set search_path = public as $$
declare v_bas date := coalesce(p_hafta, date_trunc('week', current_date)::date); v_adet int;
begin
  insert into haftalik_raporlar (ogrenci_id, hafta_baslangic, istatistik)
  select r.ogrenci_id, v_bas,
    jsonb_build_object(
      'planlanan', count(*) filter (where s.durum <> 'iptal'),
      'katildi', count(d.id) filter (where d.durum = 'V'),
      'bitti', count(d.id) filter (where d.odev_durumu = 'Bitti'),
      'kismen', count(d.id) filter (where d.odev_durumu = 'Kısmen'),
      'bitmedi', count(d.id) filter (where d.odev_durumu = 'Bitmedi'),
      'yardim_ort', round(avg(d.yardim_sayisi)::numeric, 1),
      'notlar', coalesce(jsonb_agg(jsonb_build_object('tarih', s.tarih, 'ders', d.ders, 'not', d.ogretmen_notu))
                         filter (where d.ogretmen_notu <> '' and d.veliye_ilet), '[]'::jsonb)
    )
  from rezervasyonlar r
  join seanslar s on s.id = r.seans_id
  left join devam d on d.seans_id = s.id and d.ogrenci_id = r.ogrenci_id
  where r.durum = 'aktif' and s.tarih between v_bas and v_bas + 6
  group by r.ogrenci_id
  on conflict (ogrenci_id, hafta_baslangic) do update set istatistik = excluded.istatistik
  where not haftalik_raporlar.yayinda;
  get diagnostics v_adet = row_count;
  if v_adet > 0 then
    perform yoneticilere_bildir('Haftalık rapor taslakları hazır', v_adet || ' öğrenci için rapor taslağı oluşturuldu.', '/yonetim/raporlar');
  end if;
  return v_adet;
end $$;

create or replace function rapor_yayin_bildir() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.yayinda and not coalesce(old.yayinda, false) then
    new.yayin_tarihi := now();
    perform bildir(o.veli_id, 'Haftalık gelişim raporu hazır', o.ad_soyad || ' için bu haftanın raporu yayınlandı.', '/panel/raporlar')
    from ogrenciler o where o.id = new.ogrenci_id;
  end if;
  return new;
end $$;
create trigger rapor_yayin_bildir before update on haftalik_raporlar for each row execute function rapor_yayin_bildir();

create or replace function duyuru_bildir() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.yayinda and (tg_op = 'INSERT' or not old.yayinda) then
    insert into bildirimler (kullanici_id, baslik, icerik, baglanti)
    select distinct p.id, 'Duyuru: ' || new.baslik, left(new.icerik, 200), '/panel'
    from profiller p
    where p.rol = 'veli' and (new.oda_id is null or exists (
      select 1 from ogrenciler o join kayitlar k on k.ogrenci_id = o.id
      where o.veli_id = p.id and k.oda_id = new.oda_id and k.aktif));
  end if;
  return new;
end $$;
create trigger duyuru_bildir after insert or update on duyurular for each row execute function duyuru_bildir();

create or replace function oda_degisti() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform seanslari_uret(35);
  return null;
end $$;
create trigger oda_degisti after insert or update of gunler, baslangic, bitis, aktif on odalar
  for each statement execute function oda_degisti();
;
