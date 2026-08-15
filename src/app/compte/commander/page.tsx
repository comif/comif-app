import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getAuthenticatedCotisant } from '../session';
import CommanderClient from './CommanderClient';

export default async function CommanderPage() {
  const cotisant = await getAuthenticatedCotisant();

  if (!cotisant) {
    redirect('/compte/connexion');
  }

  const supabase = await createClient();

  const { data: catData } = await supabase
    .from('categories')
    .select('name')
    .eq('visible', 1);

  const categories = catData ? catData.map(c => c.name) : [];

  const { data: prodData } = categories.length > 0
    ? await supabase
        .from('products')
        .select('id, name, category_name, price, is_favorite')
        .in('category_name', categories)
    : { data: [] };

  return <CommanderClient categories={categories} products={prodData || []} />;
}
