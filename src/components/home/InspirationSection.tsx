"use client";

import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Far7iCard } from "@/components/ui/far7i-card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
export function InspirationSection() {
  const {
    data: articles = []
  } = useQuery({
    queryKey: ['featured-articles'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('blog_articles').select('id, slug, title, category, read_time, image_url, excerpt').eq('status', 'published').eq('featured', true).order('published_at', {
        ascending: false
      }).limit(3);
      if (error) throw error;
      return data || [];
    }
  });
  return <section className="py-28 bg-background relative overflow-hidden">
    {/* Decorative background elements */}
    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold-200/10 rounded-full blur-3xl" />

    <div className="container mx-auto px-4 relative z-10">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6 animate-fade-in-up">
          Explorez l'art de créer un événement inoubliable
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{
          animationDelay: "100ms"
        }}>Tendances, idées, conseils d'experts - tout pour imaginer une célébration élégante, émotionnelle et parfaitement maîtrisée.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {articles.map((article, index) => <Link key={article.id} to={`/inspiration/${article.slug}`} className="group block animate-fade-in-up" style={{
          animationDelay: `${200 + index * 100}ms`
        }}>
          <Far7iCard hover className="overflow-hidden p-0 h-full border-2 border-border/50">
            {/* Image */}
            <div className="relative h-64 overflow-hidden">
              <img src={article.image_url} alt={article.title} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full">
                  {article.category}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock size={14} />
                  {article.read_time}
                </span>
              </div>
              <h3 className="text-xl font-serif font-semibold text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2 text-center">
                {article.title}
              </h3>
            </div>
          </Far7iCard>
        </Link>)}
      </div>
    </div>
  </section>;
}