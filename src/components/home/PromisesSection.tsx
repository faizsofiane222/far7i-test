"use client";

import { Gem, Feather, BadgeCheck } from "lucide-react";
import { Far7iCard, Far7iCardContent } from "@/components/ui/far7i-card";
export function PromisesSection() {
  const promises = [{
    icon: Gem,
    title: "Élégance",
    description: "Des experts haut de gamme triés pour leur savoir-faire, leur professionnalisme et leur sens du détail."
  }, {
    icon: Feather,
    title: "Sérénité",
    description: "Une expérience pensée pour éliminer le stress, avec des solutions fiables pour vous garantir une expérience sans mauvaises surprises."
  }, {
    icon: BadgeCheck,
    title: "Excellence",
    description: "Des prestataires adaptés à votre style, votre budget et vos attentes, pour une expérience personnalisée et raffinée."
  }];
  return <section className="py-24 bg-muted">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 animate-fade-in-up">
          Pourquoi choisir Far7i&nbsp;?
        </h2>
        <p style={{
          animationDelay: "100ms"
        }} className="text-muted-foreground text-lg max-w-3xl mx-auto animate-fade-in-up">
          Profitez de l'accompagnement de nos partenaires de confiance pour orchestrer votre événement. Un service premium, accessible gratuitement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {promises.map((promise, index) => <Far7iCard key={index} hover className="text-center border-2 border-border/50 bg-card/90 backdrop-blur-sm animate-fade-in-up group" style={{
          animationDelay: `${200 + index * 100}ms`
        }}>
          <Far7iCardContent className="p-10">
            <div className="mb-8 inline-flex justify-center items-center w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl text-primary shadow-lg border-2 border-primary/20 group-hover:border-primary/40 group-hover:shadow-glow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
              <promise.icon size={32} strokeWidth={1.5} className="transition-transform group-hover:scale-110" />
            </div>
            <h3 className="text-2xl font-serif font-bold mb-5 text-foreground group-hover:text-primary transition-colors">
              {promise.title}
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              {promise.description}
            </p>
          </Far7iCardContent>
        </Far7iCard>)}
      </div>
    </div>
  </section>;
}