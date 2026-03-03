"use client";
import { useParams, Link } from "react-router-dom";
import { ProviderCard } from "@/components/ui/ProviderCard";
import { ArrowLeft } from "lucide-react";
import { ClientWaitlistSection } from "@/components/home/ClientWaitlistSection";
import { SEO } from "@/components/seo/SEO";
import { StructuredData } from "@/components/seo/StructuredData";

const categoryData: Record<string, { name: string; description: string; imageUrl: string }> = {
  salles: {
    name: "Salles des fêtes",
    description: "Les plus belles salles pour célébrer votre événement dans un cadre exceptionnel.",
    imageUrl: "/images/categories/salles-des-fetes.jpg",
  },
  traiteurs: {
    name: "Gâteaux & Traiteurs",
    description: "Des chefs passionnés pour une expérience culinaire inoubliable.",
    imageUrl: "/images/categories/gateaux-traiteurs.jpg",
  },
  photographes: {
    name: "Photographes",
    description: "Capturez chaque moment précieux avec nos photographes d'exception.",
    imageUrl: "/images/categories/photographes.jpg",
  },
  decoration: {
    name: "Décoration",
    description: "Transformez votre vision en réalité avec nos décorateurs talentueux.",
    imageUrl: "/images/categories/decoration.jpg",
  },
  musique: {
    name: "Musique & DJ",
    description: "Créez l'ambiance parfaite avec nos artistes et DJ professionnels.",
    imageUrl: "/images/categories/musique-dj.jpg",
  },
  couture: {
    name: "Habillement & Accessoires",
    description: "Des créations sur mesure pour briller le jour J.",
    imageUrl: "/images/categories/habillement-accessoires.jpg",
  },
};

const providers = [
  {
    id: "1",
    name: "Studio Lumière",
    category: "Photographe",
    rating: 4.9,
    wilaya: "Alger",
    imageUrl: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80",
  },
  {
    id: "2",
    name: "Capture Moments",
    category: "Photographe",
    rating: 4.8,
    wilaya: "Oran",
    imageUrl: "https://images.unsplash.com/photo-1520854221256-17451cc330e7?w=800&q=80",
  },
  {
    id: "3",
    name: "Wedding Art",
    category: "Photographe",
    rating: 4.7,
    wilaya: "Blida",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
  },
  {
    id: "4",
    name: "Focus Event",
    category: "Photographe",
    rating: 4.6,
    wilaya: "Alger",
    imageUrl: "https://images.unsplash.com/photo-1554048612-387768052bf7?w=800&q=80",
  },
  {
    id: "5",
    name: "Magic Lens",
    category: "Photographe",
    rating: 4.5,
    wilaya: "Constantine",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
  },
  {
    id: "6",
    name: "Golden Hour",
    category: "Photographe",
    rating: 4.9,
    wilaya: "Sétif",
    imageUrl: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=800&q=80",
  },
];

const CategoriePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const category = categoryData[slug || ""] || {
    name: slug?.charAt(0).toUpperCase() + (slug?.slice(1) || ""),
    description: "Découvrez notre sélection de prestataires professionnels.",
    imageUrl: "/images/hero-bg.jpg",
  };

  const scrollToForm = () => document.getElementById("client-waitlist-form")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-background pb-0">
      {/* Header */}
      <SEO
        title={`${category.name} - Prestataires Mariage Algérie`}
        description={category.description}
        image={category.imageUrl}
        keywords={`${category.name.toLowerCase()}, prestataire ${category.name.toLowerCase()} algérie, mariage algérie`}
      />
      <StructuredData
        type="breadcrumb"
        data={{
          items: [
            { name: 'Accueil', url: 'https://far7i.com' },
            { name: 'Recherche', url: 'https://far7i.com/recherche' },
            { name: category.name, url: `https://far7i.com/categorie/${slug}` }
          ]
        }}
      />
      <div className="bg-secondary text-primary-foreground py-12 px-4">
        <div className="container mx-auto">
          <Link
            to="/recherche"
            className="inline-flex items-center text-primary-foreground/80 hover:text-primary transition-colors group mb-6"
          >
            <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Retour aux catégories
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">{category.name}</h1>
          <p className="text-primary-foreground/70 max-w-xl">{category.description}</p>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {providers.map((provider, index) => (
            <div
              key={provider.id}
              className="h-[340px] animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ProviderCard {...provider} className="h-full cursor-pointer" onClick={scrollToForm} comingSoon={true} />
            </div>
          ))}
        </div>
      </div>

      {/* Waitlist */}
      <ClientWaitlistSection />
    </div>
  );
};

export default CategoriePage;
