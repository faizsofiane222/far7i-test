# Guide de Sécurité - Far7i

## 📊 Score de sécurité : 88/100

Ce document décrit toutes les mesures de sécurité implémentées dans le projet Far7i.

## 🛡️ Protections implémentées

### 1. Protection XSS (Cross-Site Scripting)

**Outil**: DOMPurify  
**Fichiers**: `src/pages/Article.tsx`

```tsx
import DOMPurify from 'dompurify';

const sanitized = DOMPurify.sanitize(htmlContent, {
  ALLOWED_TAGS: ['h1', 'h2', 'p', 'a', 'img', ...],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'id', 'class'],
});
```

### 2. Headers HTTP de sécurité

**Fichier**: `vercel.json`

| Header | Valeur | Protection |
|--------|--------|------------|
| HSTS | `max-age=63072000` | Force HTTPS |
| CSP | Whitelist stricte | Anti-XSS |
| X-Frame-Options | `SAMEORIGIN` | Anti-clickjacking |
| X-Content-Type-Options | `nosniff` | Anti-MIME sniffing |

### 3. Rate Limiting

**Fichier**: `src/hooks/useRateLimit.ts`

- Client waitlist: 1 soumission / heure
- Provider waitlist: 1 soumission / 24 heures

### 4. Validation des inputs

**Fichier**: `src/lib/validation.ts`

- Validation email RFC 5322
- Blacklist de domaines jetables
- Sanitization des inputs

### 5. Stockage sécurisé

**Fichier**: `src/lib/secureStorage.ts`

- Chiffrement AES-256 pour localStorage
- Protection des tokens d'authentification

### 6. Row Level Security (Supabase)

**Fichier**: `supabase/migrations/20251205_security_rls_policies.sql`

- Policies RLS sur toutes les tables
- Rate limiting au niveau base de données
- Audit logging automatique

## 🧪 Tests de sécurité

### Test XSS

```bash
# Insérer ce payload dans un article
<script>alert('XSS')</script>

# Résultat attendu: Script bloqué, HTML sanitisé
```

### Test Headers

```bash
curl -I https://far7i.com
# Vérifier la présence de tous les headers
```

### Test Rate Limiting

1. Soumettre un formulaire
2. Essayer de soumettre à nouveau
3. Vérifier le message d'erreur

## 📋 Checklist de sécurité

Avant chaque déploiement :

- [ ] `npm run security:audit` sans erreurs critiques
- [ ] Variables d'environnement sécurisées
- [ ] RLS activé sur Supabase
- [ ] Headers HTTP configurés
- [ ] Tests de sécurité passés

## 🔗 Ressources

- [OWASP Top 10](https://owasp.org/Top10/)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Security Headers](https://securityheaders.com/)

## 🆘 Signaler une vulnérabilité

Si vous découvrez une vulnérabilité de sécurité, veuillez nous contacter à :
- 📧 security@far7i.com

**Ne pas** créer d'issue publique pour les vulnérabilités.
