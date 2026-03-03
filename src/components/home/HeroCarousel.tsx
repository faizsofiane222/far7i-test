import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
interface Slide {
  id: number;
  image: string;
  alt: string;
}
const slides: Slide[] = [{
  id: 1,
  image: "/images/hero/hero-1.webp",
  alt: "Événement 1"
}, {
  id: 2,
  image: "/images/hero/hero-2.webp",
  alt: "Événement 2"
}, {
  id: 3,
  image: "/images/hero/hero-3.webp",
  alt: "Événement 3"
}, {
  id: 4,
  image: "/images/hero/hero-4.webp",
  alt: "Événement 4"
}, {
  id: 5,
  image: "/images/hero/hero-5.webp",
  alt: "Événement 5"
}, {
  id: 6,
  image: "/images/hero/hero-6.webp",
  alt: "Événement 6"
}, {
  id: 7,
  image: "/images/hero/hero-7.webp",
  alt: "Événement 7"
}];
export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const intersectionRef = useRef<HTMLElement | null>(null);
  const scrollToWaitlist = () => {
    document.getElementById("client-waitlist-form")?.scrollIntoView({
      behavior: "smooth"
    });
  };
  const scrollToGuide = () => {
    document.getElementById("guide-teaser")?.scrollIntoView({
      behavior: "smooth"
    });
  };
  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(prev => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);
  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);
  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [currentSlide, isTransitioning]);

  // Autoplay
  useEffect(() => {
    if (!isHovered) {
      autoplayRef.current = setInterval(nextSlide, 4000);
    }
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [isHovered, nextSlide]);

  // Intersection Observer for autoplay pause
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    }, {
      threshold: 0.5
    });
    if (intersectionRef.current) {
      observer.observe(intersectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      nextSlide();
    }
    if (touchStart - touchEnd < -50) {
      prevSlide();
    }
  };
  return <section ref={intersectionRef} className="relative h-screen w-full overflow-hidden flex items-center justify-center" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
    {/* Background Carousel with Parallax */}
    <div className="absolute inset-0 z-0">
      {slides.map((slide, index) => <div key={slide.id} className={cn("absolute inset-0 transition-all duration-500 ease-in-out", index === currentSlide ? "opacity-100" : "opacity-0")} style={{
        transform: index === currentSlide ? "translate3d(0, 0, 0)" : index < currentSlide ? "translate3d(-100%, 0, 0)" : "translate3d(100%, 0, 0)"
      }}>
        <img
          src={slide.image}
          alt={slide.alt}
          width={1920}
          height={1080}
          loading={index === 0 ? "eager" : "lazy"}
          fetchpriority={index === 0 ? "high" : "low"}
          className={cn("w-full h-full object-cover transition-transform duration-[4000ms] ease-out", index === currentSlide && "animate-zoom-subtle")}
          style={{
            willChange: "transform"
          }}
        />
      </div>)}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" style={{
        willChange: "opacity"
      }} />
    </div>


    {/* Content - Layer 3 */}
    <div className="relative z-20 container mx-auto px-4 text-center" style={{
      willChange: "opacity, transform"
    }}>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 leading-tight" style={{
        textShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        animation: "fade-up 0.6s ease-out 0.2s both"
      }}>
        Votre événement en toute sérénité{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400"></span>
      </h1>

      <p style={{
        textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        animation: "fade-up 0.6s ease-out 0.4s both"
      }} className="text-lg md:text-xl text-white/90 mb-10 max-w-3xl mx-auto backdrop-blur-sm">

        Nous sélectionnons pour vous les meilleurs professionnels d’événements en Algérie,

        <br />
        vérifiés et recommandés pour garantir un événement sans stress.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" style={{
        animation: "fade-up 0.6s ease-out 0.6s both"
      }}>
        <Button variant="shine" size="lg" onClick={scrollToWaitlist} className="min-w-[200px] shadow-lg shadow-primary/30">
          Tenez-moi informé
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <Button variant="outline" size="lg" onClick={scrollToGuide} className="min-w-[200px] border-white/40 text-white bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-white/60">
          Comment ça marche ?
        </Button>
      </div>
    </div>

    {/* Indicators (Dots) */}
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-3">
      {slides.map((_, index) => <button key={index} onClick={() => goToSlide(index)} className={cn("transition-all duration-300 hover:scale-125", index === currentSlide ? "w-8 h-3 bg-white rounded-full" : "w-3 h-3 bg-white/40 rounded-full hover:bg-white/60")} aria-label={`Aller au slide ${index + 1}`} />)}
    </div>
  </section>;
}