const EscapeRecords = (() => {
  const columns = 'id,concept,nickname,total_seconds,penalty_seconds,created_at';
  let client;
  function getClient() {
    if (client) return client;
    const config = window.ESCAPE_SUPABASE;
    if (!config?.url || !config?.publishableKey) {
      throw new Error('공용 순위표 연결 설정이 필요합니다. 운영자에게 문의해주세요.');
    }
    if (!config.publishableKey.startsWith('sb_publishable_')) {
      throw new Error('Supabase 공개용 publishable key를 설정해주세요.');
    }
    if (!window.supabase?.createClient) throw new Error('연결 모듈을 불러오지 못했습니다. 인터넷 연결을 확인해주세요.');
    client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    return client;
  }
  function checked(result) {
    if (result.error) throw result.error;
    return result.data;
  }
  async function staff() {
    const api = getClient();
    const { session } = checked(await api.auth.getSession());
    if (!session) return null;
    const member = checked(await api.from('escape_staff').select('user_id').eq('user_id', session.user.id).maybeSingle());
    return member ? session.user : null;
  }
  async function signIn(email, password) {
    const api = getClient();
    checked(await api.auth.signInWithPassword({ email, password }));
    const user = await staff();
    if (!user) {
      await api.auth.signOut({ scope: 'local' });
      throw new Error('등록된 직원 계정이 아닙니다. 운영자에게 문의해주세요.');
    }
    return user;
  }
  async function signOut() { checked(await getClient().auth.signOut({ scope: 'local' })); }
  async function find(id, concept) {
    return checked(await getClient().from('escape_records').select(columns).eq('id', id).eq('concept', concept).maybeSingle());
  }
  async function list(concept, page, size) {
    const result = await getClient().from('escape_records').select(columns, { count: 'exact' })
      .eq('concept', concept).order('total_seconds').order('created_at').order('id')
      .range(page * size, (page + 1) * size - 1);
    return { records: checked(result), count: result.count };
  }
  async function save(record) {
    if (!await staff()) throw new Error('기록을 등록하려면 직원 로그인이 필요합니다.');
    const result = await getClient().from('escape_records').insert(record).select(columns).single();
    if (result.error?.code === '23505') {
      // A previous request may have succeeded before its response was lost.
      const existing = await find(record.id, record.concept);
      if (existing) return existing;
    }
    return checked(result);
  }
  function message(error) {
    if (error?.code === '42501' || error?.status === 401) return '직원 로그인과 등록 권한을 확인한 뒤 다시 시도해주세요.';
    if (error?.code === 'invalid_credentials') return '이메일 또는 비밀번호를 확인해주세요.';
    if (error instanceof Error && /[가-힣]/.test(error.message)) return error.message;
    return '요청을 완료하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.';
  }
  return { staff, signIn, signOut, find, list, save, message };
})();
