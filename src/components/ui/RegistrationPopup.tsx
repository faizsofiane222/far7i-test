"use client";

import { X, Sparkles } from "lucide-react";
import { ClientWaitlistForm } from "@/components/forms/ClientWaitlistForm";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface RegistrationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegistrationPopup({ isOpen, onClose }: RegistrationPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-secondary/50 backdrop-blur-sm animate-fade-in">
      <div
        ref={popupRef}
        className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl p-8 m-4 animate-scale-in border border-border"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors"
        >
          <X size={20} className="text-foreground" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
            Rejoignez l'élite
          </h2>
          <p className="text-muted-foreground">
            Inscrivez-vous pour un accès prioritaire aux meilleurs prestataires.
          </p>
        </div>

        {/* Form */}
        <ClientWaitlistForm onSuccess={onClose} />

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          En vous inscrivant, vous acceptez nos conditions d'utilisation et notre
          politique de confidentialité.
        </p>
      </div>
    </div>
  );
}
