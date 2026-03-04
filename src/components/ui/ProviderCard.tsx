import { Star, MapPin, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Far7iCard } from "@/components/ui/far7i-card";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ProviderCardProps {
  id: string;
  name: string;
  category: string;
  rating: number;
  wilaya: string;
  imageUrl: string;
  className?: string;
  comingSoon?: boolean;
  onClick?: () => void;
}

export function ProviderCard({
  id,
  name,
  category,
  rating,
  wilaya,
  imageUrl,
  className,
  comingSoon = true,
  onClick,
}: ProviderCardProps) {
  const { track } = useAnalytics();

  const handleClick = () => {
    // Track the view even if it's coming soon
    if (id) {
      track(id, 'profile_view');
    }
    if (onClick) onClick();
  };

  return (
    <Far7iCard
      hover={!comingSoon}
      className={cn(
        "relative overflow-hidden h-full border-none shadow-xl group p-0",
        className
      )}
      onClick={handleClick}
    >
      {/* Background Image */}
      <div className={cn("absolute inset-0 w-full h-full", comingSoon && "blur-[3px]")}>
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-secondary/98 via-secondary/60 to-transparent" />

      {/* Rating Badge */}
      <div className="absolute top-4 right-4 bg-card/30 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border-2 border-primary-foreground/20 shadow-glow-sm group-hover:bg-card/50 group-hover:scale-110 transition-all duration-300">
        <Star className="w-4 h-4 text-primary fill-primary" />
        <span className="text-sm font-bold text-primary-foreground">{rating.toFixed(1)}</span>
      </div>

      {/* Coming Soon Badge */}
      {comingSoon && (
        <div className="absolute inset-0 bg-secondary/10 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-card backdrop-blur-md px-6 py-3 rounded-full border border-primary/30 shadow-xl">
            <span className="text-base font-bold text-foreground tracking-wide">Bientôt disponible</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full p-5 text-primary-foreground z-10 flex flex-col justify-end h-full">
        <div
          className={cn(
            "transform transition-transform duration-300 group-hover:-translate-y-1",
            comingSoon && "opacity-60"
          )}
        >
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
            {category}
          </p>
          <h3 className="text-xl font-serif font-bold text-primary-foreground mb-2 line-clamp-2">
            {name}
          </h3>
          <div className="flex items-center gap-1.5 text-primary-foreground/80">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs font-sans">{wilaya}</span>
          </div>
        </div>
      </div>
    </Far7iCard>
  );
}
