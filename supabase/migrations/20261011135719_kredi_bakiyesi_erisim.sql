-- kredi_bakiyesi_erisim
create or replace function kredi_bakiyesi(p_ogrenci uuid) returns int
language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null or ogrenciye_erisim(p_ogrenci)
              then (select coalesce(sum(miktar), 0)::int from kredi_hareketleri where ogrenci_id = p_ogrenci)
              else null end;
$$;
;
