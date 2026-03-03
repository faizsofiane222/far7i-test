"use client";

import { useState } from "react";
import { UserPlus, Facebook, Instagram } from "lucide-react";
import { RegistrationPopup } from "@/components/ui/RegistrationPopup";

export function TopBar() {
  return (
    <>
      <div className="sticky top-0 z-50 bg-gradient-gold shadow-lg">
        <div className="container mx-auto px-4 h-12 flex items-center justify-end relative">
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/far7i.events?igsh=dWx5YWw1dG50dHlk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground hover:text-primary-foreground/80 transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61584567027088"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground hover:text-primary-foreground/80 transition-colors"
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground hover:text-primary-foreground/80 transition-colors"
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
              className="text-primary-foreground hover:text-primary-foreground/80 transition-colors"
              aria-label="Pinterest"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0a12 12 0 0 0-4.37 23.17c-.05-.96-.01-2.13.23-3.18l1.68-7.08s-.42-.84-.42-2.08c0-1.94 1.13-3.4 2.53-3.4 1.19 0 1.77.9 1.77 1.97 0 1.2-.77 2.99-1.16 4.65-.33 1.39.7 2.52 2.07 2.52 2.49 0 4.16-3.18 4.16-6.95 0-2.86-1.93-5-5.42-5-3.94 0-6.35 2.94-6.35 6.21 0 1.13.33 1.93.84 2.55.23.28.27.39.18.71-.06.23-.21.83-.27 1.06-.09.34-.36.46-.66.34-1.85-.76-2.72-2.8-2.72-5.09 0-3.79 3.19-8.34 9.51-8.34 5.07 0 8.42 3.66 8.42 7.58 0 5.2-2.89 9.1-7.15 9.1-1.43 0-2.78-.77-3.24-1.64l-.9 3.52c-.29 1.07-.85 2.14-1.36 2.98A12 12 0 1 0 12 0z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
