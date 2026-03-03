import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Far7iCard } from "@/components/ui/far7i-card";

interface CategoryCardProps {
  name: string;
  imageUrl: string;
  count?: number;
  className?: string;
  onClick?: () => void;
  comingSoon?: boolean;
}

export function CategoryCard({
  name,
  imageUrl,
  count,
  className,
  onClick,
  comingSoon = false,
}: CategoryCardProps) {
  const handleClick = () => {
    if (comingSoon) {
      const element = document.getElementById("client-waitlist-form");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <Far7iCard
      hover={!comingSoon}
      className={cn(
        "group relative overflow-hidden h-80 md:h-96 border-none p-0 shadow-xl",
        comingSoon ? "cursor-pointer" : "cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      {/* Card Content */}
      <div className="h-full w-full relative">
        <img
          src={imageUrl}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Coming Soon Badge */}
        {comingSoon && (
          <div className="absolute inset-0 bg-secondary/10 flex items-center justify-center">
            <div className="bg-card backdrop-blur-md px-6 py-3 rounded-full border border-primary/30 shadow-xl">
              <span className="text-base font-bold text-foreground tracking-wide">
                Bientôt disponible
              </span>
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 w-full p-8 text-primary-foreground transform transition-all duration-500 group-hover:-translate-y-4 group-hover:scale-105">
          <h3 className="text-3xl md:text-4xl font-serif font-bold mb-3 drop-shadow-lg">{name}</h3>
          {count !== undefined && (
            <div className="flex items-center gap-2">
              <div className="h-1 w-12 bg-primary rounded-full group-hover:w-16 transition-all duration-300" />
              <p className="text-sm text-primary font-bold uppercase tracking-wider">
                {count} prestataires
              </p>
            </div>
          )}
        </div>
      </div>
    </Far7iCard>
  );
}
