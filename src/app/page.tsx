"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Coins, Beer, Croissant, User, ClipboardList, Plus, Check } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function Home() {
  const supabase = createClient();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    // Fetch last 5 achats
    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'achat')
      .order('created_at', { ascending: false })
      .limit(5);

    if (txData && txData.length > 0) {
      const clientIds = [...new Set(txData.map(t => t.client_id).filter(Boolean))];
      let userMap = new Map();
      
      if (clientIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, first_name, last_name').in('id', clientIds);
        if (users) {
          userMap = new Map(users.map(u => [u.id, `${u.first_name} ${u.last_name}`]));
        }
      }

      const formatted = txData.map(t => {
        let detailsText = '';
        if (typeof t.details === 'string') detailsText = t.details;
        else if (Array.isArray(t.details)) detailsText = t.details.map((d: any) => `${d.qty}x ${d.name}`).join(', ');

        return {
          id: t.id,
          product: detailsText || 'Commande',
          qty: '-',
          amount: Math.abs(t.amount), // Amount is negative in DB for achats
          consumer: userMap.get(t.client_id) || 'Inconnu',
          date: new Date(t.created_at).toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'
          })
        };
      });
      setRecentOrders(formatted);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F1EB] font-sans text-stone-800">
      
      {/* Navbar */}
      <header className="bg-[#FCFAF5] border-b border-[#E8E4D9] px-8 py-4 sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="/logo.png" alt="COMIF Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-stone-800 tracking-tight">
            Commission Foyer
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <Link href="/admin/products" className="flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-[#5A0A18] transition-colors">
            <User className="w-4 h-4" />
            Espace Admin
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-10">
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-stone-800 tracking-tight">Tableau de bord</h2>
          <p className="text-stone-500 mt-2 text-sm font-medium">Sélectionnez une interface pour commencer l'encaissement.</p>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-12">
          
          <Link href="/deposit" className="group bg-[#FCFAF5] p-6 rounded-2xl border border-[#E8E4D9] shadow-sm hover:border-[#5A0A18] hover:shadow-md transition-all text-left flex flex-col justify-between h-44">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#E8E4D9] flex items-center justify-center group-hover:bg-[#5A0A18]/5 group-hover:border-[#5A0A18]/20 transition-colors">
              <Coins className="w-6 h-6 text-stone-500 group-hover:text-[#5A0A18] transition-colors stroke-[1.5]" />
            </div>
            <div>
              <span className="text-lg font-bold text-stone-800 leading-tight block mb-1">Renflouer<br/>un compte</span>
              <span className="text-xs font-medium text-stone-500">Dépôts et virements</span>
            </div>
          </Link>

          <Link href="/pos?service=Tibbar" className="group bg-[#FCFAF5] p-6 rounded-2xl border border-[#E8E4D9] shadow-sm hover:border-[#5A0A18] hover:shadow-md transition-all text-left flex flex-col justify-between h-44">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#E8E4D9] flex items-center justify-center group-hover:bg-[#5A0A18]/5 group-hover:border-[#5A0A18]/20 transition-colors">
              <Beer className="w-6 h-6 text-stone-500 group-hover:text-[#5A0A18] transition-colors stroke-[1.5]" />
            </div>
            <div>
              <span className="text-xl font-black text-stone-800 tracking-wide block mb-1">TIBBAR</span>
              <span className="text-xs font-medium text-stone-500">Service du soir</span>
            </div>
          </Link>

          <Link href="/pos?service=Titpause" className="group bg-[#FCFAF5] p-6 rounded-2xl border border-[#E8E4D9] shadow-sm hover:border-[#5A0A18] hover:shadow-md transition-all text-left flex flex-col justify-between h-44">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#E8E4D9] flex items-center justify-center group-hover:bg-[#5A0A18]/5 group-hover:border-[#5A0A18]/20 transition-colors">
              <Croissant className="w-6 h-6 text-stone-500 group-hover:text-[#5A0A18] transition-colors stroke-[1.5]" />
            </div>
            <div>
              <span className="text-xl font-black text-stone-800 tracking-wide block mb-1">TITPAUSE</span>
              <span className="text-xs font-medium text-stone-500">Service de jour</span>
            </div>
          </Link>

        </div>

        {/* Dernières commandes */}
        <div className="bg-[#FCFAF5] rounded-2xl border border-[#E8E4D9] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E8E4D9] flex justify-between items-center bg-[#F8F5EE]">
            <h3 className="text-base font-bold text-stone-800">Dernières commandes</h3>
            <Link href="/admin/history" className="text-sm font-semibold text-[#5A0A18] hover:underline">Afficher tout</Link>
          </div>
          
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold text-stone-500 uppercase tracking-wider border-b border-[#E8E4D9]">
                <th className="py-4 px-6">Produits</th>
                <th className="py-4 px-4 w-32 text-right">Montant</th>
                <th className="py-4 px-6">Client</th>
                <th className="py-4 px-6 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE0] text-sm">
              {isLoading ? (
                <tr><td colSpan={4} className="py-8 text-center text-stone-500 font-medium">Chargement des transactions...</td></tr>
              ) : recentOrders.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-stone-500 font-medium">Aucune commande récente.</td></tr>
              ) : recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#F4F1EB] transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-stone-800 max-w-xs truncate">{order.product}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-stone-800">{order.amount.toFixed(2)} €</td>
                  <td className="py-3.5 px-6 font-medium text-stone-600">{order.consumer}</td>
                  <td className="py-3.5 px-6 text-right text-stone-400 font-medium">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}
