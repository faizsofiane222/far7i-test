"use client";

import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
export function SearchGuideSection() {
  return <section id="guide-teaser" className="py-24 bg-background">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl md:text-5xl font-serif font-bold text-center mb-8 text-foreground animate-fade-in-up">Trouvez vos prestataires en quelques étapes</h2>
      <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        Explorez l'art de célébrer avec excellence
      </p>

      <div className="max-w-4xl mx-auto bg-card/80 backdrop-blur-xl p-10 md:p-12 rounded-2xl shadow-premium border-2 border-border/50 hover:border-primary/30 hover:shadow-glow-sm transition-all duration-500 animate-fade-in-up" style={{
        animationDelay: "200ms"
      }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Step 1 - Event Type */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-glow-sm">
                1
              </span>
              Quel événement ?
            </label>
            <div className="flex items-center justify-between px-5 py-4 border-2 border-input rounded-xl bg-background text-muted-foreground cursor-not-allowed opacity-60">
              <span>Mariage</span>
              <ChevronDown size={18} className="text-muted-foreground" />
            </div>
          </div>

          {/* Step 2 - Wilaya */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-glow-sm">
                2
              </span>
              Quelle wilaya ?
            </label>
            <div className="flex items-center justify-between px-5 py-4 border-2 border-input rounded-xl bg-background text-muted-foreground cursor-not-allowed opacity-60">
              <span>Alger</span>
              <ChevronDown size={18} className="text-muted-foreground" />
            </div>
          </div>

          {/* Step 3 - Budget */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-glow-sm">
                3
              </span>
              Quel budget ?
            </label>
            <div className="h-[56px] flex items-center px-3">
              <div className="w-full h-2.5 bg-muted rounded-full relative shadow-inner">
                <div className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-primary to-gold-400 rounded-full transition-all shadow-glow-sm" />
                <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-5 h-5 bg-card border-3 border-primary rounded-full shadow-glow-sm hover:scale-125 transition-transform cursor-grab active:cursor-grabbing" />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link to="/recherche">
            <Button variant="shine" size="lg" className="px-12 shadow-glow-lg">
              Découvrir notre guide
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </section>;
}