-- ============================================
-- CORRIGIR RLS PARA PERMITIR SIGNUP
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- O problema: durante o signup, o usuário não está totalmente autenticado
-- então auth.uid() não funciona corretamente para o INSERT

-- Solução 1: Permitir INSERT para qualquer pessoa (verificamos o ID no código)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Anyone can create their profile during signup" ON public.users
  FOR INSERT WITH CHECK (true);

-- Mantemos as outras políticas de segurança
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admins podem ver todos
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins podem atualizar todos
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins podem deletar (exceto a si mesmos)
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    AND id != auth.uid()
  );

-- ============================================
-- TRIGGER PARA CRIAR USUÁRIO AUTOMATICAMENTE
-- ============================================
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
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.users.name),
    role = COALESCE(EXCLUDED.role, public.users.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFICAR SE FUNCIONOU
-- ============================================
-- Após executar este SQL, volte para a aplicação
-- e tente criar uma conta normalmente pelo formulário de cadastro
