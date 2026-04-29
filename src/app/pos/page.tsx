"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Search, ChevronLeft, ShoppingCart, Minus, Plus, Trash2, CheckCircle2, User as UserIcon } from 'lucide-react';

// Interfaces
interface Product {
  id: number;
  name: string;
  category_name: string;
  price: number;
  is_favorite?: boolean;
}

interface UserData {
  id: string; // UUID from Supabase
  first_name: string;
  last_name: string;
  balance: number;
  promo: string;
  membership_end: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

function POSContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const service = searchParams.get('service') || 'Tibbar';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [productSearch, setProductSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Mode Remboursement
  const [isRefundMode, setIsRefundMode] = useState(false);

  useEffect(() => {
    fetchData();
  }, [service]);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: catData } = await supabase
      .from('categories')
      .select('name')
      .eq('visible', 1)
      .or(`service.eq.${service},service.eq.Les Deux`);
      
    const allowedCategories = catData ? catData.map(c => c.name) : [];
    setCategories(['⭐ Favoris', 'Tous', ...allowedCategories]);

    if (allowedCategories.length > 0) {
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .in('category_name', allowedCategories);
      if (prodData) setProducts(prodData);
    }

    const { data: userData } = await supabase.from('users').select('id, first_name, last_name, balance, promo, membership_end').order('last_name');
    if (userData) setUsers(userData);
    
    setIsLoading(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
      
      // Si l'utilisateur tape une recherche, on ignore l'onglet actif et on cherche partout !
      if (productSearch.trim()) {
        return matchSearch;
      }

      const matchCat = activeCategory === 'Tous' 
        || (activeCategory === '⭐ Favoris' && p.is_favorite)
        || p.category_name === activeCategory;
        
      return matchCat;
    });
  }, [products, activeCategory, productSearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return [];
    return users.filter(u => 
      u.last_name.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.first_name.toLowerCase().includes(userSearch.toLowerCase())
    ).slice(0, 8);
  }, [users, userSearch]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }, [cart]);

  const isUserCotisant = (user: UserData | null) => {
    if (!user || !user.membership_end) return false;
    const endDate = new Date(user.membership_end);
    const now = new Date();
    return endDate >= now;
  };

  const projectedBalance = selectedUser ? selectedUser.balance - cartTotal : null;

  const addToCart = (product: Product) => {
    const qtyToAdd = isRefundMode ? -1 : 1;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + qtyToAdd } : item);
      }
      return [...prev, { product, quantity: qtyToAdd }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQ = item.quantity + delta;
        return { ...item, quantity: newQ };
      }
      return item;
    }).filter(item => item.quantity !== 0)); // Delete if it reaches exactly 0
  };

  const handleCheckout = async () => {
    if (!selectedUser || cart.length === 0 || isProcessing) return;
    setIsProcessing(true);

    const newBalance = selectedUser.balance - cartTotal;

    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', selectedUser.id);

    if (updateError) {
      alert("Erreur réseau");
      setIsProcessing(false);
      return;
    }

    const detailsStr = cart.map(c => `${c.quantity}x ${c.product.name}`).join(', ');
    
    await supabase.from('transactions').insert({
      client_id: selectedUser.id,
      amount: -cartTotal,
      type: cartTotal < 0 ? 'remboursement' : 'achat',
      details: detailsStr
    });

    setUsers(users.map(u => u.id === selectedUser.id ? { ...u, balance: newBalance } : u));
    setSelectedUser({ ...selectedUser, balance: newBalance });

    setSuccessMessage(`${cartTotal < 0 ? 'Remboursé' : 'Encaissé'} : ${Math.abs(cartTotal).toFixed(2)}€`);
    setCart([]);
    setUserSearch('');
    setIsRefundMode(false);
    setTimeout(() => {
      setSuccessMessage('');
      setSelectedUser(null);
    }, 2000);

    setIsProcessing(false);
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#F4F1EB] font-bold text-[#5A0A18]">Chargement...</div>;

  return (
    <div className="h-screen flex flex-col bg-[#F9F8F6] font-sans overflow-hidden">
      
      <header className="bg-[#5A0A18] text-white px-6 py-3 flex justify-between items-center shadow-md z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-black tracking-widest uppercase">Caisse {service}</h1>
        </div>
        <div className="text-sm font-semibold opacity-80 bg-black/20 px-4 py-1.5 rounded-full">
          Tibbar (Test)
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left pane: Products */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          <div className="px-6 pt-6 pb-4 shrink-0">
            <div className="relative max-w-xl">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type="text" 
                placeholder="Rechercher une boisson, un snack..." 
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border-none rounded-2xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#5A0A18]/20 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
              />
            </div>
            
            <div className="flex gap-2 mt-6 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar-arrows">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-[#5A0A18] text-white shadow-md shadow-[#5A0A18]/20' : 'bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-800 shadow-sm'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between h-32 active:scale-95 border-2 ${isRefundMode ? 'border-red-100 hover:border-red-300' : 'border-transparent hover:border-[#5A0A18]/10'}`}
                >
                  <div className="font-bold text-stone-800 leading-tight text-sm line-clamp-3">{product.name}</div>
                  <div className={`text-lg font-black mt-2 ${isRefundMode ? 'text-red-500' : 'text-[#5A0A18]'}`}>
                    {isRefundMode ? '-' : ''}{product.price.toFixed(2)} €
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right pane: Cart */}
        <div className="w-[380px] bg-white flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.03)] shrink-0 z-10 border-l border-[#E8E4D9]">
          
          <div className="p-5 border-b border-[#E8E4D9] bg-stone-50/50 shrink-0">
            {!selectedUser ? (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-3.5 text-stone-400" />
                <input 
                  type="text" 
                  placeholder="Chercher un étudiant..." 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-[#E8E4D9] rounded-xl text-stone-800 font-bold focus:outline-none focus:border-[#5A0A18] focus:ring-1 focus:ring-[#5A0A18] shadow-sm transition-all"
                />
                
                {userSearch.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-[#E8E4D9] shadow-xl z-30 max-h-64 overflow-y-auto overflow-hidden">
                    {filteredUsers.length > 0 ? filteredUsers.map(user => (
                      <button 
                        key={user.id}
                        onClick={() => { setSelectedUser(user); setUserSearch(''); }}
                        className="w-full text-left px-4 py-3 hover:bg-[#F9F8F6] border-b border-[#E8E4D9] last:border-0 flex justify-between items-center transition-colors"
                      >
                        <div>
                          <div className="font-bold text-stone-800 flex items-center gap-2">
                            {user.first_name} {user.last_name}
                            {!isUserCotisant(user) && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] uppercase font-black">Non Cotisant</span>}
                          </div>
                          <div className="text-xs text-stone-500 font-medium">{user.promo}</div>
                        </div>
                        <div className={`font-black ${user.balance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                          {user.balance.toFixed(2)}€
                        </div>
                      </button>
                    )) : (
                      <div className="p-4 text-center text-sm text-stone-500 font-medium">Aucun étudiant trouvé</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#5A0A18]/5 border border-[#5A0A18]/20 rounded-xl p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5A0A18]/10 flex items-center justify-center shrink-0">
                    <UserIcon className="w-5 h-5 text-[#5A0A18]" />
                  </div>
                  <div>
                    <div className="font-black text-[#5A0A18] leading-tight flex items-center gap-2">
                      {selectedUser.first_name} {selectedUser.last_name}
                      {!isUserCotisant(selectedUser) && <span className="px-2 py-0.5 rounded bg-red-100 text-red-600 text-[10px] uppercase font-black">Non Cotisant</span>}
                    </div>
                    <div className="text-xs font-bold text-[#5A0A18]/70">{selectedUser.promo} • <span className={selectedUser.balance < 0 ? 'text-red-500' : 'text-emerald-600'}>{selectedUser.balance.toFixed(2)}€</span></div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-2 text-stone-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Commande</h2>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsRefundMode(!isRefundMode)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors ${isRefundMode ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                >
                  {isRefundMode ? 'Mode Remboursement' : 'Rembourser'}
                </button>
                {cart.length > 0 && <button onClick={() => setCart([])} className="text-red-500 hover:text-red-600 text-xs font-bold uppercase tracking-wider">Vider</button>}
              </div>
            </div>
            
            {cart.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-stone-300 gap-3">
                <ShoppingCart className="w-10 h-10 opacity-50" />
                <p className="font-semibold text-sm">Le panier est vide</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {cart.map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${item.quantity < 0 ? 'bg-red-50/50 border-red-100' : 'bg-white border-[#E8E4D9]'}`}>
                    <div className="flex-1 pr-3">
                      <div className="font-bold text-stone-800 text-sm leading-tight mb-0.5">{item.product.name}</div>
                      <div className={`font-black text-xs ${item.quantity < 0 ? 'text-red-500' : 'text-stone-500'}`}>
                        {(item.product.price * item.quantity).toFixed(2)}€
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-stone-50 border border-[#E8E4D9] rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:bg-white rounded text-stone-500 shadow-sm"><Minus className="w-3.5 h-3.5" /></button>
                      <span className={`font-black text-sm w-4 text-center ${item.quantity < 0 ? 'text-red-600' : 'text-stone-800'}`}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:bg-white rounded text-stone-500 shadow-sm"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 bg-stone-50 border-t border-[#E8E4D9] shrink-0 relative">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-stone-500">Total</span>
              <span className={`text-3xl font-black ${cartTotal < 0 ? 'text-red-500' : 'text-stone-800'}`}>
                {cartTotal.toFixed(2)} €
              </span>
            </div>
            
            {selectedUser && cart.length > 0 && projectedBalance !== null && (
              <div className="flex justify-between items-center mb-4 p-3 bg-white rounded-xl border border-[#E8E4D9] shadow-sm">
                <span className="text-sm font-semibold text-stone-500">Nouveau solde</span>
                <span className={`text-lg font-black ${projectedBalance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {projectedBalance.toFixed(2)} €
                </span>
              </div>
            )}

            {successMessage && (
              <div className="absolute inset-0 bg-[#1E7D7A]/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in zoom-in duration-200">
                <CheckCircle2 className="w-14 h-14 mb-3 text-emerald-300" />
                <h3 className="text-xl font-black tracking-wide">{successMessage}</h3>
              </div>
            )}

            {selectedUser && !isUserCotisant(selectedUser) && (
              <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm font-bold flex items-center gap-2">
                ⚠️ Impossible d'encaisser : L'étudiant n'est pas cotisant.
              </div>
            )}

            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || !selectedUser || !isUserCotisant(selectedUser) || isProcessing}
              className={`w-full py-4 rounded-xl font-black tracking-widest text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                ${(cart.length === 0 || !selectedUser || !isUserCotisant(selectedUser)) 
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none' 
                  : cartTotal < 0 
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/30 active:scale-95'
                    : 'bg-[#5A0A18] text-white hover:bg-[#7A1224] shadow-[#5A0A18]/30 active:scale-95'
                }
              `}
            >
              {isProcessing ? 'TRAITEMENT...' : cartTotal < 0 ? 'REMBOURSER' : 'ENCAISSER'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function POSPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#F9F8F6] font-bold text-[#5A0A18]">Chargement...</div>}>
      <POSContent />
    </Suspense>
  );
}
