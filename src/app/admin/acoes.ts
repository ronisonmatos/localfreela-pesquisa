'use server';

import { redirect } from 'next/navigation';
import { abrirSessao, fecharSessao } from '@/lib/admin/sessao';

export async function entrar(_estado: string | null, dados: FormData): Promise<string | null> {
  const senha = String(dados.get('senha') ?? '');
  if (!senha) return 'Digite a senha.';

  const ok = await abrirSessao(senha);
  if (!ok) {
    // atraso pequeno: encarece a tentativa em massa sem incomodar quem acerta
    await new Promise((r) => setTimeout(r, 700));
    return 'Senha incorreta.';
  }
  redirect('/admin');
}

export async function sair(): Promise<void> {
  await fecharSessao();
  redirect('/admin');
}
