"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Search, UserPlus, Pencil, Trash2, KeyRound } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface ServerData {
  id: number;
  last_name: string;
  first_name: string;
  password_hash?: string;
}

export default function ServersManagementPage() {
  const supabase = createClient();
  const [servers, setServers] = useState<ServerData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [newLastName, setNewLastName] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ServerData>>({});

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('servers')
      .select('*')
      .order('last_name');
    
    if (data) setServers(data);
    if (error) console.error("Erreur de chargement:", error);
    setIsLoading(false);
  };

  const startEdit = (server: ServerData) => {
    setEditingId(server.id);
    setEditFormData(server);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    // Optimistic update
    setServers(servers.map(s => s.id === editingId ? { ...s, ...editFormData, last_name: editFormData.last_name?.toUpperCase() || '' } as ServerData : s));
    setEditingId(null);

    const { error } = await supabase
      .from('servers')
      .update({ 
        last_name: editFormData.last_name?.toUpperCase(), 
        first_name: editFormData.first_name 
      })
      .eq('id', editingId);

    if (error) {
      console.error("Erreur de sauvegarde:", error);
      fetchServers(); // Revert
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const filteredServers = useMemo(() => {
    return servers.filter(s => 
      s.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.first_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [servers, searchQuery]);

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLastName.trim() || !newFirstName.trim() || !newPassword.trim()) return;
    
    const { data, error } = await supabase
      .from('servers')
      .insert([{ 
        last_name: newLastName.trim().toUpperCase(), 
        first_name: newFirstName.trim(),
        password_hash: newPassword.trim() // TODO: hash before sending
      }])
      .select();
      
    if (data && data.length > 0) {
      setServers([...servers, data[0]]);
    }
    if (error) console.error("Erreur d'ajout:", error);
    
    // Reset form
    setNewLastName('');
    setNewFirstName('');
    setNewPassword('');
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Êtes-vous sûr de vouloir supprimer ce serveur ?")) {
      // Optimistic update
      setServers(servers.filter(s => s.id !== id));
      
      const { error } = await supabase
        .from('servers')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Erreur de suppression:", error);
        fetchServers(); // Revert
      }
    }
  };

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight mb-2">Gestion des serveurs</h1>
        <p className="text-stone-500">Ajoutez, modifiez ou supprimez les membres autorisés à utiliser la caisse.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: List of servers */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-stone-800">Serveurs existants</h2>
            
            <div className="relative w-72">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type="text" 
                placeholder="Rechercher un serveur..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18] shadow-sm transition-colors"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E4D9] shadow-sm overflow-hidden flex flex-col max-h-[600px]">
            <div className="overflow-y-auto custom-scrollbar">
              <table className="w-full text-left relative">
                <thead className="bg-[#FCFAF5] border-b border-[#E8E4D9] sticky top-0 z-10 shadow-sm">
                  <tr className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    <th className="py-4 px-6 bg-[#FCFAF5]">Nom</th>
                    <th className="py-4 px-6 bg-[#FCFAF5]">Prénom</th>
                    <th className="py-4 px-6 bg-[#FCFAF5] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE0] text-sm">
                  {filteredServers.map(server => {
                    const isEditing = editingId === server.id;
                    return (
                      <tr key={server.id} className={`transition-colors ${isEditing ? 'bg-amber-50' : 'hover:bg-[#F4F1EB]'}`}>
                        {isEditing ? (
                          <>
                            <td className="py-2 px-6">
                              <input type="text" value={editFormData.last_name || ''} onChange={e => setEditFormData({...editFormData, last_name: e.target.value.toUpperCase()})} className="w-full px-2 py-1.5 border border-amber-300 rounded uppercase text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
                            </td>
                            <td className="py-2 px-6">
                              <input type="text" value={editFormData.first_name || ''} onChange={e => setEditFormData({...editFormData, first_name: e.target.value})} className="w-full px-2 py-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
                            </td>
                            <td className="py-2 px-6 text-right flex items-center justify-end gap-2">
                              <button onClick={saveEdit} className="px-3 py-1.5 rounded-lg font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 hover:bg-emerald-200 transition-colors text-xs">OK</button>
                              <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg font-bold text-stone-600 bg-stone-200 border border-stone-300 hover:bg-stone-300 transition-colors text-xs">Annul.</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 px-6 font-black text-stone-800">{server.last_name}</td>
                            <td className="py-4 px-6 font-medium text-stone-600">{server.first_name}</td>
                            <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                              <button 
                                onClick={() => startEdit(server)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-stone-600 bg-stone-100 border border-stone-200 hover:bg-stone-200 hover:text-stone-800 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Modifier
                              </button>
                              <button 
                                onClick={() => handleDelete(server.id)}
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
                  {filteredServers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-stone-400 font-medium bg-white">Aucun serveur trouvé.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Add Form */}
        <div className="xl:col-span-1 sticky top-10">
          <div className="bg-white rounded-2xl border border-[#E8E4D9] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#E8E4D9] bg-[#5A0A18] text-white flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-rose-300" />
              <h3 className="font-bold text-lg tracking-tight">Nouveau Serveur</h3>
            </div>
            
            <form onSubmit={handleAddServer} className="p-6 flex flex-col gap-5">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Nom</label>
                <input 
                  type="text" 
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  placeholder="Ex: DUPONT"
                  className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18] uppercase"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Prénom</label>
                <input 
                  type="text" 
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="Ex: Jean"
                  className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Mot de passe</label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-bold focus:outline-none focus:border-[#5A0A18]"
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <button 
                  type="submit"
                  disabled={!newLastName.trim() || !newFirstName.trim() || !newPassword.trim()}
                  className="w-full bg-[#5A0A18] text-white py-3 rounded-xl font-bold hover:bg-[#7A1224] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#5A0A18]/20"
                >
                  Ajouter le serveur
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
