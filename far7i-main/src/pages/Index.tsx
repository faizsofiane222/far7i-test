import { HeroCarousel } from "@/components/home/HeroCarousel";
import { SEO } from "@/components/seo/SEO";
import { StructuredData } from "@/components/seo/StructuredData";
import { PromisesSection } from "@/components/home/PromisesSection";
import { SearchGuideSection } from "@/components/home/SearchGuideSection";
import { InspirationSection } from "@/components/home/InspirationSection";
import { ClientWaitlistSection } from "@/components/home/ClientWaitlistSection";

const Index = () => {
  return (
    <>
      <SEO
        title="Trouvez les Meilleurs Prestataires Mariage en Algérie"
        description="Découvrez notre sélection exclusive de prestataires mariage vérifiés en Algérie : salles des fêtes, traiteurs, photographes, DJ. Organisez votre événement en toute sérénité."
        keywords="mariage algérie, prestataire mariage alger, salle des fêtes algérie, photographe mariage, traiteur mariage, DJ mariage, organisateur événement"
      />
      <StructuredData type="organization" />
      <StructuredData type="website" />
      <HeroCarousel />
      <PromisesSection />
      <SearchGuideSection />
      <InspirationSection />
      <ClientWaitlistSection />
    </>
  );
};

export default Index;
