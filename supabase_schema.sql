-- Schéma de base de données Supabase (PostgreSQL) pour COMIF
-- Ce fichier contient les tables principales pour faire fonctionner l'application.

-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des utilisateurs (les adhérents et les serveurs)
CREATE TABLE membres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT UNIQUE,
  solde INTEGER DEFAULT 0, -- Stocké en centimes (ex: 250 = 2,50€) pour éviter les erreurs d'arrondi
  est_serveur BOOLEAN DEFAULT false,
  mot_de_passe TEXT, -- Renseigné uniquement pour les serveurs (pour le rechargement)
  date_fin_cotisation DATE,
  cree_le TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des produits (Tibar / Tipause)
CREATE TABLE produits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL, -- 'boisson', 'snack', 'biere', etc.
  prix INTEGER NOT NULL, -- En centimes
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  cree_le TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des transactions (Achats et Rechargements)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membre_id UUID REFERENCES membres(id) NOT NULL,
  serveur_id UUID REFERENCES membres(id), -- Le serveur qui a validé la transaction
  montant INTEGER NOT NULL, -- Négatif pour un achat, Positif pour un rechargement
  type_transaction TEXT NOT NULL, -- 'achat' ou 'rechargement'
  moyen_paiement TEXT, -- 'solde', 'sumup', 'especes'
  cree_le TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Détail des achats (quels produits ont été achetés lors d'une transaction)
CREATE TABLE details_transaction (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES produits(id),
  quantite INTEGER NOT NULL,
  prix_unitaire INTEGER NOT NULL -- Prix du produit au moment de l'achat
);

-- Index pour accélérer les recherches de noms (très utile pour la barre de recherche)
CREATE INDEX idx_membres_nom ON membres(nom);
CREATE INDEX idx_membres_prenom ON membres(prenom);
