"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Search, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface UserData {
  id: number;
  last_name: string;
  first_name: string;
  promo: string;
  balance: number;
  email: string;
  membership_end: string;
}

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [newLastName, setNewLastName] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newPromo, setNewPromo] = useState('EI25');
  const [newBalance, setNewBalance] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newMembershipEnd, setNewMembershipEnd] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<UserData>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('last_name');
    
    if (data) setUsers(data);
    if (error) console.error("Erreur de chargement:", error);
    setIsLoading(false);
  };

  const startEdit = (user: UserData) => {
    setEditingId(user.id);
    setEditFormData(user);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    // Optimistic update
    setUsers(users.map(u => u.id === editingId ? { ...u, ...editFormData, last_name: editFormData.last_name?.toUpperCase() || '' } as UserData : u));
    setEditingId(null);

    const { error } = await supabase
      .from('users')
      .update({ 
        last_name: editFormData.last_name?.toUpperCase(), 
        first_name: editFormData.first_name,
        promo: editFormData.promo,
        balance: editFormData.balance,
        email: editFormData.email,
        membership_end: editFormData.membership_end
      })
      .eq('id', editingId);

    if (error) {
      console.error("Erreur de sauvegarde:", error);
      fetchUsers(); // Revert
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [users, searchQuery]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLastName.trim() || !newFirstName.trim()) return;
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        last_name: newLastName.trim().toUpperCase(), 
        first_name: newFirstName.trim(),
        promo: newPromo,
        balance: parseFloat(newBalance) || 0,
        email: newEmail.trim() || null,
        membership_end: newMembershipEnd || null
      }])
      .select();
      
    if (data && data.length > 0) {
      setUsers([...users, data[0]]);
    }
    if (error) console.error("Erreur d'ajout:", error);
    
    // Reset form
    setNewLastName('');
    setNewFirstName('');
    setNewPromo('EI25');
    setNewBalance('');
    setNewEmail('');
    setNewMembershipEnd('');
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Êtes-vous sûr de vouloir supprimer ce cotisant ?")) {
      setUsers(users.filter(u => u.id !== id));
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Erreur de suppression:", error);
        fetchUsers();
      }
    }
  };

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight mb-2">Gestion des cotisants</h1>
        <p className="text-stone-500">Ajoutez, modifiez ou supprimez les membres de l'association COMIF.</p>
      </div>

      {/* Top section: List of users */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-stone-800">Cotisants existants</h2>
          
          <div className="relative w-80">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, prénom, email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#E8E4D9] rounded-xl text-stone-800 text-sm font-medium focus:outline-none focus:border-[#5A0A18] shadow-sm transition-colors"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E4D9] shadow-sm overflow-hidden flex flex-col max-h-[500px]">
          <div className="overflow-y-auto custom-scrollbar">
            <table className="w-full text-left relative">
              <thead className="bg-[#FCFAF5] border-b border-[#E8E4D9] sticky top-0 z-10 shadow-sm">
                <tr className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-4 px-6 bg-[#FCFAF5]">Nom</th>
                  <th className="py-4 px-6 bg-[#FCFAF5]">Prénom</th>
                  <th className="py-4 px-6 bg-[#FCFAF5]">Promo</th>
                  <th className="py-4 px-6 bg-[#FCFAF5] text-right">Solde</th>
                  <th className="py-4 px-6 bg-[#FCFAF5]">Mail</th>
                  <th className="py-4 px-6 bg-[#FCFAF5]">Fin de cotisation</th>
                  <th className="py-4 px-6 bg-[#FCFAF5] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE0] text-sm">
                {filteredUsers.map(user => {
                  const isEditing = editingId === user.id;
                  return (
                    <tr key={user.id} className={`transition-colors ${isEditing ? 'bg-amber-50' : 'hover:bg-[#F4F1EB]'}`}>
                      {isEditing ? (
                        <>
                          <td className="py-2 px-6">
                            <input type="text" value={editFormData.last_name || ''} onChange={e => setEditFormData({...editFormData, last_name: e.target.value.toUpperCase()})} className="w-full px-2 py-1.5 border border-amber-300 rounded uppercase text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
                          </td>
                          <td className="py-2 px-6">
                            <input type="text" value={editFormData.first_name || ''} onChange={e => setEditFormData({...editFormData, first_name: e.target.value})} className="w-full px-2 py-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
                          </td>
                          <td className="py-2 px-6">
                            <select value={editFormData.promo || ''} onChange={e => setEditFormData({...editFormData, promo: e.target.value})} className="w-full px-2 py-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500">
                              <option value="EI23">EI23</option>
                              <option value="EI24">EI24</option>
                              <option value="EI25">EI25</option>
                              <option value="ICM">ICM</option>
                              <option value="Enseignant">Enseignant</option>
                              <option value="Recherche">Recherche</option>
                            </select>
                          </td>
                          <td className="py-2 px-6">
                            <input type="number" step="0.01" value={editFormData.balance ?? ''} onChange={e => setEditFormData({...editFormData, balance: parseFloat(e.target.value) || 0})} className="w-20 px-2 py-1.5 border border-amber-300 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-amber-500" />
                          </td>
                          <td className="py-2 px-6">
                            <input type="email" value={editFormData.email || ''} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full px-2 py-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
                          </td>
                          <td className="py-2 px-6">
                            <input type="date" value={editFormData.membership_end || ''} onChange={e => setEditFormData({...editFormData, membership_end: e.target.value})} className="w-full px-2 py-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
                          </td>
                          <td className="py-2 px-6 text-right flex items-center justify-end gap-2">
                            <button onClick={saveEdit} className="px-3 py-1.5 rounded-lg font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 hover:bg-emerald-200 transition-colors text-xs">OK</button>
                            <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg font-bold text-stone-600 bg-stone-200 border border-stone-300 hover:bg-stone-300 transition-colors text-xs">Annul.</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-6 font-black text-stone-800">{user.last_name}</td>
                          <td className="py-3 px-6 font-medium text-stone-600">{user.first_name}</td>
                          <td className="py-3 px-6 text-stone-600">{user.promo}</td>
                          <td className="py-3 px-6 text-right font-black">
                            <span className={user.balance < 0 ? 'text-red-500' : 'text-emerald-600'}>
                              {user.balance.toFixed(2)} €
                            </span>
                          </td>
                          <td className="py-3 px-6 text-stone-500">{user.email || '-'}</td>
                          <td className="py-3 px-6 text-stone-500">{user.membership_end || '-'}</td>
                          <td className="py-3 px-6 text-right flex items-center justify-end gap-2">
                            <button 
                              onClick={() => startEdit(user)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-stone-600 bg-stone-100 border border-stone-200 hover:bg-stone-200 hover:text-stone-800 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Modifier
                            </button>
                            <button 
                              onClick={() => handleDelete(user.id)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Supprimer
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400 font-medium bg-white">Aucun cotisant trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom section: Add Form */}
      <div>
        <h2 className="text-xl font-bold text-stone-800 mb-4">Nouveau Cotisant</h2>
        <div className="bg-white rounded-2xl border border-[#E8E4D9] shadow-sm overflow-hidden">
          <form onSubmit={handleAddUser} className="p-6 flex flex-col xl:flex-row gap-4 items-end">
            
            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Nom</label>
              <input 
                type="text" 
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                placeholder="ex: Voilquin"
                className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18] uppercase"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Prénom</label>
              <input 
                type="text" 
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                placeholder="ex: Louis"
                className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18]"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 w-32 shrink-0">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Promo</label>
              <select 
                value={newPromo}
                onChange={(e) => setNewPromo(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18]"
              >
                <option value="EI23">EI23</option>
                <option value="EI24">EI24</option>
                <option value="EI25">EI25</option>
                <option value="ICM">ICM</option>
                <option value="Enseignant">Enseignant</option>
                <option value="Recherche">Recherche</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 w-32 shrink-0">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Solde Initial</label>
              <input 
                type="number" 
                step="0.01"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="ex: 0.00"
                className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18]"
              />
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Mail</label>
              <input 
                type="email" 
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="ex: louis.voilquin@etu.emse.fr"
                className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18]"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-48 shrink-0">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Fin de cotisation</label>
              <input 
                type="date" 
                value={newMembershipEnd}
                onChange={(e) => setNewMembershipEnd(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18]"
              />
            </div>

            <div className="w-32 shrink-0">
              <button 
                type="submit"
                disabled={!newLastName.trim() || !newFirstName.trim()}
                className="w-full bg-[#5A0A18] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#7A1224] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#5A0A18]/20"
              >
                <UserPlus className="w-4 h-4" />
                Valider
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
}
