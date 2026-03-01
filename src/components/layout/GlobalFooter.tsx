import { Link } from "react-router-dom";
import { Facebook, Instagram } from "lucide-react";
import logoFull from "@/assets/logo-full.png";

export function GlobalFooter() {
  return (
    <footer className="bg-[#1E1E1E] text-secondary-foreground py-10 md:py-16 border-t border-border/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-5">
            <Link to="/" className="inline-block hover:scale-110 transition-all duration-300 hover:drop-shadow-glow">
              <img src={logoFull} alt="Far7i" className="h-12 md:h-16 w-auto" />
            </Link>
            <p className="text-sm text-secondary-foreground/80 leading-relaxed">
              Trouvez les meilleurs prestataires en Algérie et célébrez votre événement comme vous l'imaginez.
            </p>
          </div>

          {/* Navigation */}
          <div className="col-span-1">
            <h3 className="font-serif text-lg md:text-xl mb-4 md:mb-5 text-primary font-bold">Navigation</h3>
            <ul className="space-y-3 text-sm text-secondary-foreground/80">
              <li>
                <Link to="/" className="hover:text-primary transition-colors inline-block hover:translate-x-1 transition-all duration-300">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/recherche" className="hover:text-primary transition-colors inline-block hover:translate-x-1 transition-all duration-300">
                  Mes prestataires
                </Link>
              </li>
              <li>
                <Link to="/inspiration" className="hover:text-primary transition-colors inline-block hover:translate-x-1 transition-all duration-300">
                  Mes inspirations
                </Link>
              </li>
              <li>
                <Link to="/partner/auth" className="hover:text-primary transition-colors inline-block hover:translate-x-1 transition-all duration-300">
                  Espace Partenaire
                </Link>
              </li>
            </ul>
          </div>

          {/* À Propos */}
          <div className="col-span-1">
            <h3 className="font-serif text-lg md:text-xl mb-4 md:mb-5 text-primary font-bold">À Propos</h3>
            <ul className="space-y-3 text-sm text-secondary-foreground/80">
              <li>
                <Link to="/qui-sommes-nous" className="hover:text-primary transition-colors inline-block hover:translate-x-1 transition-all duration-300">
                  Qui sommes nous ?
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors inline-block hover:translate-x-1 transition-all duration-300">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-serif text-lg md:text-xl mb-4 md:mb-5 text-primary font-bold">Suivez-nous</h3>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/far7i.events?igsh=dWx5YWw1dG50dHlk"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-secondary-foreground/10 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-secondary-foreground/10 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-secondary-foreground/10 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
                aria-label="TikTok"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a
                href="https://www.pinterest.com/far7icom/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-secondary-foreground/10 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
                aria-label="Pinterest"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.182-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.281a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border/10 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-sm text-secondary-foreground/60">© 2025 Far7i. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
