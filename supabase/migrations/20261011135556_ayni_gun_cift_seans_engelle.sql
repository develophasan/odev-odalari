-- ayni_gun_cift_seans_engelle
create or replace function en_erken_seansa_kaydet(p_ogrenci uuid, p_oda uuid default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_sinif int; v_seans record; v_rez uuid; v_dk int;
begin
  if not ogrenciye_erisim(p_ogrenci) then raise exception 'Yetkisiz işlem'; end if;
  if kredi_bakiyesi(p_ogrenci) < 1 then raise exception 'Seans krediniz yok. Önce tek seans veya kredi paketi alın.'; end if;
  select sinif into v_sinif from ogrenciler where id = p_ogrenci and aktif;
  if v_sinif is null then raise exception 'Öğrenci bulunamadı'; end if;
  select rezervasyon_min_dakika into v_dk from ayarlar where id = 1;

  select s.id, s.baslangic, o.ad as oda_ad, o.meet_linki into v_seans
  from seanslar s join odalar o on o.id = s.oda_id
  where s.durum = 'planli' and o.aktif and o.tur = 'hafta_ici'
    and (p_oda is null or o.id = p_oda)
    and s.baslangic >= now() + make_interval(mins => v_dk)
    and v_sinif between o.sinif_min and o.sinif_max
    -- aynı gün başka bir ödev seansı olan öğrenciye ikinci seans açma
    and not exists (select 1 from rezervasyonlar r join seanslar s2 on s2.id = r.seans_id join odalar o2 on o2.id = s2.oda_id
                    where r.ogrenci_id = p_ogrenci and r.durum = 'aktif' and s2.tarih = s.tarih
                      and s2.durum = 'planli' and o2.tur = 'hafta_ici')
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
revoke execute on function en_erken_seansa_kaydet from anon, public;
grant execute on function en_erken_seansa_kaydet to authenticated;
;
