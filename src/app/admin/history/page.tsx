"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Search, AlertTriangle, ArrowRightLeft, Coins } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type TabType = 'negative' | 'transactions' | 'deposits';

interface NegativeUser {
  id: number;
  name: string;
  balance: number;
  lastUpdate?: string;
}

interface Transaction {
  id: number;
  name: string;
  amount: number;
  date: string;
  details: string;
  server?: string;
  type: string;
}

export default function HistoryPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<TabType>('negative');
  const [searchQuery, setSearchQuery] = useState('');

  const [negativeUsers, setNegativeUsers] = useState<NegativeUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deposits, setDeposits] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    // 1. Fetch ALL users (for mapping and negative list)
    const { data: usersData } = await supabase
      .from('users')
      .select('id, first_name, last_name, balance')
      .order('last_name', { ascending: true });

    if (usersData) {
      setNegativeUsers(
        usersData
          .filter(u => u.balance < 0)
          .sort((a, b) => a.balance - b.balance)
          .map(u => ({
            id: u.id,
            name: `${u.first_name} ${u.last_name}`,
            balance: u.balance,
          }))
      );
    }

    // 2. Fetch transactions (Sans foreign key relation pour éviter les bugs de cache Supabase)
    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (txData) {
      // Fetch only the users that are in the transactions
      const clientIds = [...new Set(txData.map(t => t.client_id).filter(Boolean))];
      const serverIds = [...new Set(txData.map(t => t.server_id).filter(Boolean))];
      
      let userMap = new Map();
      let serverMap = new Map();

      if (clientIds.length > 0) {
        const { data: txUsers } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', clientIds);
          
        if (txUsers) {
          userMap = new Map(txUsers.map(u => [u.id, `${u.first_name} ${u.last_name}`]));
        }
      }

      if (serverIds.length > 0) {
        const { data: txServers } = await supabase
          .from('servers')
          .select('id, first_name, last_name')
          .in('id', serverIds);

        if (txServers) {
          serverMap = new Map(txServers.map(s => [s.id, `${s.first_name}`]));
        }
      }
      
      const formattedTx = txData.map(t => {
        const userName = userMap.get(t.client_id) || 'Inconnu';
        const serverName = serverMap.get(t.server_id) || '-';
        const date = new Date(t.created_at).toLocaleString('fr-FR', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'
        });
        
        let detailsText = '';
        if (typeof t.details === 'string') {
          detailsText = t.details;
        } else if (Array.isArray(t.details)) {
          detailsText = t.details.map((d: any) => `${d.qty}x ${d.name}`).join(', ');
        }

        return {
          id: t.id,
          name: userName,
          amount: t.amount,
          date,
          details: detailsText || '-',
          server: serverName,
          type: t.type
        };
      });

      setTransactions(formattedTx.filter(t => t.type === 'achat'));
      setDeposits(formattedTx.filter(t => t.type === 'renflouement'));
    }

    setIsLoading(false);
  };

  // Filtering
  const filteredNegative = useMemo(() => negativeUsers.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ), [negativeUsers, searchQuery]);

  const filteredTransactions = useMemo(() => transactions.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.date.includes(searchQuery) ||
    item.details.toLowerCase().includes(searchQuery.toLowerCase())
  ), [transactions, searchQuery]);

  const filteredDeposits = useMemo(() => deposits.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.date.includes(searchQuery) ||
    item.details.toLowerCase().includes(searchQuery.toLowerCase())
  ), [deposits, searchQuery]);

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight mb-2">Suivi des comptes</h1>
        <p className="text-stone-500 mb-8">Consultez l'historique des opérations et les soldes débiteurs.</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#E8E4D9]">
          <button 
            onClick={() => { setActiveTab('negative'); setSearchQuery(''); }}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'negative' ? 'border-[#5A0A18] text-[#5A0A18]' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Comptes en négatif
            </div>
          </button>
          <button 
            onClick={() => { setActiveTab('transactions'); setSearchQuery(''); }}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'transactions' ? 'border-[#5A0A18] text-[#5A0A18]' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
          >
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Dernières transactions
            </div>
          </button>
          <button 
            onClick={() => { setActiveTab('deposits'); setSearchQuery(''); }}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'deposits' ? 'border-[#5A0A18] text-[#5A0A18]' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
          >
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Derniers renflouements
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, date ou produit..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18] shadow-sm transition-colors"
          />
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-[#E8E4D9] shadow-sm overflow-hidden flex flex-col max-h-[600px]">
          <div className="overflow-y-auto custom-scrollbar">
            
            {activeTab === 'negative' && (
              <table className="w-full text-left relative">
                <thead className="bg-[#FCFAF5] border-b border-[#E8E4D9] sticky top-0 z-10 shadow-sm">
                  <tr className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    <th className="py-4 px-6 bg-[#FCFAF5]">Client</th>
                    <th className="py-4 px-6 bg-[#FCFAF5] text-right">Solde Actuel</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-[#F0EBE0] text-sm">
                {filteredNegative.map(user => (
                  <tr key={user.id} className="hover:bg-[#F4F1EB] transition-colors">
                    <td className="py-4 px-6 font-semibold text-stone-800">{user.name}</td>
                    <td className="py-4 px-6 text-right font-black text-red-600">{user.balance.toFixed(2)}€</td>
                  </tr>
                ))}
                {filteredNegative.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-stone-400 font-medium">Aucun compte dans le rouge !</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'transactions' && (
            <table className="w-full text-left relative">
              <thead className="bg-[#FCFAF5] border-b border-[#E8E4D9] sticky top-0 z-10 shadow-sm">
                <tr className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-4 px-6 bg-[#FCFAF5]">Date</th>
                  <th className="py-4 px-6 bg-[#FCFAF5]">Client</th>
                  <th className="py-4 px-6 bg-[#FCFAF5]">Produits</th>
                  <th className="py-4 px-6 bg-[#FCFAF5] text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE0] text-sm">
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-[#F4F1EB] transition-colors">
                    <td className="py-4 px-6 text-stone-500">{tx.date}</td>
                    <td className="py-4 px-6 font-semibold text-stone-800">{tx.name}</td>
                    <td className="py-4 px-6 text-stone-600">{tx.details}</td>
                    <td className="py-4 px-6 text-right font-black text-stone-800">{tx.amount.toFixed(2)}€</td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-400 font-medium">Aucune transaction trouvée.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'deposits' && (
            <table className="w-full text-left relative">
              <thead className="bg-[#FCFAF5] border-b border-[#E8E4D9] sticky top-0 z-10 shadow-sm">
                <tr className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-4 px-6 bg-[#FCFAF5]">Date</th>
                  <th className="py-4 px-6 bg-[#FCFAF5]">Client</th>
                  <th className="py-4 px-6 bg-[#FCFAF5]">Moyen de paiement</th>
                  <th className="py-4 px-6 bg-[#FCFAF5] text-right">Serveur</th>
                  <th className="py-4 px-6 bg-[#FCFAF5] text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE0] text-sm">
                {filteredDeposits.map(dep => (
                  <tr key={dep.id} className="hover:bg-[#F4F1EB] transition-colors">
                    <td className="py-4 px-6 text-stone-500">{dep.date}</td>
                    <td className="py-4 px-6 font-semibold text-stone-800">{dep.name}</td>
                    <td className="py-4 px-6 text-stone-600">
                      <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-xs font-semibold border border-stone-200">
                        {dep.details}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-stone-500 font-medium">{dep.server}</td>
                    <td className="py-4 px-6 text-right font-black text-emerald-600">+{dep.amount.toFixed(2)}€</td>
                  </tr>
                ))}
                {filteredDeposits.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400 font-medium">Aucun renflouement trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          </div>
        </div>
      </div>
    </div>
  );
}
