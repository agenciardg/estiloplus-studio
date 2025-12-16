-- ============================================
-- CRIAR SUPER ADMIN
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- PASSO 1: Primeiro crie o usuário no Supabase Auth:
-- Vá em Authentication > Users > Add User
-- Email: automacaordg@gmail.com
-- Password: @Agenciardg10
-- Marque "Auto Confirm"

-- PASSO 2: Execute este SQL para criar o registro na tabela public.users
-- (Substitua o ID se necessário - você pode ver o ID em Authentication > Users)

-- Insere o usuário admin na tabela public.users
INSERT INTO public.users (id, email, name, role, credits)
SELECT 
  id,
  email,
  'Renan Custodio',
  'admin',
  999
FROM auth.users 
WHERE email = 'automacaordg@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Se já existe, apenas atualiza para admin:
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'automacaordg@gmail.com';

-- ============================================
-- POLÍTICAS RLS PARA ADMIN
-- ============================================

-- Função auxiliar para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS: Admin pode ver todos
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

-- USERS: Admin pode atualizar todos
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (public.is_admin());

-- USERS: Admin pode deletar usuários (exceto a si mesmo)
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (public.is_admin() AND id != auth.uid());

-- USERS: Admin pode inserir usuários
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (public.is_admin());

-- STORES: Admin pode gerenciar todas as lojas
DROP POLICY IF EXISTS "Admins can manage all stores" ON public.stores;
CREATE POLICY "Admins can manage all stores" ON public.stores
  FOR ALL USING (public.is_admin());

-- PRODUCTS: Admin pode gerenciar todos os produtos
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
CREATE POLICY "Admins can manage all products" ON public.products
  FOR ALL USING (public.is_admin());

-- GENERATED IMAGES: Admin pode ver todas
DROP POLICY IF EXISTS "Admins can view all generated images" ON public.generated_images;
CREATE POLICY "Admins can view all generated images" ON public.generated_images
  FOR SELECT USING (public.is_admin());

-- GENERATED IMAGES: Admin pode deletar qualquer imagem
DROP POLICY IF EXISTS "Admins can delete any generated image" ON public.generated_images;
CREATE POLICY "Admins can delete any generated image" ON public.generated_images
  FOR DELETE USING (public.is_admin());

-- CREDIT PURCHASES: Admin pode ver todas as compras
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.credit_purchases;
CREATE POLICY "Admins can view all purchases" ON public.credit_purchases
  FOR SELECT USING (public.is_admin());

-- CREDIT PURCHASES: Admin pode inserir compras (para adicionar créditos manualmente)
DROP POLICY IF EXISTS "Admins can insert purchases" ON public.credit_purchases;
CREATE POLICY "Admins can insert purchases" ON public.credit_purchases
  FOR INSERT WITH CHECK (public.is_admin());

-- ============================================
-- TABELA DE LOG DE AÇÕES DO ADMIN
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view admin actions" ON public.admin_actions;
CREATE POLICY "Only admins can view admin actions" ON public.admin_actions
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can insert admin actions" ON public.admin_actions;
CREATE POLICY "Only admins can insert admin actions" ON public.admin_actions
  FOR INSERT WITH CHECK (public.is_admin());
