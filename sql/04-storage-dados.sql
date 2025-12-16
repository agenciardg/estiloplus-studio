-- ============================================
-- PARTE 4: STORAGE E DADOS INICIAIS
-- Execute por último
-- ============================================

-- Criar bucket de storage para imagens
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Política de storage - leitura pública
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- Política de storage - upload autenticado
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
  );

-- Política de storage - deletar próprios arquivos
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- DADOS INICIAIS

-- Prompt padrão para try-on virtual
INSERT INTO public.prompts (name, content, description, is_active)
VALUES (
  'virtual_tryon',
  'Transform this photo to show the person wearing the clothing item provided. Keep the person''s face, body shape, and pose exactly the same. The clothing should look natural and properly fitted. Maintain the original background and lighting. The result should look like a professional fashion photo.',
  'Prompt principal para geração de imagens de prova virtual',
  true
)
ON CONFLICT (name) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Pacotes de créditos
INSERT INTO public.credit_packages (name, credits, price_in_cents, description, is_active)
VALUES 
  ('Pacote Básico', 50, 1990, '50 créditos para provas virtuais', true),
  ('Pacote Popular', 100, 2990, '100 créditos - Melhor custo-benefício', true),
  ('Pacote Premium', 200, 4990, '200 créditos para uso intensivo', true)
ON CONFLICT DO NOTHING;
