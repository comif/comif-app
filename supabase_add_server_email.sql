-- À exécuter une fois dans l'éditeur SQL de Supabase.
-- Relie chaque serveur à son compte cotisant (email) pour lui donner accès
-- à /compte/servir sans ressaisir de mot de passe séparé.

ALTER TABLE public.servers ADD COLUMN email text;
