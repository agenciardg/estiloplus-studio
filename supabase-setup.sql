-- ============================================
-- ESTILOPLUS.STUDIO - Setup Completo Supabase
-- Provador Virtual Plus Size com IA
-- ============================================
-- Execute este SQL no Supabase SQL Editor

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABELA DE USUÁRIOS (extensão do auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'store', 'admin')),
  profile_image_url TEXT,
  credits INTEGER NOT NULL DEFAULT 20,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ============================================
-- 2. TABELA DE LOJAS
-- ============================================
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  instagram TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_active ON public.stores(is_active);

-- ============================================
-- 3. TABELA DE PRODUTOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  product_url TEXT,
  category TEXT,
  size TEXT,
  color TEXT,
  style TEXT,
  price DECIMAL(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- ============================================
-- 4. TABELA DE PROMPTS (editáveis pelo admin)
-- ============================================
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. TABELA DE IMAGENS GERADAS
-- ============================================
CREATE TABLE IF NOT EXISTS public.generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  original_image_url TEXT NOT NULL,
  generated_image_url TEXT NOT NULL,
  prompt_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON public.generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON public.generated_images(created_at DESC);

-- ============================================
-- 6. TABELA DE PACOTES DE CRÉDITOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_in_cents INTEGER NOT NULL,
  description TEXT,
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. TABELA DE COMPRAS DE CRÉDITOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.credit_packages(id) ON DELETE SET NULL,
  credits INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON public.credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON public.credit_purchases(status);

-- ============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS - USERS
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLÍTICAS RLS - STORES
-- ============================================
DROP POLICY IF EXISTS "Anyone can view active stores" ON public.stores;
CREATE POLICY "Anyone can view active stores" ON public.stores
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Store owners can manage their store" ON public.stores;
CREATE POLICY "Store owners can manage their store" ON public.stores
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all stores" ON public.stores;
CREATE POLICY "Admins can manage all stores" ON public.stores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLÍTICAS RLS - PRODUCTS
-- ============================================
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Store owners can manage their products" ON public.products;
CREATE POLICY "Store owners can manage their products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
CREATE POLICY "Admins can manage all products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLÍTICAS RLS - PROMPTS (somente admins podem gerenciar)
-- ============================================
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

-- ============================================
-- POLÍTICAS RLS - GENERATED IMAGES
-- ============================================
DROP POLICY IF EXISTS "Users can view own generated images" ON public.generated_images;
CREATE POLICY "Users can view own generated images" ON public.generated_images
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own generated images" ON public.generated_images;
CREATE POLICY "Users can insert own generated images" ON public.generated_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own generated images" ON public.generated_images;
CREATE POLICY "Users can delete own generated images" ON public.generated_images
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all generated images" ON public.generated_images;
CREATE POLICY "Admins can view all generated images" ON public.generated_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLÍTICAS RLS - CREDIT PACKAGES (somente admins podem gerenciar)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view active credit packages" ON public.credit_packages;
CREATE POLICY "Anyone can view active credit packages" ON public.credit_packages
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Only admins can insert credit packages" ON public.credit_packages;
CREATE POLICY "Only admins can insert credit packages" ON public.credit_packages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Only admins can update credit packages" ON public.credit_packages;
CREATE POLICY "Only admins can update credit packages" ON public.credit_packages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Only admins can delete credit packages" ON public.credit_packages;
CREATE POLICY "Only admins can delete credit packages" ON public.credit_packages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- POLÍTICAS RLS - CREDIT PURCHASES
-- ============================================
DROP POLICY IF EXISTS "Users can view own purchases" ON public.credit_purchases;
CREATE POLICY "Users can view own purchases" ON public.credit_purchases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert purchases" ON public.credit_purchases;
CREATE POLICY "System can insert purchases" ON public.credit_purchases
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update purchases" ON public.credit_purchases;
CREATE POLICY "System can update purchases" ON public.credit_purchases
  FOR UPDATE WITH CHECK (true);

-- ============================================
-- FUNÇÃO PARA CRIAR USUÁRIO APÓS SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    20
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNÇÃO PARA ATUALIZAR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_stores_updated_at ON public.stores;
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_prompts_updated_at ON public.prompts;
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profiles', 'profiles', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('store-logos', 'store-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('generated', 'generated', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLÍTICAS DE STORAGE - PROFILES
-- ============================================
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

DROP POLICY IF EXISTS "Users can upload own profile image" ON storage.objects;
CREATE POLICY "Users can upload own profile image"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update own profile image" ON storage.objects;
CREATE POLICY "Users can update own profile image"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own profile image" ON storage.objects;
CREATE POLICY "Users can delete own profile image"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- POLÍTICAS DE STORAGE - STORE LOGOS
-- ============================================
DROP POLICY IF EXISTS "Anyone can view store logos" ON storage.objects;
CREATE POLICY "Anyone can view store logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "Store owners can upload logos" ON storage.objects;
CREATE POLICY "Store owners can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store-logos'
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Store owners can update logos" ON storage.objects;
CREATE POLICY "Store owners can update logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'store-logos'
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Store owners can delete logos" ON storage.objects;
CREATE POLICY "Store owners can delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'store-logos'
  AND auth.uid() IS NOT NULL
);

-- ============================================
-- POLÍTICAS DE STORAGE - PRODUCTS
-- ============================================
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Store owners can upload product images" ON storage.objects;
CREATE POLICY "Store owners can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND EXISTS (SELECT 1 FROM public.stores WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Store owners can update product images" ON storage.objects;
CREATE POLICY "Store owners can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products'
  AND EXISTS (SELECT 1 FROM public.stores WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Store owners can delete product images" ON storage.objects;
CREATE POLICY "Store owners can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products'
  AND EXISTS (SELECT 1 FROM public.stores WHERE user_id = auth.uid())
);

-- ============================================
-- POLÍTICAS DE STORAGE - GENERATED IMAGES
-- ============================================
DROP POLICY IF EXISTS "Anyone can view generated images" ON storage.objects;
CREATE POLICY "Anyone can view generated images"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated');

DROP POLICY IF EXISTS "Authenticated users can upload generated images" ON storage.objects;
CREATE POLICY "Authenticated users can upload generated images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'generated'
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Users can delete own generated images" ON storage.objects;
CREATE POLICY "Users can delete own generated images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'generated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================
-- DADOS INICIAIS - PACOTES DE CRÉDITOS
-- ============================================
INSERT INTO public.credit_packages (name, credits, price_in_cents, description, is_active)
VALUES 
  ('Pacote Inicial', 10, 990, '10 créditos para experimentar roupas', true),
  ('Pacote Básico', 30, 2490, '30 créditos - economia de 17%', true),
  ('Pacote Premium', 100, 6990, '100 créditos - economia de 30%', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- DADOS INICIAIS - PROMPTS PADRÃO
-- ============================================
INSERT INTO public.prompts (name, content, description, is_active)
VALUES 
  ('Prompt Principal - Provador Virtual',
   'Generate a realistic image of the person in the first image wearing the clothing shown in the second image. 
Keep the person''s face, body shape, and pose exactly the same as in the original photo.
The clothing should fit naturally on the person''s body, respecting their plus size figure.
Maintain the same background and lighting from the original photo.
The result should look like a real photograph taken in the same setting, not a digital composite.
Ensure the clothing drapes and fits realistically on a plus size body.
Do not alter the person''s weight, body shape, or any physical features - only change the clothing.',
   'Prompt padrão para geração de imagens de prova virtual',
   true),
  ('Prompt Casual',
   'Create a realistic photo of a plus-size woman trying on casual clothing. Match the person from the reference image exactly - same face, body shape, and skin tone. The outfit should drape naturally and look comfortable. Use soft, natural indoor lighting with a simple background.',
   'Prompt para roupas casuais',
   true),
  ('Prompt Formal',
   'Generate an elegant photo of a plus-size woman wearing formal attire. The woman should match the reference photo exactly in terms of face, body shape, and complexion. The clothing should fit impeccably with proper tailoring visible. Use professional studio lighting with a sophisticated background.',
   'Prompt para roupas formais',
   true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- FIM DO SETUP
-- ============================================
