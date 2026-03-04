"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggle = () => setIsVisible(window.scrollY > window.innerHeight * 0.5);
    window.addEventListener("scroll", toggle);
    return () => window.removeEventListener("scroll", toggle);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-8 right-8 p-3 rounded-full bg-secondary text-secondary-foreground shadow-lg transition-all duration-300 z-50 hover:bg-primary hover:text-primary-foreground hover:scale-110 hover:shadow-glow",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
      aria-label="Retour en haut"
    >
      <ArrowUp size={24} />
    </button>
  );
}
