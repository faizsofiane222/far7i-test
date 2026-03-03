# Partner Dashboard Style Guide - "The Gilded Sage"

This document provides the front-end style code for the "The Gilded Sage" identity, optimized for a premium partner dashboard experience.

## 1. CSS Variables (`theme.css`)
Add these to your global CSS or Tailwind configuration.

```css
/* Far7i Brand Colors - Gilded Sage Palette */
:root {
  /* Couleurs de marque */
  --gilded-gold: #B79A63;
  --deep-charcoal: #1E1E1E;
  --warm-white: #F8F5F0;
  --soft-stone: #D4D2CF;
  --muted-cream: #EBE6DA;
  
  /* Appliquées aux variables système */
  --background: #F8F5F0;
  --foreground: #1E1E1E;
  --primary: #B79A63;
  --primary-foreground: #1E1E1E;
  --secondary: #1E1E1E;
  --secondary-foreground: #F8F5F0;
  --muted: #EBE6DA;
  --accent: #D4D2CF;
  --border: #D4D2CF;
  --ring: #B79A63;
}
```

## 2. Font Imports (`fonts.css`)
Include these in your main entry point.

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Lato:wght@300;400;700;900&display=swap');
```

## 3. Tailwind Configuration Snippets
Reusable Tailwind classes for background, text, and borders.

### Backgrounds
- `bg-[#F8F5F0]` (Warm White - Fond principal)
- `bg-[#1E1E1E]` (Deep Charcoal - Header/Footer)
- `bg-[#EBE6DA]` (Muted Cream - Sections/Cards alternées)
- `bg-[#B79A63]` (Gilded Gold - Éléments premium)

### Text
- `text-[#1E1E1E]` (Deep Charcoal - Texte principal)
- `text-[#B79A63]` (Gilded Gold - Accents/Valeurs)
- `text-[#717182]` (Gris - Texte secondaire)
- `text-[#F8F5F0]` (Warm White - Texte sur fond sombre)

### Borders
- `border-[#D4D2CF]` (Soft Stone - Bordures principales)
- `border-[#EBE6DA]` (Muted Cream - Bordures subtiles)

### Typography
- **Playfair Display**: `style={{ fontFamily: 'Playfair Display, serif' }}`
- **Lato**: `style={{ fontFamily: 'Lato, sans-serif' }}`

## 4. Reusable UI Components (React/Tailwind)

### Header
```tsx
<header className="bg-[#1E1E1E] sticky top-0 z-50 shadow-lg">
  <div className="max-w-7xl mx-auto px-8 py-6">
    <h1 className="text-4xl font-bold text-[#F8F5F0]" 
        style={{ fontFamily: 'Playfair Display, serif' }}>
      Titre <span className="text-[#B79A63]">Accent</span>
    </h1>
    <p className="text-[#D4D2CF] mt-2 text-sm" 
       style={{ fontFamily: 'Lato, sans-serif' }}>
      Sous-titre
    </p>
  </div>
</header>
```

### Premium Card
```tsx
<div className="bg-white rounded-xl p-6 border border-[#D4D2CF] shadow-sm hover:shadow-md transition-all duration-300">
  {/* Contenu */}
</div>
```

### Buttons
```tsx
/* Primary (Gilded Gold) */
<button className="px-6 py-3 bg-[#B79A63] text-[#1E1E1E] rounded-lg font-bold hover:bg-[#a88a54] transition-colors duration-200"
        style={{ fontFamily: 'Lato, sans-serif' }}>
  Action Premium
</button>

/* Secondary (Deep Charcoal) */
<button className="px-6 py-3 bg-[#1E1E1E] text-[#F8F5F0] rounded-lg font-bold hover:bg-[#2a2a2a] transition-colors duration-200"
        style={{ fontFamily: 'Lato, sans-serif' }}>
  Action Standard
</button>

/* Ghost */
<button className="px-6 py-3 bg-transparent border border-[#1E1E1E] text-[#1E1E1E] rounded-lg font-bold hover:bg-[#F8F5F0] transition-colors duration-200"
        style={{ fontFamily: 'Lato, sans-serif' }}>
  Action Secondaire
</button>
```

### Form Elements
```tsx
<input 
  className="w-full px-4 py-3 bg-[#F8F5F0] border border-[#D4D2CF] rounded-lg focus:border-[#B79A63] focus:ring-2 focus:ring-[#B79A63] focus:ring-opacity-20 outline-none transition-all duration-200"
  style={{ fontFamily: 'Lato, sans-serif' }}
/>
```

### Badges
```tsx
/* Verified */
<span className="inline-flex items-center gap-1 px-3 py-1 bg-[#D4D2CF] text-[#1E1E1E] rounded-full text-xs font-bold"
      style={{ fontFamily: 'Lato, sans-serif' }}>
  <CheckIcon className="w-3 h-3 text-[#B79A63]" />
  Vérifié
</span>

/* Partner/Premium */
<span className="inline-flex items-center px-3 py-1 bg-[#B79A63] text-[#1E1E1E] rounded-full text-xs font-bold"
      style={{ fontFamily: 'Lato, sans-serif' }}>
  Partenaire
</span>
```

### Stats and Titles
```tsx
/* Stat Card Icon Wrapper */
<div className="p-3 rounded-xl bg-[#B79A63]">
  <Icon className="w-6 h-6 text-[#1E1E1E]" />
</div>

/* Section Title */
<div>
  <h2 className="text-2xl font-bold text-[#1E1E1E]" 
      style={{ fontFamily: 'Playfair Display, serif' }}>
    Titre de Section
  </h2>
  <p className="text-sm text-[#717182] mt-2" 
     style={{ fontFamily: 'Lato, sans-serif' }}>
    Description
  </p>
</div>
```

## 5. JavaScript Color Palette Object
Useful for programmatic styling (e.g., Framer Motion or Chart.js).

```javascript
const far7iBrand = {
  gildedGold: {
    hex: '#B79A63',
    rgb: 'rgb(183, 154, 99)'
  },
  deepCharcoal: {
    hex: '#1E1E1E',
    rgb: 'rgb(30, 30, 30)'
  },
  warmWhite: {
    hex: '#F8F5F0',
    rgb: 'rgb(248, 245, 240)'
  },
  softStone: {
    hex: '#D4D2CF',
    rgb: 'rgb(212, 210, 207)'
  },
  mutedCream: {
    hex: '#EBE6DA',
    rgb: 'rgb(235, 230, 218)'
  }
};
```
