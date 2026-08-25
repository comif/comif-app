import { createClient } from '@/utils/supabase/server';

export async function getAuthenticatedCotisant() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: cotisant } = await supabase
    .from('users')
    .select('id, first_name, last_name, balance, promo')
    .ilike('email', user.email)
    .maybeSingle();

  if (!cotisant) return null;

  return { ...cotisant, email: user.email };
}

// Un serveur est un cotisant dont l'email a été relié à une fiche serveur
// depuis /admin/servers. Ça donne accès à /compte/servir sans mot de passe
// séparé, l'identité étant déjà prouvée par la session /compte.
export async function getLinkedServer(email: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('servers')
    .select('id, first_name, last_name')
    .ilike('email', email)
    .maybeSingle();

  return data;
}
