# estiloplus.studio - Provador Virtual Plus Size

## Visão Geral
Plataforma de provador virtual com IA para mulheres plus size. O sistema permite que lojas cadastrem produtos e clientes experimentem roupas virtualmente usando geração de imagem com Gemini.

## Arquitetura

### Frontend (React + Vite)
- **Landing Page**: Página inicial com informações sobre a plataforma
- **Autenticação**: Login/Cadastro integrado com Supabase Auth
- **Dashboard Cliente**: Upload de foto de perfil, provador virtual, histórico de imagens
- **Dashboard Loja**: Configurações da loja, gerenciador de produtos
- **Dashboard Admin**: Gerenciador de prompts para IA

### Backend (Express)
- **API REST**: Endpoints para produtos, lojas, prompts e geração de imagens
- **Supabase**: Banco de dados PostgreSQL, autenticação e storage
- **Gemini API**: Geração de imagens de try-on virtual

## Estrutura de Arquivos

```
client/src/
├── components/
│   ├── VirtualTryOn.tsx      # Componente principal do provador virtual
│   ├── ProductGallery.tsx    # Galeria de produtos disponíveis
│   ├── ProductManager.tsx    # Gerenciador de produtos (lojas)
│   ├── ProfileUpload.tsx     # Upload de foto com crop
│   ├── ImageHistory.tsx      # Histórico de imagens geradas
│   ├── StoreSettings.tsx     # Configurações da loja
│   └── PromptManager.tsx     # Gerenciador de prompts (admin)
├── contexts/
│   └── AuthContext.tsx       # Contexto de autenticação
├── lib/
│   ├── supabase.ts          # Cliente Supabase (async)
│   └── queryClient.ts       # Configuração React Query
├── pages/
│   ├── Landing.tsx          # Página inicial
│   ├── Login.tsx            # Login
│   ├── Register.tsx         # Cadastro
│   ├── ClientDashboard.tsx  # Dashboard do cliente
│   ├── StoreDashboard.tsx   # Dashboard da loja
│   └── AdminDashboard.tsx   # Dashboard do admin

server/
├── routes.ts                # Rotas da API
├── gemini.ts                # Integração com Gemini
├── supabase.ts              # Cliente Supabase (server-side)
└── index.ts                 # Entrada do servidor

shared/
└── schema.ts                # Schemas Drizzle + Zod
```

## Configuração do Supabase

Para configurar o projeto, execute o SQL em `supabase-setup.sql` no editor SQL do Supabase.

### Tabelas
- **users**: Usuários (extensão do auth.users) - inclui campo `credits` (20 grátis no cadastro)
- **stores**: Lojas cadastradas
- **products**: Produtos das lojas
- **prompts**: Prompts para geração de imagem (editáveis pelo admin)
- **generated_images**: Histórico de imagens geradas
- **credit_packages**: Pacotes de créditos disponíveis para compra
- **credit_purchases**: Histórico de compras de créditos

### Storage
- **images**: Bucket para armazenar fotos de perfil, logos e imagens geradas

## Variáveis de Ambiente

- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_ANON_KEY`: Chave anon do Supabase
- `GEMINI_API_KEY`: Chave da API do Google Gemini
- `SESSION_SECRET`: Segredo para sessões Express

## Padrões de Código

### Frontend
- Componentes funcionais com hooks
- React Query para estado do servidor
- Supabase client assíncrono via `getSupabase()`
- Shadcn UI para componentes
- Tailwind CSS para estilização

### Backend
- Express com TypeScript
- Rotas REST em `server/routes.ts`
- Gemini para geração de imagens em `server/gemini.ts`

## Design

- **Cores principais**: Rosa (#E91E63 / tons rose)
- **Tipografia**: Inter (corpo), Playfair Display (títulos)
- **Estilo**: Elegante, clean, arejado
- **Idioma**: Português (Brasil)

## Sistema de Créditos

- **Créditos iniciais**: 20 créditos grátis para novos usuários
- **Custo por uso**: 1 crédito por prova virtual
- **Compra de créditos**: Via Stripe Checkout (pacotes de 10, 30 e 100 créditos)
- **Webhooks**: Processamento de pagamentos via Stripe webhooks

### Arquivos Stripe
- `server/stripeClient.ts`: Cliente Stripe e funções de autenticação
- `server/webhookHandlers.ts`: Processamento de webhooks do Stripe
- `client/src/components/CreditPurchase.tsx`: Componente de compra de créditos

## Próximos Passos

1. Filtros avançados de produtos
2. Favoritos e coleções
3. Compartilhamento em redes sociais
4. Dashboard de analytics
