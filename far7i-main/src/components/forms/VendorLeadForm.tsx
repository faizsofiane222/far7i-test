"use client";

import { useState } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { validateEmail, sanitizeInput } from "@/lib/validation";
import { useRateLimit } from "@/hooks/useRateLimit";
import { logger } from "@/lib/logger";

const wilayas = ["Alger", "Oran", "Constantine", "Blida", "Sétif", "Annaba", "Tizi Ouzou", "Batna", "Béjaïa", "Chlef"];
const categories = [
  { value: "photographe", label: "Photographe" },
  { value: "traiteur", label: "Traiteur" },
  { value: "salle", label: "Salle des fêtes" },
  { value: "dj", label: "DJ / Musique" },
  { value: "decoration", label: "Décoration" },
  { value: "couture", label: "Habillement & Accessoires" },
  { value: "autre", label: "Autre" },
];

export function VendorLeadForm() {
  const [formData, setFormData] = useState({
    businessName: "",
    wilaya: "",
    category: "",
    email: "",
    phone: "",
    socialLink: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { canSubmit, remainingTime, recordSubmit } = useRateLimit({
    key: 'provider_waitlist',
    duration: 24 * 60 * 60 * 1000 // 24 heures
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérifier le rate limit
    if (!canSubmit) {
      setErrorMessage(`Vous avez déjà soumis une demande. Veuillez attendre ${Math.ceil(remainingTime / 60)} heure(s).`);
      setStatus("error");
      return;
    }

    // Validation stricte de l'email
    const validation = validateEmail(formData.email);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Email invalide");
      setStatus("error");
      return;
    }

    setIsLoading(true);

    try {
      const { supabase } = await import("@/integrations/supabase/client");

      // Sanitize inputs
      const sanitizedData = {
        name: sanitizeInput(formData.businessName),
        email: formData.email.trim().toLowerCase(),
        category: formData.category,
        wilaya: formData.wilaya,
        phone: formData.phone ? sanitizeInput(formData.phone) : null,
        website: formData.socialLink ? sanitizeInput(formData.socialLink) : null,
      };

      const { error } = await supabase.from("provider_waitlist").insert(sanitizedData);

      if (error) {
        if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
          setErrorMessage("Cet email est déjà inscrit.");
        }
        throw error;
      }

      recordSubmit();
      setStatus("success");
      setFormData({ businessName: "", wilaya: "", category: "", email: "", phone: "", socialLink: "" });
    } catch (error) {
      logger.error("Failed to save to provider waitlist", error, {
        email: formData.email,
        category: formData.category
      });
      setStatus("error");
      if (!errorMessage) {
        setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="max-w-md mx-auto bg-accent/10 border border-accent/30 rounded-xl p-8 text-center animate-scale-in">
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-xl font-bold text-accent mb-2">Demande reçue !</h3>
        <p className="text-accent/80">Nous vous contacterons très prochainement.</p>
        <Button variant="outline" className="mt-6" onClick={() => setStatus("idle")}>
          Envoyer une autre demande
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-card rounded-2xl shadow-xl p-8 md:p-10 border border-border">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nom de l'entreprise / Prestataire</label>
          <input
            required
            type="text"
            className={cn(
              "w-full px-4 py-3 rounded-lg border border-input bg-background",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all",
              "placeholder:text-muted-foreground",
            )}
            placeholder="Ex: Studio Lumière"
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
          />
        </div>

        {/* Wilaya & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Wilaya</label>
            <select
              required
              className={cn(
                "w-full px-4 py-3 rounded-lg border border-input bg-background",
                "focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all",
                "text-muted-foreground",
              )}
              value={formData.wilaya}
              onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
            >
              <option value="">Sélectionner...</option>
              {wilayas.map((w) => (
                <option key={w} value={w} className="text-foreground">
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Catégorie</label>
            <select
              required
              className={cn(
                "w-full px-4 py-3 rounded-lg border border-input bg-background",
                "focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all",
                "text-muted-foreground",
              )}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Sélectionner...</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value} className="text-foreground">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email professionnel</label>
          <input
            required
            type="email"
            pattern="[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}"
            title="Veuillez entrer un email valide avec @ et une extension de domaine"
            className={cn(
              "w-full px-4 py-3 rounded-lg border border-input bg-background",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all",
              "placeholder:text-muted-foreground",
            )}
            placeholder="contact@exemple.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        {/* Phone & Social */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Numéro <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <input
              type="tel"
              className={cn(
                "w-full px-4 py-3 rounded-lg border border-input bg-background",
                "focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all",
                "placeholder:text-muted-foreground",
              )}
              placeholder="Ex: 0555 12 34 56"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Lien réseau social <span className="text-muted-foreground">(optionnel)</span>
            </label>
            <input
              type="url"
              className={cn(
                "w-full px-4 py-3 rounded-lg border border-input bg-background",
                "focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all",
                "placeholder:text-muted-foreground",
              )}
              placeholder="Ex: instagram.com/votre_compte"
              value={formData.socialLink}
              onChange={(e) => setFormData({ ...formData, socialLink: e.target.value })}
            />
          </div>
        </div>

        {/* Error Message */}
        {status === "error" && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 animate-shake">
            <AlertCircle size={20} />
            {errorMessage || "Une erreur est survenue. Veuillez réessayer."}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full py-4 text-base font-bold shadow-lg shadow-primary/20"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Rejoindre la plateforme"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          En rejoignant la liste, vous acceptez d'être contacté par l'équipe Far7i.
        </p>
      </form>
    </div>
  );
}
