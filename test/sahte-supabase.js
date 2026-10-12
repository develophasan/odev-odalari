// Test için sahte supabase-js: tarayıcıda window.__SAHTE verisini döndürür.
// Senaryo bayrakları: __SAHTE.__hata (tüm sorgular hata), __SAHTE.__gecikme (ms),
// __SAHTE.__tabloHata = { tablo: 'mesaj' }, __SAHTE.__rpcHata = { ad: 'mesaj' }
const V = () => window.__SAHTE || {};
const bekle = () => new Promise((r) => setTimeout(r, V().__gecikme || 0));
const yaz = (x) => (window.__YAZ ||= []).push(x);
function oluk(tablo) {
  let tek = false, sayim = false;
  const b = {
    select(_, o) { if (o?.head) sayim = true; return b; },
    insert(x) { yaz(['insert', tablo, x]); return b; },
    update(x) { yaz(['update', tablo, x]); return b; },
    upsert(x) { yaz(['upsert', tablo, x]); return b; },
    delete() { yaz(['delete', tablo]); return b; },
    single() { tek = true; return b; }, maybeSingle() { tek = true; return b; },
    then(coz, red) {
      return bekle().then(() => {
        const h = V().__hata || (V().__tabloHata || {})[tablo];
        if (h) return { data: null, error: { message: typeof h === 'string' ? h : 'Failed to fetch' } };
        const d = V()[tablo] ?? [];
        return sayim ? { data: null, count: Array.isArray(d) ? d.length : 0, error: null }
          : { data: tek ? (Array.isArray(d) ? d[0] ?? null : d) : d, error: null };
      }).then(coz, red);
    },
  };
  for (const m of ['eq', 'neq', 'gte', 'lte', 'gt', 'lt', 'in', 'ilike', 'like', 'order', 'limit', 'is', 'not', 'or', 'range', 'filter', 'match']) b[m] = () => b;
  return b;
}
const dinleyiciler = [];
window.__oturumOlayi = (olay) => dinleyiciler.forEach((f) => f(olay, null));
export function createClient() {
  return {
    from: oluk,
    rpc: async (ad, arg) => {
      yaz(['rpc', ad, arg]); await bekle();
      const h = V().__hata || (V().__rpcHata || {})[ad];
      if (h) return { data: null, error: { message: typeof h === 'string' ? h : 'Failed to fetch' } };
      return { data: (V().rpc || {})[ad] ?? null, error: null };
    },
    auth: {
      getSession: async () => ({ data: { session: V().oturum && !sessionStorage.getItem('__cikis') ? { user: { id: V().oturum } } : null } }),
      onAuthStateChange: (f) => { dinleyiciler.push(f); return { data: { subscription: { unsubscribe() {} } } }; },
      signOut: async () => { yaz(['auth', 'signOut']); sessionStorage.setItem('__cikis', '1'); return {}; },
      signInWithPassword: async () => ({ error: { message: 'Invalid login credentials' } }),
      signUp: async () => ({ data: {}, error: null }), resetPasswordForEmail: async () => ({}), updateUser: async () => ({}),
    },
    storage: { from: (k) => ({
      upload: async (yol) => { yaz(['upload', k, yol]); await bekle(); return V().__hata ? { error: { message: 'Failed to fetch' } } : {}; },
      remove: async () => ({}),
      createSignedUrl: async () => ({ data: { signedUrl: '/assets/logo.svg' } }),
    }) },
  };
}
