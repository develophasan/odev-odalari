// Tek tıkla Google Meet: yöneticinin kendi Google Takvim'inde, odanın gün ve saatlerinde
// tekrarlayan bir etkinlik açar ve Meet bağlantısını döndürür.
// İstemci kimliği tanımlı değilse yedek yol: meet.google.com/new yeni sekmede açılır.
import { GOOGLE_CLIENT_ID } from './ayar.js';

const KAPSAM = 'https://www.googleapis.com/auth/calendar.events';
const GUN_KODU = { 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA', 7: 'SU' };
let token = null;
let tokenBitis = 0;

export const otomatikMeetHazir = () => Boolean(GOOGLE_CLIENT_ID);

function gisYukle() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((coz, red) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => coz();
    s.onerror = () => red(new Error('Google oturum hizmeti yüklenemedi. İnternet bağlantınızı kontrol edin.'));
    document.head.append(s);
  });
}

async function erisimAl() {
  if (token && Date.now() < tokenBitis - 60_000) return token;
  await gisYukle();
  return new Promise((coz, red) => {
    const istemci = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: KAPSAM,
      prompt: token ? '' : 'consent',
      callback: (y) => {
        if (y.error) { red(new Error('Google izni verilmedi.')); return; }
        token = y.access_token;
        tokenBitis = Date.now() + (Number(y.expires_in) || 3600) * 1000;
        coz(token);
      },
      error_callback: (e) => red(new Error(e?.type === 'popup_closed' ? 'Google penceresi kapatıldı.' : 'Google penceresi açılamadı. Açılır pencere engelini kaldırın.')),
    });
    istemci.requestAccessToken();
  });
}

// Odanın ilk günü için bugünden sonraki ilk tarih (İstanbul saatiyle)
function ilkTarih(gunler) {
  const bugun = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  for (let i = 0; i < 8; i++) {
    const d = new Date(bugun); d.setDate(bugun.getDate() + i);
    const iso = ((d.getDay() + 6) % 7) + 1;
    if (gunler.includes(iso)) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return null;
}

// oda: { ad, gunler:[1..7], baslangic:'HH:MM[:SS]', bitis:'HH:MM[:SS]' }
export async function meetOlustur(oda) {
  const erisim = await erisimAl();
  const gun = ilkTarih(oda.gunler);
  if (!gun) throw new Error('Odanın günlerini seçin.');
  const saat = (t) => String(t).slice(0, 5) + ':00';
  const govde = {
    summary: `Ödev Odaları – ${oda.ad}`,
    description: 'Ödev Odaları sistemi tarafından oluşturuldu. Bağlantı velilere panelden gösterilir.',
    start: { dateTime: `${gun}T${saat(oda.baslangic)}`, timeZone: 'Europe/Istanbul' },
    end: { dateTime: `${gun}T${saat(oda.bitis)}`, timeZone: 'Europe/Istanbul' },
    recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${oda.gunler.map((g) => GUN_KODU[g]).join(',')}`],
    conferenceData: { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
  };
  const y = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=none', {
    method: 'POST',
    headers: { Authorization: `Bearer ${erisim}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(govde),
  });
  if (y.status === 401) { token = null; throw new Error('Google oturumunun süresi doldu, tekrar deneyin.'); }
  if (!y.ok) throw new Error('Google Takvim etkinliği oluşturulamadı (' + y.status + ').');
  const e = await y.json();
  const link = e.hangoutLink || e.conferenceData?.entryPoints?.find((p) => p.entryPointType === 'video')?.uri;
  if (!link) throw new Error('Meet bağlantısı alınamadı, birkaç saniye sonra tekrar deneyin.');
  return link.replace(/\?.*$/, '');
}
