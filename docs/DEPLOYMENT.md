# Guide de Déploiement - Far7i

## 🚀 Déploiement sur Vercel

### Prérequis

- Compte Vercel
- Repository GitHub/GitLab
- Projet Supabase configuré

### Étapes

#### 1. Préparer le projet

```bash
# Vérifier que tout fonctionne localement
npm run build
npm run preview

# Vérifier la sécurité
npm run security:check
```

#### 2. Configurer Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

#### 3. Variables d'environnement

Dans Vercel Dashboard > Settings > Environment Variables :

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_STORAGE_ENCRYPTION_KEY=generate_strong_key_here
```

**Important**: Générer une clé de chiffrement unique pour la production :
```bash
openssl rand -base64 32
```

#### 4. Configurer le domaine

1. Vercel Dashboard > Settings > Domains
2. Ajouter votre domaine personnalisé
3. Configurer les DNS selon les instructions

## 🗄️ Configuration Supabase

### 1. Appliquer les migrations

Dans Supabase Dashboard > SQL Editor :

```sql
-- Copier et exécuter chaque fichier de supabase/migrations/
-- Dans l'ordre chronologique
```

### 2. Activer RLS

```sql
-- Exécuter le fichier de sécurité
-- supabase/migrations/20251205_security_rls_policies.sql
```

### 3. Vérifier les policies

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## ✅ Checklist pré-déploiement

### Code

- [ ] `npm run build` réussit sans erreurs
- [ ] `npm run lint` sans erreurs
- [ ] Tests de sécurité passés
- [ ] Sitemap généré

### Supabase

- [ ] Toutes les migrations appliquées
- [ ] RLS activé sur toutes les tables
- [ ] Policies testées
- [ ] Indexes créés

### Vercel

- [ ] Variables d'environnement configurées
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] Headers HTTP vérifiés

### Sécurité

- [ ] Clé de chiffrement unique générée
- [ ] `.env` non commité
- [ ] Secrets GitHub configurés (si CI/CD)
- [ ] Headers testés sur securityheaders.com

## 🔄 Déploiement continu

### Automatique via Git

Vercel déploie automatiquement à chaque push sur `main`.

Pour désactiver :
```bash
vercel --prod --no-auto-deploy
```

### Rollback

En cas de problème :

```bash
# Lister les déploiements
vercel ls

# Promouvoir un ancien déploiement
vercel promote <deployment-url>
```

## 📊 Monitoring

### Vercel Analytics

Activer dans Vercel Dashboard > Analytics

### Logs

```bash
# Voir les logs en temps réel
vercel logs <deployment-url> --follow
```

### Erreurs

Configurer Sentry (optionnel) :

```bash
npm install @sentry/react
```

## 🆘 Troubleshooting

### Build échoue

```bash
# Vérifier localement
npm run build

# Vérifier les logs Vercel
vercel logs
```

### Variables d'environnement manquantes

Vérifier dans Vercel Dashboard > Settings > Environment Variables

### Headers HTTP non appliqués

Vérifier `vercel.json` et redéployer

## 🔗 Ressources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Deployment](https://supabase.com/docs/guides/platform)
- [Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
