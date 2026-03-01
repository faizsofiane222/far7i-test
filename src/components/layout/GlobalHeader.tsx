"use client";

import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/logo.png";
export function GlobalHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const navLinks = [
    {
      href: "/",
      label: "Accueil",
    },
    {
      href: "/recherche",
      label: "Mes prestataires",
    },
    {
      href: "/inspiration",
      label: "Mes inspirations",
    },
  ];
  return (
    <header
      className={cn(
        "sticky top-12 z-40 w-full transition-all duration-300",
        "bg-[#1E1E1E] shadow-md",
        isScrolled && "backdrop-blur-xl shadow-xl",
      )}
      style={{ backgroundColor: "#1E1E1E" }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* Logo */}
        <Link to="/" className="hover:scale-110 transition-all duration-300 hover:drop-shadow-lg z-10">
          <img src={logoImage} alt="Far7i" className="h-8 md:h-10" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-sm font-medium transition-all font-sans relative group",
                location.pathname === link.href ? "text-primary" : "text-secondary-foreground hover:text-primary",
              )}
            >
              {link.label}
              <span
                className={cn(
                  "absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300",
                  location.pathname === link.href ? "w-full" : "w-0 group-hover:w-full",
                )}
              />
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center z-10">
          <Link to="/partner/auth">
            <Button variant="outline" size="sm" className="hover:shadow-glow-sm">
              Espace Partenaire{" "}
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-secondary-foreground p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          className="md:hidden backdrop-blur-xl border-t border-border/20 absolute w-full p-6 flex flex-col gap-4 animate-fade-in shadow-2xl"
          style={{ backgroundColor: "#1E1E1E" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-secondary-foreground hover:text-primary transition-colors py-2",
                location.pathname === link.href && "text-primary",
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/partner/auth">
            <Button variant="outline" className="w-full" onClick={() => setIsMenuOpen(false)}>
              Espace Partenaire
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
