"use client";

import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { Far7iCard } from "@/components/ui/far7i-card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function FeaturedArticlesSection() {
  // Fetch featured articles from Supabase
  const { data: featuredArticles = [] } = useQuery({
    queryKey: ['featured-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_articles')
        .select('id, slug, title, category, read_time, image_url, excerpt')
        .eq('status', 'published')
        .eq('featured', true)
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Don't show section if no featured articles
  if (featuredArticles.length === 0) return null;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4 tracking-wider">
            À LA UNE
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-secondary mb-4">
            Nos Articles Phares
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Les tendances et conseils incontournables pour réussir votre événement
          </p>
        </div>

        {/* Featured Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredArticles.map((article, index) => (
            <Link
              key={article.id}
              to={`/inspiration/${article.slug}`}
              className="group block h-full animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Far7iCard hover className="overflow-hidden h-full flex flex-col p-0 border-primary/20 shadow-lg hover:shadow-glow transition-all duration-300 relative">
                {/* Featured Badge */}
                <div className="absolute top-4 right-4 z-10 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
                  À la Une
                </div>
                
                {/* Image */}
                <div className="relative h-72 w-full overflow-hidden flex-shrink-0">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow bg-card">
                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 font-sans">
                    <span className="uppercase tracking-wider font-semibold text-primary">
                      {article.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>{article.read_time}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-serif font-bold text-secondary group-hover:text-primary transition-colors line-clamp-2 mb-3">
                    {article.title}
                  </h3>
                  
                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-grow">
                      {article.excerpt}
                    </p>
                  )}

                  {/* Read More Link */}
                  <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                    <span>Lire l'article</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Far7iCard>
            </Link>
          ))}
        </div>

        {/* CTA to all articles */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <Link to="/inspiration">
            <Button size="lg" variant="outline" className="group">
              Voir tous les articles
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
