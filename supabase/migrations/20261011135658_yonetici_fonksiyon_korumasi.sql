-- yonetici_fonksiyon_korumasi
create or replace function seanslari_uret(p_gun int default 35) returns int
language plpgsql security definer set search_path = public as $$
declare v_adet int := 0; v_tarih date; o record; v_yeni uuid;
begin
  if auth.uid() is not null and not yonetici_mi() then raise exception 'Yetkisiz işlem'; end if;
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

create or replace function haftalik_raporlari_uret(p_hafta date default null) returns int
language plpgsql security definer set search_path = public as $$
declare v_bas date := coalesce(p_hafta, date_trunc('week', current_date)::date); v_adet int;
begin
  if auth.uid() is not null and not yonetici_mi() then raise exception 'Yetkisiz işlem'; end if;
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
;
