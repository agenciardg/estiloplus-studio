# Segurança - estiloplus.studio

## Proteções Implementadas

### 1. Credenciais e Secrets

**Todas as credenciais estão protegidas:**
- `SUPABASE_URL` e `SUPABASE_ANON_KEY` - Armazenados como secrets
- `GEMINI_API_KEY` - Armazenado como secret, nunca exposto ao frontend
- `SESSION_SECRET` - Usado para sessões seguras
- `STRIPE_SECRET_KEY` - Gerenciado automaticamente pela integração Stripe do Replit

**Boas práticas seguidas:**
- Nenhuma credencial hardcoded no código
- Secrets nunca são logados no console
- Frontend só recebe dados públicos via API `/api/config`

### 2. Banco de Dados (Supabase)

**Row Level Security (RLS) habilitado em TODAS as tabelas:**
- `users` - Usuários só veem/editam seu próprio perfil
- `stores` - Donos gerenciam suas lojas, público vê lojas ativas
- `products` - Donos de loja gerenciam produtos, público vê ativos
- `prompts` - Somente admins editam, usuários veem ativos
- `generated_images` - Usuários veem apenas suas próprias imagens
- `credit_packages` - Público lê, admins gerenciam
- `credit_purchases` - Usuários veem próprias compras

**Políticas de segurança:**
- Todas as operações verificam `auth.uid()` do Supabase
- Admins têm políticas separadas com verificação de role
- Dados sensíveis (stripe_customer_id) não são expostos publicamente

### 3. Storage (Supabase)

**Buckets com políticas restritivas:**
- `profiles` - Usuário só faz upload na própria pasta (user_id)
- `store-logos` - Apenas donos de loja autenticados
- `products` - Apenas lojistas cadastrados
- `generated` - Usuários autenticados, deletam só próprias imagens

**Limites de arquivo:**
- Perfis: 5MB máximo
- Logos: 5MB máximo
- Produtos: 10MB máximo
- Geradas: 10MB máximo
- Tipos permitidos: JPEG, PNG, WebP

### 4. Autenticação

**Supabase Auth:**
- Autenticação gerenciada pelo Supabase
- Tokens JWT seguros
- Sessões com expiração automática
- Trigger automático cria perfil após cadastro

### 5. API Backend

**Proteções implementadas:**
- Validação de entrada com Zod
- Verificação de autenticação em rotas protegidas
- Rate limiting via Supabase
- Erros não expõem detalhes internos

### 6. Pagamentos (Stripe)

**Integração segura:**
- Webhooks verificados com assinatura
- Checkout session gerenciado pelo Stripe
- Nenhum dado de cartão trafega pelo servidor
- Histórico de transações auditável

## Recomendações Adicionais

### Para Produção:

1. **Ativar 2FA** no painel do Supabase
2. **Configurar domínio personalizado** para SSL
3. **Revisar políticas RLS** periodicamente
4. **Monitorar logs** de acesso no Supabase
5. **Backup automático** está habilitado no Supabase

### Checklist de Segurança:

- [x] RLS habilitado em todas as tabelas
- [x] Secrets armazenados de forma segura
- [x] Nenhuma credencial no código-fonte
- [x] Validação de entrada em todas as rotas
- [x] Políticas de storage restritivas
- [x] Webhooks com verificação de assinatura
- [x] Tipos de arquivo limitados no upload
- [x] Sessões com expiração

## Contato

Em caso de vulnerabilidade encontrada, entre em contato imediatamente.
