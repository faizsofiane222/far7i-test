"use client";
import { ClientWaitlistForm } from "@/components/forms/ClientWaitlistForm";

export function ClientWaitlistSection() {
  return (
    <section id="client-waitlist-form" className="py-24 bg-gradient-to-br from-muted via-muted to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
              Tenez-moi informé
            </h2>
            <p className="text-muted-foreground text-lg mb-12 leading-relaxed">
              Restez informés et soyez les premiers à profiter du lancement pour vivre
              une expérience exceptionnelle.
            </p>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <ClientWaitlistForm />
          </div>
        </div>
      </div>
    </section>
  );
}
