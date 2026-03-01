# Far7i - Plateforme Premium pour Événements en Algérie

[![Security Score](https://img.shields.io/badge/security-88%2F100-green)](https://securityheaders.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> Trouvez les meilleurs prestataires pour votre mariage et événements en Algérie.

## 🚀 Technologies

- **Frontend**: Vite + React 18 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Déploiement**: Vercel
- **Sécurité**: DOMPurify, Crypto-JS, RLS Policies

## 📋 Prérequis

- Node.js 18+ et npm
- Compte Supabase
- Compte Vercel (optionnel)

## 🛠️ Installation

```bash
# 1. Cloner le repository
git clone <YOUR_GIT_URL>
cd far7i-main

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase

# 4. Lancer le serveur de développement
npm run dev
```

## 📁 Structure du projet

```
far7i-main/
├── public/              # Assets statiques
│   ├── images/         # Images du site
│   ├── robots.txt      # Configuration SEO
│   └── sitemap.xml     # Sitemap généré
├── src/
│   ├── components/     # Composants React
│   │   ├── forms/     # Formulaires
│   │   ├── home/      # Composants page d'accueil
│   │   ├── layout/    # Layout (Header, Footer)
│   │   ├── seo/       # SEO (métadonnées, structured data)
│   │   └── ui/        # Composants UI réutilisables
│   ├── hooks/         # Custom hooks
│   ├── integrations/  # Intégrations externes (Supabase)
│   ├── lib/           # Utilitaires
│   │   ├── logger.ts       # Logging sécurisé
│   │   ├── secureStorage.ts # Stockage chiffré
│   │   ├── validation.ts    # Validation & sanitization
│   │   └── utils.ts        # Utilitaires généraux
│   ├── pages/         # Pages de l'application
│   └── main.tsx       # Point d'entrée
├── scripts/           # Scripts utilitaires
│   └── generate-sitemap.ts
├── supabase/          # Configuration Supabase
│   └── migrations/    # Migrations SQL
└── package.json
```

## 🔐 Sécurité

Le projet implémente les meilleures pratiques de sécurité OWASP Top 10 :

- ✅ Protection XSS (DOMPurify)
- ✅ Headers HTTP sécurisés (CSP, HSTS, X-Frame-Options)
- ✅ Rate limiting sur les formulaires
- ✅ Validation stricte des inputs
- ✅ Stockage chiffré (AES-256)
- ✅ Row Level Security (Supabase)
- ✅ Logging sécurisé

**Score de sécurité : 88/100**

Voir [`docs/SECURITY.md`](docs/SECURITY.md) pour plus de détails.

## 📜 Scripts disponibles

```bash
# Développement
npm run dev              # Lancer le serveur de dev

# Build
npm run build            # Build production
npm run preview          # Preview du build

# Qualité du code
npm run lint             # Linter ESLint

# SEO
npm run generate:sitemap # Générer le sitemap

# Sécurité
npm run security:audit   # Audit de sécurité
npm run security:fix     # Corriger les vulnérabilités
npm run security:check   # Audit + dépendances obsolètes
```

## 🗄️ Configuration Supabase

### 1. Créer les tables

Les migrations SQL sont dans `supabase/migrations/`. Pour les appliquer :

```bash
# Via Supabase Dashboard
# SQL Editor > Coller le contenu des migrations > Run
```

### 2. Configurer RLS

Exécuter `supabase/migrations/20251205_security_rls_policies.sql` pour activer Row Level Security.

### 3. Variables d'environnement

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STORAGE_ENCRYPTION_KEY=your_encryption_key
```

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Déployer
vercel --prod

# 3. Configurer les variables d'environnement sur Vercel Dashboard
```

### Checklist pré-déploiement

- [ ] Variables d'environnement configurées
- [ ] Migrations Supabase appliquées
- [ ] RLS activé sur toutes les tables
- [ ] `npm run build` réussit
- [ ] Tests de sécurité passés

## 📚 Documentation

- [`docs/SECURITY.md`](docs/SECURITY.md) - Guide de sécurité complet
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) - Guide de déploiement
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) - Guide de contribution

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [`CONTRIBUTING.md`](docs/CONTRIBUTING.md).

## 📄 License

MIT License - voir [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- 📧 Email: support@far7i.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

**Fait avec ❤️ pour les événements en Algérie**
