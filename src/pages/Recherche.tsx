"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchTabs } from "@/components/search/SearchTabs";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientWaitlistSection } from "@/components/home/ClientWaitlistSection";
import { SEO } from "@/components/seo/SEO";
const categories = [{
  id: "1",
  name: "Salles des fêtes",
  slug: "salles",
  imageUrl: "/images/categories/salles-des-fetes.jpg",
  count: 120
}, {
  id: "2",
  name: "Gâteaux & Traiteurs",
  slug: "traiteurs",
  imageUrl: "/images/categories/gateaux-traiteurs.jpg",
  count: 85
}, {
  id: "3",
  name: "Photographes",
  slug: "photographes",
  imageUrl: "/images/categories/photographes.jpg",
  count: 64
}, {
  id: "4",
  name: "Décoration",
  slug: "decoration",
  imageUrl: "/images/categories/decoration.jpg",
  count: 45
}, {
  id: "5",
  name: "Musique & DJ",
  slug: "musique",
  imageUrl: "/images/categories/musique-dj.jpg",
  count: 32
}, {
  id: "6",
  name: "Habillement & Accessoires",
  slug: "couture",
  imageUrl: "/images/categories/habillement-accessoires.jpg",
  count: 28
}];
const wilayas = ["Alger", "Oran", "Constantine", "Blida", "Sétif", "Annaba", "Tizi Ouzou"];
const budgets = ["Économique", "Standard", "Premium", "Luxe"];
const eventTypes = ["Mariage", "Fiançailles", "Anniversaire", "Circoncision", "Événement Pro"];
const RecherchePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"guide" | "explore">("guide");
  const handleGuideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/guide-resultat");
  };
  return <div className="min-h-screen bg-background pb-20">
    <SEO
      title="Recherche de prestataires - Far7i"
      description="Recherchez et trouvez les meilleurs prestataires pour votre mariage en Algérie. Filtrez par catégorie, ville et budget."
    />
    {/* Hero Header */}
    <div className="bg-secondary text-primary-foreground pt-24 pb-20 px-4 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
      <div className="relative z-10 container mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 animate-fade-in-up">Trouvez vos prestataires parfaits</h1>
        <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto font-sans animate-fade-in-up">
          Découvrez des professionnels fiables et passionnés pour sublimer chaque instant de votre événement.
        </p>
      </div>
    </div>

    {/* Content */}
    <div className="container mx-auto px-4 -mt-8 relative z-20">
      <SearchTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="animate-fade-in-up">
        {activeTab === "guide" ? (/* Guide Form */
          <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-elegant p-6 md:p-10 border border-border">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Créez votre sélection sur mesure</h2>
              <p className="text-muted-foreground">
                Dites-nous ce que vous recherchez, nous vous guidons vers les prestataires les plus adaptés.
              </p>
            </div>

            <form onSubmit={handleGuideSubmit} className="space-y-10">
              {/* Step 1 - Event Type */}
              <div className="space-y-4">
                <label className="text-base font-semibold text-foreground flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  Quel type d'événement organisez-vous ?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {eventTypes.map(type => <button key={type} type="button" disabled className="p-3 rounded-xl border border-input bg-card text-sm font-medium text-foreground opacity-60 cursor-not-allowed">
                    {type}
                  </button>)}
                </div>
              </div>

              {/* Step 2 & 3 - Location and Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-base font-semibold text-foreground flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    Où cela se passe-t-il ?
                  </label>
                  <div className="relative">
                    <select disabled className="w-full p-4 rounded-xl border border-input bg-card text-foreground font-medium outline-none shadow-sm appearance-none cursor-not-allowed opacity-60">
                      <option value="">Sélectionner une wilaya...</option>
                      {wilayas.map(w => <option key={w} value={w}>
                        {w}
                      </option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-base font-semibold text-foreground flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    Quel est votre budget ?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {budgets.map(b => <button key={b} type="button" disabled className="p-3 rounded-xl border border-input bg-card text-sm font-medium text-foreground opacity-60 cursor-not-allowed">
                      {b}
                    </button>)}
                  </div>
                </div>
              </div>

              {/* Step 4 - Categories */}
              <div className="space-y-4">
                <label className="text-base font-semibold text-foreground flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    4
                  </span>
                  De quels prestataires avez-vous besoin ?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map(cat => <button key={cat.slug} type="button" disabled className="p-4 rounded-xl border border-input bg-card flex items-center justify-center text-center font-medium text-sm text-foreground opacity-60 cursor-not-allowed">
                    {cat.name}
                  </button>)}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 flex justify-center">
                <Button type="submit" size="lg" className="w-full md:w-auto px-12 py-6 text-lg rounded-full shadow-glow hover:shadow-glow-lg hover:scale-105 transition-all duration-300">
                  <Search className="mr-2 h-5 w-5" />
                  Découvrir notre guide
                </Button>
              </div>
            </form>
          </div>) : (/* Explorer Grid */
          <>
            <div id="categories" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {categories.map((category, index) => <div key={category.id} className="animate-fade-in-up" style={{
                animationDelay: `${index * 50}ms`
              }}>
                <CategoryCard name={category.name} imageUrl={category.imageUrl} count={category.count} onClick={() => navigate(`/categorie/${category.slug}`)} comingSoon={true} />
              </div>)}
            </div>

            {/* Newsletter Section */}
            <div className="mt-20">
              <ClientWaitlistSection />
            </div>
          </>)}
      </div>
    </div>
  </div>;
};
export default RecherchePage;