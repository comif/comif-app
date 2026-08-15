'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

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
      return { error: "Erreur lors de l'envoi de l'email. Réessayez plus tard." };
    }
  }

  redirect('/compte/verifiez');
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/compte/connexion');
}
