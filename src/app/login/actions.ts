'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string;
  
  // Mots de passe par défaut (à changer plus tard si besoin)
  const BAR_PASSWORD = 'comifisalive';
  const ADMIN_PASSWORD = 'comifisdead';

  if (password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('comif_auth', 'admin', { secure: true, httpOnly: true, path: '/', maxAge: 60 * 60 * 2 }); // 2 heures
    redirect('/admin');
  } 
  else if (password === BAR_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('comif_auth', 'bar', { secure: true, httpOnly: true, path: '/', maxAge: 60 * 60 * 2 }); // 2 heures
    redirect('/');
  }
  
  return { error: 'Mot de passe incorrect' };
}
