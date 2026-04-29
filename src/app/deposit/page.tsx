"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Coins, CheckCircle, Wallet, User as UserIcon } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  promo: string;
  balance: number;
}

interface ServerData {
  id: string;
  first_name: string;
  last_name: string;
  password_hash: string;
}

export default function DepositPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<UserData[]>([]);
  const [servers, setServers] = useState<ServerData[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [serverPassword, setServerPassword] = useState('');
  const [amount, setAmount] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('last_name');
    
    if (data) setUsers(data);
    if (error) console.error("Erreur chargement utilisateurs:", error);

    const { data: sData } = await supabase.from('servers').select('*').order('first_name');
    if (sData) setServers(sData);
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return [];
    const query = search.toLowerCase();
    return users.filter(u => 
      u.first_name.toLowerCase().includes(query) || 
      u.last_name.toLowerCase().includes(query) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(query) ||
      `${u.last_name} ${u.first_name}`.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [users, search]);

  const handleSelectUser = (u: UserData) => {
    setSelectedUser(u);
    setSearch('');
    setAmount('');
    setSuccessMsg('');
  };

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    if (!selectedUser || !selectedServer || !serverPassword || isNaN(depositAmount) || depositAmount <= 0) return;
    
    setIsProcessing(true);
    
    // Check password
    const server = servers.find(s => s.id === selectedServer);
    if (server) {
      const encoder = new TextEncoder();
      const data = encoder.encode(serverPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (hashed !== server.password_hash) {
        alert("Mot de passe incorrect pour ce serveur !");
        setIsProcessing(false);
        return;
      }
    }
    
    const newBalance = selectedUser.balance + depositAmount;

    // 1. Mettre à jour le solde
    const { error: userError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', selectedUser.id);
      
    if (userError) {
      console.error(userError);
      alert("Erreur lors de la mise à jour du solde");
      setIsProcessing(false);
      return;
    }

    // 2. Insérer une transaction
    const { error: txError } = await supabase.from('transactions').insert([{
      client_id: selectedUser.id,
      server_id: selectedServer,
      amount: depositAmount,
      type: 'renflouement',
      details: 'Renflouement de compte'
    }]);

    if (txError) {
      console.error(txError);
      alert("Erreur lors de la création de la transaction (Vérifiez que client_id est de type UUID dans Supabase) ! L'argent a été ajouté mais pas tracé.");
    }

    // Update local state
    setUsers(users.map(u => u.id === selectedUser.id ? { ...u, balance: newBalance } : u));
    setSelectedUser({ ...selectedUser, balance: newBalance });
    
    setIsProcessing(false);
    setSuccessMsg(`+ ${depositAmount.toFixed(2)} € ajoutés au compte de ${selectedUser.first_name} !`);
    setAmount('');
    setServerPassword('');
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#F4F1EB] font-sans text-stone-800">
      {/* Header */}
      <header className="bg-[#FCFAF5] border-b border-[#E8E4D9] px-8 py-4 sticky top-0 z-20 flex items-center gap-6">
        <Link href="/" className="p-2 -ml-2 rounded-xl text-stone-400 hover:text-stone-800 hover:bg-[#E8E4D9] transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-stone-800 tracking-tight flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#5A0A18]" />
            Renflouement
          </h1>
          <p className="text-xs font-medium text-stone-500">Ajouter du crédit sur le compte d'un étudiant</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-10 flex gap-10">
        
        {/* Colonne de gauche : Recherche */}
        <div className="w-1/2">
          <div className="bg-white rounded-2xl border border-[#E8E4D9] shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-stone-800 mb-4">Rechercher un compte</h2>
            
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type="text" 
                placeholder="Nom ou Prénom..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18] focus:ring-1 focus:ring-[#5A0A18] shadow-inner transition-all"
              />
            </div>

            {search.trim() !== '' && (
              <div className="mt-4 border border-[#E8E4D9] rounded-xl overflow-hidden bg-white shadow-sm">
                {filteredUsers.length > 0 ? (
                  <ul className="divide-y divide-[#F0EBE0]">
                    {filteredUsers.map(u => (
                      <li key={u.id}>
                        <button 
                          onClick={() => handleSelectUser(u)}
                          className="w-full text-left px-4 py-3 hover:bg-[#F4F1EB] transition-colors flex justify-between items-center group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#E8E4D9] flex items-center justify-center text-stone-500 group-hover:bg-[#5A0A18] group-hover:text-white transition-colors">
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-stone-800">{u.last_name} {u.first_name}</div>
                              <div className="text-xs font-medium text-stone-500">{u.promo}</div>
                            </div>
                          </div>
                          <div className={`font-bold ${u.balance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {u.balance.toFixed(2)} €
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-stone-500 text-sm font-medium">
                    Aucun étudiant trouvé.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Colonne de droite : Action */}
        <div className="w-1/2">
          {selectedUser ? (
            <div className="bg-white rounded-2xl border border-[#E8E4D9] shadow-sm p-8 relative overflow-hidden">
              
              {/* Message de succès superposé */}
              {successMsg && (
                <div className="absolute inset-0 bg-emerald-500 z-10 flex flex-col items-center justify-center text-white animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <CheckCircle className="w-16 h-16 mb-4" />
                  <h3 className="text-2xl font-black text-center px-4">{successMsg}</h3>
                  <p className="font-bold mt-4 bg-black/20 px-4 py-2 rounded-lg">Solde actuel : {selectedUser.balance.toFixed(2)} €</p>
                </div>
              )}

              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-stone-800">{selectedUser.last_name} {selectedUser.first_name}</h3>
                  <p className="text-stone-500 font-medium">{selectedUser.promo}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Solde Actuel</p>
                  <p className={`text-3xl font-black ${selectedUser.balance < 0 ? 'text-red-600' : 'text-[#5A0A18]'}`}>
                    {selectedUser.balance.toFixed(2)} €
                  </p>
                </div>
              </div>

              <div className="h-px w-full bg-[#E8E4D9] mb-8"></div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-stone-700 mb-3">Montant à créditer</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-center text-4xl font-black text-stone-800 bg-[#FCFAF5] border-2 border-[#E8E4D9] rounded-2xl py-6 focus:outline-none focus:border-[#5A0A18] focus:bg-white transition-colors"
                    placeholder="0.00"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-stone-400">€</div>
                </div>
              </div>

              <div className="flex gap-3 mb-8">
                {[5, 10, 20, 50].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val.toString())}
                    className="flex-1 py-3 rounded-xl border-2 border-[#E8E4D9] font-bold text-stone-600 hover:border-[#5A0A18] hover:text-[#5A0A18] hover:bg-[#FCFAF5] transition-colors"
                  >
                    +{val} €
                  </button>
                ))}
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-stone-700 mb-3">Serveur effectuant l'opération</label>
                <div className="flex gap-3">
                  <select 
                    value={selectedServer}
                    onChange={(e) => setSelectedServer(e.target.value)}
                    className="w-1/2 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl px-4 py-3 text-stone-800 font-bold focus:outline-none focus:border-[#5A0A18] transition-colors"
                  >
                    <option value="" disabled>-- Sélectionnez votre nom --</option>
                    {servers.map(s => (
                      <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                    ))}
                  </select>
                  
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={serverPassword}
                    onChange={(e) => setServerPassword(e.target.value)}
                    disabled={!selectedServer}
                    className="w-1/2 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl px-4 py-3 text-stone-800 font-bold focus:outline-none focus:border-[#5A0A18] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <button 
                onClick={handleDeposit}
                disabled={!amount || !selectedServer || !serverPassword || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || isProcessing}
                className="w-full py-4 rounded-xl font-black text-lg text-white bg-[#5A0A18] hover:bg-[#7A1224] transition-colors shadow-lg shadow-[#5A0A18]/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                {isProcessing ? 'Traitement...' : 'Valider le dépôt'}
              </button>

            </div>
          ) : (
            <div className="bg-[#FCFAF5] rounded-2xl border border-[#E8E4D9] border-dashed flex flex-col items-center justify-center p-12 text-center h-[500px]">
              <div className="w-16 h-16 bg-[#E8E4D9] rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-2">Sélectionnez un étudiant</h3>
              <p className="text-stone-500 font-medium">Recherchez un étudiant à gauche pour afficher son compte et ajouter des fonds.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
