# Architecture du Projet Far7i

## 📐 Vue d'ensemble

Far7i est une application web moderne construite avec React et TypeScript, utilisant Supabase comme backend.

## 🏗️ Architecture technique

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   React    │  │ TypeScript │  │  Tailwind  │            │
│  │   18.3     │  │    5.8     │  │    CSS     │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Vite     │  │   Router   │  │   Query    │            │
│  │   5.4      │  │    6.30    │  │   5.83     │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS + Security Headers
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Supabase                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │PostgreSQL│  │   Auth   │  │ Storage  │            │ │
│  │  └──────────┘  └──────────┘  └──────────┘            │ │
│  │  ┌──────────┐  ┌──────────┐                          │ │
│  │  │   RLS    │  │Realtime  │                          │ │
│  │  └──────────┘  └──────────┘                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Structure des dossiers

```
src/
├── components/          # Composants React
│   ├── forms/          # Formulaires (waitlist, lead)
│   ├── home/           # Composants page d'accueil
│   ├── layout/         # Layout (Header, Footer)
│   ├── seo/            # SEO (métadonnées, structured data)
│   └── ui/             # Composants UI réutilisables (shadcn)
│
├── hooks/              # Custom React hooks
│   └── useRateLimit.ts # Rate limiting
│
├── integrations/       # Intégrations externes
│   └── supabase/       # Client Supabase + types
│
├── lib/                # Utilitaires
│   ├── logger.ts       # Logging sécurisé
│   ├── secureStorage.ts # Stockage chiffré
│   ├── validation.ts   # Validation & sanitization
│   └── utils.ts        # Utilitaires généraux
│
├── pages/              # Pages de l'application
│   ├── Index.tsx       # Page d'accueil
│   ├── Article.tsx     # Page article blog
│   ├── Categorie.tsx   # Page catégorie
│   ├── Inspiration.tsx # Page blog
│   ├── Recherche.tsx   # Page recherche
│   └── ...
│
└── main.tsx            # Point d'entrée
```

## 🔄 Flux de données

### 1. Lecture de données (Blog, Catégories)

```
User Request
    ↓
React Component
    ↓
React Query (useQuery)
    ↓
Supabase Client
    ↓
PostgreSQL (via RLS)
    ↓
Data returned
    ↓
Component renders
```

### 2. Soumission de formulaire

```
User submits form
    ↓
Form validation (client-side)
    ↓
Rate limit check (useRateLimit)
    ↓
Input sanitization
    ↓
Supabase insert
    ↓
RLS policy check
    ↓
Database insert
    ↓
Success/Error feedback
```

## 🔐 Couches de sécurité

```
┌─────────────────────────────────────────┐
│  1. Client-side validation              │
│     - Email format (RFC 5322)           │
│     - Disposable email check            │
│     - Input sanitization                │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  2. Rate limiting (localStorage)        │
│     - 1 req/hour (client)               │
│     - 1 req/24h (provider)              │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  3. HTTP Security Headers               │
│     - CSP, HSTS, X-Frame-Options        │
│     - XSS Protection                    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  4. Supabase RLS Policies               │
│     - Row-level permissions             │
│     - Rate limit (database)             │
│     - Audit logging                     │
└─────────────────────────────────────────┘
```

## 🎨 Patterns de design

### 1. Composants

```tsx
// Composant fonctionnel avec TypeScript
interface MyComponentProps {
  title: string;
  onSubmit: () => void;
}

export function MyComponent({ title, onSubmit }: MyComponentProps) {
  // Hooks en premier
  const [state, setState] = useState('');
  
  // Handlers
  const handleClick = () => {
    // Logic
  };
  
  // Render
  return <div>{title}</div>;
}
```

### 2. Hooks personnalisés

```tsx
// Hook réutilisable
export function useCustomHook(param: string) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Logic
  }, [param]);
  
  return { data };
}
```

### 3. Gestion d'état

- **Local**: `useState` pour l'état du composant
- **Server**: React Query pour les données serveur
- **Global**: Context API (si nécessaire)

## 📊 Performance

### Code Splitting

```typescript
// vite.config.ts
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'ui-vendor': ['@radix-ui/...'],
  'supabase': ['@supabase/supabase-js'],
}
```

### Lazy Loading

```tsx
// Images
<img loading="lazy" width={400} height={300} />

// Routes (si nécessaire)
const LazyComponent = lazy(() => import('./Component'));
```

## 🧪 Tests (à implémenter)

```
tests/
├── unit/           # Tests unitaires (Vitest)
├── integration/    # Tests d'intégration
└── e2e/            # Tests E2E (Playwright)
```

## 🚀 Déploiement

```
Git Push
    ↓
Vercel CI/CD
    ↓
Build (npm run build)
    ↓
Generate Sitemap
    ↓
Deploy to Edge Network
    ↓
Production ✅
```

## 📈 Évolution future

### Phase 2
- Dashboard prestataire
- Système de notation
- Messagerie interne

### Phase 3
- Paiement en ligne
- Réservation
- Application mobile

### Phase 4
- IA pour recommandations
- Chatbot support
- Analytics avancés
