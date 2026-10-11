-- guvenlik
alter table ayarlar enable row level security;
alter table yonetici_epostalari enable row level security;
alter table profiller enable row level security;
alter table ogrenciler enable row level security;
alter table paketler enable row level security;
alter table odalar enable row level security;
alter table tatiller enable row level security;
alter table seanslar enable row level security;
alter table kayitlar enable row level security;
alter table rezervasyonlar enable row level security;
alter table siparisler enable row level security;
alter table kredi_hareketleri enable row level security;
alter table odevler enable row level security;
alter table devam enable row level security;
alter table duyurular enable row level security;
alter table haftalik_raporlar enable row level security;
alter table bildirimler enable row level security;

create policy "paketler herkese acik" on paketler for select using (aktif or yonetici_mi());
create policy "odalar herkese acik" on odalar for select using (aktif or yonetici_mi());
create policy "tatiller herkese acik" on tatiller for select using (true);
create policy "ayarlar uyelere acik" on ayarlar for select to authenticated using (true);

create policy "yonetici ayarlar" on ayarlar for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici eposta" on yonetici_epostalari for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici paketler" on paketler for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici odalar" on odalar for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici tatiller" on tatiller for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici seanslar" on seanslar for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici kayitlar" on kayitlar for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici rezervasyonlar" on rezervasyonlar for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici siparisler" on siparisler for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici krediler" on kredi_hareketleri for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici odevler" on odevler for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici devam" on devam for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici duyurular" on duyurular for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici raporlar" on haftalik_raporlar for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici bildirimler" on bildirimler for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici ogrenciler" on ogrenciler for all to authenticated using (yonetici_mi()) with check (yonetici_mi());
create policy "yonetici profiller" on profiller for all to authenticated using (yonetici_mi()) with check (yonetici_mi());

create policy "kendi profili okur" on profiller for select to authenticated using (id = auth.uid());
create policy "kendi profilini gunceller" on profiller for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "veli ogrencileri okur" on ogrenciler for select to authenticated using (veli_id = auth.uid());
create policy "veli ogrenci ekler" on ogrenciler for insert to authenticated with check (veli_id = auth.uid());
create policy "veli ogrenci gunceller" on ogrenciler for update to authenticated using (veli_id = auth.uid()) with check (veli_id = auth.uid());

create policy "uyeler seanslari gorur" on seanslar for select to authenticated using (true);

create policy "veli kayitlari" on kayitlar for select to authenticated using (ogrenciye_erisim(ogrenci_id));
create policy "veli rezervasyonlari" on rezervasyonlar for select to authenticated using (ogrenciye_erisim(ogrenci_id));
create policy "veli kredileri" on kredi_hareketleri for select to authenticated using (ogrenciye_erisim(ogrenci_id));
create policy "veli devam" on devam for select to authenticated using (ogrenciye_erisim(ogrenci_id));

create policy "veli siparisleri okur" on siparisler for select to authenticated using (veli_id = auth.uid());
create policy "veli siparis olusturur" on siparisler for insert to authenticated with check (veli_id = auth.uid() and ogrenciye_erisim(ogrenci_id));
create policy "veli bekleyen siparisi iptal eder" on siparisler for update to authenticated
  using (veli_id = auth.uid() and durum = 'bekliyor') with check (veli_id = auth.uid() and durum = 'iptal');

create policy "veli odevleri okur" on odevler for select to authenticated using (ogrenciye_erisim(ogrenci_id));
create policy "veli odev yukler" on odevler for insert to authenticated with check (ogrenciye_erisim(ogrenci_id));
create policy "veli odev siler" on odevler for delete to authenticated using (ogrenciye_erisim(ogrenci_id) and olusturuldu > now() - interval '1 day');

create policy "veli duyurulari" on duyurular for select to authenticated using (
  yayinda and (oda_id is null or exists (
    select 1 from kayitlar k join ogrenciler o on o.id = k.ogrenci_id
    where k.oda_id = duyurular.oda_id and k.aktif and o.veli_id = auth.uid())));

create policy "veli raporlari" on haftalik_raporlar for select to authenticated using (yayinda and ogrenciye_erisim(ogrenci_id));

create policy "kendi bildirimleri" on bildirimler for select to authenticated using (kullanici_id = auth.uid());
create policy "bildirim okundu" on bildirimler for update to authenticated using (kullanici_id = auth.uid()) with check (kullanici_id = auth.uid());

revoke all on oda_doluluk from anon;

revoke execute on all functions in schema public from anon, public;
grant execute on function yonetici_mi, kredi_bakiyesi, ogrenciye_erisim, seans_dolu,
  odeme_bildir, en_erken_seansa_kaydet, rezervasyon_iptal,
  siparis_onayla, siparis_reddet, seans_iptal, telafi_olustur, haftalik_raporlari_uret, seanslari_uret
  to authenticated;
grant execute on function yonetici_mi to anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('odevler', 'odevler', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic','application/pdf']),
       ('dekontlar', 'dekontlar', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy "veli kendi klasorune yukler" on storage.objects for insert to authenticated
  with check (bucket_id in ('odevler','dekontlar') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "veli kendi dosyalarini gorur" on storage.objects for select to authenticated
  using (bucket_id in ('odevler','dekontlar') and ((storage.foldername(name))[1] = auth.uid()::text or yonetici_mi()));
create policy "veli kendi dosyasini siler" on storage.objects for delete to authenticated
  using (bucket_id in ('odevler','dekontlar') and ((storage.foldername(name))[1] = auth.uid()::text or yonetici_mi()));
;
