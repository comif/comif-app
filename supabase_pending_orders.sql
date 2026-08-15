-- À exécuter une fois dans l'éditeur SQL de Supabase.
-- Stocke temporairement une commande générée par un étudiant sur son téléphone,
-- le temps qu'un serveur la scanne. Supprimée dès qu'elle est acceptée/refusée.

CREATE TABLE public.pending_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  items jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT pending_orders_pkey PRIMARY KEY (id),
  CONSTRAINT pending_orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id)
);
