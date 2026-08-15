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

  return cotisant;
}
