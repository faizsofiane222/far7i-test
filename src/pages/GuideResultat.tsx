"use client";

import { ProviderCard } from "@/components/ui/ProviderCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, SlidersHorizontal, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { ClientWaitlistSection } from "@/components/home/ClientWaitlistSection";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/Carousel";
import { SEO } from "@/components/seo/SEO";
const photographers = [{
  id: "1",
  name: "Studio Lumière",
  category: "Photographe",
  rating: 5.0,
  wilaya: "Alger",
  imageUrl: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80",
  description: "L'art de capturer l'émotion brute. Spécialiste des mariages traditionnels et modernes."
}, {
  id: "2",
  name: "Atelier Vision",
  category: "Photographe",
  rating: 4.8,
  wilaya: "Oran",
  imageUrl: "https://images.unsplash.com/photo-1520854221256-17451cc330e7?w=800&q=80"
}, {
  id: "3",
  name: "PhotoGraphie Élégante",
  category: "Photographe",
  rating: 4.7,
  wilaya: "Blida",
  imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"
}, {
  id: "4",
  name: "Regard d'Exception",
  category: "Photographe",
  rating: 4.6,
  wilaya: "Alger",
  imageUrl: "https://images.unsplash.com/photo-1554048612-387768052bf7?w=800&q=80"
}];
const caterers = [{
  id: "5",
  name: "Délices d'Orient",
  category: "Traiteur",
  rating: 5.0,
  wilaya: "Alger",
  imageUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80",
  description: "Une gastronomie raffinée qui allie tradition et modernité pour ravir vos convives."
}, {
  id: "6",
  name: "Saveurs Royales",
  category: "Traiteur",
  rating: 4.8,
  wilaya: "Constantine",
  imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"
}, {
  id: "7",
  name: "Gourmet Event",
  category: "Traiteur",
  rating: 4.7,
  wilaya: "Oran",
  imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"
}];
const GuideResultatPage = () => {
  const topPhotographer = photographers[0];
  const topCaterer = caterers[0];
  const scrollToForm = () => document.getElementById("client-waitlist-form")?.scrollIntoView({
    behavior: "smooth"
  });
  return <div className="min-h-screen bg-background pb-0">
    <SEO
      title="Votre sélection personnalisée - Far7i"
      description="Découvrez notre sélection de prestataires adaptée à vos besoins pour votre événement."
    />
    {/* Sticky Header */}
    <div className="bg-secondary text-primary-foreground py-4 px-4 sticky top-10 z-30 shadow-md backdrop-blur-md bg-secondary/95 border-b border-primary-foreground/10">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/recherche" className="flex items-center text-primary-foreground/80 hover:text-primary transition-colors group">
          <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-primary-foreground/60 bg-primary-foreground/5 px-4 py-2 rounded-full border border-primary-foreground/10">
            <span>Mariage</span>
            <span className="w-1 h-1 bg-primary-foreground/30 rounded-full" />
            <span>Alger</span>
            <span className="w-1 h-1 bg-primary-foreground/30 rounded-full" />
            <span>Standard</span>
          </div>
          <Link to="/recherche">
            <Button variant="outline" size="sm" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          </Link>
        </div>
      </div>
    </div>

    <div className="container mx-auto px-4 py-12 space-y-16">
      {/* Header Text */}
      <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6 leading-tight">
          L'Excellence pour Votre{" "}
          <span className="text-primary">Événement</span>
        </h1>
        <p className="text-lg text-muted-foreground">Nous avons analysé vos critères et sélectionné la crème de la crème : des prestataires Haut de gamme pour faire de votre événement un moment inoubliable.

        </p>
      </div>

      {/* Caterers Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Traiteurs</h2>
          <div className="h-px bg-border flex-1" />
        </div>

        {/* Featured Caterer */}
        <div onClick={scrollToForm} className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-elegant grid grid-cols-1 lg:grid-cols-2 h-[400px] animate-fade-in-up cursor-pointer group hover:shadow-card-hover transition-all duration-300">
          {/* Content Side */}
          <div className="p-10 flex flex-col justify-center order-2 lg:order-1">
            <div className="flex items-center justify-between mb-6">
              <span className="text-primary font-medium tracking-wider uppercase text-sm">
                Recommandé pour vous
              </span>
              <div className="bg-muted text-foreground px-3 py-1 rounded-full text-xs font-bold border border-border">
                Mieux noté
              </div>
            </div>
            <h3 className="text-3xl lg:text-4xl font-serif font-bold text-foreground mb-4">
              Traiteur d'Excellence
            </h3>
            <div className="flex items-center gap-3 mb-6 text-muted-foreground">
              <Star className="w-5 h-5 text-primary fill-primary" />
              <span className="font-bold text-foreground">5.0</span>
              <span>•</span>
              <span>Alger</span>
            </div>
            <p className="text-foreground/80 text-base mb-8 leading-relaxed blur-[3px] select-none">
              {topCaterer.description}
            </p>
            <div>
              <Button variant="default" size="lg" className="pointer-events-none">
                Voir le profil
              </Button>
            </div>
          </div>

          {/* Image Side */}
          <div className="relative h-72 lg:h-full w-full order-1 lg:order-2">
            <img src={topCaterer.imageUrl} alt={topCaterer.name} className="w-full h-full object-cover blur-[2px] group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-secondary/10 flex items-center justify-center">
              <div className="bg-card backdrop-blur-md px-6 py-3 rounded-full border border-primary/30 shadow-xl flex items-center gap-3">
                <Star className="w-5 h-5 text-primary fill-primary" />
                <span className="text-base font-bold text-foreground tracking-wide">
                  Bientôt disponible
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Other Caterers */}
        <div>
          <h3 className="text-lg font-serif font-semibold text-foreground mb-6">D’autres sélections coup de cœur</h3>
          <Carousel
            opts={{
              align: "start",
              loop: false,
              slidesToScroll: 2,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {caterers.slice(1).map(provider => (
                <CarouselItem key={provider.id} className="pl-2 md:pl-4 basis-full md:basis-1/2">
                  <div className="h-[320px]">
                    <ProviderCard {...provider} className="h-full cursor-pointer" comingSoon={true} onClick={scrollToForm} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </section>
    </div>

    {/* Waitlist Section */}
    <ClientWaitlistSection />
  </div>;
};
export default GuideResultatPage;