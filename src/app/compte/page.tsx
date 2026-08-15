import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { LogOut, ShoppingBag } from 'lucide-react';
import { signOutAction } from './actions';
import { getAuthenticatedCotisant } from './session';

interface TransactionRow {
  id: number;
  type: string;
  amount: number;
  details: string | { qty: number; name: string }[] | null;
  created_at: string;
}

function formatDetails(details: TransactionRow['details']): string {
  if (typeof details === 'string') return details;
  if (Array.isArray(details)) return details.map(d => `${d.qty}x ${d.name}`).join(', ');
  return '-';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export default async function ComptePage() {
  const cotisant = await getAuthenticatedCotisant();

  if (!cotisant) {
    redirect('/compte/connexion');
  }

  const supabase = await createClient();

  const { data: txData } = await supabase
    .from('transactions')
    .select('*')
    .eq('client_id', cotisant.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const transactions = (txData || []) as TransactionRow[];

  return (
    <div className="min-h-screen bg-[#F4F1EB] font-sans text-stone-800">
      <header className="bg-[#FCFAF5] border-b border-[#E8E4D9] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl border border-[#E8E4D9] flex items-center justify-center p-1.5 shrink-0">
            <img src="/logo.png" alt="COMIF Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-black text-stone-800 leading-tight">{cotisant.first_name} {cotisant.last_name}</h1>
            <p className="text-xs font-medium text-stone-500">{cotisant.promo}</p>
          </div>
        </div>

        <form action={signOutAction}>
          <button type="submit" className="flex items-center gap-1.5 text-stone-400 hover:text-[#5A0A18] transition-colors text-xs font-bold">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </form>
      </header>

      <main className="max-w-md mx-auto p-5 flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-[#E8E4D9] shadow-sm p-6 text-center">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Solde actuel</p>
          <p className={`text-5xl font-black ${cotisant.balance < 0 ? 'text-red-600' : 'text-[#5A0A18]'}`}>
            {cotisant.balance.toFixed(2)} €
          </p>
        </div>

        <Link
          href="/compte/commander"
          className="w-full py-4 rounded-xl font-black text-white bg-[#5A0A18] hover:bg-[#7A1224] transition-colors shadow-lg shadow-[#5A0A18]/20 flex justify-center items-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          Passer une commande
        </Link>

        <div>
          <h2 className="text-sm font-black text-stone-800 uppercase tracking-wider mb-3 px-1">Historique récent</h2>
          <div className="bg-white rounded-2xl border border-[#E8E4D9] shadow-sm overflow-hidden divide-y divide-[#F0EBE0]">
            {transactions.length === 0 && (
              <p className="p-6 text-center text-stone-400 font-medium text-sm">Aucune opération pour le moment.</p>
            )}
            {transactions.map(tx => (
              <div key={tx.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-800 text-sm truncate">{formatDetails(tx.details)}</p>
                  <p className="text-xs text-stone-500 font-medium">{formatDate(tx.created_at)}</p>
                </div>
                <p className={`font-black text-sm shrink-0 ${tx.amount < 0 ? 'text-stone-800' : 'text-emerald-600'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} €
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
