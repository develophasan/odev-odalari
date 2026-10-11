// Veli paneli
import {
  sb, $, $$, esc, tl, saat, tarih, tarihKisa, gunKisa, gunNo, tarihSaat, saatKes, GUN_ADLARI, GUN_KISA,
  etiket, odaNokta, basHarf, toast, hataMetni, islem, al, koru, imzaliUrl, guvenliDosyaAdi,
  dialogAc, onayla, kopyala, formVeri,
} from './ortak.js';
import { kabukKur, sayacYaz } from './kabuk.js';

const ben = await koru('veli');
if (ben) baslat(ben);

function baslat(ben) {
  const uid = ben.id;
  let ayarlar = null;
  const ayarAl = async () => (ayarlar ??= await al(sb.from('ayarlar').select('*').eq('id', 1).single()));
  const cocuklarAl = () => al(sb.from('ogrenciler').select('*').eq('veli_id', uid).eq('aktif', true).order('olusturuldu'));

  const sayfalar = {
    ozet, cocuklar, paket: paketAl, odemeler, odevler, raporlar, duyurular, profil: profilSayfa,
  };
  const menu = [
    { id: 'ozet', ad: 'Özet' },
    { id: 'cocuklar', ad: 'Çocuklarım' },
    { id: 'paket', ad: 'Paket al' },
    { id: 'odemeler', ad: 'Ödemelerim' },
    { id: 'odevler', ad: 'Ödev yükle' },
    { id: 'raporlar', ad: 'Haftalık raporlar' },
    { id: 'duyurular', ad: 'Duyurular' },
    { id: 'profil', ad: 'Hesabım' },
  ];
  const kabuk = kabukKur({ menu, profil: ben, rolAdi: 'Veli hesabı', sayfalar, varsayilan: 'ozet' });
  sayaclar();

  async function sayaclar() {
    const { count } = await sb.from('bildirimler').select('id', { count: 'exact', head: true }).eq('kullanici_id', uid).eq('okundu', false);
    sayacYaz('duyurular', count || 0);
    const { count: bek } = await sb.from('siparisler').select('id', { count: 'exact', head: true }).eq('veli_id', uid).eq('durum', 'bekliyor');
    sayacYaz('odemeler', bek || 0);
  }

  // =========================================================
  // Özet
  // =========================================================
  async function ozet(kap, _, guncel) {
    const simdi = new Date().toISOString();
    const [cocuklarL, rez, kayitlar, sabit] = await Promise.all([
      cocuklarAl(),
      al(sb.from('rezervasyonlar')
        .select('id,kaynak,ogrenci_id,seans:seanslar!inner(id,baslangic,bitis,durum,telafi_mi,oda:odalar(ad,renk,meet_linki,tur))')
        .eq('durum', 'aktif').gte('seans.bitis', simdi).eq('seans.durum', 'planli').limit(300)),
      al(sb.from('kayitlar').select('id,ogrenci_id,gunler,baslangic,bitis,aktif,oda:odalar(ad,renk,baslangic,bitis,tur)').eq('aktif', true)),
      al(sb.from('duyurular').select('*').eq('sabit', true).order('olusturuldu', { ascending: false }).limit(3)),
    ]);
    if (!guncel()) return;
    rez.sort((a, b) => new Date(a.seans.baslangic) - new Date(b.seans.baslangic));
    const krediler = Object.fromEntries(await Promise.all(cocuklarL.map(async (c) => [c.id, (await sb.rpc('kredi_bakiyesi', { p_ogrenci: c.id })).data ?? 0])));
    if (!guncel()) return;

    const ad = (ben.ad_soyad || '').split(' ')[0];
    let html = `<div class="icerik-ust"><h1>Merhaba${ad ? ' ' + esc(ad) : ''}</h1>
      <a class="dugme" href="#paket">Paket al</a></div>`;
    html += sabit.map((d) => `<div class="mesaj bilgi"><strong>${esc(d.baslik)}</strong><br>${esc(d.icerik)}</div>`).join('');

    if (!cocuklarL.length) {
      kap.innerHTML = html + `<div class="bos"><p><strong>Henüz çocuk eklemediniz.</strong></p><p>Paket alabilmek ve odaya yerleşebilmek için önce çocuğunuzu sınıfıyla birlikte ekleyin.</p>
        <button class="dugme" id="ilk-cocuk">Çocuk ekle</button></div>`;
      $('#ilk-cocuk').onclick = () => cocukDialog(null, () => kabuk.yenile());
      return;
    }

    html += '<div class="izgara">';
    for (const c of cocuklarL) {
      const benimRez = rez.filter((r) => r.ogrenci_id === c.id);
      const sonraki = benimRez[0];
      const kay = kayitlar.filter((k) => k.ogrenci_id === c.id);
      const kredi = krediler[c.id];
      html += `<section class="kart" aria-label="${esc(c.ad_soyad)}">
        <div class="kart-ust"><div class="cocuk-bas"><span class="avatar">${basHarf(c.ad_soyad)}</span>
          <div><h2 style="margin:0;font-size:1.15rem">${esc(c.ad_soyad)}</h2><span class="soluk kucuk">${c.sinif}. sınıf${c.okul ? ', ' + esc(c.okul) : ''}</span></div></div>
          <div style="text-align:right"><div class="kredi">${kredi}</div><span class="soluk kucuk">seans kredisi</span></div></div>
        ${sonraki ? `<div class="mesaj bilgi" style="margin-bottom:.75rem"><strong>Sıradaki seans:</strong> ${esc(tarihSaat(sonraki.seans.baslangic))}<br>
            ${odaNokta(sonraki.seans.oda.renk)}${esc(sonraki.seans.oda.ad)}${sonraki.seans.telafi_mi ? ' (telafi)' : ''}
            ${sonraki.seans.oda.meet_linki ? `<div style="margin-top:.6rem"><a class="dugme kucuk" href="${esc(sonraki.seans.oda.meet_linki)}" target="_blank" rel="noopener">Odaya katıl (Meet)</a></div>` : ''}</div>`
          : '<p class="soluk">Planlanmış seansı yok.</p>'}
        ${kay.length ? `<p class="kucuk" style="margin-bottom:.5rem"><strong>Kayıtlı olduğu odalar</strong></p><ul style="margin:0 0 1rem;padding-left:1.1em">${kay.map((k) => `<li>${odaNokta(k.oda.renk)}${esc(k.oda.ad)}, ${k.gunler.map((g) => GUN_KISA[g]).join(' ')} ${saatKes(k.oda.baslangic)}<span class="soluk kucuk">, ${tarihKisa(k.bitis + 'T12:00:00Z')} tarihine kadar</span></li>`).join('')}</ul>` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:.5rem">
          ${kredi > 0 ? `<button class="dugme kucuk" data-en-erken="${c.id}">En erken boş seansa yerleş</button>` : `<a class="dugme kucuk ikincil" href="#paket/${c.id}">Paket veya seans al</a>`}
          <a class="dugme kucuk ikincil" href="#odevler/${c.id}">Ödev yükle</a>
        </div>
      </section>`;
    }
    html += '</div>';

    html += `<section class="kart" style="margin-top:1.25rem"><h2>Yaklaşan seanslar</h2>
      ${rez.length ? rez.slice(0, 20).map((r) => {
        const c = cocuklarL.find((x) => x.id === r.ogrenci_id);
        return `<div class="seans-satir"><div class="seans-tarih" style="--renk:${esc(r.seans.oda.renk)}"><strong>${gunNo(r.seans.baslangic)}</strong><span>${gunKisa(r.seans.baslangic)}</span></div>
          <div><strong>${saat(r.seans.baslangic)}–${saat(r.seans.bitis)}</strong> ${esc(r.seans.oda.ad)}${r.seans.telafi_mi ? ' <span class="etiket">telafi</span>' : ''}<br><span class="soluk kucuk">${esc(c?.ad_soyad || '')}, ${r.kaynak === 'kredi' ? 'kredi ile' : 'paket'}</span></div>
          <div><button class="dugme kucuk sade" data-iptal="${r.id}" data-kaynak="${r.kaynak}">Katılamayacak</button></div></div>`;
      }).join('') : '<p class="soluk">Yaklaşan seans yok.</p>'}</section>`;

    kap.innerHTML = html;

    $$('[data-en-erken]', kap).forEach((b) => b.addEventListener('click', () => islem(b, async () => {
      const { data, error } = await sb.rpc('en_erken_seansa_kaydet', { p_ogrenci: b.dataset.enErken });
      if (error) throw error;
      dialogAc(`<div class="dialog-ic"><h2>Seansınız hazır</h2>
        <p><strong>${esc(data.oda)}</strong><br>${esc(tarihSaat(data.baslangic))}</p>
        ${data.meet ? `<p>Seans saatinde bu bağlantıya tıklayın:<br><a href="${esc(data.meet)}" target="_blank" rel="noopener">${esc(data.meet)}</a></p>` : ''}
        <p class="soluk kucuk">Ödevin fotoğrafını şimdiden yüklerseniz öğretmen hazırlıklı gelir.</p>
        <div class="dialog-eylem"><a class="dugme ikincil" href="#odevler/${esc(b.dataset.enErken)}" data-kapat-git>Ödev yükle</a><button class="dugme" data-kapat>Tamam</button></div></div>`,
        (d) => $('[data-kapat-git]', d).addEventListener('click', () => d.close()));
      kabuk.yenile();
    })));
    $$('[data-iptal]', kap).forEach((b) => b.addEventListener('click', async () => {
      const kredi = b.dataset.kaynak === 'kredi';
      const ok = await onayla(kredi
        ? `Bu seansı iptal etmek istiyor musunuz? Seansa ${ayarlar?.kredi_iade_saat ?? 2} saatten fazla varsa krediniz geri yüklenir.`
        : 'Çocuğunuzun bu seansa katılamayacağını öğretmene bildirelim mi? Paket koltukları için ücret iadesi yapılmaz.', 'Evet, iptal et', true);
      if (!ok) return;
      islem(b, async () => {
        const { data, error } = await sb.rpc('rezervasyon_iptal', { p_rez: b.dataset.iptal });
        if (error) throw error;
        toast(data);
        kabuk.yenile();
      });
    }));
    ayarAl().catch(() => {});
  }

  // =========================================================
  // Çocuklarım
  // =========================================================
  function cocukDialog(c, sonra) {
    dialogAc(`<form class="dialog-ic" method="dialog">
      <h2>${c ? 'Bilgileri düzenle' : 'Çocuk ekle'}</h2>
      <div class="alan"><label for="c-ad">Adı soyadı</label><input id="c-ad" name="ad_soyad" required value="${esc(c?.ad_soyad)}"></div>
      <div class="satir">
        <div class="alan"><label for="c-sinif">Sınıfı</label><select id="c-sinif" name="sinif" required>
          ${[1, 2, 3, 4, 5, 6, 7, 8].map((s) => `<option value="${s}" ${c?.sinif === s ? 'selected' : ''}>${s}. sınıf</option>`).join('')}</select></div>
        <div class="alan"><label for="c-okul">Okulu <span class="soluk">(isteğe bağlı)</span></label><input id="c-okul" name="okul" value="${esc(c?.okul)}"></div>
      </div>
      <div class="alan"><label for="c-not">Öğretmenin bilmesini istedikleriniz <span class="soluk">(isteğe bağlı)</span></label>
        <textarea id="c-not" name="notlar" placeholder="Örneğin: okumada zorlanıyor, kesirleri yeni öğrendi">${esc(c?.notlar)}</textarea></div>
      ${c?.kvkk_onay ? '' : `<div class="alan"><label class="onay"><input type="checkbox" name="kvkk" required> <span>Çocuğumun ad, sınıf ve ödev bilgilerinin eğitim hizmeti amacıyla işlenmesine ve seans sırasında ödev sayfasının ekran görüntüsünün alınmasına izin veriyorum. Görüntü ve ses kaydı yapılmaz.</span></label></div>`}
      <div class="dialog-eylem"><button class="dugme ikincil" data-kapat>Vazgeç</button><button class="dugme" type="submit">Kaydet</button></div></form>`,
    (d) => {
      $('form', d).addEventListener('submit', (e) => {
        e.preventDefault();
        const v = formVeri(e.currentTarget);
        islem(e.submitter, async () => {
          const kayit = { ad_soyad: v.ad_soyad.trim(), sinif: Number(v.sinif), okul: v.okul.trim(), notlar: v.notlar.trim() };
          if (c) {
            await al(sb.from('ogrenciler').update(kayit).eq('id', c.id));
          } else {
            await al(sb.from('ogrenciler').insert({ ...kayit, veli_id: uid, kvkk_onay: true, kvkk_onay_tarihi: new Date().toISOString() }));
          }
          d.close();
          toast(c ? 'Bilgiler güncellendi' : 'Çocuğunuz eklendi');
          sonra?.();
        });
      });
    });
  }

  async function cocuklar(kap) {
    const liste = await cocuklarAl();
    kap.innerHTML = `<div class="icerik-ust"><h1>Çocuklarım</h1><button class="dugme" id="yeni-cocuk">Çocuk ekle</button></div>
      ${liste.length ? `<div class="izgara">${liste.map((c) => `<div class="kart"><div class="kart-ust"><div class="cocuk-bas"><span class="avatar">${basHarf(c.ad_soyad)}</span>
        <div><h2 style="margin:0;font-size:1.15rem">${esc(c.ad_soyad)}</h2><span class="soluk kucuk">${c.sinif}. sınıf${c.okul ? ', ' + esc(c.okul) : ''}</span></div></div>
        <button class="dugme kucuk ikincil" data-duzenle="${c.id}">Düzenle</button></div>
        ${c.notlar ? `<p class="kucuk soluk">${esc(c.notlar)}</p>` : ''}
        <p class="kucuk soluk" style="margin:0">Veri izni: ${c.kvkk_onay ? `verildi (${tarihKisa(c.kvkk_onay_tarihi)})` : 'verilmedi'}</p></div>`).join('')}</div>`
      : '<div class="bos"><p>Henüz çocuk eklemediniz.</p></div>'}`;
    $('#yeni-cocuk').onclick = () => cocukDialog(null, () => kabuk.yenile());
    $$('[data-duzenle]', kap).forEach((b) => b.addEventListener('click', () => cocukDialog(liste.find((c) => c.id === b.dataset.duzenle), () => kabuk.yenile())));
  }

  // =========================================================
  // Paket al
  // =========================================================
  async function paketAl(kap, [secCocuk]) {
    const [liste, paketler, odalar] = await Promise.all([
      cocuklarAl(),
      al(sb.from('paketler').select('*').eq('aktif', true).order('sira')),
      al(sb.from('odalar').select('*').eq('aktif', true).order('sira')),
    ]);
    if (!liste.length) {
      kap.innerHTML = `<div class="icerik-ust"><h1>Paket al</h1></div><div class="bos"><p>Paket almadan önce çocuğunuzu ekleyin.</p><button class="dugme" id="c-ekle">Çocuk ekle</button></div>`;
      $('#c-ekle').onclick = () => cocukDialog(null, () => kabuk.yenile());
      return;
    }
    let onSecili = null;
    try { onSecili = sessionStorage.getItem('secilen_paket'); } catch {}
    kap.innerHTML = `<div class="icerik-ust"><h1>Paket al</h1></div>
      <form class="kart" id="paket-form" style="max-width:760px">
        <div class="alan"><label for="p-cocuk">Hangi çocuğunuz için?</label><select id="p-cocuk" name="ogrenci_id" required>
          ${liste.map((c) => `<option value="${c.id}" ${c.id === secCocuk ? 'selected' : ''}>${esc(c.ad_soyad)} (${c.sinif}. sınıf)</option>`).join('')}</select></div>
        <fieldset style="border:0;padding:0;margin:0 0 1rem"><legend style="font-weight:700;margin-bottom:.5rem">Paket</legend>
          ${paketler.map((p, i) => `<label class="onay kart" style="margin-bottom:.5rem;cursor:pointer">
            <input type="radio" name="paket_id" value="${p.id}" required ${(onSecili ? p.id === onSecili : i === 0) ? 'checked' : ''}>
            <span style="flex:1"><strong>${esc(p.ad)}</strong> <span style="float:right;font-family:var(--yazi-baslik);font-weight:800">${tl(p.fiyat)}</span><br>
            <span class="soluk kucuk" style="font-weight:400">${esc(p.aciklama)}</span></span></label>`).join('')}
        </fieldset>
        <div class="alan" id="tercih-alan"><label for="p-oda">Tercih ettiğiniz saat</label><select id="p-oda" name="tercih_oda_id"></select>
          <small>Seçtiğiniz oda doluysa en yakın saatteki boş odaya yerleştirilir.</small></div>
        <button class="dugme" type="submit">Siparişi oluştur</button>
        <p class="soluk kucuk" style="margin-top:.75rem">Sipariş oluşturunca size bir kod ve IBAN bilgisi gösterilir. Ödeme yapılana kadar koltuk ayrılmaz.</p>
      </form>`;
    const form = $('#paket-form');
    const tercihGuncelle = () => {
      const p = paketler.find((x) => x.id === form.paket_id.value);
      const c = liste.find((x) => x.id === form.ogrenci_id.value);
      const uygun = odalar.filter((o) => o.tur === 'hafta_ici' && c && c.sinif >= o.sinif_min && c.sinif <= o.sinif_max && (!p || p.hafta_ici_gunler.every((g) => o.gunler.includes(g))));
      const goster = p && p.tur === 'abonelik' && p.hafta_ici_gunler.length > 0;
      $('#tercih-alan').hidden = !goster;
      const onceki = $('#p-oda').value;
      $('#p-oda').innerHTML = `<option value="">Fark etmez, en erken uygun saat</option>` + uygun.map((o) => `<option value="${o.id}">${esc(o.ad)}, ${saatKes(o.baslangic)}–${saatKes(o.bitis)}</option>`).join('');
      if (uygun.some((o) => o.id === onceki)) $('#p-oda').value = onceki;
    };
    form.addEventListener('change', (e) => { if (e.target.id !== 'p-oda') tercihGuncelle(); });
    tercihGuncelle();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = formVeri(form);
      islem(e.submitter, async () => {
        const s = await al(sb.from('siparisler').insert({
          veli_id: uid, ogrenci_id: v.ogrenci_id, paket_id: v.paket_id,
          tercih_oda_id: $('#tercih-alan').hidden ? null : (v.tercih_oda_id || null),
        }).select('id').single());
        try { sessionStorage.removeItem('secilen_paket'); } catch {}
        location.hash = `odemeler/${s.id}`;
        sayaclar();
      });
    });
  }

  // =========================================================
  // Ödemelerim
  // =========================================================
  function ibanKutusu(a, s) {
    return `<dl class="iban-kutu">
      <div><dt>Sipariş kodu (açıklamaya yazın)</dt><dd><span class="kod">${esc(s.kod)}</span> <button class="dugme kucuk sade" data-kopya="${esc(s.kod)}">Kopyala</button></dd></div>
      <div><dt>Tutar</dt><dd>${tl(s.tutar)}</dd></div>
      <div><dt>Alıcı</dt><dd>${esc(a.hesap_sahibi)}</dd></div>
      <div><dt>Banka</dt><dd>${esc(a.banka)}</dd></div>
      <div><dt>IBAN</dt><dd>${esc(a.iban)} <button class="dugme kucuk sade" data-kopya="${esc(a.iban.replace(/\s/g, ''))}">Kopyala</button></dd></div>
    </dl><p class="kucuk soluk" style="margin-top:.5rem">${esc(a.odeme_notu)}</p>`;
  }

  async function odemeler(kap, [acik]) {
    const [liste, a] = await Promise.all([
      al(sb.from('siparisler').select('*, paket:paketler(ad,tur), ogrenci:ogrenciler(ad_soyad)').eq('veli_id', uid).order('olusturuldu', { ascending: false })),
      ayarAl(),
    ]);
    kap.innerHTML = `<div class="icerik-ust"><h1>Ödemelerim</h1><a class="dugme ikincil" href="#paket">Yeni paket al</a></div>
      ${liste.length ? liste.map((s) => `<section class="kart" id="s-${s.id}">
        <div class="kart-ust"><div><h2>${esc(s.paket?.ad)}</h2><span class="soluk kucuk">${esc(s.ogrenci?.ad_soyad)}, ${tarihKisa(s.olusturuldu)}, kod ${esc(s.kod)}</span></div>
          <div style="text-align:right"><div class="kredi" style="font-size:1.3rem">${tl(s.tutar)}</div>${etiket(s.durum)}</div></div>
        ${s.durum === 'bekliyor' || s.durum === 'reddedildi' ? `
          ${s.durum === 'reddedildi' ? `<div class="mesaj hata">Bu ödemeyi hesabımızda göremedik.${s.yonetici_notu ? ' Not: ' + esc(s.yonetici_notu) : ''} Dekontu kontrol edip tekrar bildirebilirsiniz.</div>` : ''}
          <p>Aşağıdaki hesaba havale veya EFT yapın, sonra ödemeyi bildirin.</p>
          ${ibanKutusu(a, s)}
          <form class="bildir-form" data-id="${s.id}" data-ogrenci="${s.ogrenci_id}" style="margin-top:1rem">
            <div class="satir">
              <div class="alan"><label for="g-${s.id}">Gönderenin adı soyadı</label><input id="g-${s.id}" name="gonderen" required value="${esc(s.gonderen_ad || ben.ad_soyad)}"></div>
              <div class="alan"><label for="d-${s.id}">Dekont <span class="soluk">(fotoğraf veya PDF)</span></label><input id="d-${s.id}" name="dekont" type="file" accept="image/*,application/pdf"></div>
            </div>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap"><button class="dugme" type="submit">Ödemeyi bildir</button>
            ${s.durum === 'bekliyor' ? `<button class="dugme ikincil tehlike" type="button" data-sil="${s.id}">Siparişi iptal et</button>` : ''}</div>
          </form>` : ''}
        ${s.durum === 'bildirildi' ? `<p class="soluk" style="margin:0">Bildiriminiz ${tarihSaat(s.bildirim_tarihi)} tarihinde alındı. Hesabımıza geçtiğini gördüğümüzde onaylayacağız; size bildirim gelecek.</p>` : ''}
        ${s.durum === 'onaylandi' ? `<p style="margin:0">${esc(s.sonuc_notu || 'Paketiniz aktif.')}</p>` : ''}
      </section>`).join('') : '<div class="bos"><p>Henüz siparişiniz yok.</p><a class="dugme" href="#paket">Paket al</a></div>'}`;

    $$('[data-kopya]', kap).forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); kopyala(b.dataset.kopya); }));
    $$('.bildir-form', kap).forEach((f) => f.addEventListener('submit', (e) => {
      e.preventDefault();
      islem(e.submitter, async () => {
        let yol = null;
        const dosya = f.dekont.files[0];
        if (dosya) {
          if (dosya.size > 10 * 1024 * 1024) throw new Error('Dekont 10 MB sınırını aşıyor.');
          yol = `${uid}/${f.dataset.ogrenci}/${Date.now()}-${guvenliDosyaAdi(dosya.name)}`;
          const { error } = await sb.storage.from('dekontlar').upload(yol, dosya, { contentType: dosya.type });
          if (error) throw error;
        }
        const { error } = await sb.rpc('odeme_bildir', { p_siparis: f.dataset.id, p_gonderen: f.gonderen.value.trim(), p_dekont: yol });
        if (error) throw error;
        toast('Ödeme bildiriminiz alındı');
        sayaclar();
        kabuk.yenile();
      });
    }));
    $$('[data-sil]', kap).forEach((b) => b.addEventListener('click', async () => {
      if (!(await onayla('Bu siparişi iptal etmek istiyor musunuz?', 'İptal et', true))) return;
      islem(b, async () => {
        await al(sb.from('siparisler').update({ durum: 'iptal' }).eq('id', b.dataset.sil));
        toast('Sipariş iptal edildi');
        sayaclar();
        kabuk.yenile();
      });
    }));
    if (acik) document.getElementById(`s-${acik}`)?.scrollIntoView({ block: 'start' });
  }

  // =========================================================
  // Ödev yükle
  // =========================================================
  async function odevler(kap, [secCocuk]) {
    const liste = await cocuklarAl();
    if (!liste.length) { kap.innerHTML = '<div class="icerik-ust"><h1>Ödev yükle</h1></div><div class="bos"><p>Önce çocuğunuzu ekleyin.</p><a class="dugme" href="#cocuklar">Çocuklarım</a></div>'; return; }
    const kayitlar = await al(sb.from('odevler').select('*, seans:seanslar(baslangic, oda:odalar(ad))').in('ogrenci_id', liste.map((c) => c.id)).order('olusturuldu', { ascending: false }).limit(40));
    kap.innerHTML = `<div class="icerik-ust"><h1>Ödev yükle</h1></div>
      <form class="kart" id="odev-form" style="max-width:760px">
        <p class="soluk">Ödevin fotoğrafını çekip yükleyin. Dosya, çocuğunuzun bir sonraki seansına otomatik eklenir ve öğretmen seanstan önce görür.</p>
        <div class="satir">
          <div class="alan"><label for="o-cocuk">Çocuk</label><select id="o-cocuk" name="ogrenci_id">${liste.map((c) => `<option value="${c.id}" ${c.id === secCocuk ? 'selected' : ''}>${esc(c.ad_soyad)}</option>`).join('')}</select></div>
          <div class="alan"><label for="o-dosya">Fotoğraf veya PDF</label><input id="o-dosya" name="dosya" type="file" accept="image/*,application/pdf" multiple required><small>Birden fazla sayfa seçebilirsiniz. Dosya başına en fazla 10 MB.</small></div>
        </div>
        <div class="alan"><label for="o-not">Not <span class="soluk">(isteğe bağlı)</span></label><input id="o-not" name="not_metni" placeholder="Örneğin: Matematik 34. sayfa, 3. sorudan itibaren"></div>
        <button class="dugme" type="submit">Yükle</button>
      </form>
      <h2 style="font-size:1.25rem;margin-top:2rem">Yüklenen ödevler</h2>
      ${kayitlar.length ? `<div class="dosya-liste" id="dosyalar">${kayitlar.map((o) => `<div class="dosya" data-yol="${esc(o.dosya_yolu)}">
        <div class="onizleme"></div>
        <strong>${esc(liste.find((c) => c.id === o.ogrenci_id)?.ad_soyad || '')}</strong><br>
        <span class="soluk">${tarihKisa(o.olusturuldu)}${o.seans ? `, ${esc(o.seans.oda?.ad)} ${saat(o.seans.baslangic)}` : ''}</span>
        ${o.not_metni ? `<p class="kucuk" style="margin:.3rem 0 0">${esc(o.not_metni)}</p>` : ''}
        ${o.geri_bildirim ? `<p class="kucuk" style="margin:.3rem 0 0"><strong>Öğretmen:</strong> ${esc(o.geri_bildirim)}</p>` : ''}
        ${Date.now() - new Date(o.olusturuldu) < 864e5 ? `<button class="dugme kucuk sade" data-odev-sil="${o.id}" style="margin-top:.3rem">Sil</button>` : ''}
      </div>`).join('')}</div>` : '<div class="bos"><p>Henüz ödev yüklenmedi.</p></div>'}`;

    // Önizlemeler
    $$('.dosya', kap).forEach(async (d) => {
      try {
        const url = await imzaliUrl('odevler', d.dataset.yol);
        const pdf = /\.pdf$/i.test(d.dataset.yol);
        $('.onizleme', d).innerHTML = pdf ? `<a href="${esc(url)}" target="_blank" rel="noopener">PDF'i aç</a>` : `<a href="${esc(url)}" target="_blank" rel="noopener"><img src="${esc(url)}" alt="Ödev fotoğrafı" loading="lazy"></a>`;
      } catch {}
    });

    $('#odev-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.currentTarget;
      islem(e.submitter, async () => {
        const dosyalar = [...f.dosya.files];
        for (const dosya of dosyalar) {
          if (dosya.size > 10 * 1024 * 1024) throw new Error(`${dosya.name} 10 MB sınırını aşıyor.`);
          const yol = `${uid}/${f.ogrenci_id.value}/${Date.now()}-${guvenliDosyaAdi(dosya.name)}`;
          const { error } = await sb.storage.from('odevler').upload(yol, dosya, { contentType: dosya.type });
          if (error) throw error;
          await al(sb.from('odevler').insert({ ogrenci_id: f.ogrenci_id.value, dosya_yolu: yol, dosya_adi: dosya.name, not_metni: f.not_metni.value.trim() }));
        }
        toast(`${dosyalar.length} dosya yüklendi`);
        kabuk.yenile();
      });
    });
    $$('[data-odev-sil]', kap).forEach((b) => b.addEventListener('click', async () => {
      if (!(await onayla('Bu ödev dosyasını silmek istiyor musunuz?', 'Sil', true))) return;
      islem(b, async () => {
        const o = kayitlar.find((x) => x.id === b.dataset.odevSil);
        await al(sb.from('odevler').delete().eq('id', o.id));
        await sb.storage.from('odevler').remove([o.dosya_yolu]);
        toast('Silindi');
        kabuk.yenile();
      });
    }));
  }

  // =========================================================
  // Haftalık raporlar
  // =========================================================
  async function raporlar(kap) {
    const liste = await cocuklarAl();
    const r = liste.length ? await al(sb.from('haftalik_raporlar').select('*').in('ogrenci_id', liste.map((c) => c.id)).eq('yayinda', true).order('hafta_baslangic', { ascending: false }).limit(30)) : [];
    kap.innerHTML = `<div class="icerik-ust"><h1>Haftalık raporlar</h1></div>
      ${r.length ? r.map((x) => {
        const i = x.istatistik || {};
        const c = liste.find((y) => y.id === x.ogrenci_id);
        return `<section class="kart"><div class="kart-ust"><div><h2>${esc(c?.ad_soyad)}</h2><span class="soluk kucuk">${tarih(x.hafta_baslangic + 'T12:00:00Z')} haftası</span></div></div>
          <div class="sayilar">
            <div class="sayi"><strong>${i.katildi ?? 0}/${i.planlanan ?? 0}</strong><span>seansa katıldı</span></div>
            <div class="sayi"><strong>${i.bitti ?? 0}</strong><span>ödevi bitirdi</span></div>
            <div class="sayi"><strong>${i.kismen ?? 0}</strong><span>kısmen bitti</span></div>
            <div class="sayi"><strong>${i.yardim_ort ?? '–'}</strong><span>seans başına yardım</span></div>
          </div>
          ${x.iyi_gidenler ? `<h3>İyi gidenler</h3><p>${esc(x.iyi_gidenler)}</p>` : ''}
          ${x.takildigi_konular ? `<h3>Takıldığı konular</h3><p>${esc(x.takildigi_konular)}</p>` : ''}
          ${x.evde_destek ? `<h3>Evde nasıl destek olabilirsiniz</h3><p>${esc(x.evde_destek)}</p>` : ''}
          ${x.gelecek_hafta ? `<h3>Gelecek hafta</h3><p>${esc(x.gelecek_hafta)}</p>` : ''}
          ${(i.notlar || []).length ? `<h3>Seans notları</h3><ul>${i.notlar.map((n) => `<li><strong>${tarihKisa(n.tarih + 'T12:00:00Z')}</strong>${n.ders ? ', ' + esc(n.ders) : ''}: ${esc(n.not)}</li>`).join('')}</ul>` : ''}
        </section>`;
      }).join('') : '<div class="bos"><p>Raporlar her Cuma yayınlanır. İlk haftanın sonunda burada göreceksiniz.</p></div>'}`;
  }

  // =========================================================
  // Duyurular ve bildirimler
  // =========================================================
  async function duyurular(kap) {
    const [d, b] = await Promise.all([
      al(sb.from('duyurular').select('*, oda:odalar(ad,renk)').order('sabit', { ascending: false }).order('olusturuldu', { ascending: false }).limit(30)),
      al(sb.from('bildirimler').select('*').eq('kullanici_id', uid).order('olusturuldu', { ascending: false }).limit(50)),
    ]);
    kap.innerHTML = `<div class="icerik-ust"><h1>Duyurular</h1></div>
      <div class="iki-sutun">
        <section><h2 style="font-size:1.2rem">Duyurular</h2>
          ${d.length ? d.map((x) => `<article class="kart"><h3>${esc(x.baslik)}</h3><p style="white-space:pre-line">${esc(x.icerik)}</p>
            <span class="soluk kucuk">${tarihKisa(x.olusturuldu)}${x.oda ? `, ${odaNokta(x.oda.renk)}${esc(x.oda.ad)}` : ''}</span></article>`).join('') : '<div class="bos"><p>Duyuru yok.</p></div>'}
        </section>
        <section><div class="kart-ust"><h2 style="font-size:1.2rem;margin:0">Bildirimler</h2>${b.some((x) => !x.okundu) ? '<button class="dugme kucuk ikincil" id="okundu">Tümünü okundu say</button>' : ''}</div>
          ${b.length ? `<ul class="bildirim-liste kart">${b.map((x) => `<li class="${x.okundu ? '' : 'yeni'}"><strong>${esc(x.baslik)}</strong><br>${esc(x.icerik)}<br><span class="soluk kucuk">${tarihSaat(x.olusturuldu)}</span></li>`).join('')}</ul>` : '<div class="bos"><p>Bildirim yok.</p></div>'}
        </section>
      </div>`;
    $('#okundu')?.addEventListener('click', (e) => islem(e.currentTarget, async () => {
      await al(sb.from('bildirimler').update({ okundu: true }).eq('kullanici_id', uid).eq('okundu', false));
      sayaclar();
      kabuk.yenile();
    }));
  }

  // =========================================================
  // Hesabım
  // =========================================================
  async function profilSayfa(kap) {
    kap.innerHTML = `<div class="icerik-ust"><h1>Hesabım</h1></div>
      <div class="izgara">
        <form class="kart" id="profil-form"><h2>İletişim bilgileri</h2>
          <div class="alan"><label for="pr-ad">Adınız soyadınız</label><input id="pr-ad" name="ad_soyad" required value="${esc(ben.ad_soyad)}"></div>
          <div class="alan"><label for="pr-tel">Telefon</label><input id="pr-tel" name="telefon" type="tel" value="${esc(ben.telefon)}"></div>
          <div class="alan"><label>E-posta</label><input value="${esc(ben.eposta)}" disabled></div>
          <button class="dugme" type="submit">Kaydet</button></form>
        <form class="kart" id="sifre-form"><h2>Şifre değiştir</h2>
          <div class="alan"><label for="pr-sifre">Yeni şifre</label><input id="pr-sifre" name="sifre" type="password" minlength="6" autocomplete="new-password" required></div>
          <button class="dugme" type="submit">Şifreyi değiştir</button></form>
      </div>`;
    $('#profil-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = formVeri(e.currentTarget);
      islem(e.submitter, async () => {
        await al(sb.from('profiller').update({ ad_soyad: v.ad_soyad.trim(), telefon: v.telefon.trim() }).eq('id', uid));
        ben.ad_soyad = v.ad_soyad.trim(); ben.telefon = v.telefon.trim();
        toast('Bilgileriniz kaydedildi');
      });
    });
    $('#sifre-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.currentTarget;
      islem(e.submitter, async () => {
        const { error } = await sb.auth.updateUser({ password: f.sifre.value });
        if (error) throw error;
        f.reset();
        toast('Şifreniz değiştirildi');
      });
    });
  }
}
