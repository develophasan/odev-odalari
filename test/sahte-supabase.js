// Test için sahte supabase-js: tarayıcıda window.__SAHTE verisini döndürür
const V = () => window.__SAHTE || {};
function oluk(tablo) {
  let tek = false, sayim = false;
  const b = {
    select(_, o) { if (o?.head) sayim = true; return b; },
    insert(x) { (window.__YAZ ||= []).push(['insert', tablo, x]); return b; },
    update(x) { (window.__YAZ ||= []).push(['update', tablo, x]); return b; },
    upsert(x) { (window.__YAZ ||= []).push(['upsert', tablo, x]); return b; },
    delete() { (window.__YAZ ||= []).push(['delete', tablo]); return b; },
    single() { tek = true; return b; }, maybeSingle() { tek = true; return b; },
    then(coz, red) {
      const d = V()[tablo] ?? [];
      const sonuc = sayim ? { data: null, count: Array.isArray(d) ? d.length : 0, error: null }
        : { data: tek ? (Array.isArray(d) ? d[0] ?? null : d) : d, error: null };
      return Promise.resolve(sonuc).then(coz, red);
    },
  };
  for (const m of ['eq','neq','gte','lte','gt','lt','in','ilike','like','order','limit','is','not','or','range','filter','match']) b[m] = () => b;
  return b;
}
export function createClient() {
  return {
    from: oluk,
    rpc: async (ad, arg) => ({ data: (V().rpc || {})[ad] ?? null, error: null }),
    auth: {
      getSession: async () => ({ data: { session: V().oturum ? { user: { id: V().oturum } } : null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({}), signInWithPassword: async () => ({ error: { message: 'Invalid login credentials' } }),
      signUp: async () => ({ data: {}, error: null }), resetPasswordForEmail: async () => ({}), updateUser: async () => ({}),
    },
    storage: { from: () => ({ upload: async () => ({}), remove: async () => ({}), createSignedUrl: async () => ({ data: { signedUrl: '/assets/logo.svg' } }) }) },
  };
}
