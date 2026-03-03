"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatFrenchText } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/seo/SEO";
const contactSchema = z.object({
  email: z.string().trim().min(1, {
    message: "L'email est requis"
  }).regex(/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/, {
    message: "Adresse email invalide (doit contenir @ et une extension valide)"
  }),
  message: z.string().trim().min(1, {
    message: "Le message est requis"
  }).max(1000, {
    message: "Le message doit contenir moins de 1000 caractères"
  })
});
type ContactFormData = z.infer<typeof contactSchema>;
export default function Contact() {
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const {
    register,
    handleSubmit,
    formState: {
      errors
    },
    reset
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  });
  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      // Create mailto link
      const subject = encodeURIComponent("Contact depuis Far7i");
      const body = encodeURIComponent(`Email : ${data.email}\n\nMessage :\n${data.message}`);
      const mailtoLink = `mailto:far7ievents@gmail.com?subject=${subject}&body=${body}`;

      // Open mail client
      window.location.href = mailtoLink;
      toast({
        title: "Message préparé",
        description: "Votre client email s'ouvre avec le message prêt à envoyer."
      });
      reset();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <main className="min-h-screen bg-background py-24">
    <SEO
      title="Contactez-nous - Far7i"
      description="Une question ? Contactez l'équipe Far7i pour toute demande d'information ou partenariat."
    />
    {/* Hero Section */}
    <div className="container mx-auto px-4 mb-20">
      <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6 leading-tight">
          Contactez-nous
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          Une question, une suggestion ? Nous serions ravis d'échanger avec vous.
          <br className="hidden md:block" />
          Partagez vos idées et construisons ensemble l'expérience Far7i.
        </p>
      </div>
    </div>

    {/* Contact Form */}
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border-2 border-border rounded-2xl p-8 md:p-12 shadow-elegant animate-fade-in-up" style={{
          animationDelay: "200ms"
        }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-base font-sans">
                <Mail size={18} className="text-primary" />
                {formatFrenchText("Votre email :")}
              </Label>
              <Input id="email" type="email" placeholder="votre.email@exemple.com" {...register("email")} className={errors.email ? "border-destructive" : ""} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            {/* Message Field */}
            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-2 text-base font-sans">
                <MessageSquare size={18} className="text-primary" />
                {formatFrenchText("Votre message :")}
              </Label>
              <Textarea id="message" placeholder="Écrivez votre message ici..." rows={8} {...register("message")} className={errors.message ? "border-destructive" : ""} />
              {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button type="submit" variant="default" size="lg" disabled={isSubmitting} className="w-full md:w-auto px-12">
                <Send size={18} className="mr-2" />
                {isSubmitting ? "Préparation..." : "Envoyer"}
              </Button>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center animate-fade-in-up" style={{
          animationDelay: "400ms"
        }}>

        </div>
      </div>
    </div>
  </main>;
}