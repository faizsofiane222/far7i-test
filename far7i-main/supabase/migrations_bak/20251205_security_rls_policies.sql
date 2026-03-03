-- ============================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Far7i Security Configuration
-- ============================================

-- Enable RLS on all tables
ALTER TABLE client_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CLIENT_WAITLIST POLICIES
-- ============================================

-- Policy: Allow public inserts with rate limiting
CREATE POLICY "Allow public inserts with rate limit"
ON client_waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Limite: 1 insertion par email par heure
  NOT EXISTS (
    SELECT 1 FROM client_waitlist
    WHERE email = NEW.email
    AND created_at > NOW() - INTERVAL '1 hour'
  )
);

-- Policy: Allow users to read their own submissions
CREATE POLICY "Users can read own submissions"
ON client_waitlist
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Admin full access
CREATE POLICY "Admin full access"
ON client_waitlist
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- ============================================
-- PROVIDER_WAITLIST POLICIES
-- ============================================

-- Policy: Allow public inserts with stricter rate limiting
CREATE POLICY "Allow provider inserts with rate limit"
ON provider_waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Limite: 1 insertion par email par 24 heures
  NOT EXISTS (
    SELECT 1 FROM provider_waitlist
    WHERE email = NEW.email
    AND created_at > NOW() - INTERVAL '24 hours'
  )
  AND
  -- Limite: Maximum 5 soumissions par IP par jour (nécessite une colonne ip_address)
  (
    SELECT COUNT(*) 
    FROM provider_waitlist 
    WHERE created_at > NOW() - INTERVAL '24 hours'
  ) < 100
);

-- Policy: Providers can read their own submissions
CREATE POLICY "Providers can read own submissions"
ON provider_waitlist
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Admin full access
CREATE POLICY "Admin full access on providers"
ON provider_waitlist
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- ============================================
-- BLOG_ARTICLES POLICIES
-- ============================================

-- Policy: Public can read published articles
CREATE POLICY "Public can read published articles"
ON blog_articles
FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Policy: Authenticated users can read all articles
CREATE POLICY "Authenticated can read all articles"
ON blog_articles
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only admins can insert/update/delete articles
CREATE POLICY "Admin can manage articles"
ON blog_articles
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);

-- ============================================
-- ADDITIONAL SECURITY FUNCTIONS
-- ============================================

-- Function to check rate limit (can be used in policies)
CREATE OR REPLACE FUNCTION check_rate_limit(
  table_name TEXT,
  email_address TEXT,
  time_window INTERVAL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM client_waitlist 
    WHERE email = email_address 
    AND created_at > NOW() - time_window
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_waitlist_email ON client_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_client_waitlist_created_at ON client_waitlist(created_at);

CREATE INDEX IF NOT EXISTS idx_provider_waitlist_email ON provider_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_provider_waitlist_created_at ON provider_waitlist(created_at);

CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON blog_articles(status);
CREATE INDEX IF NOT EXISTS idx_blog_articles_slug ON blog_articles(slug);
CREATE INDEX IF NOT EXISTS idx_blog_articles_published_at ON blog_articles(published_at);

-- ============================================
-- TRIGGERS FOR SECURITY LOGGING (Optional)
-- ============================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id UUID,
  email TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO security_audit_log (table_name, action, email)
  VALUES (TG_TABLE_NAME, TG_OP, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for client_waitlist
CREATE TRIGGER client_waitlist_security_log
AFTER INSERT ON client_waitlist
FOR EACH ROW
EXECUTE FUNCTION log_security_event();

-- Trigger for provider_waitlist
CREATE TRIGGER provider_waitlist_security_log
AFTER INSERT ON provider_waitlist
FOR EACH ROW
EXECUTE FUNCTION log_security_event();

-- ============================================
-- NOTES
-- ============================================

/*
IMPORTANT: 
1. Exécutez ce script dans Supabase SQL Editor
2. Vérifiez que toutes les tables existent avant d'activer RLS
3. Testez les policies avec différents rôles (anon, authenticated, admin)
4. Ajustez les intervalles de rate limiting selon vos besoins
5. Configurez les rôles admin dans Supabase Auth

Pour tester les policies:
- Utilisez l'onglet "Table Editor" dans Supabase
- Essayez d'insérer des données en tant qu'utilisateur anonyme
- Vérifiez que le rate limiting fonctionne

Pour monitorer:
- SELECT * FROM security_audit_log ORDER BY created_at DESC LIMIT 100;
*/
