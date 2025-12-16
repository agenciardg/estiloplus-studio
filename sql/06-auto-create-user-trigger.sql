-- ============================================
-- TRIGGER PARA CRIAR USUÁRIO AUTOMATICAMENTE
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Esta função é chamada automaticamente quando alguém se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    20
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger que dispara quando um novo usuário é criado no auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CRIAR O SUPER ADMIN MANUALMENTE
-- ============================================

-- Primeiro, vamos inserir diretamente o admin na tabela public.users
-- usando o serviço de admin do Supabase (bypassa RLS)

-- Para criar o admin, use o SQL Editor com role = postgres
INSERT INTO public.users (id, email, name, role, credits)
VALUES (
  gen_random_uuid(),
  'automacaordg@gmail.com',
  'Renan Custodio',
  'admin',
  999
) ON CONFLICT DO NOTHING;

-- Depois, crie o usuário no Supabase Auth:
-- 1. Vá em Authentication > Users > Add User
-- 2. Email: automacaordg@gmail.com  
-- 3. Password: @Agenciardg10
-- 4. Marque "Auto Confirm User"
-- 5. IMPORTANTE: Copie o ID do usuário criado

-- Depois de criar o usuário no Auth, execute este comando
-- substituindo 'ID_DO_USUARIO' pelo ID real:

-- UPDATE public.users 
-- SET id = 'ID_DO_USUARIO_AUTH'
-- WHERE email = 'automacaordg@gmail.com';
