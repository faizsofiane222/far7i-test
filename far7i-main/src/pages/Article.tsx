"use client";
import { Clock, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { ClientWaitlistForm } from "@/components/forms/ClientWaitlistForm";
import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Far7iCard } from "@/components/ui/far7i-card";
import { SEO } from "@/components/seo/SEO";
import { StructuredData } from "@/components/seo/StructuredData";
import DOMPurify from 'dompurify';

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch related articles (3 other articles)
  const { data: relatedArticles = [] } = useQuery({
    queryKey: ['related-articles', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_articles')
        .select('id, slug, title, category, read_time, image_url')
        .eq('status', 'published')
        .neq('slug', slug)
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!slug,
  });

  // Extract table of contents from article content (called even if loading/error)
  const tableOfContents = useMemo(() => {
    if (!article?.content) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(article.content, 'text/html');
    const headings = doc.querySelectorAll('h2');

    return Array.from(headings).map((heading, index) => {
      const text = heading.textContent || '';
      const id = `section-${index}`;
      heading.id = id; // Add ID to the heading
      return { id, text };
    });
  }, [article?.content]);

  // Update content with IDs for headings and sanitize
  const contentWithIds = useMemo(() => {
    if (!article?.content) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(article.content, 'text/html');
    const headings = doc.querySelectorAll('h2');

    headings.forEach((heading, index) => {
      heading.id = `section-${index}`;
    });

    // Sanitize HTML to prevent XSS attacks
    const sanitized = DOMPurify.sanitize(doc.body.innerHTML, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'a', 'ul', 'ol', 'li',
        'strong', 'em', 'br', 'img',
        'blockquote', 'code', 'pre',
        'div', 'span'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'id', 'class', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });

    return sanitized;
  }, [article?.content]);

  // Track active section on scroll (called even if loading/error)
  useEffect(() => {
    if (!tableOfContents.length) return;

    const handleScroll = () => {
      const sections = tableOfContents.map(({ id }) => document.getElementById(id));
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(tableOfContents[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tableOfContents]);

  // Now we can have early returns after all hooks are called

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de l'article...</p>
        </div>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-secondary mb-4">Article non trouvé</h1>
          <p className="text-muted-foreground">Cet article n'existe pas ou a été supprimé.</p>
        </div>
      </main>
    );
  }

  const handleShare = async () => {
    const shareData = {
      title: article.title,
      text: article.excerpt || article.title,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Lien copié dans le presse-papier!");
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[50vh] md:h-[60vh] w-full">
        <img
          src={article.image_url}
          alt={article.title}
          width={1920}
          height={1080}
          loading="eager"
          fetchPriority="high"
          className="w-full h-full object-cover"
        />
        {article && (
          <>
            <SEO
              title={article.title}
              description={article.excerpt || `Lisez notre article sur : ${article.title}`}
              image={article.image_url}
              type="article"
              publishedTime={article.published_at}
              modifiedTime={article.updated_at}
              keywords={`${article.category}, mariage algérie, conseils mariage`}
            />
            <StructuredData
              type="article"
              data={{
                title: article.title,
                excerpt: article.excerpt,
                image_url: article.image_url,
                published_at: article.published_at,
                updated_at: article.updated_at,
                url: window.location.href
              }}
            />
          </>
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4 text-center text-white">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 max-w-4xl mx-auto leading-tight">
              {article.title}
            </h1>
            <div className="flex items-center justify-center gap-4 md:gap-6 text-sm font-sans text-white/90">
              <span className="inline-block px-4 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full font-sans">
                {article.category}
              </span>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{article.read_time}</span>
              </div>
              <span>•</span>
              <span>Publié le {new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar (Desktop only) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-8 max-h-[calc(100vh-8rem)] overflow-y-auto">
              {/* Table of Contents */}
              {tableOfContents.length > 0 && (
                <nav>
                  <h3 className="font-serif font-bold text-lg mb-4 text-secondary">
                    Dans cet article
                  </h3>
                  <ul className="space-y-2">
                    {tableOfContents.map(({ id, text }) => (
                      <li key={id}>
                        <a
                          href={`#${id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const element = document.getElementById(id);
                            if (element) {
                              const yOffset = -100; // Offset for fixed header
                              const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                              window.scrollTo({ top: y, behavior: 'smooth' });
                            }
                          }}
                          className={`text-sm font-sans block py-1.5 px-3 rounded-md transition-colors ${activeSection === id
                            ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                            : 'text-muted-foreground hover:text-secondary hover:bg-muted'
                            }`}
                        >
                          {text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              {/* Social Share */}
              <div>
                <h3 className="font-serif font-bold text-lg mb-4 text-secondary">
                  Partager
                </h3>
                <div className="flex gap-4 text-muted-foreground">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Facebook
                      size={20}
                      className="hover:text-primary cursor-pointer transition-colors"
                    />
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter
                      size={20}
                      className="hover:text-primary cursor-pointer transition-colors"
                    />
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin
                      size={20}
                      className="hover:text-primary cursor-pointer transition-colors"
                    />
                  </a>
                  <button onClick={handleShare}>
                    <Share2
                      size={20}
                      className="hover:text-primary cursor-pointer transition-colors"
                    />
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Article Content */}
          <article className="flex-grow max-w-3xl">
            {article.excerpt && (
              <p className="text-xl font-serif italic text-muted-foreground mb-10 leading-relaxed">
                {article.excerpt}
              </p>
            )}

            <div
              className="text-muted-foreground font-sans article-content"
              dangerouslySetInnerHTML={{ __html: contentWithIds }}
            />

            {/* Mobile Social Share - Only visible on mobile */}
            <div className="lg:hidden mt-8 pt-6 border-t border-border">
              <h3 className="font-serif font-bold text-lg mb-4 text-secondary">
                Partager
              </h3>
              <div className="flex gap-4 text-muted-foreground">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Partager sur Facebook"
                >
                  <Facebook
                    size={20}
                    className="hover:text-primary cursor-pointer transition-colors"
                  />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Partager sur Twitter"
                >
                  <Twitter
                    size={20}
                    className="hover:text-primary cursor-pointer transition-colors"
                  />
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Partager sur LinkedIn"
                >
                  <Linkedin
                    size={20}
                    className="hover:text-primary cursor-pointer transition-colors"
                  />
                </a>
                <button
                  onClick={handleShare}
                  title="Copier le lien"
                  aria-label="Copier le lien"
                >
                  <Share2
                    size={20}
                    className="hover:text-primary cursor-pointer transition-colors"
                  />
                </button>
              </div>
            </div>
          </article>
        </div>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <div className="max-w-3xl mx-auto lg:ml-[calc(16rem+3rem)] mt-20 pt-12 border-t border-border">
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-8 text-center">
              Vous aimerez aussi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <Link
                  key={relatedArticle.id}
                  to={`/inspiration/${relatedArticle.slug}`}
                  className="group block"
                >
                  <Far7iCard hover className="overflow-hidden h-full flex flex-col p-0 border-2 border-border/50">
                    <div className="relative h-48 w-full overflow-hidden flex-shrink-0">
                      <img
                        src={relatedArticle.image_url}
                        alt={relatedArticle.title}
                        width={400}
                        height={300}
                        loading="lazy"
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 font-sans">
                        <span className="uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                          {relatedArticle.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{relatedArticle.read_time}</span>
                        </div>
                      </div>
                      <h4 className="text-base font-serif font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight text-center">
                        {relatedArticle.title}
                      </h4>
                    </div>
                  </Far7iCard>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="max-w-3xl mx-auto lg:ml-[calc(16rem+3rem)] mt-16 pt-12 border-t border-border">
          <div className="bg-muted p-8 md:p-12 rounded-xl text-center">
            <h3 className="text-2xl font-serif font-bold text-secondary mb-4">
              Tenez-moi informé
            </h3>
            <p className="text-muted-foreground mb-8 font-sans">
              Restez informés et soyez les premiers à profiter du lancement pour
              vivre une expérience exceptionnelle.
            </p>
            <ClientWaitlistForm />
          </div>
        </div>
      </div>
    </main>
  );
}
