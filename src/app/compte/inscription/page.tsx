'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, KeyRound } from 'lucide-react';
import { signUpAction } from '../actions';

export default function InscriptionPage() {
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm') as string;

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsPending(true);
    const result = await signUpAction(formData);

    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EB] font-sans flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white rounded-3xl border border-[#E8E4D9] shadow-xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#5A0A18]" />

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#FCFAF5] rounded-full border border-[#E8E4D9] flex items-center justify-center p-2">
            <img src="/logo.png" alt="COMIF Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <h1 className="text-xl font-black text-center text-stone-800 mb-2">Créer un compte</h1>
        <p className="text-center text-stone-500 font-medium mb-8 text-sm">
          Utilisez l&apos;email associé à votre compte cotisant. Un email de confirmation vous sera envoyé une seule fois.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                name="email"
                required
                placeholder="prenom.nom@ecole.fr"
                className="w-full bg-[#FCFAF5] border-2 border-[#E8E4D9] rounded-xl pl-12 pr-4 py-4 text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">Mot de passe</label>
            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="Au moins 6 caractères"
                className="w-full bg-[#FCFAF5] border-2 border-[#E8E4D9] rounded-xl pl-12 pr-4 py-4 text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">Confirmer le mot de passe</label>
            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                name="confirm"
                required
                minLength={6}
                placeholder="Retapez le mot de passe"
                className="w-full bg-[#FCFAF5] border-2 border-[#E8E4D9] rounded-xl pl-12 pr-4 py-4 text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18] transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 rounded-xl font-black text-white bg-[#5A0A18] hover:bg-[#7A1224] transition-colors shadow-lg shadow-[#5A0A18]/20 flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isPending ? '...' : 'Créer mon compte'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <p className="text-center text-sm text-stone-500 font-medium mt-6">
          Déjà un compte ?{' '}
          <Link href="/compte/connexion" className="text-[#5A0A18] font-bold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
