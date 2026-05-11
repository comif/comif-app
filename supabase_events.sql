-- Script pour créer la table events dans Supabase
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  type TEXT DEFAULT 'Autre',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Autoriser la lecture, l'insertion, la mise à jour et la suppression (selon tes règles RLS)
-- Par défaut, si l'espace Admin gère tout côté serveur, on peut désactiver RLS ou ajouter des politiques.
-- Si tu utilises le service_role ou si RLS est actif, tu peux exécuter :
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Autoriser l'accès en lecture à tous (si nécessaire)
CREATE POLICY "Allow public read access" ON public.events FOR SELECT USING (true);

-- Autoriser l'insertion/modification pour tous (à ajuster selon ta sécurité, idéalement réservé aux admins)
CREATE POLICY "Allow insert for all" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete for all" ON public.events FOR DELETE USING (true);
