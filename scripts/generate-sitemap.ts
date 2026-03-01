import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not found. Generating sitemap with static pages only.');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

async function generateSitemap() {
  const baseUrl = 'https://far7i.com';
  const urls: SitemapUrl[] = [];

  // Static pages
  const staticPages = [
    { path: '/', changefreq: 'weekly' as const, priority: 1.0 },
    { path: '/recherche', changefreq: 'weekly' as const, priority: 0.9 },
    { path: '/inspiration', changefreq: 'daily' as const, priority: 0.8 },
    { path: '/etes-vous-prestataire', changefreq: 'monthly' as const, priority: 0.8 },
    { path: '/qui-sommes-nous', changefreq: 'monthly' as const, priority: 0.6 },
    { path: '/contact', changefreq: 'monthly' as const, priority: 0.6 },
  ];

  staticPages.forEach(page => {
    urls.push({
      loc: `${baseUrl}${page.path}`,
      changefreq: page.changefreq,
      priority: page.priority,
    });
  });

  // Fetch blog articles from Supabase
  try {
    if (supabase) {
      const { data: articles, error } = await supabase
        .from('blog_articles')
        .select('slug, updated_at, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
      } else if (articles) {
        articles.forEach(article => {
          urls.push({
            loc: `${baseUrl}/inspiration/${article.slug}`,
            lastmod: article.updated_at || article.published_at,
            changefreq: 'monthly',
            priority: 0.7,
          });
        });
      }
    }
  } catch (error) {
    console.error('Error fetching articles:', error);
  }

  // Category pages
  const categories = [
    'salles',
    'traiteurs',
    'photographes',
    'decoration',
    'musique',
    'couture'
  ];

  categories.forEach(category => {
    urls.push({
      loc: `${baseUrl}/categorie/${category}`,
      changefreq: 'weekly',
      priority: 0.8,
    });
  });

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>${url.lastmod ? `
    <lastmod>${new Date(url.lastmod).toISOString()}</lastmod>` : ''}${url.changefreq ? `
    <changefreq>${url.changefreq}</changefreq>` : ''}${url.priority !== undefined ? `
    <priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  // Write to file
  const outputPath = join(process.cwd(), 'public', 'sitemap.xml');
  writeFileSync(outputPath, xml, 'utf-8');
  
  console.log(`✅ Sitemap generated successfully with ${urls.length} URLs`);
  console.log(`📝 Written to: ${outputPath}`);
}

// Run the generator
generateSitemap().catch(console.error);
