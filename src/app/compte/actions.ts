'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getAuthenticatedCotisant } from './session';

export async function requestMagicLink(formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase();

  if (!email) {
    return { error: 'Merci de renseigner votre email.' };
  }

  const supabase = await createClient();

  // On ne dit jamais si l'email existe ou non côté cotisants: le lien n'est
  // envoyé que si un compte correspond, mais le message reste le même dans
  // tous les cas pour ne pas permettre de deviner qui est cotisant.
  const { data: matchedUser } = await supabase
    .from('users')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  if (matchedUser) {
    const origin = (await headers()).get('origin');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Erreur envoi du lien magique:', error);
      // Détail exposé temporairement pour diagnostiquer la config Supabase.
      return { error: `Erreur: ${error.message}` };
    }
  }

  redirect('/compte/verifiez');
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/compte/connexion');
}

export async function createPendingOrder(itemsInput: { product_id: number; qty: number }[]) {
  const cotisant = await getAuthenticatedCotisant();
  if (!cotisant) {
    return { error: 'Session expirée, reconnectez-vous.' };
  }

  const cleanItems = itemsInput.filter(i => i.qty > 0);
  if (cleanItems.length === 0) {
    return { error: 'Le panier est vide.' };
  }

  const supabase = await createClient();
  const productIds = cleanItems.map(i => i.product_id);

  // On ne fait jamais confiance à un nom/prix envoyé par le téléphone de
  // l'étudiant: on relit toujours le vrai prix en base au moment de créer
  // la commande.
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price')
    .in('id', productIds);

  const productMap = new Map((products || []).map(p => [p.id, p]));

  const items = cleanItems
    .filter(i => productMap.has(i.product_id))
    .map(i => {
      const p = productMap.get(i.product_id)!;
      return { product_id: p.id, name: p.name, price: p.price, qty: i.qty };
    });

  if (items.length === 0) {
    return { error: 'Produits introuvables.' };
  }

  const { data: order, error } = await supabase
    .from('pending_orders')
    .insert({ client_id: cotisant.id, items })
    .select('id')
    .single();

  if (error || !order) {
    console.error('Erreur création commande:', error);
    return { error: 'Erreur lors de la création de la commande.' };
  }

  return { id: order.id as string };
}
