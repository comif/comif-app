'use client';

import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { loginAction } from './actions';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const searchParams = useSearchParams();
  const isAdminError = searchParams.get('error') === 'admin';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    
    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EB] font-sans flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E8E4D9] shadow-xl p-10 overflow-hidden relative">
        
        {/* Décoration en haut */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#5A0A18]"></div>

        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-[#FCFAF5] rounded-full border border-[#E8E4D9] flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#5A0A18]" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-center text-stone-800 mb-2">Accès Restreint</h1>
        <p className="text-center text-stone-500 font-medium mb-8 text-sm">
          Veuillez saisir votre mot de passe pour accéder à l'interface COMIF.
        </p>

        {isAdminError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-amber-700">Vous avez besoin du mot de passe Administrateur pour accéder à cette page.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">Mot de passe</label>
            <input 
              type="password" 
              name="password"
              required
              placeholder="••••••••"
              className="w-full bg-[#FCFAF5] border-2 border-[#E8E4D9] rounded-xl px-4 py-4 text-stone-800 font-bold focus:outline-none focus:border-[#5A0A18] transition-colors text-center text-xl tracking-widest"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-bold text-center">{error}</p>
          )}

          <button 
            type="submit"
            disabled={isPending}
            className="w-full py-4 rounded-xl font-black text-white bg-[#5A0A18] hover:bg-[#7A1224] transition-colors shadow-lg shadow-[#5A0A18]/20 flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isPending ? 'Vérification...' : 'Déverrouiller'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

      </div>
    </div>
  );
}
