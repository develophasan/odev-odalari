// Yönetim paneli
import {
  sb, $, $$, esc, tl, saat, tarih, tarihKisa, gunAdi, gunKisa, gunNo, tarihSaat, saatKes, GUN_ADLARI, GUN_KISA,
  etiket, odaNokta, basHarf, toast, islem, al, koru, imzaliUrl, dialogAc, onayla, formVeri,
  bugunISO, istanbulISO, haftaBasi, gunEkle, DURUM_ADI, ODA_SUTUN, guvenliMeet, baglantilar,
} from './ortak.js';
import { kabukKur, sayacYaz } from './kabuk.js';

const ben = await koru('admin');
if (ben) baslat(ben);

function baslat(ben) {
  const sayfalar = { bugun, odemeler, seanslar, ogrenciler, veliler, odalar, paketler, odevler, duyurular, raporlar, ayarlar: ayarlarSayfa };
  const menu = [
    { id: 'bugun', ad: 'Bugün' },
    { id: 'odemeler', ad: 'Ödemeler' },
    { id: 'seanslar', ad: 'Seanslar ve yoklama' },
    { id: 'ogrenciler', ad: 'Öğrenciler' },
    { id: 'veliler', ad: 'Veliler' },
    { id: 'odevler', ad: 'Gelen ödevler' },
    { id: 'raporlar', ad: 'Haftalık raporlar' },
    { id: 'duyurular', ad: 'Duyurular' },
    { id: 'odalar', ad: 'Odalar ve saatler' },
    { id: 'paketler', ad: 'Paketler ve fiyatlar' },
    { id: 'ayarlar', ad: 'Ayarlar' },
  ];
  const odalarAl = async () => {
    const [o, m] = await Promise.all([al(sb.from('odalar').select(ODA_SUTUN).order('sira')), baglantilar()]);
    return o.map((x) => ({ ...x, meet_linki: m[x.id] || '' }));
  };
  const ogrencilerAl = () => al(sb.from('ogrenciler').select('*, veli:profiller(ad_soyad,telefon,eposta)').order('ad_soyad'));
  const ust = (baslik, sag = '') => `<div class="icerik-ust"><h1>${esc(baslik)}</h1><div style="display:flex;gap:.5rem;flex-wrap:wrap">${sag}</div></div>`;
  const SEANS_SEC = 'id,tarih,baslangic,bitis,durum,iptal_nedeni,telafi_mi,oda:odalar(id,ad,renk,kapasite,tur),rez:rezervasyonlar(id,durum,kaynak,ogrenci:ogrenciler(id,ad_soyad,sinif))';
  const KAYNAK = { abonelik: 'aylık paket', kredi: 'kredi ile', yonetici: 'yönetici ekledi' };
  const aktifRez = (s) => (s.rez || []).filter((r) => r.durum === 'aktif');
  const kabuk = kabukKur({ menu, profil: ben, rolAdi: 'Yönetici', sayfalar, varsayilan: 'bugun' });
  sayaclar();

  async function sayaclar() {
    const { count } = await sb.from('siparisler').select('id', { count: 'exact', head: true }).eq('durum', 'bildirildi');
    sayacYaz('odemeler', count || 0);
    const { count: tr } = await sb.from('haftalik_raporlar').select('id', { count: 'exact', head: true }).eq('yayinda', false);
    sayacYaz('raporlar', tr || 0);
  }


  // =========================================================
  // Bugün
  // =========================================================
  async function bugun(kap, _, guncel) {
    const gun = bugunISO();
    const [bildirildi, bekliyor, bugunSeans, ogrSay, bildirim, bekleme, meet] = await Promise.all([
      sb.from('siparisler').select('id', { count: 'exact', head: true }).eq('durum', 'bildirildi'),
      sb.from('siparisler').select('id', { count: 'exact', head: true }).eq('durum', 'bekliyor'),
      al(sb.from('seanslar').select(SEANS_SEC).eq('tarih', gun).order('baslangic')),
      sb.from('ogrenciler').select('id', { count: 'exact', head: true }).eq('aktif', true),
      al(sb.from('bildirimler').select('*').eq('kullanici_id', ben.id).order('olusturuldu', { ascending: false }).limit(12)),
      al(sb.from('siparisler').select('id,kod,sonuc_notu,ogrenci:ogrenciler(ad_soyad,sinif),paket:paketler(ad)').eq('durum', 'onaylandi').ilike('sonuc_notu', '%bekleme%').order('onay_tarihi', { ascending: false }).limit(20)),
      baglantilar(),
    ]);
    if (!guncel()) return;
    const odevSay = bugunSeans.length ? (await sb.from('odevler').select('seans_id').in('seans_id', bugunSeans.map((s) => s.id))).data || [] : [];
    const dolu = bugunSeans.reduce((t, s) => t + aktifRez(s).length, 0);
    const kapasite = bugunSeans.filter((s) => s.durum !== 'iptal').reduce((t, s) => t + s.oda.kapasite, 0);

    kap.innerHTML = ust(`Bugün, ${tarih(gun + 'T12:00:00+03:00')} ${gunAdi(gun + 'T12:00:00+03:00')}`) + `
      <div class="sayilar">
        <a class="sayi" href="#odemeler"><strong>${bildirildi.count || 0}</strong><span>onay bekleyen ödeme</span></a>
        <a class="sayi" href="#odemeler/bekliyor"><strong>${bekliyor.count || 0}</strong><span>henüz ödenmemiş sipariş</span></a>
        <a class="sayi" href="#seanslar"><strong>${dolu}/${kapasite}</strong><span>bugünkü koltuk doluluğu</span></a>
        <a class="sayi" href="#ogrenciler"><strong>${ogrSay.count || 0}</strong><span>kayıtlı öğrenci</span></a>
      </div>
      ${bekleme.length ? `<div class="mesaj uyari"><strong>Bekleme listesi:</strong> ${bekleme.map((b) => `${esc(b.ogrenci?.ad_soyad)} (${esc(b.paket?.ad)})`).join(', ')}. Öğrenciler sayfasından elle yerleştirebilir ya da yeni oda açabilirsiniz.</div>` : ''}
      <div class="iki-sutun">
        <section class="kart"><h2>Bugünkü seanslar</h2>
          ${bugunSeans.length ? bugunSeans.map((s) => `<div class="seans-satir">
            <div class="seans-tarih" style="--renk:${esc(s.oda.renk)}"><strong>${saat(s.baslangic)}</strong><span>${saat(s.bitis)}</span></div>
            <div><strong>${esc(s.oda.ad)}</strong> ${s.durum !== 'planli' ? etiket(s.durum) : ''} ${s.telafi_mi ? '<span class="etiket">telafi</span>' : ''}<br>
              <span class="soluk kucuk">${aktifRez(s).map((r) => esc(r.ogrenci.ad_soyad)).join(', ') || 'Öğrenci yok'}</span><br>
              <span class="kucuk">${odevSay.filter((o) => o.seans_id === s.id).length} ödev yüklendi</span></div>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap">${meet[s.oda.id] ? `<a class="dugme kucuk ikincil" href="${esc(meet[s.oda.id])}" target="_blank" rel="noopener noreferrer">Meet</a>` : ''}
              <a class="dugme kucuk" href="#seanslar/${s.id}">Yoklama</a></div></div>`).join('') : '<p class="soluk">Bugün seans yok.</p>'}
        </section>
        <section class="kart"><div class="kart-ust"><h2>Bildirimler</h2>${bildirim.some((b) => !b.okundu) ? '<button class="dugme kucuk ikincil" id="okundu">Okundu say</button>' : ''}</div>
          ${bildirim.length ? `<ul class="bildirim-liste">${bildirim.map((b) => `<li class="${b.okundu ? '' : 'yeni'}"><strong>${esc(b.baslik)}</strong><br>${esc(b.icerik)}<br>
            <span class="soluk kucuk">${tarihSaat(b.olusturuldu)}</span>${b.baglanti?.startsWith('/yonetim/') ? ` <a class="kucuk" href="#${esc(b.baglanti.split('/')[2])}">Aç</a>` : ''}</li>`).join('')}</ul>` : '<p class="soluk">Bildirim yok.</p>'}
        </section>
      </div>`;
    $('#okundu')?.addEventListener('click', (e) => islem(e.currentTarget, async () => {
      await al(sb.from('bildirimler').update({ okundu: true }).eq('kullanici_id', ben.id).eq('okundu', false));
      kabuk.yenile();
    }));
  }

  // =========================================================
  // Ödemeler
  // =========================================================
  async function odemeler(kap, [filtre = 'bildirildi']) {
    let q = sb.from('siparisler').select('*, veli:profiller!siparisler_veli_id_fkey(ad_soyad,telefon,eposta), ogrenci:ogrenciler(ad_soyad,sinif), paket:paketler(ad,tur), tercih:odalar(ad)')
      .order('olusturuldu', { ascending: false }).limit(200);
    if (filtre !== 'tumu') q = q.eq('durum', filtre);
    const liste = await al(q);
    const filtreler = ['bildirildi', 'bekliyor', 'onaylandi', 'reddedildi', 'iptal', 'tumu'];
    kap.innerHTML = ust('Ödemeler') + `
      <p class="soluk">Banka hesabınıza gelen havaleleri sipariş koduyla eşleştirip onaylayın. Onayladığınızda öğrenci otomatik olarak odaya yerleşir veya kredisi yüklenir.</p>
      <div class="filtre" role="group" aria-label="Duruma göre süz">${filtreler.map((f) => `<a class="cip" href="#odemeler/${f}" aria-pressed="${f === filtre}">${f === 'tumu' ? 'Tümü' : DURUM_ADI[f]}</a>`).join('')}</div>
      ${liste.length ? `<div class="tablo-kap"><table class="tablo mobil-kart"><thead><tr><th>Kod</th><th>Veli</th><th>Öğrenci</th><th>Paket</th><th>Tutar</th><th>Durum</th><th></th></tr></thead><tbody>
        ${liste.map((s) => `<tr>
          <td data-b="Kod"><strong>${esc(s.kod)}</strong><br><span class="soluk kucuk">${tarihKisa(s.olusturuldu)}</span></td>
          <td data-b="Veli">${esc(s.veli?.ad_soyad)}<br><span class="soluk kucuk">${esc(s.veli?.telefon || s.veli?.eposta || '')}</span></td>
          <td data-b="Öğrenci">${esc(s.ogrenci?.ad_soyad)} <span class="soluk kucuk">${s.ogrenci?.sinif}. sınıf</span></td>
          <td data-b="Paket">${esc(s.paket?.ad)}${s.tercih ? `<br><span class="soluk kucuk">tercih: ${esc(s.tercih.ad)}</span>` : ''}</td>
          <td data-b="Tutar"><strong>${tl(s.tutar)}</strong>${s.gonderen_ad ? `<br><span class="soluk kucuk">gönderen: ${esc(s.gonderen_ad)}</span>` : ''}</td>
          <td data-b="Durum">${etiket(s.durum)}${s.sonuc_notu ? `<br><span class="soluk kucuk">${esc(s.sonuc_notu)}</span>` : ''}${s.yonetici_notu ? `<br><span class="soluk kucuk">not: ${esc(s.yonetici_notu)}</span>` : ''}</td>
          <td class="islem">${s.dekont_yolu ? `<button class="dugme kucuk sade" data-dekont="${esc(s.dekont_yolu)}">Dekont</button>` : ''}
            ${['bekliyor', 'bildirildi', 'reddedildi'].includes(s.durum) ? `<button class="dugme kucuk" data-onayla="${s.id}">Onayla</button><button class="dugme kucuk ikincil tehlike" data-reddet="${s.id}">Reddet</button>` : ''}</td>
        </tr>`).join('')}</tbody></table></div>` : '<div class="bos"><p>Bu durumda sipariş yok.</p></div>'}`;

    $$('[data-dekont]', kap).forEach((b) => b.addEventListener('click', () => islem(b, async () => window.open(await imzaliUrl('dekontlar', b.dataset.dekont), '_blank', 'noopener'))));
    $$('[data-onayla]', kap).forEach((b) => b.addEventListener('click', () => {
      const s = liste.find((x) => x.id === b.dataset.onayla);
      dialogAc(`<form class="dialog-ic"><h2>Ödemeyi onayla</h2>
        <p><strong>${esc(s.kod)}</strong>, ${tl(s.tutar)}<br>${esc(s.ogrenci?.ad_soyad)}: ${esc(s.paket?.ad)}</p>
        <p class="soluk kucuk">Hesabınıza ${tl(s.tutar)} tutarında, açıklamasında ${esc(s.kod)} yazan bir havale geldiğinden emin olun.</p>
        <div class="alan"><label for="on-not">Not <span class="soluk">(isteğe bağlı)</span></label><input id="on-not" name="not"></div>
        <div class="dialog-eylem"><button class="dugme ikincil" data-kapat>Vazgeç</button><button class="dugme" type="submit">Onayla ve yerleştir</button></div></form>`, (d) => {
        $('form', d).addEventListener('submit', (e) => {
          e.preventDefault();
          islem(e.submitter, async () => {
            const { data, error } = await sb.rpc('siparis_onayla', { p_siparis: s.id, p_not: e.currentTarget.not.value.trim() || null });
            if (error) throw error;
            d.close();
            toast(`Onaylandı. ${data?.sonuc || ''}`);
            sayaclar();
            kabuk.yenile();
          });
        });
      });
    }));
    $$('[data-reddet]', kap).forEach((b) => b.addEventListener('click', () => {
      const s = liste.find((x) => x.id === b.dataset.reddet);
      dialogAc(`<form class="dialog-ic"><h2>Ödemeyi reddet</h2><p>${esc(s.kod)}, ${tl(s.tutar)}</p>
        <div class="alan"><label for="red-not">Veliye gösterilecek açıklama</label><input id="red-not" name="not" required placeholder="Örneğin: Hesabımızda bu kodla bir havale göremedik"></div>
        <div class="dialog-eylem"><button class="dugme ikincil" data-kapat>Vazgeç</button><button class="dugme tehlike" type="submit">Reddet</button></div></form>`, (d) => {
        $('form', d).addEventListener('submit', (e) => {
          e.preventDefault();
          islem(e.submitter, async () => {
            const { error } = await sb.rpc('siparis_reddet', { p_siparis: s.id, p_not: e.currentTarget.not.value.trim() });
            if (error) throw error;
            d.close(); toast('Reddedildi, veliye bildirildi'); sayaclar(); kabuk.yenile();
          });
        });
      });
    }));
  }

  // =========================================================
  // Seanslar (haftalık) ve yoklama
  // =========================================================
  async function seanslar(kap, parametre) {
    if (parametre[0] && parametre[0].length > 20) return yoklama(kap, parametre[0]);
    const bas = parametre[0] || haftaBasi();
    const bit = gunEkle(bas, 6);
    const liste = await al(sb.from('seanslar').select(SEANS_SEC).gte('tarih', bas).lte('tarih', bit).order('baslangic'));
    const gunler = [...new Set(liste.map((s) => s.tarih))];
    kap.innerHTML = ust('Seanslar ve yoklama', `<a class="dugme kucuk ikincil" href="#seanslar/${gunEkle(bas, -7)}">Önceki hafta</a><a class="dugme kucuk ikincil" href="#seanslar">Bu hafta</a><a class="dugme kucuk ikincil" href="#seanslar/${gunEkle(bas, 7)}">Sonraki hafta</a>`) + `
      <p class="soluk">${tarih(bas + 'T12:00:00Z')} – ${tarih(bit + 'T12:00:00Z')}. Seanslar odaların gün ve saatlerine göre her gece 5 hafta ileriye kadar otomatik oluşturulur.</p>
      ${gunler.length ? gunler.map((g) => `<section class="kart"><h2>${gunAdi(g + 'T12:00:00+03:00')}, ${tarih(g + 'T12:00:00+03:00')}</h2>
        ${liste.filter((s) => s.tarih === g).map((s) => {
          const r = aktifRez(s);
          return `<div class="seans-satir"><div class="seans-tarih" style="--renk:${esc(s.oda.renk)}"><strong>${saat(s.baslangic)}</strong><span>${saat(s.bitis)}</span></div>
          <div><strong>${esc(s.oda.ad)}</strong> <span class="soluk">${r.length}/${s.oda.kapasite}</span> ${s.durum !== 'planli' ? etiket(s.durum) : ''} ${s.telafi_mi ? '<span class="etiket">telafi</span>' : ''}
            ${s.iptal_nedeni ? `<br><span class="soluk kucuk">İptal nedeni: ${esc(s.iptal_nedeni)}</span>` : ''}
            <br><span class="soluk kucuk">${r.map((x) => esc(x.ogrenci.ad_soyad)).join(', ') || 'Öğrenci yok'}</span></div>
          <div style="display:flex;gap:.4rem;flex-wrap:wrap">
            ${s.durum !== 'iptal' ? `<a class="dugme kucuk" href="#seanslar/${s.id}">Yoklama</a>` : ''}
            ${s.durum === 'planli' ? `<button class="dugme kucuk ikincil tehlike" data-iptal="${s.id}">İptal</button>` : ''}
            ${s.durum === 'iptal' ? `<button class="dugme kucuk ikincil" data-telafi="${s.id}">Telafi planla</button>` : ''}
          </div></div>`;
        }).join('')}</section>`).join('') : '<div class="bos"><p>Bu hafta seans yok.</p></div>'}`;

    $$('[data-iptal]', kap).forEach((b) => b.addEventListener('click', () => {
      dialogAc(`<form class="dialog-ic"><h2>Seansı iptal et</h2><p class="soluk">Bu seanstaki velilere bildirim gider, kredi ile gelenlerin kredisi iade edilir.</p>
        <div class="alan"><label for="ip-neden">İptal nedeni</label><input id="ip-neden" name="neden" required placeholder="Örneğin: Öğretmen rahatsızlığı"></div>
        <div class="dialog-eylem"><button class="dugme ikincil" data-kapat>Vazgeç</button><button class="dugme tehlike" type="submit">Seansı iptal et</button></div></form>`, (d) => {
        $('form', d).addEventListener('submit', (e) => {
          e.preventDefault();
          islem(e.submitter, async () => {
            const { data, error } = await sb.rpc('seans_iptal', { p_seans: b.dataset.iptal, p_neden: e.currentTarget.neden.value.trim() });
            if (error) throw error;
            d.close(); toast(`Seans iptal edildi, ${data} veliye bildirildi`); kabuk.yenile();
          });
        });
      });
    }));
    $$('[data-telafi]', kap).forEach((b) => b.addEventListener('click', () => {
      const s = liste.find((x) => x.id === b.dataset.telafi);
      dialogAc(`<form class="dialog-ic"><h2>Telafi seansı planla</h2><p class="soluk">${esc(s.oda.ad)} öğrencileri yeni seansa otomatik eklenir ve velilere bildirim gider.</p>
        <div class="satir"><div class="alan"><label for="tf-gun">Tarih</label><input id="tf-gun" name="gun" type="date" required min="${bugunISO()}"></div>
        <div class="alan"><label for="tf-saat">Başlangıç saati</label><input id="tf-saat" name="saat" type="time" required value="${saat(s.baslangic)}"></div></div>
        <div class="dialog-eylem"><button class="dugme ikincil" data-kapat>Vazgeç</button><button class="dugme" type="submit">Telafiyi oluştur</button></div></form>`, (d) => {
        $('form', d).addEventListener('submit', (e) => {
          e.preventDefault();
          const f = e.currentTarget;
          islem(e.submitter, async () => {
            const { error } = await sb.rpc('telafi_olustur', { p_seans: s.id, p_baslangic: istanbulISO(f.gun.value, f.saat.value) });
            if (error) throw error;
            d.close(); toast('Telafi seansı oluşturuldu'); kabuk.yenile();
          });
        });
      });
    }));
  }

  async function yoklama(kap, seansId) {
    const [s, devam, odev, tumOgr, meet] = await Promise.all([
      al(sb.from('seanslar').select(SEANS_SEC).eq('id', seansId).single()),
      al(sb.from('devam').select('*').eq('seans_id', seansId)),
      al(sb.from('odevler').select('*').eq('seans_id', seansId)),
      al(sb.from('ogrenciler').select('id,ad_soyad,sinif,notlar').eq('aktif', true).order('ad_soyad')),
      baglantilar(),
    ]);
    s.oda.meet_linki = meet[s.oda.id] || '';
    const r = aktifRez(s);
    const secenek = (ad, deger, liste) => `<select name="${ad}">${liste.map(([v, t]) => `<option value="${v}" ${deger === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
    kap.innerHTML = ust(`${s.oda.ad}, ${tarih(s.baslangic)} ${saat(s.baslangic)}`, `<a class="dugme kucuk ikincil" href="#seanslar/${haftaBasi(s.tarih)}">Haftaya dön</a>${s.oda.meet_linki ? `<a class="dugme kucuk" href="${esc(s.oda.meet_linki)}" target="_blank" rel="noopener noreferrer">Meet'i aç</a>` : ''}`) + `
      <p class="soluk">${gunAdi(s.baslangic)}, ${saat(s.baslangic)}–${saat(s.bitis)}. ${etiket(s.durum)} ${r.length}/${s.oda.kapasite} koltuk dolu.</p>
      <form id="yoklama-form" class="kart">
        ${r.length ? r.map((x) => {
          const d = devam.find((y) => y.ogrenci_id === x.ogrenci.id) || {};
          const od = odev.filter((o) => o.ogrenci_id === x.ogrenci.id);
          const not = tumOgr.find((o) => o.id === x.ogrenci.id)?.notlar;
          return `<fieldset class="yoklama-satir" data-ogrenci="${x.ogrenci.id}">
            <legend style="font-weight:800;font-family:var(--yazi-baslik);font-size:1.1rem">${esc(x.ogrenci.ad_soyad)} <span class="soluk kucuk" style="font-family:var(--yazi-govde);font-weight:400">${x.ogrenci.sinif}. sınıf, ${KAYNAK[x.kaynak] || x.kaynak}</span></legend>
            ${not ? `<p class="kucuk soluk" style="margin:0">Veli notu: ${esc(not)}</p>` : ''}
            ${od.length ? `<p class="kucuk" style="margin:0">Yüklenen ödev: ${od.map((o) => `<a href="#" data-dosya="${esc(o.dosya_yolu)}">${esc(o.dosya_adi || 'dosya')}</a>${o.not_metni ? ` (${esc(o.not_metni)})` : ''}`).join(', ')}</p>` : ''}
            <div class="satir">
              <div><label>Katılım</label>${secenek('durum', d.durum || 'V', [['V', 'Geldi'], ['Y', 'Gelmedi'], ['M', 'Mazeretli']])}</div>
              <div><label>Ödev</label>${secenek('odev_durumu', d.odev_durumu || '', [['', 'Seçilmedi'], ['Bitti', 'Bitti'], ['Kısmen', 'Kısmen'], ['Bitmedi', 'Bitmedi']])}</div>
              <div><label>Yardım sayısı</label><input type="number" name="yardim_sayisi" min="0" max="50" value="${d.yardim_sayisi ?? 0}"></div>
              <div><label>Ders</label><input name="ders" value="${esc(d.ders)}" placeholder="Matematik"></div>
            </div>
            <div><label>Öğretmen notu</label><textarea name="ogretmen_notu" style="min-height:64px" placeholder="Takıldığı yer, gözlem">${esc(d.ogretmen_notu)}</textarea></div>
            <div style="display:flex;gap:1.25rem;flex-wrap:wrap">
              <label class="onay"><input type="checkbox" name="veliye_ilet" ${d.veliye_ilet ? 'checked' : ''}> <span>Notu haftalık rapora ekle</span></label>
              <label class="onay"><input type="checkbox" name="ekran_goruntusu" ${d.ekran_goruntusu ? 'checked' : ''}> <span>Ekran görüntüsü alındı</span></label>
            </div>
          </fieldset>`;
        }).join('') : '<p class="soluk">Bu seansta öğrenci yok.</p>'}
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1rem">
          ${r.length ? '<button class="dugme" type="submit">Yoklamayı kaydet</button>' : ''}
          ${r.length && s.durum === 'planli' ? '<button class="dugme ikincil" type="button" id="tamamla">Kaydet ve seansı tamamla</button>' : ''}
        </div>
      </form>
      ${s.durum !== 'iptal' ? `<section class="kart"><h2>Seansa öğrenci ekle</h2>
        <form id="ekle-form" class="filtre" style="margin:0"><select name="ogrenci" required aria-label="Öğrenci">
          <option value="">Öğrenci seçin</option>${tumOgr.filter((o) => !r.some((x) => x.ogrenci.id === o.id)).map((o) => `<option value="${o.id}">${esc(o.ad_soyad)} (${o.sinif}. sınıf)</option>`).join('')}</select>
          <button class="dugme kucuk" type="submit">Ekle</button></form>
        <p class="soluk kucuk" style="margin:.5rem 0 0">Kredi düşmeden, yönetici kaydı olarak eklenir.</p></section>` : ''}`;

    $$('[data-dosya]', kap).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); islem(null, async () => window.open(await imzaliUrl('odevler', a.dataset.dosya), '_blank', 'noopener')); }));
    const kaydet = async (tamamla) => {
      const satirlar = $$('[data-ogrenci]', kap).map((fs) => {
        const v = (n) => fs.querySelector(`[name=${n}]`);
        return {
          seans_id: seansId, ogrenci_id: fs.dataset.ogrenci, durum: v('durum').value,
          odev_durumu: v('odev_durumu').value || null, yardim_sayisi: Number(v('yardim_sayisi').value || 0),
          ders: v('ders').value.trim(), ogretmen_notu: v('ogretmen_notu').value.trim(),
          veliye_ilet: v('veliye_ilet').checked, ekran_goruntusu: v('ekran_goruntusu').checked, guncellendi: new Date().toISOString(),
        };
      });
      await al(sb.from('devam').upsert(satirlar, { onConflict: 'seans_id,ogrenci_id' }));
      if (tamamla) await al(sb.from('seanslar').update({ durum: 'tamamlandi' }).eq('id', seansId));
      toast(tamamla ? 'Yoklama kaydedildi, seans tamamlandı' : 'Yoklama kaydedildi');
      if (tamamla) kabuk.yenile();
    };
    $('#yoklama-form').addEventListener('submit', (e) => { e.preventDefault(); islem(e.submitter, () => kaydet(false)); });
    $('#tamamla')?.addEventListener('click', (e) => islem(e.currentTarget, () => kaydet(true)));
    $('#ekle-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      islem(e.submitter, async () => {
        await al(sb.from('rezervasyonlar').upsert({ seans_id: seansId, ogrenci_id: e.currentTarget.ogrenci.value, kaynak: 'yonetici', durum: 'aktif' }, { onConflict: 'seans_id,ogrenci_id' }));
        toast('Öğrenci eklendi'); kabuk.yenile();
      });
    });
  }

  // =========================================================
  // Öğrenciler
  // =========================================================
  async function ogrenciler(kap) {
    const [liste, kayitlar, kredi, odaL] = await Promise.all([
      ogrencilerAl(),
      al(sb.from('kayitlar').select('id,ogrenci_id,gunler,baslangic,bitis,oda:odalar(ad,renk,baslangic)').eq('aktif', true)),
      al(sb.from('kredi_hareketleri').select('ogrenci_id,miktar')),
      odalarAl(),
    ]);
    const bakiye = {};
    kredi.forEach((k) => { bakiye[k.ogrenci_id] = (bakiye[k.ogrenci_id] || 0) + k.miktar; });
    kap.innerHTML = ust('Öğrenciler') + `
      <div class="filtre"><input type="search" id="ara" placeholder="İsim veya veli ara" aria-label="Ara" style="min-width:240px">
        <label class="onay" style="margin:0"><input type="checkbox" id="pasif"> <span>Pasif öğrencileri göster</span></label></div>
      <div class="tablo-kap"><table class="tablo mobil-kart"><thead><tr><th>Öğrenci</th><th>Veli</th><th>Odası</th><th>Kredi</th><th></th></tr></thead><tbody id="ogr-govde">
      ${liste.map((o) => {
        const k = kayitlar.filter((x) => x.ogrenci_id === o.id);
        return `<tr data-ara="${esc((o.ad_soyad + ' ' + (o.veli?.ad_soyad || '') + ' ' + (o.veli?.telefon || '')).toLocaleLowerCase('tr-TR'))}" data-aktif="${o.aktif}" ${o.aktif ? '' : 'hidden'}>
          <td data-b="Öğrenci"><strong>${esc(o.ad_soyad)}</strong> ${o.aktif ? '' : '<span class="etiket iptal">pasif</span>'}<br><span class="soluk kucuk">${o.sinif}. sınıf${o.okul ? ', ' + esc(o.okul) : ''}</span>${o.notlar ? `<br><span class="kucuk">${esc(o.notlar)}</span>` : ''}</td>
          <td data-b="Veli">${esc(o.veli?.ad_soyad)}<br><span class="soluk kucuk">${esc(o.veli?.telefon || '')} ${esc(o.veli?.eposta || '')}</span></td>
          <td data-b="Odası">${k.length ? k.map((x) => `<div>${odaNokta(x.oda.renk)}${esc(x.oda.ad)} <span class="soluk kucuk">${x.gunler.map((g) => GUN_KISA[g]).join(' ')}, ${tarihKisa(x.bitis + 'T12:00:00Z')}'e kadar</span>
            <button class="dugme kucuk sade" data-kapat-kayit="${x.id}" title="Kaydı kapat">Kapat</button></div>`).join('') : '<span class="soluk">Kayıt yok</span>'}</td>
          <td data-b="Kredi"><strong>${bakiye[o.id] || 0}</strong></td>
          <td class="islem"><button class="dugme kucuk" data-yerlestir="${o.id}">Odaya yerleştir</button><button class="dugme kucuk ikincil" data-kredi="${o.id}">Kredi</button>
            <button class="dugme kucuk sade" data-aktif="${o.id}">${o.aktif ? 'Pasif yap' : 'Aktif yap'}</button></td></tr>`;
      }).join('')}</tbody></table></div>
      ${liste.length ? '' : '<div class="bos" style="margin-top:1rem"><p>Henüz öğrenci yok. Veliler üye olup çocuklarını eklediğinde burada görünür.</p></div>'}`;

    const suz = () => {
      const t = $('#ara').value.toLocaleLowerCase('tr-TR').trim();
      const p = $('#pasif').checked;
      $$('#ogr-govde tr').forEach((tr) => { tr.hidden = (!p && tr.dataset.aktif === 'false') || (t && !tr.dataset.ara.includes(t)); });
    };
    $('#ara').addEventListener('input', suz);
    $('#pasif').addEventListener('change', suz);

    $$('[data-yerlestir]', kap).forEach((b) => b.addEventListener('click', () => {
      const o = liste.find((x) => x.id === b.dataset.yerlestir);
      const uygun = odaL.filter((x) => x.aktif);
      dialogAc(`<form class="dialog-ic"><h2>${esc(o.ad_soyad)} odaya yerleştir</h2>
        <p class="soluk kucuk">Seçilen tarih aralığında odanın seçili günlerindeki tüm seanslara koltuk ayrılır. Kapasite kontrolü yapılmaz; doluluğu kontrol edin.</p>
        <div class="alan"><label for="y-oda">Oda</label><select id="y-oda" name="oda" required>${uygun.map((x) => `<option value="${x.id}">${esc(x.ad)}, ${x.gunler.map((g) => GUN_KISA[g]).join(' ')} ${saatKes(x.baslangic)}</option>`).join('')}</select></div>
        <div class="alan"><label>Günler</label><div class="gunler-sec" id="y-gunler"></div></div>
        <div class="satir"><div class="alan"><label for="y-bas">Başlangıç</label><input id="y-bas" name="bas" type="date" required value="${bugunISO()}"></div>
        <div class="alan"><label for="y-bit">Bitiş</label><input id="y-bit" name="bit" type="date" required value="${bugunISO(30)}"></div></div>
        <div class="dialog-eylem"><button class="dugme ikincil" data-kapat>Vazgeç</button><button class="dugme" type="submit">Yerleştir</button></div></form>`, (d) => {
        const f = $('form', d);
        const gunCiz = () => {
          const oda = uygun.find((x) => x.id === f.oda.value);
          $('#y-gunler', d).innerHTML = (oda?.gunler || []).map((g) => `<label><input type="checkbox" name="gun" value="${g}" checked> ${GUN_ADLARI[g]}</label>`).join('');
        };
        f.oda.addEventListener('change', gunCiz); gunCiz();
        f.addEventListener('submit', (e) => {
          e.preventDefault();
          const gunler = $$('[name=gun]:checked', f).map((x) => Number(x.value));
          if (!gunler.length) { toast('En az bir gün seçin', true); return; }
          islem(e.submitter, async () => {
            const { error } = await sb.rpc('yonetici_kayit_ekle', { p_ogrenci: o.id, p_oda: f.oda.value, p_bas: f.bas.value, p_bit: f.bit.value, p_gunler: gunler });
            if (error) throw error;
            d.close(); toast('Öğrenci yerleştirildi, veliye bildirildi'); kabuk.yenile();
          });
        });
      });
    }));
    $$('[data-kredi]', kap).forEach((b) => b.addEventListener('click', () => {
      const o = liste.find((x) => x.id === b.dataset.kredi);
      dialogAc(`<form class="dialog-ic"><h2>${esc(o.ad_soyad)} kredi</h2><p>Mevcut bakiye: <strong>${bakiye[o.id] || 0}</strong></p>
        <div class="satir"><div class="alan"><label for="kr-m">Miktar</label><input id="kr-m" name="miktar" type="number" required value="1"><small>Düşmek için eksi yazın.</small></div>
        <div class="alan"><label for="kr-n">Neden</label><input id="kr-n" name="neden" required value="Yönetici düzeltmesi"></div></div>
        <div class="dialog-eylem"><button class="dugme ikincil" data-kapat>Vazgeç</button><button class="dugme" type="submit">Kaydet</button></div></form>`, (d) => {
        $('form', d).addEventListener('submit', (e) => {
          e.preventDefault();
          const f = e.currentTarget;
          islem(e.submitter, async () => {
            await al(sb.from('kredi_hareketleri').insert({ ogrenci_id: o.id, miktar: Number(f.miktar.value), neden: f.neden.value.trim() }));
            d.close(); toast('Kredi güncellendi'); kabuk.yenile();
          });
        });
      });
    }));
    $$('[data-kapat-kayit]', kap).forEach((b) => b.addEventListener('click', async () => {
      if (!(await onayla('Bu kaydı bugünden itibaren kapatmak istiyor musunuz? Gelecekteki koltuklar boşalır.', 'Kaydı kapat', true))) return;
      islem(b, async () => {
        const { data, error } = await sb.rpc('yonetici_kayit_kapat', { p_kayit: b.dataset.kapatKayit });
        if (error) throw error;
        toast(`Kayıt kapatıldı, ${data} koltuk boşaldı`); kabuk.yenile();
      });
    }));
    $$('[data-aktif]', kap).forEach((b) => b.addEventListener('click', () => islem(b, async () => {
      const o = liste.find((x) => x.id === b.dataset.aktif);
      await al(sb.from('ogrenciler').update({ aktif: !o.aktif }).eq('id', o.id));
      kabuk.yenile();
    })));
  }

  // =========================================================
  // Veliler
  // =========================================================
  async function veliler(kap) {
    const [liste, ogr] = await Promise.all([
      al(sb.from('profiller').select('*').order('olusturuldu', { ascending: false })),
      al(sb.from('ogrenciler').select('veli_id,ad_soyad,sinif')),
    ]);
    kap.innerHTML = ust('Veliler') + `<div class="tablo-kap"><table class="tablo mobil-kart"><thead><tr><th>Ad soyad</th><th>Telefon</th><th>E-posta</th><th>Çocuklar</th><th>Üyelik</th></tr></thead><tbody>
      ${liste.map((p) => `<tr><td data-b="Ad soyad"><strong>${esc(p.ad_soyad || '—')}</strong> ${p.rol === 'admin' ? '<span class="etiket">yönetici</span>' : ''}</td>
        <td data-b="Telefon">${p.telefon ? `<a href="tel:${esc(p.telefon.replace(/\s/g, ''))}">${esc(p.telefon)}</a>` : '—'}</td>
        <td data-b="E-posta"><a href="mailto:${esc(p.eposta)}">${esc(p.eposta)}</a></td>
        <td data-b="Çocuklar">${ogr.filter((o) => o.veli_id === p.id).map((o) => `${esc(o.ad_soyad)} (${o.sinif})`).join(', ') || '—'}</td>
        <td data-b="Üyelik">${tarihKisa(p.olusturuldu)}</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  // =========================================================
  // Odalar
  // =========================================================
  function odaDialog(o) {
    const gun = o?.gunler || [1, 2, 3, 4];
    dialogAc(`<form class="dialog-ic"><h2>${o ? 'Odayı düzenle' : 'Yeni oda'}</h2>
      <div class="satir"><div class="alan"><label for="od-ad">Oda adı</label><input id="od-ad" name="ad" required value="${esc(o?.ad)}"></div>
        <div class="alan"><label for="od-tur">Tür</label><select id="od-tur" name="tur"><option value="hafta_ici" ${o?.tur !== 'hafta_sonu' ? 'selected' : ''}>Hafta içi ödev odası</option><option value="hafta_sonu" ${o?.tur === 'hafta_sonu' ? 'selected' : ''}>Hafta sonu genel tekrar</option></select></div></div>
      <div class="alan"><label>Günler</label><div class="gunler-sec">${[1, 2, 3, 4, 5, 6, 7].map((g) => `<label><input type="checkbox" name="gunler" value="${g}" ${gun.includes(g) ? 'checked' : ''}> ${GUN_KISA[g]}</label>`).join('')}</div></div>
      <div class="satir"><div class="alan"><label for="od-bas">Başlangıç</label><input id="od-bas" name="baslangic" type="time" required value="${saatKes(o?.baslangic) || '17:00'}"></div>
        <div class="alan"><label for="od-bit">Bitiş</label><input id="od-bit" name="bitis" type="time" required value="${saatKes(o?.bitis) || '18:00'}"></div>
        <div class="alan"><label for="od-kap">Kapasite</label><input id="od-kap" name="kapasite" type="number" min="1" max="30" required value="${o?.kapasite ?? 4}"></div></div>
      <div class="satir"><div class="alan"><label for="od-smin">En küçük sınıf</label><input id="od-smin" name="sinif_min" type="number" min="1" max="8" value="${o?.sinif_min ?? 1}"></div>
        <div class="alan"><label for="od-smax">En büyük sınıf</label><input id="od-smax" name="sinif_max" type="number" min="1" max="8" value="${o?.sinif_max ?? 4}"></div>
        <div class="alan"><label for="od-renk">Renk</label><input id="od-renk" name="renk" type="color" value="${esc(o?.renk || '#1F5F6B')}"></div></div>
      <div class="alan"><label for="od-meet">Google Meet bağlantısı</label><input id="od-meet" name="meet_linki" type="url" placeholder="https://meet.google.com/..." value="${esc(o?.meet_linki)}"></div>
      <div class="satir"><div class="alan"><label for="od-og">Öğretmen</label><input id="od-og" name="ogretmen" value="${esc(o?.ogretmen || 'Kurucu')}"></div>
        <div class="alan"><label for="od-sira">Sıra</label><input id="od-sira" name="sira" type="number" value="${o?.sira ?? 0}"></div></div>
      <label class="onay"><input type="checkbox" name="aktif" ${o?.aktif === false ? '' : 'checked'}> <span>Aktif (sitede görünür, seansları üretilir)</span></label>
      <p class="soluk kucuk">Gün veya saat değişikliğinde gelecek seanslar otomatik yeniden üretilir.</p>
      <div class="dialog-eylem"><button class="dugme ikincil" data-kapat>Vazgeç</button><button class="dugme" type="submit">Kaydet</button></div></form>`, (d) => {
      $('form', d).addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.currentTarget;
        const v = formVeri(f);
        const kayit = {
          ad: v.ad.trim(), tur: v.tur, gunler: [].concat(v.gunler || []).map(Number), baslangic: v.baslangic, bitis: v.bitis,
          kapasite: Number(v.kapasite), sinif_min: Number(v.sinif_min), sinif_max: Number(v.sinif_max), renk: v.renk,
          ogretmen: v.ogretmen.trim(), sira: Number(v.sira), aktif: !!f.aktif.checked,
        };
        const meetYeni = v.meet_linki.trim().replace(/\?.*$/, '');
        if (meetYeni && !guvenliMeet(meetYeni)) { toast('Meet bağlantısı https://meet.google.com/abc-defg-hij biçiminde olmalı', true); return; }
        if (!kayit.gunler.length) { toast('En az bir gün seçin', true); return; }
        islem(e.submitter, async () => {
          let odaId = o?.id;
          if (o) await al(sb.from('odalar').update(kayit).eq('id', o.id));
          else odaId = (await al(sb.from('odalar').insert(kayit).select('id').single())).id;
          await al(sb.from('oda_baglanti').upsert({ oda_id: odaId, meet_linki: meetYeni }));
          d.close(); toast('Oda kaydedildi'); kabuk.yenile();
        });
      });
    });
  }

  async function odalar(kap) {
    const liste = await odalarAl();
    kap.innerHTML = ust('Odalar ve saatler', '<button class="dugme" id="yeni-oda">Yeni oda</button>') + `
      <div class="tablo-kap"><table class="tablo mobil-kart"><thead><tr><th>Oda</th><th>Günler</th><th>Saat</th><th>Kapasite</th><th>Sınıf</th><th>Meet</th><th></th></tr></thead><tbody>
      ${liste.map((o) => `<tr><td data-b="Oda">${odaNokta(o.renk)}<strong>${esc(o.ad)}</strong> ${o.aktif ? '' : '<span class="etiket iptal">pasif</span>'}<br><span class="soluk kucuk">${o.tur === 'hafta_sonu' ? 'Hafta sonu' : 'Hafta içi'}, ${esc(o.ogretmen)}</span></td>
        <td data-b="Günler">${o.gunler.map((g) => GUN_KISA[g]).join(' ')}</td><td data-b="Saat">${saatKes(o.baslangic)}–${saatKes(o.bitis)}</td>
        <td data-b="Kapasite">${o.kapasite}</td><td data-b="Sınıf">${o.sinif_min}–${o.sinif_max}</td>
        <td data-b="Meet">${o.meet_linki ? `<a href="${esc(o.meet_linki)}" target="_blank" rel="noopener noreferrer">${esc(o.meet_linki.replace('https://meet.google.com/', ''))}</a>` : '—'}</td>
        <td class="islem"><button class="dugme kucuk ikincil" data-duzenle="${o.id}">Düzenle</button></td></tr>`).join('')}
      </tbody></table></div>`;
    $('#yeni-oda').onclick = () => odaDialog(null);
    $$('[data-duzenle]', kap).forEach((b) => b.addEventListener('click', () => odaDialog(liste.find((o) => o.id === b.dataset.duzenle))));
  }

  // =========================================================
  // Paketler
  // =========================================================
  function paketDialog(p) {
    const gun = p?.hafta_ici_gunler || [];
    dialogAc(`<form class="dialog-ic"><h2>${p ? 'Paketi düzenle' : 'Yeni paket'}</h2>
      <div class="satir"><div class="alan"><label for="pk-ad">Paket adı</label><input id="pk-ad" name="ad" required value="${esc(p?.ad)}"></div>
        <div class="alan"><label for="pk-fiyat">Fiyat (TL)</label><input id="pk-fiyat" name="fiyat" type="number" min="0" step="1" required value="${p?.fiyat ?? ''}"></div></div>
      <div class="alan"><label for="pk-ac">Açıklama</label><textarea id="pk-ac" name="aciklama" style="min-height:70px">${esc(p?.aciklama)}</textarea></div>
      <div class="alan"><label for="pk-tur">Paket türü</label><select id="pk-tur" name="tur"><option value="abonelik" ${p?.tur !== 'kredi' ? 'selected' : ''}>Aylık (sabit koltuk)</option><option value="kredi" ${p?.tur === 'kredi' ? 'selected' : ''}>Seans kredisi</option></select></div>
      <div id="pk-abon"><div class="alan"><label>Hafta içi günler</label><div class="gunler-sec">${[1, 2, 3, 4, 5].map((g) => `<label><input type="checkbox" name="gunler" value="${g}" ${gun.includes(g) ? 'checked' : ''}> ${GUN_KISA[g]}</label>`).join('')}</div></div>
        <label class="onay alan"><input type="checkbox" name="hafta_sonu" ${p?.hafta_sonu ? 'checked' : ''}> <span>Cumartesi genel tekrar dahil</span></label></div>
      <div class="satir"><div class="alan" id="pk-kredi-alan"><label for="pk-kredi">Kredi (seans)</label><input id="pk-kredi" name="kredi" type="number" min="0" value="${p?.kredi ?? 0}"></div>
        <div class="alan"><label for="pk-sure">Geçerlilik (gün)</label><input id="pk-sure" name="sure_gun" type="number" min="1" value="${p?.sure_gun ?? 30}"></div>
        <div class="alan"><label for="pk-sira">Sıra</label><input id="pk-sira" name="sira" type="number" value="${p?.sira ?? 0}"></div></div>
      <label class="onay"><input type="checkbox" name="aktif" ${p?.aktif === false ? '' : 'checked'}> <span>Satışta</span></label>
      <div class="dialog-eylem"><button class="dugme ikincil" data-kapat>Vazgeç</button><button class="dugme" type="submit">Kaydet</button></div></form>`, (d) => {
      const f = $('form', d);
      const tur = () => { $('#pk-abon', d).hidden = f.tur.value === 'kredi'; $('#pk-kredi-alan', d).hidden = f.tur.value !== 'kredi'; };
      f.tur.addEventListener('change', tur); tur();
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = formVeri(f);
        const kredi = v.tur === 'kredi';
        const kayit = {
          ad: v.ad.trim(), aciklama: v.aciklama.trim(), fiyat: Number(v.fiyat), tur: v.tur,
          hafta_ici_gunler: kredi ? [] : [].concat(v.gunler || []).map(Number), hafta_sonu: !kredi && !!f.hafta_sonu.checked,
          kredi: kredi ? Number(v.kredi) : 0, sure_gun: Number(v.sure_gun), sira: Number(v.sira), aktif: !!f.aktif.checked,
        };
        if (!kredi && !kayit.hafta_ici_gunler.length && !kayit.hafta_sonu) { toast('Aylık pakette en az bir gün veya Cumartesi seçin', true); return; }
        if (kredi && kayit.kredi < 1) { toast('Kredi en az 1 olmalı', true); return; }
        islem(e.submitter, async () => {
          if (p) await al(sb.from('paketler').update(kayit).eq('id', p.id));
          else await al(sb.from('paketler').insert(kayit));
          d.close(); toast('Paket kaydedildi'); kabuk.yenile();
        });
      });
    });
  }

  async function paketler(kap) {
    const liste = await al(sb.from('paketler').select('*').order('sira'));
    kap.innerHTML = ust('Paketler ve fiyatlar', '<button class="dugme" id="yeni-paket">Yeni paket</button>') + `
      <p class="soluk">Fiyat değişikliği yalnızca yeni siparişlere uygulanır.</p>
      <div class="tablo-kap"><table class="tablo mobil-kart"><thead><tr><th>Paket</th><th>Tür</th><th>İçerik</th><th>Fiyat</th><th></th></tr></thead><tbody>
      ${liste.map((p) => `<tr><td data-b="Paket"><strong>${esc(p.ad)}</strong> ${p.aktif ? '' : '<span class="etiket iptal">satışta değil</span>'}<br><span class="soluk kucuk">${esc(p.aciklama)}</span></td>
        <td data-b="Tür">${p.tur === 'kredi' ? 'Kredi' : 'Aylık'}</td>
        <td data-b="İçerik">${p.tur === 'kredi' ? `${p.kredi} seans` : [p.hafta_ici_gunler.map((g) => GUN_KISA[g]).join(' '), p.hafta_sonu ? 'Cmt' : ''].filter(Boolean).join(' + ')}, ${p.sure_gun} gün</td>
        <td data-b="Fiyat"><strong>${tl(p.fiyat)}</strong></td>
        <td class="islem"><button class="dugme kucuk ikincil" data-duzenle="${p.id}">Düzenle</button></td></tr>`).join('')}
      </tbody></table></div>`;
    $('#yeni-paket').onclick = () => paketDialog(null);
    $$('[data-duzenle]', kap).forEach((b) => b.addEventListener('click', () => paketDialog(liste.find((p) => p.id === b.dataset.duzenle))));
  }

  // =========================================================
  // Gelen ödevler
  // =========================================================
  async function odevler(kap) {
    const liste = await al(sb.from('odevler').select('*, ogrenci:ogrenciler(ad_soyad,sinif), seans:seanslar(baslangic, oda:odalar(ad,renk))').order('olusturuldu', { ascending: false }).limit(60));
    kap.innerHTML = ust('Gelen ödevler') + (liste.length ? `<div class="izgara">${liste.map((o) => `<div class="kart" data-yol="${esc(o.dosya_yolu)}">
        <div class="kart-ust"><div><strong>${esc(o.ogrenci?.ad_soyad)}</strong> <span class="soluk kucuk">${o.ogrenci?.sinif}. sınıf</span><br>
          <span class="soluk kucuk">${tarihSaat(o.olusturuldu)}</span></div>
          ${o.seans ? `<span class="kucuk">${odaNokta(o.seans.oda?.renk)}${esc(o.seans.oda?.ad)}, ${tarihKisa(o.seans.baslangic)} ${saat(o.seans.baslangic)}</span>` : '<span class="etiket">seans yok</span>'}</div>
        <div class="onizleme" style="margin-bottom:.5rem"></div>
        ${o.not_metni ? `<p class="kucuk">Veli notu: ${esc(o.not_metni)}</p>` : ''}
        <form data-geri="${o.id}"><label for="gb-${o.id}">Veliye geri bildirim</label><textarea id="gb-${o.id}" name="geri" style="min-height:60px">${esc(o.geri_bildirim)}</textarea>
          <button class="dugme kucuk" type="submit" style="margin-top:.5rem">Kaydet</button></form></div>`).join('')}</div>`
      : '<div class="bos"><p>Henüz ödev yüklenmedi.</p></div>');
    $$('[data-yol]', kap).forEach(async (k) => {
      try {
        const url = await imzaliUrl('odevler', k.dataset.yol);
        $('.onizleme', k).innerHTML = /\.pdf$/i.test(k.dataset.yol) ? `<a class="dugme kucuk ikincil" href="${esc(url)}" target="_blank" rel="noopener noreferrer">PDF'i aç</a>`
          : `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(url)}" alt="Ödev" loading="lazy" style="width:100%;max-height:260px;object-fit:contain;background:var(--kagit);border-radius:6px"></a>`;
      } catch {}
    });
    $$('[data-geri]', kap).forEach((f) => f.addEventListener('submit', (e) => {
      e.preventDefault();
      islem(e.submitter, async () => { await al(sb.from('odevler').update({ geri_bildirim: f.geri.value.trim() }).eq('id', f.dataset.geri)); toast('Geri bildirim kaydedildi'); });
    }));
  }

  // =========================================================
  // Duyurular
  // =========================================================
  async function duyurular(kap) {
    const [liste, odaL] = await Promise.all([al(sb.from('duyurular').select('*, oda:odalar(ad,renk)').order('olusturuldu', { ascending: false })), odalarAl()]);
    const dlg = (x) => dialogAc(`<form class="dialog-ic"><h2>${x ? 'Duyuruyu düzenle' : 'Yeni duyuru'}</h2>
      <div class="alan"><label for="du-b">Başlık</label><input id="du-b" name="baslik" required value="${esc(x?.baslik)}"></div>
      <div class="alan"><label for="du-i">Metin</label><textarea id="du-i" name="icerik" required>${esc(x?.icerik)}</textarea></div>
      <div class="alan"><label for="du-o">Kimler görsün</label><select id="du-o" name="oda_id"><option value="">Tüm veliler</option>${odaL.map((o) => `<option value="${o.id}" ${x?.oda_id === o.id ? 'selected' : ''}>Yalnızca ${esc(o.ad)} velileri</option>`).join('')}</select></div>
      <label class="onay"><input type="checkbox" name="yayinda" ${x?.yayinda === false ? '' : 'checked'}> <span>Yayında (yeni yayınlanınca velilere bildirim gider)</span></label>
      <label class="onay"><input type="checkbox" name="sabit" ${x?.sabit ? 'checked' : ''}> <span>Veli panelinin üstüne sabitle</span></label>
      <div class="dialog-eylem"><button class="dugme ikincil" data-kapat>Vazgeç</button><button class="dugme" type="submit">Kaydet</button></div></form>`, (d) => {
      $('form', d).addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.currentTarget;
        const kayit = { baslik: f.baslik.value.trim(), icerik: f.icerik.value.trim(), oda_id: f.oda_id.value || null, yayinda: f.yayinda.checked, sabit: f.sabit.checked };
        islem(e.submitter, async () => {
          if (x) await al(sb.from('duyurular').update(kayit).eq('id', x.id));
          else await al(sb.from('duyurular').insert({ ...kayit, olusturan: ben.id }));
          d.close(); toast('Duyuru kaydedildi'); kabuk.yenile();
        });
      });
    });
    kap.innerHTML = ust('Duyurular', '<button class="dugme" id="yeni-duyuru">Yeni duyuru</button>') + (liste.length ? liste.map((x) => `<article class="kart">
      <div class="kart-ust"><div><h2>${esc(x.baslik)}</h2><span class="soluk kucuk">${tarihSaat(x.olusturuldu)}, ${x.oda ? `${odaNokta(x.oda.renk)}${esc(x.oda.ad)} velileri` : 'tüm veliler'}</span>
        ${x.yayinda ? '' : ' <span class="etiket">taslak</span>'} ${x.sabit ? '<span class="etiket bildirildi">sabit</span>' : ''}</div>
        <div><button class="dugme kucuk ikincil" data-duzenle="${x.id}">Düzenle</button> <button class="dugme kucuk sade" data-sil="${x.id}">Sil</button></div></div>
      <p style="white-space:pre-line;margin:0">${esc(x.icerik)}</p></article>`).join('') : '<div class="bos"><p>Henüz duyuru yok.</p></div>');
    $('#yeni-duyuru').onclick = () => dlg(null);
    $$('[data-duzenle]', kap).forEach((b) => b.addEventListener('click', () => dlg(liste.find((x) => x.id === b.dataset.duzenle))));
    $$('[data-sil]', kap).forEach((b) => b.addEventListener('click', async () => {
      if (!(await onayla('Bu duyuru silinsin mi?', 'Sil', true))) return;
      islem(b, async () => { await al(sb.from('duyurular').delete().eq('id', b.dataset.sil)); kabuk.yenile(); });
    }));
  }

  // =========================================================
  // Haftalık raporlar
  // =========================================================
  async function raporlar(kap, [hafta]) {
    const bas = hafta || haftaBasi();
    const liste = await al(sb.from('haftalik_raporlar').select('*, ogrenci:ogrenciler(ad_soyad,sinif)').eq('hafta_baslangic', bas).order('olusturuldu'));
    kap.innerHTML = ust('Haftalık raporlar', `<a class="dugme kucuk ikincil" href="#raporlar/${gunEkle(bas, -7)}">Önceki hafta</a><a class="dugme kucuk ikincil" href="#raporlar/${gunEkle(bas, 7)}">Sonraki hafta</a><button class="dugme kucuk" id="uret">Taslakları oluştur</button>`) + `
      <p class="soluk">${tarih(bas + 'T12:00:00Z')} haftası. Taslaklar her Cuma 15:00'te yoklama verisinden otomatik oluşur. Yorumları yazıp yayınladığınızda veliye bildirim gider.</p>
      ${liste.length ? liste.map((r) => {
        const i = r.istatistik || {};
        return `<form class="kart" data-rapor="${r.id}">
          <div class="kart-ust"><div><h2>${esc(r.ogrenci?.ad_soyad)}</h2><span class="soluk kucuk">${r.ogrenci?.sinif}. sınıf</span></div>${r.yayinda ? `<span class="etiket onaylandi">yayında</span>` : '<span class="etiket bekliyor">taslak</span>'}</div>
          <p class="kucuk">Katıldı ${i.katildi ?? 0}/${i.planlanan ?? 0}, bitti ${i.bitti ?? 0}, kısmen ${i.kismen ?? 0}, bitmedi ${i.bitmedi ?? 0}, ortalama yardım ${i.yardim_ort ?? '–'}</p>
          ${(i.notlar || []).length ? `<ul class="kucuk soluk">${i.notlar.map((n) => `<li>${esc(n.tarih)} ${esc(n.ders || '')}: ${esc(n.not)}</li>`).join('')}</ul>` : ''}
          <div class="satir">
            <div class="alan"><label>İyi gidenler</label><textarea name="iyi_gidenler">${esc(r.iyi_gidenler)}</textarea></div>
            <div class="alan"><label>Takıldığı konular</label><textarea name="takildigi_konular">${esc(r.takildigi_konular)}</textarea></div>
            <div class="alan"><label>Evde destek</label><textarea name="evde_destek">${esc(r.evde_destek)}</textarea></div>
            <div class="alan"><label>Gelecek hafta</label><textarea name="gelecek_hafta">${esc(r.gelecek_hafta)}</textarea></div>
          </div>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap"><button class="dugme ikincil" type="submit" value="kaydet">Kaydet</button>
            ${r.yayinda ? '<button class="dugme sade" type="submit" value="kaldir">Yayından kaldır</button>' : '<button class="dugme" type="submit" value="yayinla">Kaydet ve yayınla</button>'}</div>
        </form>`;
      }).join('') : '<div class="bos"><p>Bu hafta için rapor taslağı yok. Seanslar yapıldıysa "Taslakları oluştur" ile hazırlayın.</p></div>'}`;
    $('#uret').addEventListener('click', (e) => islem(e.currentTarget, async () => {
      const { data, error } = await sb.rpc('haftalik_raporlari_uret', { p_hafta: bas });
      if (error) throw error;
      toast(`${data} rapor taslağı hazırlandı`); sayaclar(); kabuk.yenile();
    }));
    $$('[data-rapor]', kap).forEach((f) => f.addEventListener('submit', (e) => {
      e.preventDefault();
      const eylem = e.submitter?.value;
      const v = formVeri(f);
      const kayit = { iyi_gidenler: v.iyi_gidenler, takildigi_konular: v.takildigi_konular, evde_destek: v.evde_destek, gelecek_hafta: v.gelecek_hafta };
      if (eylem === 'yayinla') Object.assign(kayit, { yayinda: true, yayin_tarihi: new Date().toISOString() });
      if (eylem === 'kaldir') kayit.yayinda = false;
      islem(e.submitter, async () => {
        await al(sb.from('haftalik_raporlar').update(kayit).eq('id', f.dataset.rapor));
        toast(eylem === 'yayinla' ? 'Rapor yayınlandı, veliye bildirildi' : 'Kaydedildi');
        if (eylem !== 'kaydet') { sayaclar(); kabuk.yenile(); }
      });
    }));
  }

  // =========================================================
  // Ayarlar
  // =========================================================
  async function ayarlarSayfa(kap) {
    const [a, tatil, yon] = await Promise.all([
      al(sb.from('ayarlar').select('*').eq('id', 1).single()),
      al(sb.from('tatiller').select('*').gte('tarih', bugunISO(-30)).order('tarih')),
      al(sb.from('yonetici_epostalari').select('*').order('eposta')),
    ]);
    kap.innerHTML = ust('Ayarlar') + `
      <form class="kart" id="odeme-form"><h2>Ödeme bilgileri</h2>
        <p class="soluk kucuk">Velilere sipariş oluşturduklarında bu bilgiler gösterilir.</p>
        <div class="satir"><div class="alan"><label for="a-sahip">Hesap sahibi</label><input id="a-sahip" name="hesap_sahibi" required value="${esc(a.hesap_sahibi)}"></div>
          <div class="alan"><label for="a-banka">Banka</label><input id="a-banka" name="banka" required value="${esc(a.banka)}"></div></div>
        <div class="alan"><label for="a-iban">IBAN</label><input id="a-iban" name="iban" required value="${esc(a.iban)}"><small>TR ile başlayan 26 karakter. Boşluklu ya da boşluksuz yazabilirsiniz.</small></div>
        <div class="alan"><label for="a-not">Ödeme notu</label><input id="a-not" name="odeme_notu" value="${esc(a.odeme_notu)}"></div>
        <div class="satir"><div class="alan"><label for="a-marka">Marka adı</label><input id="a-marka" name="marka" value="${esc(a.marka)}"></div>
          <div class="alan"><label for="a-tel">İletişim telefonu</label><input id="a-tel" name="iletisim_telefon" value="${esc(a.iletisim_telefon)}"></div>
          <div class="alan"><label for="a-ep">İletişim e-postası</label><input id="a-ep" name="iletisim_eposta" type="email" value="${esc(a.iletisim_eposta)}"></div></div>
        <h2 style="margin-top:1rem">Rezervasyon kuralları</h2>
        <div class="satir"><div class="alan"><label for="a-dk">Anlık kayıtta en az kaç dakika sonrası</label><input id="a-dk" name="rezervasyon_min_dakika" type="number" min="0" value="${a.rezervasyon_min_dakika}"></div>
          <div class="alan"><label for="a-iade">Kredi iadesi için en geç kaç saat önce iptal</label><input id="a-iade" name="kredi_iade_saat" type="number" min="0" value="${a.kredi_iade_saat}"></div></div>
        <button class="dugme" type="submit">Kaydet</button></form>

      <div class="iki-sutun">
        <section class="kart"><h2>Tatil günleri</h2><p class="soluk kucuk">Tatil günlerinde seans üretilmez. Eklerken o günün seanslarını iptal edip velilere bildirebilirsiniz.</p>
          ${tatil.length ? `<ul class="bildirim-liste">${tatil.map((t) => `<li style="display:flex;justify-content:space-between;gap:1rem"><span><strong>${tarih(t.tarih + 'T12:00:00Z')}</strong> ${esc(t.aciklama)}</span><button class="dugme kucuk sade" data-tatil-sil="${t.tarih}">Kaldır</button></li>`).join('')}</ul>` : '<p class="soluk">Tatil günü yok.</p>'}
          <form id="tatil-form" style="margin-top:1rem"><div class="satir"><div class="alan"><label for="t-g">Tarih</label><input id="t-g" name="tarih" type="date" required></div>
            <div class="alan"><label for="t-a">Açıklama</label><input id="t-a" name="aciklama" required placeholder="Ara tatil"></div></div>
            <label class="onay alan"><input type="checkbox" name="iptal" checked> <span>O günün seanslarını iptal et ve velilere bildir</span></label>
            <button class="dugme kucuk" type="submit">Tatil ekle</button></form></section>
        <section class="kart"><h2>Yöneticiler</h2><p class="soluk kucuk">Bu adreslerle üye olan hesaplar yönetici olur. Zaten üye olan biri eklenirse hemen yönetici yapılır.</p>
          <ul class="bildirim-liste">${yon.map((y) => `<li style="display:flex;justify-content:space-between;gap:1rem"><span>${esc(y.eposta)}</span>${y.eposta === ben.eposta ? '<span class="soluk kucuk">siz</span>' : `<button class="dugme kucuk sade" data-yon-sil="${esc(y.eposta)}">Kaldır</button>`}</li>`).join('')}</ul>
          <form id="yon-form" class="filtre" style="margin-top:1rem"><input name="eposta" type="email" required placeholder="eposta@ornek.com" aria-label="Yönetici e-postası"><button class="dugme kucuk" type="submit">Ekle</button></form>
          <h2 style="margin-top:1.5rem">Seans üretimi</h2><p class="soluk kucuk">Her gece otomatik çalışır. Yeni oda ya da tatil değişikliğinden sonra hemen görmek isterseniz elle çalıştırın.</p>
          <button class="dugme kucuk ikincil" id="seans-uret">Seansları şimdi üret</button></section>
      </div>`;

    $('#odeme-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = formVeri(e.currentTarget);
      v.rezervasyon_min_dakika = Number(v.rezervasyon_min_dakika); v.kredi_iade_saat = Number(v.kredi_iade_saat);
      const ham = v.iban.toUpperCase().replace(/\s+/g, '');
      if (!/^TR\d{24}$/.test(ham)) { toast('IBAN TR ile başlamalı ve 26 karakter olmalı', true); return; }
      v.iban = ham.replace(/(.{4})/g, '$1 ').trim();
      islem(e.submitter, async () => { await al(sb.from('ayarlar').update({ ...v, guncellendi: new Date().toISOString() }).eq('id', 1)); toast('Ayarlar kaydedildi'); });
    });
    $('#tatil-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.currentTarget;
      islem(e.submitter, async () => {
        await al(sb.from('tatiller').upsert({ tarih: f.tarih.value, aciklama: f.aciklama.value.trim() }));
        let n = 0;
        if (f.iptal.checked) {
          const ss = await al(sb.from('seanslar').select('id').eq('tarih', f.tarih.value).eq('durum', 'planli'));
          for (const s of ss) { const { error } = await sb.rpc('seans_iptal', { p_seans: s.id, p_neden: `Tatil: ${f.aciklama.value.trim()}` }); if (error) throw error; n++; }
        }
        toast(`Tatil eklendi${n ? `, ${n} seans iptal edildi` : ''}`); kabuk.yenile();
      });
    });
    $$('[data-tatil-sil]', kap).forEach((b) => b.addEventListener('click', () => islem(b, async () => {
      await al(sb.from('tatiller').delete().eq('tarih', b.dataset.tatilSil)); toast('Tatil kaldırıldı. Seansları yeniden üretmeyi unutmayın.'); kabuk.yenile();
    })));
    $('#yon-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const ep = e.currentTarget.eposta.value.trim().toLowerCase();
      islem(e.submitter, async () => {
        await al(sb.from('yonetici_epostalari').upsert({ eposta: ep }));
        await al(sb.from('profiller').update({ rol: 'admin' }).ilike('eposta', ep));
        toast('Yönetici eklendi'); kabuk.yenile();
      });
    });
    $$('[data-yon-sil]', kap).forEach((b) => b.addEventListener('click', async () => {
      if (!(await onayla(`${b.dataset.yonSil} yöneticilikten çıkarılsın mı?`, 'Çıkar', true))) return;
      islem(b, async () => {
        await al(sb.from('yonetici_epostalari').delete().eq('eposta', b.dataset.yonSil));
        await al(sb.from('profiller').update({ rol: 'veli' }).ilike('eposta', b.dataset.yonSil));
        kabuk.yenile();
      });
    }));
    $('#seans-uret').addEventListener('click', (e) => islem(e.currentTarget, async () => {
      const { data, error } = await sb.rpc('seanslari_uret', { p_gun: 35 });
      if (error) throw error;
      toast(`${data} yeni seans üretildi`);
    }));
  }
}
