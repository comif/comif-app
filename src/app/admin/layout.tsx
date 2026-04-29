"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Layers, 
  Package, 
  Users, 
  UserSquare2, 
  FileCheck, 
  MenuSquare,
  ArrowLeft,
  ClipboardList
} from 'lucide-react';

const ADMIN_LINKS = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, category: 'Général' },
  { href: '/admin/history', label: 'Suivi des comptes', icon: ClipboardList, category: 'Général' },
  { href: '/admin/categories', label: 'Ajouter/Supprimer une catégorie', icon: Layers, category: 'Administration du site' },
  { href: '/admin/products', label: 'Ajouter/Supprimer un produit', icon: Package, category: 'Administration du site' },
  { href: '/admin/servers', label: 'Ajouter/Supprimer un serveur', icon: UserSquare2, category: 'Administration du site' },
  { href: '/admin/users', label: 'Ajouter/Supprimer un cotisant', icon: Users, category: 'Administration du site' },
  { href: '/admin/cotisations', label: 'Mettre à jour les cotisations', icon: FileCheck, category: 'Administration du site' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F4F1EB] font-sans flex">
      
      {/* Sidebar */}
      <aside className="w-80 bg-[#5A0A18] text-rose-100 flex flex-col shrink-0 min-h-screen shadow-xl z-20 relative">
        <div className="p-6 border-b border-rose-900/50 flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-2 text-rose-300 hover:text-white transition-colors text-sm font-medium w-fit">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
              <span className="text-[#5A0A18] font-black text-[10px] tracking-tighter">COMIF</span>
            </div>
            <div>
              <h2 className="text-white font-bold tracking-tight">Espace Admin</h2>
              <p className="text-xs text-rose-300 font-medium uppercase tracking-widest">Gestion du foyer</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-8 custom-scrollbar">
          
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-3 px-3">Général</div>
            <div className="flex flex-col gap-1">
              {ADMIN_LINKS.filter(l => l.category === 'Général').map((link) => {
                const active = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${active ? 'bg-rose-900 text-white shadow-inner' : 'hover:bg-rose-900/50 text-rose-100 hover:text-white'}`}
                  >
                    <Icon className="w-5 h-5 opacity-80" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-3 px-3">Administration du site</div>
            <div className="flex flex-col gap-1">
              {ADMIN_LINKS.filter(l => l.category === 'Administration du site').map((link) => {
                const active = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${active ? 'bg-rose-900 text-white shadow-inner' : 'hover:bg-rose-900/50 text-rose-100 hover:text-white'}`}
                  >
                    <Icon className="w-5 h-5 opacity-80" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto h-screen relative">
        <div className="p-10 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}
