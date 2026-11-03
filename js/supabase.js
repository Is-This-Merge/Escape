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
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    return client;
  }
  function checked(result) {
    if (result.error) throw result.error;
    return result.data;
  }
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
    const result = await getClient().from('escape_records').insert(record).select(columns).single();
    if (result.error?.code === '23505') {
      // A previous request may have succeeded before its response was lost.
      const existing = await find(record.id, record.concept);
      if (existing) return existing;
    }
    return checked(result);
  }
  function message(error) {
    if (error?.code === '42501' || error?.status === 401) return '기록 등록 권한 또는 연결 설정을 확인해주세요. 운영자에게 문의해주세요.';
    if (error instanceof Error && /[가-힣]/.test(error.message)) return error.message;
    return '요청을 완료하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.';
  }
  return { find, list, save, message };
})();
