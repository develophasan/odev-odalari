-- yonetici_yerlesim
-- Yönetici: öğrenciyi elle bir odaya yerleştir (bekleme listesi, oda değişikliği)
create or replace function yonetici_kayit_ekle(p_ogrenci uuid, p_oda uuid, p_bas date, p_bit date, p_gunler int[] default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_kayit uuid; v_gunler int[];
begin
  if not yonetici_mi() then raise exception 'Yetkisiz işlem'; end if;
  select coalesce(p_gunler, gunler) into v_gunler from odalar where id = p_oda;
  if v_gunler is null then raise exception 'Oda bulunamadı'; end if;
  if p_bit < p_bas then raise exception 'Bitiş tarihi başlangıçtan önce olamaz'; end if;
  insert into kayitlar (ogrenci_id, oda_id, gunler, baslangic, bitis)
  values (p_ogrenci, p_oda, v_gunler, p_bas, p_bit) returning id into v_kayit;
  perform kayit_rezervasyonlari(v_kayit);
  perform bildir(o.veli_id, 'Oda yerleşimi güncellendi',
                 (select ad from odalar where id = p_oda) || ' – ' || to_char(p_bas, 'DD.MM.YYYY') || ' itibarıyla', '/panel')
  from ogrenciler o where o.id = p_ogrenci;
  return v_kayit;
end $$;

-- Yönetici: kaydı kapat, gelecekteki koltukları boşalt
create or replace function yonetici_kayit_kapat(p_kayit uuid)
returns int language plpgsql security definer set search_path = public as $$
declare v_adet int;
begin
  if not yonetici_mi() then raise exception 'Yetkisiz işlem'; end if;
  update kayitlar set aktif = false, bitis = least(bitis, current_date) where id = p_kayit;
  update rezervasyonlar r set durum = 'iptal'
  from seanslar s where s.id = r.seans_id and r.kayit_id = p_kayit and r.durum = 'aktif' and s.baslangic > now();
  get diagnostics v_adet = row_count;
  return v_adet;
end $$;

revoke execute on function yonetici_kayit_ekle(uuid, uuid, date, date, int[]) from public, anon;
revoke execute on function yonetici_kayit_kapat(uuid) from public, anon;
grant execute on function yonetici_kayit_ekle(uuid, uuid, date, date, int[]) to authenticated;
grant execute on function yonetici_kayit_kapat(uuid) to authenticated;
;
