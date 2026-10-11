-- siparis_kodu_duzelt
create or replace function siparis_hazirla() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_kod text;
begin
  if not ogrenciye_erisim(new.ogrenci_id) then raise exception 'Bu öğrenci için işlem yetkiniz yok'; end if;
  loop
    v_kod := 'OD-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
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
;
