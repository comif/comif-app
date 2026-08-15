'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import QrScanner from 'qr-scanner';
import { createClient } from '@/utils/supabase/client';
import { hashPassword } from '@/utils/hash';
import { ChevronLeft, AlertTriangle, CheckCircle2, XCircle, KeyRound } from 'lucide-react';

QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js';

const MAX_NEGATIVE_BALANCE = -20;
const ORDER_EXPIRY_MINUTES = 30;

interface ServerData {
  id: string;
  first_name: string;
  last_name: string;
  password_hash: string;
}

interface OrderItem {
  product_id: number;
  name: string;
  price: number;
  qty: number;
}

interface PendingOrder {
  id: string;
  client_id: string;
  items: OrderItem[];
  created_at: string;
}

interface ClientData {
  id: string;
  first_name: string;
  last_name: string;
  balance: number;
  membership_end: string | null;
}

export default function ServirClient() {
  const supabase = createClient();

  const [servers, setServers] = useState<ServerData[]>([]);
  const [selectedServerId, setSelectedServerId] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authenticatedServer, setAuthenticatedServer] = useState<ServerData | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [scanError, setScanError] = useState('');

  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [orderError, setOrderError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  useEffect(() => {
    supabase.from('servers').select('*').order('first_name').then(({ data }) => {
      if (data) setServers(data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isScanning = !!authenticatedServer && !order && !resultMessage;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const server = servers.find(s => s.id === selectedServerId);
    if (!server) return;

    const hashed = await hashPassword(password);
    if (hashed !== server.password_hash) {
      setAuthError('Mot de passe incorrect.');
      return;
    }

    setAuthenticatedServer(server);
    setPassword('');
  };

  const handleScan = async (data: string) => {
    scannerRef.current?.stop();
    setOrderError('');

    const orderId = data.trim();

    const { data: pendingOrder } = await supabase
      .from('pending_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (!pendingOrder) {
      setOrderError('Commande introuvable. Elle a peut-être déjà été scannée.');
      return;
    }

    const ageMinutes = (Date.now() - new Date(pendingOrder.created_at).getTime()) / 60000;
    if (ageMinutes > ORDER_EXPIRY_MINUTES) {
      await supabase.from('pending_orders').delete().eq('id', pendingOrder.id);
      setOrderError("Cette commande a expiré. Demandez à l'étudiant d'en générer une nouvelle.");
      return;
    }

    const { data: clientData } = await supabase
      .from('users')
      .select('id, first_name, last_name, balance, membership_end')
      .eq('id', pendingOrder.client_id)
      .maybeSingle();

    if (!clientData) {
      setOrderError('Compte client introuvable.');
      return;
    }

    setOrder(pendingOrder);
    setClient(clientData);
  };

  useEffect(() => {
    if (!isScanning || !videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      result => handleScan(result.data),
      { highlightScanRegion: true, highlightCodeOutline: true }
    );
    scannerRef.current = scanner;
    scanner.start().catch(() => setScanError("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur."));

    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

  const isCotisant = (c: ClientData) => {
    if (!c.membership_end) return false;
    return new Date(c.membership_end) >= new Date();
  };

  const cartTotal = order ? order.items.reduce((total, item) => total + item.price * item.qty, 0) : 0;

  const handleRefuse = async () => {
    if (!order) return;
    setIsProcessing(true);
    await supabase.from('pending_orders').delete().eq('id', order.id);
    setResultMessage('refused');
    setIsProcessing(false);
  };

  const handleAccept = async () => {
    if (!order || !client || !authenticatedServer) return;
    setIsProcessing(true);

    const { error: balanceError } = await supabase.rpc('increment_balance', {
      p_user_id: client.id,
      p_amount: -cartTotal,
    });

    if (balanceError) {
      setOrderError('Erreur lors de la mise à jour du solde. Réessayez.');
      setIsProcessing(false);
      return;
    }

    const detailsStr = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');

    await supabase.from('transactions').insert({
      client_id: client.id,
      server_id: authenticatedServer.id,
      amount: -cartTotal,
      type: 'achat',
      details: detailsStr,
    });

    await supabase.from('pending_orders').delete().eq('id', order.id);

    setResultMessage('accepted');
    setIsProcessing(false);
  };

  const handleNext = () => {
    setOrder(null);
    setClient(null);
    setOrderError('');
    setResultMessage('');
    setScanError('');
  };

  // --- Écran 1: identification du serveur ---
  if (!authenticatedServer) {
    return (
      <div className="min-h-screen bg-[#F4F1EB] font-sans flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-3xl border border-[#E8E4D9] shadow-xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#5A0A18]" />

          <h1 className="text-xl font-black text-center text-stone-800 mb-2">Servir une commande</h1>
          <p className="text-center text-stone-500 font-medium mb-8 text-sm">Identifiez-vous pour scanner des commandes.</p>

          <form onSubmit={handleAuth} className="space-y-4">
            <select
              value={selectedServerId}
              onChange={e => setSelectedServerId(e.target.value)}
              required
              className="w-full bg-[#FCFAF5] border-2 border-[#E8E4D9] rounded-xl px-4 py-3.5 text-stone-800 font-bold focus:outline-none focus:border-[#5A0A18]"
            >
              <option value="" disabled>-- Votre nom --</option>
              {servers.map(s => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>

            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3.5 bg-[#FCFAF5] border-2 border-[#E8E4D9] rounded-xl text-stone-800 font-bold focus:outline-none focus:border-[#5A0A18]"
              />
            </div>

            {authError && <p className="text-red-500 text-sm font-bold text-center">{authError}</p>}

            <button
              type="submit"
              disabled={!selectedServerId || !password}
              className="w-full py-4 rounded-xl font-black text-white bg-[#5A0A18] hover:bg-[#7A1224] transition-colors shadow-lg shadow-[#5A0A18]/20 disabled:opacity-50"
            >
              Continuer
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Écran 2: résultat (acceptée / refusée) ---
  if (resultMessage) {
    const accepted = resultMessage === 'accepted';
    return (
      <div className="min-h-screen bg-[#F4F1EB] font-sans flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-3xl border border-[#E8E4D9] shadow-xl p-8 text-center">
          {accepted ? (
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          <h1 className="text-xl font-black text-stone-800 mb-2">
            {accepted ? 'Commande acceptée' : 'Commande refusée'}
          </h1>
          {accepted && <p className="text-stone-500 font-medium mb-6">{cartTotal.toFixed(2)} € débités du compte.</p>}

          <button
            onClick={handleNext}
            className="w-full py-4 rounded-xl font-black text-white bg-[#5A0A18] hover:bg-[#7A1224] transition-colors mt-4"
          >
            Scanner la commande suivante
          </button>
        </div>
      </div>
    );
  }

  // --- Écran 3: récapitulatif de la commande scannée ---
  if (order && client) {
    const cotisant = isCotisant(client);
    const balanceTooLow = client.balance < MAX_NEGATIVE_BALANCE;

    return (
      <div className="min-h-screen bg-[#F4F1EB] font-sans p-6">
        <div className="max-w-sm mx-auto bg-white rounded-3xl border border-[#E8E4D9] shadow-xl p-6">
          <h1 className="text-lg font-black text-stone-800 mb-1">{client.first_name} {client.last_name}</h1>
          <p className={`text-sm font-bold mb-4 ${client.balance < 0 ? 'text-red-600' : 'text-stone-500'}`}>
            Solde actuel : {client.balance.toFixed(2)} €
          </p>

          <div className="bg-[#FCFAF5] rounded-2xl border border-[#E8E4D9] divide-y divide-[#F0EBE0] mb-4 overflow-hidden">
            {order.items.map(item => (
              <div key={item.product_id} className="p-3 flex justify-between items-center text-sm">
                <span className="font-semibold text-stone-800">{item.qty}x {item.name}</span>
                <span className="font-bold text-stone-600">{(item.price * item.qty).toFixed(2)} €</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-stone-500">Total</span>
            <span className="text-2xl font-black text-[#5A0A18]">{cartTotal.toFixed(2)} €</span>
          </div>

          {orderError && <p className="text-red-500 text-sm font-bold text-center mb-4">{orderError}</p>}

          {!cotisant && (
            <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Cet étudiant n&apos;est pas cotisant, impossible d&apos;accepter cette commande.
            </div>
          )}

          {cotisant && balanceTooLow && (
            <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-700 text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Solde déjà inférieur à {MAX_NEGATIVE_BALANCE} €. Vous pouvez refuser cette commande.
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleRefuse}
              disabled={isProcessing}
              className="flex-1 py-3.5 rounded-xl font-black text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              Refuser
            </button>
            <button
              onClick={handleAccept}
              disabled={isProcessing || !cotisant}
              className="flex-1 py-3.5 rounded-xl font-black text-white bg-[#5A0A18] hover:bg-[#7A1224] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? '...' : 'Accepter'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Écran 4: scan caméra ---
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="px-4 py-4 flex items-center gap-3 text-white">
        <Link href="/" className="p-1 -ml-1">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="font-black">Scanner une commande</h1>
          <p className="text-xs text-white/60 font-medium">{authenticatedServer.first_name} {authenticatedServer.last_name}</p>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <video ref={videoRef} className="w-full max-w-sm rounded-2xl overflow-hidden" muted playsInline />
      </div>

      {(scanError || orderError) && (
        <div className="p-4">
          <p className="text-red-400 text-sm font-bold text-center bg-red-950/50 rounded-xl p-3">{scanError || orderError}</p>
        </div>
      )}
    </div>
  );
}
