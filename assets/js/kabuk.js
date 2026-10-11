// Panel iskeleti: yan menü, mobil üst çubuk, hash yönlendirme
import { $, $$, esc, LOGO_SVG, cikis, hataMetni } from './ortak.js';

export function kabukKur({ menu, profil, rolAdi, sayfalar, varsayilan }) {
  document.body.innerHTML = `
  <div class="mobil-ust"><a class="logo" href="#">${LOGO_SVG}<span>Ödev Odaları</span></a>
    <button type="button" id="menu-ac" aria-expanded="false" aria-controls="yan">Menü</button></div>
  <div class="panel-govde">
    <aside class="yan" id="yan">
      <a class="logo" href="/">${LOGO_SVG}Ödev Odaları</a>
      <nav aria-label="Panel menüsü">
        ${menu.map((m) => `<a href="#${m.id}" data-sayfa="${m.id}"><span>${esc(m.ad)}</span><span class="sayac" data-sayac="${m.id}" hidden></span></a>`).join('')}
      </nav>
      <div class="yan-alt">
        <div><strong style="color:#fff">${esc(profil.ad_soyad || profil.eposta)}</strong></div>
        <div>${esc(rolAdi)}</div>
        <button type="button" id="cikis">Çıkış yap</button>
      </div>
    </aside>
    <main class="icerik" id="icerik" tabindex="-1"></main>
  </div>`;

  const yan = $('#yan');
  const menuAc = $('#menu-ac');
  menuAc.onclick = () => { const a = yan.classList.toggle('acik'); menuAc.setAttribute('aria-expanded', a); };
  document.addEventListener('click', (e) => {
    if (yan.classList.contains('acik') && !yan.contains(e.target) && e.target !== menuAc) { yan.classList.remove('acik'); menuAc.setAttribute('aria-expanded', false); }
  });
  $('#cikis').onclick = cikis;

  let sira = 0;
  async function git() {
    const [id, ...parametre] = (location.hash.slice(1) || varsayilan).split('/');
    const sayfa = sayfalar[id] ? id : varsayilan;
    $$('.yan nav a').forEach((a) => { if (a.dataset.sayfa === sayfa) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    yan.classList.remove('acik');
    const kap = $('#icerik');
    const benim = ++sira;
    kap.innerHTML = '<p class="yukleniyor">Yükleniyor…</p>';
    try {
      await sayfalar[sayfa](kap, parametre, () => benim === sira);
    } catch (e) {
      console.error(e);
      if (benim === sira) {
        kap.innerHTML = `<div class="mesaj hata" role="alert"><strong>Bu sayfa yüklenemedi.</strong><br>${esc(hataMetni(e))}</div><button class="dugme" id="tekrar-dene">Tekrar dene</button>`;
        $('#tekrar-dene').onclick = git;
      }
    }
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', git);
  git();
  return { yenile: git };
}

export function sayacYaz(id, n) {
  const s = document.querySelector(`[data-sayac="${id}"]`);
  if (!s) return;
  s.textContent = n;
  s.hidden = !n;
}
