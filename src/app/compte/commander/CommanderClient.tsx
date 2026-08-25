'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronLeft, Minus, Plus, Search, ShoppingBag, RotateCcw } from 'lucide-react';
import { createPendingOrder } from '../actions';

interface Product {
  id: number;
  name: string;
  category_name: string;
  price: number;
  is_favorite?: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CommanderClient({ categories, products }: { categories: string[]; products: Product[] }) {
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);

  const allCategories = useMemo(() => ['⭐ Favoris', 'Tous', ...categories], [categories]);

  const filteredProducts = useMemo(() => {
    let list = products;

    if (activeCategory === '⭐ Favoris') {
      list = list.filter(p => p.is_favorite);
    } else if (activeCategory !== 'Tous') {
      list = list.filter(p => p.category_name === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }

    return list;
  }, [products, activeCategory, search]);

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.product.price * item.quantity, 0),
    [cart]
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev
      .map(item => item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item)
      .filter(item => item.quantity > 0));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');

    const result = await createPendingOrder(cart.map(item => ({ product_id: item.product.id, qty: item.quantity })));

    if (result?.error) {
      setError(result.error);
      setIsGenerating(false);
      return;
    }

    setOrderId(result.id!);
    setIsGenerating(false);
  };

  const handleReset = () => {
    setOrderId(null);
    setCart([]);
  };

  if (orderId) {
    return (
      <div className="min-h-screen bg-[#F4F1EB] font-sans text-stone-800 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-3xl border border-[#E8E4D9] shadow-xl p-8 text-center">
          <h1 className="text-xl font-black text-stone-800 mb-2">Montrez cet écran au serveur</h1>
          <p className="text-stone-500 font-medium text-sm mb-6">
            Le montant sera débité une fois la commande scannée et acceptée.
          </p>

          <div className="bg-white p-4 rounded-2xl border border-[#E8E4D9] inline-block mb-6">
            <QRCodeSVG value={orderId} size={220} />
          </div>

          <p className="text-3xl font-black text-[#5A0A18] mb-6">{cartTotal.toFixed(2)} €</p>

          <button
            onClick={handleReset}
            className="w-full py-3 rounded-xl font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Nouvelle commande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F1EB] font-sans text-stone-800 pb-32">
      <header className="bg-[#FCFAF5] border-b border-[#E8E4D9] px-4 py-4 flex items-center gap-3 sticky top-0 z-20">
        <Link href="/compte" className="p-1 -ml-1 text-stone-500 hover:text-[#5A0A18] transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-black">Commander</h1>
      </header>

      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-stone-800 text-sm font-medium focus:outline-none focus:border-[#5A0A18]"
          />
        </div>
      </div>

      <div className="px-4 pt-3 flex gap-2 overflow-x-auto pb-2 hide-scrollbar-arrows">
        {allCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all shrink-0 ${activeCategory === cat ? 'bg-[#5A0A18] text-white' : 'bg-white text-stone-500 border border-[#E8E4D9]'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="px-4 pt-3">
        <div className="bg-white rounded-2xl border border-[#E8E4D9] divide-y divide-[#F0EBE0] overflow-hidden">
          {filteredProducts.map(product => {
            const inCart = cart.find(item => item.product.id === product.id);
            return (
              <div key={product.id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-stone-800 truncate">{product.name}</p>
                  <p className="text-xs text-stone-500 font-bold">{product.price.toFixed(2)} €</p>
                </div>
                {inCart ? (
                  <div className="flex items-center gap-3 bg-stone-50 border border-[#E8E4D9] rounded-lg p-1 shrink-0">
                    <button onClick={() => updateQuantity(product.id, -1)} className="p-1 hover:bg-white rounded text-stone-500"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="font-black text-sm w-4 text-center">{inCart.quantity}</span>
                    <button onClick={() => updateQuantity(product.id, 1)} className="p-1 hover:bg-white rounded text-stone-500"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(product)}
                    className="shrink-0 w-8 h-8 rounded-lg bg-[#5A0A18]/10 text-[#5A0A18] flex items-center justify-center hover:bg-[#5A0A18] hover:text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <p className="p-6 text-center text-stone-400 font-medium text-sm">Aucun produit trouvé.</p>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E4D9] p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {error && <p className="text-red-500 text-sm font-bold text-center mb-2">{error}</p>}
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-stone-500 text-sm">Total</span>
          <span className="text-2xl font-black text-stone-800">{cartTotal.toFixed(2)} €</span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={cart.length === 0 || isGenerating}
          className="w-full py-4 rounded-xl font-black text-white bg-[#5A0A18] hover:bg-[#7A1224] transition-colors shadow-lg shadow-[#5A0A18]/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          {isGenerating ? 'Génération...' : 'Générer le QR code'}
        </button>
      </div>
    </div>
  );
}
