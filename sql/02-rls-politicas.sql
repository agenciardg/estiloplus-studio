-- ============================================
-- PARTE 2: HABILITAR RLS E CRIAR POLÍTICAS
-- Execute após criar as tabelas
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS - USERS
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- POLÍTICAS - STORES
DROP POLICY IF EXISTS "Anyone can view active stores" ON public.stores;
CREATE POLICY "Anyone can view active stores" ON public.stores
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Store owners can manage their store" ON public.stores;
CREATE POLICY "Store owners can manage their store" ON public.stores
  FOR ALL USING (auth.uid() = user_id);

-- POLÍTICAS - PRODUCTS
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Store owners can manage their products" ON public.products;
CREATE POLICY "Store owners can manage their products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
  );

-- POLÍTICAS - PROMPTS (somente admins)
DROP POLICY IF EXISTS "Anyone can view active prompts" ON public.prompts;
CREATE POLICY "Anyone can view active prompts" ON public.prompts
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Only admins can insert prompts" ON public.prompts;
CREATE POLICY "Only admins can insert prompts" ON public.prompts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Only admins can update prompts" ON public.prompts;
CREATE POLICY "Only admins can update prompts" ON public.prompts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Only admins can delete prompts" ON public.prompts;
CREATE POLICY "Only admins can delete prompts" ON public.prompts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- POLÍTICAS - GENERATED IMAGES
DROP POLICY IF EXISTS "Users can view own generated images" ON public.generated_images;
CREATE POLICY "Users can view own generated images" ON public.generated_images
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own generated images" ON public.generated_images;
CREATE POLICY "Users can insert own generated images" ON public.generated_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own generated images" ON public.generated_images;
CREATE POLICY "Users can delete own generated images" ON public.generated_images
  FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS - CREDIT PACKAGES
DROP POLICY IF EXISTS "Anyone can view active credit packages" ON public.credit_packages;
CREATE POLICY "Anyone can view active credit packages" ON public.credit_packages
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Only admins can manage credit packages" ON public.credit_packages;
CREATE POLICY "Only admins can manage credit packages" ON public.credit_packages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- POLÍTICAS - CREDIT PURCHASES
DROP POLICY IF EXISTS "Users can view own purchases" ON public.credit_purchases;
CREATE POLICY "Users can view own purchases" ON public.credit_purchases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert purchases" ON public.credit_purchases;
CREATE POLICY "System can insert purchases" ON public.credit_purchases
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update purchases" ON public.credit_purchases;
CREATE POLICY "System can update purchases" ON public.credit_purchases
  FOR UPDATE WITH CHECK (true);
