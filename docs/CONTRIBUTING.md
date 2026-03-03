# Guide de Contribution - Far7i

Merci de votre intérêt pour contribuer à Far7i ! 🎉

## 🚀 Démarrage rapide

### 1. Fork et Clone

```bash
# Fork le repository sur GitHub
# Puis cloner votre fork
git clone https://github.com/YOUR_USERNAME/far7i-main.git
cd far7i-main
```

### 2. Installation

```bash
# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés

# Lancer le serveur de dev
npm run dev
```

### 3. Créer une branche

```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
```

## 📝 Standards de code

### TypeScript

- Utiliser TypeScript strict
- Typer toutes les fonctions et variables
- Éviter `any`

### React

- Utiliser des composants fonctionnels
- Hooks pour la logique
- Props typées avec interfaces

### Styling

- Tailwind CSS uniquement
- Classes utilitaires
- Pas de CSS inline sauf exceptions

### Naming

```tsx
// Composants: PascalCase
export function MyComponent() {}

// Fonctions: camelCase
function handleSubmit() {}

// Constants: UPPER_SNAKE_CASE
const API_URL = 'https://api.example.com';

// Fichiers: kebab-case ou PascalCase
my-component.tsx
MyComponent.tsx
```

## 🧪 Tests

```bash
# Linter
npm run lint

# Build
npm run build

# Sécurité
npm run security:check
```

## 📦 Commits

Utiliser [Conventional Commits](https://www.conventionalcommits.org/) :

```bash
feat: ajouter le formulaire de contact
fix: corriger le bug de validation email
docs: mettre à jour le README
style: formater le code
refactor: restructurer les composants
test: ajouter tests unitaires
chore: mettre à jour les dépendances
```

## 🔀 Pull Requests

### Checklist

- [ ] Code testé localement
- [ ] Lint passé (`npm run lint`)
- [ ] Build réussit (`npm run build`)
- [ ] Pas de console.log oubliés
- [ ] Documentation mise à jour si nécessaire
- [ ] Commit messages suivent les conventions

### Template

```markdown
## Description
Brève description des changements

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Tests
Comment tester les changements

## Screenshots (si applicable)
```

## 🐛 Signaler un bug

Utiliser le template d'issue GitHub avec :

- Description du bug
- Steps to reproduce
- Comportement attendu vs actuel
- Screenshots si applicable
- Environnement (OS, browser, version)

## 💡 Proposer une fonctionnalité

Créer une issue avec :

- Description de la fonctionnalité
- Cas d'usage
- Mockups si applicable
- Impact estimé

## 🔐 Sécurité

Pour les vulnérabilités de sécurité :
- **NE PAS** créer d'issue publique
- Contacter : security@far7i.com

## 📚 Ressources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)

## 🙏 Merci !

Toute contribution, grande ou petite, est appréciée ! ❤️
