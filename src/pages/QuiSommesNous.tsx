"use client";

import { useEffect } from "react";
import { SEO } from "@/components/seo/SEO";

export default function QuiSommesNous() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return <main className="min-h-screen bg-background py-24">
    <SEO
      title="Qui sommes-nous ? - Far7i"
      description="Découvrez l'équipe derrière Far7i, votre partenaire de confiance pour l'organisation d'événements en Algérie."
    />
    <div className="container mx-auto px-4 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-20 animate-fade-in-up">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-secondary mb-8">
          Qui sommes-nous ?
        </h1>
        <div className="h-1.5 w-32 bg-gradient-gold mx-auto rounded-full shadow-glow-sm" />
      </div>

      {/* Content */}
      <div className="bg-card/90 backdrop-blur-sm rounded-2xl shadow-premium p-12 md:p-16 border-2 border-border/50 hover:border-primary/30 hover:shadow-glow-sm transition-all duration-500 animate-fade-in-up" style={{
        animationDelay: "200ms"
      }}>
        <div className="prose prose-lg max-w-none space-y-8">
          <p className="text-xl leading-relaxed text-muted-foreground text-justify">
            <span className="text-primary font-serif text-3xl font-bold">Far7i</span> est né d’une conviction simple : chaque événement en Algérie mérite d’être vécu avec joie, élégance et sans stress.
            Nous sommes de jeunes ingénieurs algériens, portés par l’envie de créer une plateforme moderne, humaine et fidèle à l’esprit de nos célébrations.

          </p>

          <p className="text-xl leading-relaxed text-muted-foreground text-justify">
            Après avoir vécu nous-mêmes les difficultés de trouver des prestataires fiables et d’avancer en confiance, nous avons décidé de bâtir un service pensé pour vous : simple, rassurant et rigoureux.
            Nous sélectionnons des professionnels talentueux, reconnus pour leur sérieux et leur sens du détail.

          </p>

          <p className="text-xl leading-relaxed text-muted-foreground text-justify">
            Guidés par nos valeurs - Élégance, Sérénité, Excellence - nous imaginons une nouvelle manière d’organiser vos moments importants : plus douce, plus fluide et parfaitement adaptée à notre culture.
          </p>

          <div className="mt-16 p-8 bg-gradient-to-br from-primary/10 to-gold-200/10 rounded-2xl border-l-4 border-primary shadow-lg">
            <p className="text-xl leading-relaxed text-muted-foreground italic font-medium text-justify">
              "Far7i, c'est l'assurance d'un événement réussi, où chaque détail compte et chaque prestataire est choisi avec soin."
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>;
}