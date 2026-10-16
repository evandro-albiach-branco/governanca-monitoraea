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
  if (/itens_github_idx/i.test(t)) return 'Esta issue já está vinculada a outro item.';
  if (/membros_github_idx/i.test(t)) return 'Este usuário do GitHub já está ligado a outra pessoa.';
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
      const [inst, mem, itens, atr, dec, evt, anx, ghi] = await Promise.all([
        sb.from('instituicoes').select('*').order('ordem'),
        sb.from('membros').select('*').order('nome'),
        sb.from('itens').select('*').order('atualizado_em', { ascending: false }),
        sb.from('atribuicoes').select('*').order('criado_em', { ascending: false }),
        sb.from('decisoes').select('*').order('criado_em', { ascending: false }),
        sb.from('eventos').select('*').order('criado_em', { ascending: false }).limit(15),
        sb.from('anexos').select('item_id'),
        sb.from('github_issues').select('*').order('atualizada_em', { ascending: false, nullsFirst: false }),
      ]);
      const anexosPorItem = {};
      // Se a migração de anexos ainda não foi rodada, a plataforma segue funcionando sem eles.
      if (!anx.error) anx.data.forEach((a) => { anexosPorItem[a.item_id] = (anexosPorItem[a.item_id] || 0) + 1; });
      return {
        instituicoes: ok(inst), membros: ok(mem), itens: ok(itens),
        atribuicoes: ok(atr), decisoes: ok(dec), eventosRecentes: ok(evt),
        anexosPorItem, anexosAtivos: !anx.error,
        // Se github.sql ainda não foi rodado, a integração fica escondida.
        githubAtivo: !ghi.error,
        githubIssues: ghi.error ? [] : ghi.data,
      };
    },
    async githubAdicionar(numero, origem, frente) {
      return ok(await sb.rpc('github_adicionar', { p_numero: numero, p_origem: origem, p_frente: frente || null }));
    },
    async githubIgnorar(numero, ignorar) {
      ok(await sb.rpc('github_ignorar', { p_numero: numero, p_ignorar: !!ignorar }));
    },
    async definirGithub(id, login) {
      ok(await sb.rpc('definir_github', { p_membro: id, p_login: login || null }));
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
    async excluirItem(id) {
      const anx = await sb.from('anexos').select('caminho').eq('item_id', id);
      const r = ok(await sb.from('itens').delete().eq('id', id).select('id'));
      if (!r.length) throw new Error('Só a administração ou quem registrou o item pode excluí-lo.');
      // arquivos no Storage: remoção de melhor esforço (o registro já foi apagado)
      const caminhos = (anx.data || []).map((a) => a.caminho).filter(Boolean);
      if (caminhos.length) await sb.storage.from('anexos').remove(caminhos);
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
      return ok(await sb.from('comentarios')
        .insert({ item_id: itemId, texto, proposta_decisao: !!proposta, autor_id: euCache.id }).select().single());
    },

    // ---- anexos (Supabase Storage, bucket privado "anexos") ----
    async anexos(itemId) {
      const r = await sb.from('anexos').select('*').eq('item_id', itemId).order('criado_em');
      if (r.error) return [];
      const lista = r.data;
      const caminhos = lista.filter((a) => a.caminho).map((a) => a.caminho);
      if (caminhos.length) {
        const { data } = await sb.storage.from('anexos').createSignedUrls(caminhos, 3600);
        const mapa = {};
        (data || []).forEach((d) => { if (d.signedUrl) mapa[d.path] = d.signedUrl; });
        lista.forEach((a) => { if (a.caminho) a.endereco = mapa[a.caminho] || null; });
      }
      lista.forEach((a) => { if (a.tipo === 'link') a.endereco = a.url; });
      return lista;
    },
    async anexar(itemId, { arquivo = null, nome, tipo, mime = null, duracao = null, url = null, comentarioId = null }) {
      const base = { item_id: itemId, comentario_id: comentarioId, nome, tipo, criado_por: euCache.id };
      if (tipo === 'link') {
        ok(await sb.from('anexos').insert({ ...base, url }));
        return;
      }
      const seguro = String(nome).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w.-]+/g, '_').slice(-80);
      const caminho = `${euCache.id}/${itemId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${seguro}`;
      const up = await sb.storage.from('anexos').upload(caminho, arquivo, { contentType: mime || undefined, upsert: false });
      if (up.error) {
        throw new Error(/exceeded|too large|maximum/i.test(up.error.message)
          ? 'O arquivo passa do limite de 50 MB. Para vídeos maiores, publique no YouTube ou no Drive e anexe o link.'
          : 'Não foi possível enviar o arquivo: ' + up.error.message);
      }
      const ins = await sb.from('anexos').insert({ ...base, caminho, mime, tamanho: arquivo.size, duracao_s: duracao });
      if (ins.error) {
        await sb.storage.from('anexos').remove([caminho]);
        ok(ins);
      }
    },
    async removerAnexo(a) {
      const r = ok(await sb.from('anexos').delete().eq('id', a.id).select());
      if (!r.length) throw new Error('Só quem enviou pode remover este anexo.');
      if (a.caminho) await sb.storage.from('anexos').remove([a.caminho]);
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
