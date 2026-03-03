import { useState } from "react";
import { Loader2, CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { validateEmail } from "@/lib/validation";
import { useRateLimit } from "@/hooks/useRateLimit";
import { logger } from "@/lib/logger";

interface ClientWaitlistFormProps {
  onSuccess?: () => void;
}

export function ClientWaitlistForm({ onSuccess }: ClientWaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { canSubmit, remainingTime, recordSubmit } = useRateLimit({
    key: 'client_waitlist',
    duration: 60 * 60 * 1000 // 1 heure
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérifier le rate limit
    if (!canSubmit) {
      setErrorMessage(`Vous avez déjà soumis une demande. Veuillez attendre ${remainingTime} minute(s).`);
      setStatus("error");
      return;
    }

    // Validation stricte avec vérification des domaines jetables
    const validation = validateEmail(email);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Email invalide");
      setStatus("error");
      return;
    }

    setIsLoading(true);

    try {
      const { supabase } = await import("@/integrations/supabase/client");

      const { error } = await supabase
        .from('client_waitlist')
        .insert({ email });

      if (error) {
        // Vérifier si c'est une erreur de rate limit de Supabase
        if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
          setErrorMessage("Cet email est déjà inscrit.");
        }
        throw error;
      }

      recordSubmit(); // Enregistrer la soumission pour le rate limit
      setStatus("success");
      setEmail("");
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error) {
      logger.error("Failed to save to client waitlist", error, { email });
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
      <div className="p-8 bg-accent/10 border-2 border-accent/30 text-accent rounded-2xl text-center animate-scale-in max-w-md mx-auto shadow-glow-sm">
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-subtle">
          <CheckCircle className="w-10 h-10" />
        </div>
        <p className="font-bold text-xl mb-2">Merci pour votre inscription !</p>
        <p className="text-sm mt-1 opacity-90">
          Nous vous contacterons très bientôt.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="email"
            placeholder="votre@email.com"
            required
            pattern="[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}"
            title="Veuillez entrer un email valide avec @ et une extension de domaine"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              "w-full pl-12 pr-4 py-4 border-2 border-input rounded-xl bg-card shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:shadow-glow-sm",
              "transition-all duration-300 placeholder:text-muted-foreground hover:border-primary/30"
            )}
          />
        </div>
        <Button
          type="submit"
          variant="shine"
          size="lg"
          disabled={isLoading}
          className="min-w-[140px] shadow-glow-sm"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "S'inscrire"
          )}
        </Button>
      </div>

      {status === "error" && (
        <p className="text-sm text-destructive mt-4 text-center bg-destructive/10 p-3 rounded-lg border border-destructive/20">
          {errorMessage || "Une erreur est survenue. Veuillez réessayer."}
        </p>
      )}
    </form>
  );
}
