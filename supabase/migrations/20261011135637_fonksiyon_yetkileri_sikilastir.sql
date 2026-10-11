-- fonksiyon_yetkileri_sikilastir
revoke execute on function bildir(uuid, text, text, text) from anon, authenticated, public;
revoke execute on function yoneticilere_bildir(text, text, text) from anon, authenticated, public;
revoke execute on function kayit_rezervasyonlari(uuid) from anon, authenticated, public;
revoke execute on function oda_bul(uuid, oda_turu, int[], uuid, date, date) from anon, authenticated, public;
revoke execute on function oda_degisti() from anon, authenticated, public;
revoke execute on function odev_seansa_bagla() from anon, authenticated, public;
revoke execute on function rapor_yayin_bildir() from anon, authenticated, public;
revoke execute on function rol_koru() from anon, authenticated, public;
revoke execute on function siparis_hazirla() from anon, authenticated, public;
revoke execute on function suresi_dolanlari_kapat() from anon, authenticated, public;
revoke execute on function yeni_kullanici() from anon, authenticated, public;
revoke execute on function duyuru_bildir() from anon, authenticated, public;

alter policy "paketler herkese acik" on paketler to anon, authenticated using (aktif);
alter policy "odalar herkese acik" on odalar to anon, authenticated using (aktif);
revoke execute on function yonetici_mi() from anon;
;
