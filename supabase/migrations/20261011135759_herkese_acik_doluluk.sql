-- herkese_acik_doluluk
-- Ana sayfa için: yaklaşan seansların doluluğu (kişisel veri içermez)
create or replace function yaklasan_odalar(p_gun int default 7)
returns table (seans_id uuid, oda text, renk text, tur oda_turu, baslangic timestamptz, bitis timestamptz, kapasite int, dolu int)
language sql stable security definer set search_path = public as $$
  select s.id, o.ad, o.renk, o.tur, s.baslangic, s.bitis, o.kapasite,
         (select count(*)::int from rezervasyonlar r where r.seans_id = s.id and r.durum = 'aktif')
  from seanslar s join odalar o on o.id = s.oda_id
  where o.aktif and s.durum = 'planli' and s.bitis > now() and s.baslangic < now() + make_interval(days => least(p_gun, 14))
  order by s.baslangic;
$$;
revoke execute on function yaklasan_odalar(int) from public;
grant execute on function yaklasan_odalar(int) to anon, authenticated;
;
