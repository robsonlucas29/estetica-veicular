import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

const VALID_ROLES = ['administrador', 'gerente', 'administrativo', 'visualizador']
const MANAGER_TARGET_ROLES = ['administrativo', 'visualizador']

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const auth = req.headers.get('Authorization')
    if (!auth) throw new Error('Não autenticado.')

    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const caller = createClient(url, anon, {
      global: { headers: { Authorization: auth } }
    })

    const { data: { user: callerUser }, error: callerError } = await caller.auth.getUser()
    if (callerError || !callerUser) throw new Error('Sessão inválida.')

    const admin = createClient(url, service)

    const { data: callerProfile, error: callerProfileError } = await admin
      .from('profiles')
      .select('id, full_name, email, role, photo_url')
      .eq('id', callerUser.id)
      .single()

    if (callerProfileError || !callerProfile) throw new Error('Perfil do usuário não encontrado.')

    const body = await req.json()
    const action = body?.action || 'create'

    if (action === 'create') {
      if (!['administrador', 'gerente'].includes(callerProfile.role)) {
        throw new Error('Você não possui permissão para criar usuários.')
      }

      const full_name = String(body?.full_name || '').trim()
      const email = String(body?.email || '').trim().toLowerCase()
      const password = String(body?.password || '')
      const role = String(body?.role || 'visualizador')

      if (!full_name || !email || password.length < 6) {
        throw new Error('Informe nome, e-mail e uma senha com pelo menos 6 caracteres.')
      }

      if (!VALID_ROLES.includes(role)) throw new Error('Perfil inválido.')

      if (callerProfile.role === 'gerente' && !MANAGER_TARGET_ROLES.includes(role)) {
        throw new Error('Gerentes só podem criar usuários Administrativo ou Visualizador.')
      }

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name }
      })

      if (createError) throw createError

      const { data: savedProfile, error: profileError } = await admin
        .from('profiles')
        .upsert({
          id: created.user.id,
          full_name,
          email,
          role
        }, { onConflict: 'id' })
        .select()
        .single()

      if (profileError) throw profileError

      return json({ user: savedProfile })
    }

    if (action === 'update') {
      const id = String(body?.id || '')
      if (!id) throw new Error('Usuário não informado.')

      const { data: target, error: targetError } = await admin
        .from('profiles')
        .select('id, full_name, email, role, photo_url')
        .eq('id', id)
        .single()

      if (targetError || !target) throw new Error('Usuário não encontrado.')

      const isSelf = id === callerUser.id
      const requestedRole = String(body?.role || target.role)

      if (!VALID_ROLES.includes(requestedRole)) throw new Error('Perfil inválido.')

      if (!isSelf) {
        if (callerProfile.role === 'administrador') {
          // Administrador pode editar qualquer usuário.
        } else if (callerProfile.role === 'gerente') {
          if (!MANAGER_TARGET_ROLES.includes(target.role)) {
            throw new Error('Gerentes só podem editar usuários Administrativo ou Visualizador.')
          }
          if (!MANAGER_TARGET_ROLES.includes(requestedRole)) {
            throw new Error('Gerentes só podem definir o perfil como Administrativo ou Visualizador.')
          }
        } else {
          throw new Error('Você só pode alterar o seu próprio cadastro.')
        }
      }

      const full_name = String(body?.full_name ?? target.full_name ?? '').trim()
      const email = String(body?.email ?? target.email ?? '').trim().toLowerCase()
      const password = String(body?.password || '')
      const finalRole = isSelf ? target.role : requestedRole

      if (!full_name || !email) throw new Error('Informe o nome e o e-mail.')
      if (password && password.length < 6) throw new Error('A nova senha deve ter pelo menos 6 caracteres.')

      const authUpdate: Record<string, unknown> = {
        email,
        user_metadata: { full_name }
      }
      if (password) authUpdate.password = password

      const { error: authUpdateError } = await admin.auth.admin.updateUserById(id, authUpdate)
      if (authUpdateError) throw authUpdateError

      const profileUpdate: Record<string, unknown> = {
        full_name,
        email,
        role: finalRole
      }

      if (typeof body?.photo_url === 'string' && body.photo_url.trim()) {
        profileUpdate.photo_url = body.photo_url.trim()
      }

      const { data: updatedProfile, error: updateError } = await admin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      return json({ user: updatedProfile })
    }

    throw new Error('Ação inválida.')
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro inesperado.' }, 400)
  }
})
