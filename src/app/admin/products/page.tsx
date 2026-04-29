"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Pencil, Trash2, PackagePlus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Product {
  id: number;
  name: string;
  category_name: string;
  price: number;
  volume: number;
  degree_or_mass: number;
  is_favorite: boolean;
}

export default function AdminProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Bières');
  const [newPrice, setNewPrice] = useState('');
  const [newVolume, setNewVolume] = useState('');
  const [newDegreeOrMass, setNewDegreeOrMass] = useState('');
  const [newIsFavorite, setNewIsFavorite] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Product>>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (data) setProducts(data);
    if (error) console.error("Erreur de chargement:", error);
    setIsLoading(false);
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditFormData(product);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    
    // Optimistic update
    setProducts(products.map(p => p.id === editingId ? { ...p, ...editFormData } as Product : p));
    setEditingId(null);

    const { error } = await supabase
      .from('products')
      .update({ 
        name: editFormData.name, 
        category_name: editFormData.category_name,
        price: editFormData.price,
        volume: editFormData.volume,
        degree_or_mass: editFormData.degree_or_mass,
        is_favorite: editFormData.is_favorite
      })
      .eq('id', editingId);

    if (error) {
      console.error("Erreur de sauvegarde:", error);
      fetchProducts(); // Revert
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const toggleFavorite = async (id: number, currentFav: boolean) => {
    setProducts(products.map(p => p.id === id ? { ...p, is_favorite: !currentFav } : p));
    const { error } = await supabase.from('products').update({ is_favorite: !currentFav }).eq('id', id);
    if (error) fetchProducts();
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) return;
    
    const { data, error } = await supabase
      .from('products')
      .insert([{ 
        name: newName.trim(), 
        category_name: newCategory,
        price: parseFloat(newPrice) || 0,
        volume: parseFloat(newVolume) || 0,
        degree_or_mass: parseFloat(newDegreeOrMass) || 0,
        is_favorite: newIsFavorite
      }])
      .select();
      
    if (data && data.length > 0) {
      setProducts([...products, data[0]]);
    }
    if (error) console.error("Erreur d'ajout:", error);
    
    // Reset form
    setNewName('');
    setNewCategory('Bières');
    setNewPrice('');
    setNewVolume('');
    setNewDegreeOrMass('');
    setNewIsFavorite(false);
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      // Optimistic update
      setProducts(products.filter(p => p.id !== id));
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Erreur de suppression:", error);
        fetchProducts(); // Revert
      }
    }
  };

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight mb-2">Gestion des produits</h1>
        <p className="text-stone-500">Ajoutez, modifiez ou supprimez les articles du catalogue du foyer.</p>
      </div>

      {/* Top section: List of products */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-stone-800">Produits existants</h2>
          
          <div className="relative w-80">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text" 
              placeholder="Rechercher par nom ou catégorie..." 
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
                  <th className="py-4 px-6 bg-[#FCFAF5] text-center w-20">⭐ Favori</th>
                  <th className="py-4 px-6 bg-[#FCFAF5]">Nom</th>
                  <th className="py-4 px-6 bg-[#FCFAF5]">Catégorie</th>
                  <th className="py-4 px-6 bg-[#FCFAF5] text-right">Prix</th>
                  <th className="py-4 px-6 bg-[#FCFAF5] text-center">Volume (mL)</th>
                  <th className="py-4 px-6 bg-[#FCFAF5] text-center">Degré / Masse</th>
                  <th className="py-4 px-6 bg-[#FCFAF5] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE0] text-sm">
                {filteredProducts.map(product => {
                  const isEditing = editingId === product.id;
                  return (
                    <tr key={product.id} className={`transition-colors ${isEditing ? 'bg-amber-50' : 'hover:bg-[#F4F1EB]'}`}>
                      {isEditing ? (
                        <>
                          <td className="py-2 px-6 text-center">
                            <input type="checkbox" checked={editFormData.is_favorite || false} onChange={e => setEditFormData({...editFormData, is_favorite: e.target.checked})} className="w-4 h-4 accent-amber-500" />
                          </td>
                          <td className="py-2 px-6">
                            <input type="text" value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full px-2 py-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold" />
                          </td>
                          <td className="py-2 px-6">
                            <input type="text" value={editFormData.category_name || ''} onChange={e => setEditFormData({...editFormData, category_name: e.target.value})} className="w-full px-2 py-1.5 border border-amber-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
                          </td>
                          <td className="py-2 px-6">
                            <input type="number" step="0.01" value={editFormData.price ?? ''} onChange={e => setEditFormData({...editFormData, price: parseFloat(e.target.value) || 0})} className="w-20 mx-auto block px-2 py-1.5 border border-amber-300 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-amber-500" />
                          </td>
                          <td className="py-2 px-6">
                            <input type="number" value={editFormData.volume ?? ''} onChange={e => setEditFormData({...editFormData, volume: parseFloat(e.target.value) || 0})} className="w-20 mx-auto block px-2 py-1.5 border border-amber-300 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-amber-500" />
                          </td>
                          <td className="py-2 px-6">
                            <input type="number" step="0.1" value={editFormData.degree_or_mass ?? ''} onChange={e => setEditFormData({...editFormData, degree_or_mass: parseFloat(e.target.value) || 0})} className="w-20 mx-auto block px-2 py-1.5 border border-amber-300 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-amber-500" />
                          </td>
                          <td className="py-2 px-6 text-right flex items-center justify-end gap-2">
                            <button onClick={saveEdit} className="px-3 py-1.5 rounded-lg font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 hover:bg-emerald-200 transition-colors text-xs">OK</button>
                            <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg font-bold text-stone-600 bg-stone-200 border border-stone-300 hover:bg-stone-300 transition-colors text-xs">Annul.</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-6 text-center">
                            <button 
                              onClick={() => toggleFavorite(product.id, product.is_favorite)}
                              className={`text-lg transition-colors ${product.is_favorite ? 'grayscale-0' : 'grayscale opacity-30 hover:opacity-100'}`}
                            >
                              ⭐
                            </button>
                          </td>
                          <td className="py-3 px-6 font-black text-stone-800">{product.name}</td>
                          <td className="py-3 px-6 text-stone-600 font-medium">{product.category_name}</td>
                          <td className="py-3 px-6 text-right font-black text-[#5A0A18]">{product.price.toFixed(2)} €</td>
                          <td className="py-3 px-6 text-center text-stone-500">{product.volume > 0 ? product.volume : '-'}</td>
                          <td className="py-3 px-6 text-center text-stone-500">{product.degree_or_mass > 0 ? product.degree_or_mass : '-'}</td>
                          <td className="py-3 px-6 text-right flex items-center justify-end gap-2">
                            <button 
                              onClick={() => startEdit(product)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-stone-600 bg-stone-100 border border-stone-200 hover:bg-stone-200 hover:text-stone-800 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Modifier
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id)}
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
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400 font-medium bg-white">Aucun produit trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom section: Add Form */}
      <div>
        <h2 className="text-xl font-bold text-stone-800 mb-4">Nouveau Produit</h2>
        <div className="bg-white rounded-2xl border border-[#E8E4D9] shadow-sm overflow-hidden">
          <form onSubmit={handleAddProduct} className="p-6 flex flex-col xl:flex-row gap-4 items-end">
            
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Nom du produit</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ex: Chouffe"
                className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18]"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 w-40 shrink-0">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Catégorie</label>
              <select 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18]"
              >
                <option value="Bières">Bières</option>
                <option value="Pressions">Pressions</option>
                <option value="Cocktails">Cocktails</option>
                <option value="Snacks">Snacks</option>
                <option value="Gastronomines">Gastronomines</option>
                <option value="Goodies">Goodies</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 w-32 shrink-0">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Prix (€)</label>
              <input 
                type="number" 
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="ex: 2.50"
                className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18]"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 w-32 shrink-0">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Volume</label>
              <input 
                type="number" 
                value={newVolume}
                onChange={(e) => setNewVolume(e.target.value)}
                placeholder="ex: 33 (mL)"
                className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18]"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-36 shrink-0">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider pl-1">Degré / Masse</label>
              <input 
                type="number" 
                step="0.1"
                value={newDegreeOrMass}
                onChange={(e) => setNewDegreeOrMass(e.target.value)}
                placeholder="ex: 8.0"
                className="w-full px-4 py-2.5 bg-[#FCFAF5] border border-[#E8E4D9] rounded-xl text-stone-800 font-medium focus:outline-none focus:border-[#5A0A18]"
              />
            </div>

            <div className="w-32 shrink-0">
              <button 
                type="submit"
                disabled={!newName.trim() || !newPrice}
                className="w-full bg-[#5A0A18] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#7A1224] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#5A0A18]/20"
              >
                <PackagePlus className="w-4 h-4" />
                Valider
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
}
