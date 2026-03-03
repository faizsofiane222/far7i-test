"use client";

import { Link } from "react-router-dom";
import { Clock, Search, ChevronDown } from "lucide-react";
import { Far7iCard } from "@/components/ui/far7i-card";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/components/seo/SEO";
import { StructuredData } from "@/components/seo/StructuredData";

export default function Inspiration() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes les catégories");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch articles from Supabase
  const {
    data: articles = []
  } = useQuery({
    queryKey: ['blog-articles'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('blog_articles').select('id, slug, title, category, read_time, image_url, excerpt').eq('status', 'published').order('published_at', {
        ascending: false
      });
      if (error) throw error;
      console.log("DEBUG Inspiration articles:", data);
      return data || [];
    }
  });

  // Dynamically extract unique categories from articles
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(articles.map(article => article.category))).sort();
    return ["Toutes les catégories", ...uniqueCategories];
  }, [articles]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Toutes les catégories" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  return <main className="min-h-screen bg-background py-24">
    <SEO
      title="Inspiration Mariage - Conseils et Tendances"
      description="Découvrez nos conseils, tendances et idées pour faire de votre mariage un moment inoubliable. Articles, guides et inspiration pour votre événement en Algérie."
      keywords="inspiration mariage, conseils mariage algérie, tendances mariage, idées mariage, blog mariage"
    />
    <StructuredData type="website" />
    <div className="container mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-20 animate-fade-in-up">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-secondary mb-8">
          Inspiration
        </h1>
        <p className="text-xl text-muted-foreground font-sans max-w-3xl mx-auto leading-relaxed">Découvrez nos conseils, tendances et idées pour faire de votre événement un moment inoubliable. et idées pour faire de votre événement un moment inoubliable.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="max-w-4xl mx-auto mb-20 flex flex-col md:flex-row gap-5 animate-fade-in-up" style={{
        animationDelay: "200ms"
      }}>
        <div className="relative flex-grow">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={22} />
          <input type="text" placeholder="Rechercher un article..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-14 pr-5 py-4 bg-card border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 focus:shadow-glow-sm transition-all duration-300 font-sans hover:border-primary/50" />
        </div>
        <div className="relative w-full md:w-72">
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full px-5 py-4 bg-card border-2 border-border rounded-xl flex justify-between items-center cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-300">
            <span className="text-foreground font-sans font-medium">{selectedCategory}</span>
            <ChevronDown size={18} className="text-muted-foreground transition-transform duration-300" style={{
              transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
            }} />
          </button>
          {isDropdownOpen && <div className="absolute top-full left-0 right-0 mt-3 bg-card border-2 border-border rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-lg animate-fade-in">
            {categories.map(category => <button key={category} onClick={() => {
              setSelectedCategory(category);
              setIsDropdownOpen(false);
            }} className="w-full px-5 py-4 text-left hover:bg-primary/10 hover:text-primary transition-all duration-200 font-sans text-foreground border-b border-border/50 last:border-0">
              {category}
            </button>)}
          </div>}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredArticles.length > 0 ? filteredArticles.map((article, index) => <Link key={article.id} to={`/inspiration/${article.slug}`} className="group block h-full animate-fade-in-up" style={{
          animationDelay: `${index * 80}ms`
        }}>
          <Far7iCard hover className="overflow-hidden h-full flex flex-col p-0 border-2 border-border/50">
            {/* Image */}
            <div className="relative h-72 w-full overflow-hidden flex-shrink-0">
              <img
                src={article.image_url}
                alt={article.title}
                width={400}
                height={300}
                loading="lazy"
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Content */}
            <div className="p-7 flex flex-col flex-grow">
              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 font-sans">
                <span className="uppercase tracking-wider font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                  {article.category}
                </span>
                <div className="flex items-center gap-1.5">
                  <Clock size={15} />
                  <span>{article.read_time}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-serif font-bold text-secondary group-hover:text-primary transition-colors line-clamp-2 leading-tight text-center">
                {article.title}
              </h3>
            </div>
          </Far7iCard>
        </Link>) : <div className="col-span-full text-center py-20">
          <p className="text-muted-foreground text-xl">Aucun article trouvé</p>
        </div>}
      </div>
    </div>
  </main>;
}