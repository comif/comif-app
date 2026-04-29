"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Category {
  id: number;
  name: string;
  visible: number;
  service: string;
}

export default function AdminCategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newService, setNewService] = useState('Les Deux');
  const [newVisible, setNewVisible] = useState('1');

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Category>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (data) setCategories(data);
    if (error) console.error("Erreur de chargement:", error);
    setIsLoading(false);
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditFormData(category);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    
    // Optimistic update
    setCategories(categories.map(c => c.id === editingId ? { ...c, ...editFormData } as Category : c));
    setEditingId(null);

    const { error } = await supabase
      .from('categories')
      .update({ name: editFormData.name, service: editFormData.service, visible: editFormData.visible })
      .eq('id', editingId);

    if (error) {
      console.error("Erreur de sauvegarde:", error);
      fetchCategories(); // Revert on error
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const toggleVisibility = async (id: number, currentVisibility: number) => {
    const newVisibility = currentVisibility === 1 ? 0 : 1;
    // Optimistic update
    setCategories(categories.map(c => c.id === id ? { ...c, visible: newVisibility } : c));

    const { error } = await supabase
      .from('categories')
      .update({ visible: newVisibility })
      .eq('id', id);

    if (error) {
      console.error("Erreur de visibilité:", error);
      fetchCategories(); // Revert on error
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    const visibleInt = parseInt(newVisible, 10);
    
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: newName.trim(), visible: visibleInt, service: newService }])
      .select();
      
    if (data && data.length > 0) {
      setCategories([...categories, data[0]]);
    }
    if (error) console.error("Erreur d'ajout:", error);
    
    // Reset form
    setNewName('');
    setNewVisible('1');
    setNewService('Les Deux');
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      // Optimistic update
      setCategories(categories.filter(c => c.id !== id));
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Erreur de suppression:", error);
        fetchCategories(); // Revert
      }
    }
  };

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight mb-2">Gestion des catégories</h1>
        <p className="text-stone-500">Gérez les onglets et raccourcis disponibles dans le Tibar et la Tipause.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: List of categories */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-stone-800">Catégories existantes</h2>
            
            <div className="relative w-72">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type="text" 
                placeholder="Rechercher une catégorie..." 
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
                    <th className="py-4 px-6 bg-[#FCFAF5] text-center">Service</th>
                    <th className="py-4 px-6 bg-[#FCFAF5] text-center">Visible</th>
                    <th className="py-4 px-6 bg-[#FCFAF5] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE0] text-sm">
                  {filteredCategories.map(category => {
                    const isEditing = editingId === category.id;
                    const isCatVisible = category.visible === 1;
                    return (
                      <tr key={category.id} className={`transition-colors ${isEditing ? 'bg-amber-50' : 'hover:bg-[#F4F1EB]'}`}>
                        {isEditing ? (
                          <>
                            <td className="py-2 px-6">
                              <input type="text" value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full px-2 py-1.5 border border-amber-300 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500" />
                            </td>
                            <td className="py-2 px-6">
                              <select value={editFormData.service || 'Les Deux'} onChange={e => setEditFormData({...editFormData, service: e.target.value})} className="w-full px-2 py-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500">
                                <option value="Tibbar">Tibbar</option>
                                <option value="Titpause">Titpause</option>
                                <option value="Les Deux">Les Deux</option>
                              </select>
                            </td>
                            <td className="py-2 px-6">
                              <select value={editFormData.visible?.toString() || '0'} onChange={e => setEditFormData({...editFormData, visible: parseInt(e.target.value, 10)})} className="w-24 mx-auto block px-2 py-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500">
                                <option value="1">Oui</option>
                                <option value="0">Non</option>
                              </select>
                            </td>
                            <td className="py-2 px-6 text-right flex items-center justify-end gap-2">
                              <button onClick={saveEdit} className="px-3 py-1.5 rounded-lg font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 hover:bg-emerald-200 transition-colors text-xs">OK</button>
                              <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg font-bold text-stone-600 bg-stone-200 border border-stone-300 hover:bg-stone-300 transition-colors text-xs">Annul.</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 px-6 font-black text-stone-800">{category.name}</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                                category.service === 'Tibbar' ? 'bg-[#5A0A18]/10 text-[#5A0A18] border-[#5A0A18]/20' : 
                                category.service === 'Titpause' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                                'bg-stone-100 text-stone-600 border-stone-200'
                              }`}>
                                {category.service || 'Les Deux'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button 
                                onClick={() => toggleVisibility(category.id, category.visible)}
                                className={`w-10 h-6 rounded-full relative transition-colors ${isCatVisible ? 'bg-emerald-500' : 'bg-stone-300'}`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isCatVisible ? 'left-5' : 'left-1'}`}></div>
                              </button>
                            </td>
                            <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                              <button 
                                onClick={() => startEdit(category)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-stone-600 bg-stone-100 border border-stone-200 hover:bg-stone-200 hover:text-stone-800 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Modifier
                              </button>
                              <button 
                                onClick={() => handleDelete(category.id)}
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
                  {filteredCategories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-stone-400 font-medium bg-white">Aucune catégorie trouvée.</td>
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
              <Layers className="w-5 h-5 text-rose-300" />
              <h3 className="font-bold text-lg tracking-tight">Nouvelle catégorie</h3>
            </div>
            
            <form onSubmit={handleAddCategory} className="p-6 flex flex-col gap-5">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Nom de la catégorie</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ex: Boisson Chaude"
                  className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Service</label>
                <select 
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18]"
                >
                  <option value="Tibbar">Tibbar (Soir uniquement)</option>
                  <option value="Titpause">Titpause (Jour uniquement)</option>
                  <option value="Les Deux">Les Deux</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Visible sur la caisse</label>
                <select 
                  value={newVisible}
                  onChange={(e) => setNewVisible(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18]"
                >
                  <option value="1">Oui</option>
                  <option value="0">Non</option>
                </select>
              </div>

              <div className="mt-4">
                <button 
                  type="submit"
                  disabled={!newName.trim()}
                  className="w-full bg-[#5A0A18] text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-[#7A1224] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#5A0A18]/20"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter la catégorie
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
