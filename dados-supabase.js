// Camada de dados ligada ao Supabase (modo real).
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

function msg(error) {
  const t = error?.message || String(error || 'Erro desconhecido');
  if (/Database error saving new user|CONVITE_INVALIDO/i.test(t)) {
    return 'Código de convite inválido, expirado ou emitido para outro e-mail.';
  }
  if (/Invalid login credentials/i.test(t)) return 'E-mail ou senha incorretos.';
  if (/Email not confirmed/i.test(t)) return 'Confirme o seu e-mail pelo link recebido antes de entrar.';
  if (/User already registered/i.test(t)) return 'Este e-mail já tem conta. Use a aba Entrar.';
  if (/row-level security/i.test(t)) return 'Seu perfil não permite esta ação.';
  if (/Password should be/i.test(t)) return 'A senha precisa ter pelo menos 10 caracteres.';
  const m = t.match(/^[A-Z_]+:\s*(.*)$/s);
  return m ? m[1] : t;
}
function ok({ data, error }) {
  if (error) throw new Error(msg(error));
  return data;
}

export function criarBackendSupabase(url, chave) {
  const sb = createClient(url, chave, { auth: { persistSession: true, autoRefreshToken: true } });
  let euCache = null;

  async function membroAtual() {
    const { data } = await sb.auth.getUser();
    if (!data?.user) return null;
    const r = await sb.from('membros').select('*').eq('id', data.user.id).maybeSingle();
    if (r.error || !r.data || !r.data.ativo) return null;
    return r.data;
  }

  return {
    modo: 'supabase',

    async sessao() {
      euCache = await membroAtual();
      return euCache;
    },
    async entrar(email, senha) {
      ok(await sb.auth.signInWithPassword({ email, password: senha }));
      euCache = await membroAtual();
      if (!euCache) {
        await sb.auth.signOut();
        throw new Error('Sua conta não está ativa nesta plataforma. Fale com a coordenação da sua instituição.');
      }
      return euCache;
    },
    async cadastrar({ codigo, nome, email, senha }) {
      const d = ok(await sb.auth.signUp({
        email, password: senha,
        options: { data: { convite: codigo.trim().toUpperCase(), nome: nome.trim() } },
      }));
      if (!d.session) return { confirmar: true };
      euCache = await membroAtual();
      return { membro: euCache };
    },
    async sair() {
      await sb.auth.signOut();
      euCache = null;
    },

    async carregar() {
      const [inst, mem, itens, atr, dec, evt] = await Promise.all([
        sb.from('instituicoes').select('*').order('ordem'),
        sb.from('membros').select('*').order('nome'),
        sb.from('itens').select('*').order('atualizado_em', { ascending: false }),
        sb.from('atribuicoes').select('*').order('criado_em', { ascending: false }),
        sb.from('decisoes').select('*').order('criado_em', { ascending: false }),
        sb.from('eventos').select('*').order('criado_em', { ascending: false }).limit(15),
      ]);
      return {
        instituicoes: ok(inst), membros: ok(mem), itens: ok(itens),
        atribuicoes: ok(atr), decisoes: ok(dec), eventosRecentes: ok(evt),
      };
    },
    async comentarios(itemId) {
      return ok(await sb.from('comentarios').select('*').eq('item_id', itemId).order('criado_em'));
    },
    async eventos(itemId) {
      return ok(await sb.from('eventos').select('*').eq('item_id', itemId).order('criado_em', { ascending: false }));
    },

    async criarItem(dados, atribuicao) {
      const it = ok(await sb.from('itens').insert({ ...dados, criado_por: euCache.id }).select().single());
      if (atribuicao) {
        ok(await sb.from('atribuicoes').insert({
          ...atribuicao, item_id: it.id, de_instituicao: euCache.instituicao_id, criado_por: euCache.id,
        }));
      }
      return it;
    },
    async atualizarItem(id, patch) {
      const r = ok(await sb.from('itens').update(patch).eq('id', id).select());
      if (!r.length) throw new Error('Seu perfil não permite alterar este item.');
      return r[0];
    },
    async atribuir(itemId, atribuicao) {
      ok(await sb.from('atribuicoes').insert({
        ...atribuicao, item_id: itemId, de_instituicao: euCache.instituicao_id, criado_por: euCache.id,
      }));
    },
    async responder(id, acao, { responsavel = null, prazo = null, texto = null } = {}) {
      ok(await sb.rpc('responder_atribuicao', {
        p_id: id, p_acao: acao, p_responsavel: responsavel || null, p_prazo: prazo || null, p_texto: texto || null,
      }));
    },
    async comentar(itemId, texto, proposta) {
      ok(await sb.from('comentarios').insert({ item_id: itemId, texto, proposta_decisao: !!proposta, autor_id: euCache.id }));
    },
    async proporDecisao(d) {
      ok(await sb.from('decisoes').insert({ ...d, criado_por: euCache.id }));
    },
    async pactuar(id, deAcordo = true) {
      ok(await sb.rpc('pactuar_decisao', { p_id: id, p_de_acordo: deAcordo }));
    },
    async convidar(c) {
      return ok(await sb.from('convites').insert({ ...c, criado_por: euCache.id }).select().single());
    },
    async convites() {
      return ok(await sb.from('convites').select('*').order('criado_em', { ascending: false }));
    },
    async atualizarMembro(id, { perfil = null, papel = null, ativo = null }) {
      ok(await sb.rpc('atualizar_membro', { p_id: id, p_perfil: perfil, p_papel: papel, p_ativo: ativo }));
    },
    async notificacoes() {
      return ok(await sb.from('notificacoes').select('*').order('criado_em', { ascending: false }).limit(100));
    },
    async marcarLida(id) {
      ok(await sb.from('notificacoes').update({ lida: true }).eq('id', id));
    },
    async marcarTodas() {
      ok(await sb.from('notificacoes').update({ lida: true }).eq('lida', false));
    },
    assinar(aoMudar) {
      if (!euCache) return () => {};
      const canal = sb.channel('notif-' + euCache.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `membro_id=eq.${euCache.id}` }, aoMudar)
        .subscribe();
      return () => sb.removeChannel(canal);
    },
  };
}
