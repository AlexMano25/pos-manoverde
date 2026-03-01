# Guide administrateur -- POS Mano Verde

Ce guide est destine aux **administrateurs systeme** et **developpeurs** responsables de l'installation, la maintenance et l'evolution technique de POS Mano Verde.

---

## Table des matieres

- [1. Architecture du systeme](#1-architecture-du-systeme)
- [2. Configuration du serveur local](#2-configuration-du-serveur-local)
- [3. Configuration Supabase (cloud)](#3-configuration-supabase-cloud)
- [4. Base de donnees SQLite](#4-base-de-donnees-sqlite)
- [5. Sauvegarde et restauration](#5-sauvegarde-et-restauration)
- [6. Mise a jour de l'application](#6-mise-a-jour-de-lapplication)
- [7. Surveillance et logs](#7-surveillance-et-logs)
- [8. Depannage courant](#8-depannage-courant)
- [9. Reference API](#9-reference-api)
- [10. Variables d'environnement](#10-variables-denvironnement)
- [11. Securite](#11-securite)
- [12. Deploiement Docker en production](#12-deploiement-docker-en-production)
- [13. Monitoring et health checks](#13-monitoring-et-health-checks)

---

## 1. Architecture du systeme

POS Mano Verde suit une architecture **offline-first** avec trois couches :

### Schema d'architecture

```
+------------------------------------------------------------+
|                       CLIENTS                              |
|                                                            |
|  +------------------+  +------------------+                |
|  | Navigateur #1    |  | Navigateur #2    |  ...           |
|  | (Tablette/PC)    |  | (Telephone)      |                |
|  |                  |  |                  |                |
|  | React 19 (SPA)   |  | React 19 (SPA)   |                |
|  | Zustand (state)  |  | Zustand (state)  |                |
|  | Dexie (IndexedDB)|  | Dexie (IndexedDB)|                |
|  | Socket.IO Client |  | Socket.IO Client |                |
|  | Web Bluetooth    |  | Web Bluetooth    |                |
|  +--------+---------+  +--------+---------+                |
|           |                      |                         |
+-----------|----------------------|-------------------------+
            |    HTTP + WebSocket  |
            v                      v
+------------------------------------------------------------+
|                    SERVEUR LOCAL                            |
|                                                            |
|  +------------------------------------------------------+  |
|  | Node.js 20 + Express 5                               |  |
|  |                                                      |  |
|  | Routes API :                                         |  |
|  |   /api/auth     - Authentification (JWT)             |  |
|  |   /api/products - CRUD produits                      |  |
|  |   /api/orders   - CRUD commandes                     |  |
|  |   /api/stock    - Mouvements de stock                |  |
|  |   /api/users    - Gestion employes                   |  |
|  |   /api/sync     - Synchronisation push/pull          |  |
|  |   /api/health   - Endpoint de sante                  |  |
|  |                                                      |  |
|  | Services :                                           |  |
|  |   Socket.IO     - WebSocket temps reel               |  |
|  |   mDNS (Bonjour)- Decouverte automatique du serveur  |  |
|  |                                                      |  |
|  | Base de donnees :                                    |  |
|  |   SQLite (better-sqlite3) - pos.db                   |  |
|  |   WAL mode + 20 Mo cache                             |  |
|  +------------------------------------------------------+  |
|                                                            |
+------------------------------------------------------------+
            |
            | (optionnel)
            v
+------------------------------------------------------------+
|                    CLOUD (OPTIONNEL)                        |
|                                                            |
|  +------------------------------------------------------+  |
|  | Supabase                                             |  |
|  |   - PostgreSQL (base de donnees)                     |  |
|  |   - Realtime (subscriptions en temps reel)           |  |
|  |   - Auth (authentification)                          |  |
|  |   - Row Level Security (RLS)                         |  |
|  +------------------------------------------------------+  |
|                                                            |
+------------------------------------------------------------+
```

### Composants frontend

| Composant | Technologie | Role |
|-----------|-------------|------|
| **Framework** | React 19 | Interface utilisateur |
| **Langage** | TypeScript | Typage statique |
| **Build** | Vite 7 | Bundling et HMR |
| **State management** | Zustand 5 | Gestion d'etat globale |
| **Base locale** | Dexie 4 (IndexedDB) | Stockage offline des donnees |
| **Temps reel** | Socket.IO Client | Reception des mises a jour |
| **Impression** | Web Bluetooth API | Communication avec imprimantes ESC/POS |
| **PWA** | vite-plugin-pwa + Workbox | Installation et cache offline |
| **i18n** | Systeme maison | Traductions francais/anglais |
| **Icones** | Lucide React | Icones SVG |
| **Routing** | react-router-dom 7 | Navigation SPA |
| **Dates** | date-fns 4 | Formatage et calcul de dates |
| **Cloud** | @supabase/supabase-js | Client Supabase (optionnel) |

### Composants backend

| Composant | Technologie | Role |
|-----------|-------------|------|
| **Runtime** | Node.js 20 | Execution serveur |
| **Framework** | Express 5 | API REST |
| **Base de donnees** | better-sqlite3 | SQLite synchrone, haute performance |
| **WebSocket** | Socket.IO 4 | Communication temps reel |
| **Auth** | jsonwebtoken (JWT) | Tokens d'authentification |
| **Hachage** | bcryptjs | Hachage des mots de passe |
| **IDs** | uuid v4 | Identifiants uniques |
| **mDNS** | bonjour-service | Decouverte reseau automatique |
| **Env** | dotenv | Variables d'environnement |

### Stores Zustand (frontend)

| Store | Fichier | Responsabilite |
|-------|---------|---------------|
| `appStore` | `stores/appStore.ts` | Mode (serveur/client), section active, URL serveur, boutique courante, statut connexion. |
| `authStore` | `stores/authStore.ts` | Utilisateur connecte, token JWT, login/logout. |
| `cartStore` | `stores/cartStore.ts` | Panier en cours (articles, quantites). |
| `productStore` | `stores/productStore.ts` | Liste des produits, categories, chargement/recherche. |
| `orderStore` | `stores/orderStore.ts` | Commandes, creation, historique. |
| `syncStore` | `stores/syncStore.ts` | File d'attente de synchronisation, push/pull, compteur pending. |
| `languageStore` | `stores/languageStore.ts` | Langue active, traductions. |

---

## 2. Configuration du serveur local

### Structure des fichiers backend

```
backend/
  .env                   # Variables d'environnement
  .dockerignore          # Fichiers exclus du build Docker
  Dockerfile             # Image Docker
  index.js               # Point d'entree (legacy, redirige vers src/)
  package.json           # Dependances
  pos.db                 # Base de donnees SQLite (cree au premier lancement)
  src/
    index.js             # Point d'entree principal
    db/
      database.js        # Initialisation SQLite, helpers CRUD
      schema.sql         # Schema de la base de donnees
    middleware/
      auth.js            # Middleware JWT (authenticate, authorize)
    routes/
      auth.js            # Routes d'authentification
      products.js        # Routes produits
      orders.js          # Routes commandes
      stock.js           # Routes mouvements de stock
      users.js           # Routes employes
      sync.js            # Routes de synchronisation
    services/
      websocket.js       # Configuration Socket.IO
      mdns.js            # Service mDNS (Bonjour)
```

### Configuration de la base de donnees

La base SQLite est initialisee avec les pragmas suivants pour des performances optimales en environnement POS :

```sql
PRAGMA journal_mode = WAL;       -- Write-Ahead Logging pour lectures concurrentes
PRAGMA foreign_keys = ON;        -- Contraintes de cles etrangeres
PRAGMA busy_timeout = 5000;      -- Attente max 5s en cas de verrou
PRAGMA synchronous = NORMAL;     -- Bon compromis performance/securite
PRAGMA cache_size = -20000;      -- Cache de 20 Mo
PRAGMA temp_store = MEMORY;      -- Tables temporaires en memoire
```

### Donnees par defaut

Au premier demarrage, si la base est vide, le systeme cree automatiquement :

- Une boutique "Mano Verde" (Douala, Cameroun).
- Un compte administrateur (`admin@manoverde.com` / `admin123`, PIN `1234`).
- 5 produits de demonstration (Cafe Latte, Sandwich Poulet, Eau Minerale, Croissant, Jus de Fruit).

---

## 3. Configuration Supabase (cloud)

L'integration Supabase est **optionnelle**. Elle permet la sauvegarde cloud et la gestion multi-boutiques.

### Quand utiliser Supabase

- Sauvegarde automatique des donnees dans le cloud.
- Gestion de plusieurs boutiques avec une base centralisee.
- Acces aux donnees depuis n'importe ou (pas seulement le reseau local).

### Configuration

1. Creez un projet sur [supabase.com](https://supabase.com).
2. Recuperez l'URL du projet et la cle anonyme (anon key).
3. Ajoutez les variables d'environnement dans le frontend :

```env
# frontend/.env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...votre-cle-anon
```

4. Recompilez le frontend : `cd frontend && npm run build`.

### Comportement

- Si les variables Supabase **sont definies** : le client Supabase est initialise, les donnees sont synchronisees vers Supabase en plus du serveur local.
- Si les variables Supabase **ne sont pas definies** : l'application fonctionne en mode "local-only" sans aucune tentative de connexion au cloud.

Le code verifie automatiquement la configuration :

```typescript
export const isSupabaseConfigured: boolean =
  Boolean(supabaseUrl) && Boolean(supabaseAnonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null
```

### Fonctionnalites Supabase utilisees

| Fonctionnalite | Usage |
|---------------|-------|
| **PostgreSQL** | Stockage des donnees (produits, commandes, stock, utilisateurs). |
| **Realtime** | Notifications en temps reel des changements de donnees (subscriptions par boutique). |
| **Auth** | Authentification via email/mot de passe (alternative au JWT local). |
| **Row Level Security** | Isolation des donnees par `store_id`. |

---

## 4. Base de donnees SQLite

### Schema des tables

#### Table `stores`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT (PK) | UUID de la boutique |
| `name` | TEXT | Nom de la boutique |
| `address` | TEXT | Adresse |
| `phone` | TEXT | Telephone |
| `activity` | TEXT | Type d'activite |
| `created_at` | TEXT | Date de creation (ISO 8601) |
| `updated_at` | TEXT | Derniere modification |

#### Table `users`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT (PK) | UUID de l'utilisateur |
| `store_id` | TEXT (FK) | Reference vers `stores.id` |
| `name` | TEXT | Nom complet |
| `email` | TEXT (UNIQUE) | Email (identifiant de connexion) |
| `password_hash` | TEXT | Mot de passe hache (bcrypt) |
| `role` | TEXT | `admin`, `manager`, `cashier` ou `stock` |
| `pin` | TEXT | Code PIN (4-6 chiffres) |
| `phone` | TEXT | Telephone |
| `is_active` | INTEGER | 1 = actif, 0 = desactive |
| `created_at` | TEXT | Date de creation |
| `updated_at` | TEXT | Derniere modification |

#### Table `products`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT (PK) | UUID du produit |
| `store_id` | TEXT (FK) | Reference vers `stores.id` |
| `name` | TEXT | Nom du produit |
| `price` | REAL | Prix de vente (FCFA) |
| `cost` | REAL | Cout d'achat (FCFA) |
| `stock` | INTEGER | Quantite en stock |
| `category` | TEXT | Categorie |
| `sku` | TEXT | Code interne |
| `barcode` | TEXT | Code-barres |
| `image_url` | TEXT | URL de l'image |
| `is_active` | INTEGER | 1 = actif, 0 = desactive |
| `created_at` | TEXT | Date de creation |
| `updated_at` | TEXT | Derniere modification |

#### Table `orders`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT (PK) | UUID de la commande |
| `store_id` | TEXT (FK) | Reference vers `stores.id` |
| `user_id` | TEXT (FK) | Caissier qui a cree la commande |
| `items` | TEXT | Articles (JSON stringifie) |
| `subtotal` | REAL | Sous-total avant remise (FCFA) |
| `discount` | REAL | Remise en FCFA |
| `tax` | REAL | Montant de la taxe (FCFA) |
| `total` | REAL | Total final (FCFA) |
| `payment_method` | TEXT | `cash`, `card`, `momo` ou `transfer` |
| `status` | TEXT | `paid`, `pending`, `refunded` ou `cancelled` |
| `synced` | INTEGER | 0 = non synchronise, 1 = synchronise |
| `device_id` | TEXT | Identifiant du terminal |
| `created_at` | TEXT | Date de creation |
| `updated_at` | TEXT | Derniere modification |

#### Table `stock_moves`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT (PK) | UUID du mouvement |
| `store_id` | TEXT (FK) | Reference vers `stores.id` |
| `product_id` | TEXT (FK) | Reference vers `products.id` |
| `type` | TEXT | `in`, `out`, `adjust`, `sale` ou `return` |
| `qty` | INTEGER | Quantite (positive ou negative) |
| `reason` | TEXT | Raison du mouvement |
| `user_id` | TEXT (FK) | Employe qui a effectue le mouvement |
| `synced` | INTEGER | 0 = non synchronise, 1 = synchronise |
| `created_at` | TEXT | Date de creation |

#### Table `sync_queue`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | TEXT (PK) | UUID de l'entree |
| `entity_type` | TEXT | `product`, `order`, `stock_move` ou `user` |
| `entity_id` | TEXT | UUID de l'entite concernee |
| `operation` | TEXT | `create`, `update` ou `delete` |
| `data` | TEXT | Donnees de l'entite (JSON) |
| `device_id` | TEXT | Terminal d'origine |
| `store_id` | TEXT | Boutique |
| `created_at` | TEXT | Date de creation |
| `synced_at` | TEXT | Date de synchronisation (NULL si en attente) |

### Index

Chaque table possede des index optimises pour les requetes courantes. Voir `backend/src/db/schema.sql` pour la liste complete des index.

### Acces direct a la base

Pour consulter la base de donnees directement :

```bash
# Installer sqlite3 si necessaire
sudo apt install sqlite3   # Linux
brew install sqlite3       # macOS

# Ouvrir la base
sqlite3 backend/pos.db

# Exemples de requetes
.tables                                    -- Lister les tables
SELECT * FROM stores;                      -- Voir les boutiques
SELECT * FROM users;                       -- Voir les utilisateurs
SELECT COUNT(*) FROM orders;               -- Compter les commandes
SELECT * FROM products WHERE stock < 5;    -- Produits en stock bas
.quit                                      -- Quitter
```

---

## 5. Sauvegarde et restauration

### Sauvegarde de la base SQLite

La base SQLite est un fichier unique (`pos.db`). Pour la sauvegarder :

```bash
# Sauvegarde simple (copie du fichier)
cp backend/pos.db backup/pos-$(date +%Y%m%d-%H%M%S).db

# Si le serveur tourne (mode WAL), utilisez sqlite3 pour une copie coherente
sqlite3 backend/pos.db ".backup 'backup/pos-backup.db'"
```

### Sauvegarde Docker

```bash
# Copier la base depuis le conteneur
docker cp pos-manoverde:/data/pos.db ./backup/pos-$(date +%Y%m%d).db
```

### Script de sauvegarde automatique

Creez un script cron pour des sauvegardes automatiques :

```bash
#!/bin/bash
# backup-pos.sh -- Sauvegarde quotidienne de la base POS

BACKUP_DIR="/home/user/pos-backups"
DB_PATH="/chemin/vers/backend/pos.db"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"
sqlite3 "$DB_PATH" ".backup '${BACKUP_DIR}/pos-${DATE}.db'"

# Supprimer les sauvegardes de plus de 30 jours
find "$BACKUP_DIR" -name "pos-*.db" -mtime +30 -delete

echo "[BACKUP] Sauvegarde terminee : pos-${DATE}.db"
```

Ajoutez au crontab :

```bash
crontab -e
# Sauvegarde quotidienne a 23h00
0 23 * * * /home/user/backup-pos.sh >> /var/log/pos-backup.log 2>&1
```

### Restauration

```bash
# Arreter le serveur
docker-compose down   # ou Ctrl+C si lance manuellement

# Remplacer la base par la sauvegarde
cp backup/pos-20260301.db backend/pos.db

# Redemarrer le serveur
docker-compose up -d   # ou npm start
```

---

## 6. Mise a jour de l'application

### Mise a jour manuelle

```bash
# 1. Arreter le serveur
docker-compose down

# 2. Sauvegarder la base
cp backend/pos.db backup/pos-avant-maj.db

# 3. Tirer les dernieres modifications
git pull origin main

# 4. Mettre a jour les dependances backend
cd backend && npm install && cd ..

# 5. Recompiler le frontend
cd frontend && npm install && npm run build && cd ..

# 6. Relancer
docker-compose up -d --build
```

### Mise a jour Docker

```bash
docker-compose down
git pull
cd frontend && npm install && npm run build && cd ..
docker-compose build --no-cache
docker-compose up -d
```

### Compatibilite des bases de donnees

Le schema SQLite utilise `CREATE TABLE IF NOT EXISTS`, ce qui permet des mises a jour sans perte de donnees. Les nouvelles tables sont creees automatiquement, les tables existantes ne sont pas modifiees.

Cote frontend, Dexie gere les migrations de schema IndexedDB via le systeme de versionnement integre.

---

## 7. Surveillance et logs

### Logs du serveur

Le serveur affiche les logs dans la sortie standard. En production avec Docker :

```bash
# Suivre les logs en temps reel
docker-compose logs -f pos-server

# Derniers 100 logs
docker-compose logs --tail=100 pos-server
```

### Niveaux de logs

| Prefixe | Signification |
|---------|---------------|
| `[SERVER]` | Messages du serveur (demarrage, arret, erreurs fatales) |
| `[DB]` | Messages de la base de donnees (initialisation, seed) |
| `[AUTH]` | Messages d'authentification (login, register, erreurs) |
| `[WS]` | Messages WebSocket (connexions, deconnexions) |
| `[MDNS]` | Messages mDNS (decouverte reseau) |
| `[SYNC]` | Messages de synchronisation |

### Endpoint de sante

```bash
curl http://localhost:4000/api/health
```

Reponse :

```json
{
  "status": "ok",
  "server": "POS Mano Verde",
  "version": "1.0.0",
  "store": {
    "id": "uuid-de-la-boutique",
    "name": "Mano Verde"
  },
  "uptime": 3600,
  "connected_clients": 2,
  "timestamp": "2026-03-01T14:30:00.000Z"
}
```

---

## 8. Depannage courant

### Le serveur ne demarre pas

**Symptome** : Erreur au lancement de `npm start`.

**Causes et solutions** :

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Error: Could not locate the bindings file` | `better-sqlite3` non compile pour la plateforme | `cd backend && npm rebuild better-sqlite3` |
| `EADDRINUSE :::4000` | Le port 4000 est deja utilise | Changez le port dans `.env` ou tuez le processus existant : `lsof -i :4000` puis `kill <PID>` |
| `SQLITE_CANTOPEN` | Chemin de la base invalide ou permissions insuffisantes | Verifiez `DB_PATH` dans `.env` et les permissions du dossier |
| `MODULE_NOT_FOUND` | Dependance manquante | `cd backend && npm install` |

### La synchronisation est bloquee

**Symptome** : Le compteur de synchronisation en attente ne descend pas.

**Solutions** :

1. Verifiez la connexion reseau entre le client et le serveur.
2. Verifiez que le serveur est accessible : `curl http://serveur:4000/api/health`.
3. Verifiez les logs du serveur pour des erreurs de synchronisation.
4. Forcez une synchronisation dans **Parametres** > **Synchroniser maintenant**.
5. En dernier recours, videz le cache du navigateur et rechargez l'application.

### Le frontend ne se charge pas

**Symptome** : Page blanche ou erreur 404.

**Solutions** :

1. Verifiez que le frontend est compile : le dossier `frontend/dist/` doit exister.
2. Recompilez : `cd frontend && npm run build`.
3. Verifiez que le serveur sert bien les fichiers statiques (log `[SERVER] Serving frontend from ...`).
4. En Docker, verifiez le montage du volume : `./frontend/dist:/app/public`.

### L'imprimante Bluetooth ne fonctionne pas

**Symptome** : Erreur lors de la connexion ou de l'impression.

**Solutions** :

1. Web Bluetooth n'est disponible que dans **Chrome** et **Edge** en contexte HTTPS ou localhost.
2. Verifiez que le Bluetooth est active sur l'appareil.
3. L'imprimante doit supporter le protocole ESC/POS.
4. Certains navigateurs mobiles ne supportent pas Web Bluetooth.

### Erreur JWT / Token expire

**Symptome** : Erreur 401 Unauthorized.

**Solutions** :

1. Deconnectez-vous et reconnectez-vous.
2. Verifiez que le `JWT_SECRET` du serveur n'a pas change depuis la generation du token.
3. Les tokens expirent apres un certain temps. La reconnexion genere un nouveau token.

---

## 9. Reference API

Toutes les routes API sont prefixees par `/api`.

### Authentification

| Methode | Route | Description | Auth requise |
|---------|-------|-------------|:------------:|
| `POST` | `/api/auth/login` | Connexion email + mot de passe | Non |
| `POST` | `/api/auth/login/pin` | Connexion par PIN | Non |
| `GET` | `/api/auth/me` | Profil de l'utilisateur connecte | Oui |
| `POST` | `/api/auth/register` | Creer un utilisateur (admin only) | Oui (admin) |

**POST /api/auth/login**

```json
// Request
{
  "email": "caissier@manoverde.com",
  "password": "motdepasse"
}

// Response (200)
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "uuid",
    "store_id": "uuid",
    "name": "Jean Caissier",
    "email": "caissier@manoverde.com",
    "role": "cashier",
    "phone": "+237 600 000 000"
  }
}
```

**POST /api/auth/login/pin**

```json
// Request
{ "pin": "1234" }

// Response (200) -- identique a /api/auth/login
```

### Produits

| Methode | Route | Description | Auth requise |
|---------|-------|-------------|:------------:|
| `GET` | `/api/products?store_id=X` | Lister les produits | Oui |
| `GET` | `/api/products/:id` | Detail d'un produit | Oui |
| `POST` | `/api/products` | Creer un produit | Oui (admin/manager) |
| `PUT` | `/api/products/:id` | Modifier un produit | Oui (admin/manager) |
| `DELETE` | `/api/products/:id` | Supprimer un produit | Oui (admin/manager) |
| `GET` | `/api/products/barcode/:code?store_id=X` | Trouver par code-barres | Oui |

**Parametres de requete pour GET /api/products** :

| Parametre | Type | Description |
|-----------|------|-------------|
| `store_id` | string | (requis) Identifiant de la boutique |
| `page` | number | Numero de page (pagination) |
| `per_page` | number | Nombre de resultats par page |
| `category` | string | Filtrer par categorie |
| `search` | string | Recherche par nom, SKU ou code-barres |
| `active_only` | boolean | Ne retourner que les produits actifs |

### Commandes

| Methode | Route | Description | Auth requise |
|---------|-------|-------------|:------------:|
| `GET` | `/api/orders?store_id=X` | Lister les commandes | Oui |
| `GET` | `/api/orders/:id` | Detail d'une commande | Oui |
| `POST` | `/api/orders` | Creer une commande | Oui |
| `PUT` | `/api/orders/:id` | Modifier une commande | Oui (admin/manager) |
| `POST` | `/api/orders/:id/refund` | Rembourser une commande | Oui (admin/manager) |
| `POST` | `/api/orders/sync` | Synchroniser des commandes en lot | Oui |

### Stock

| Methode | Route | Description | Auth requise |
|---------|-------|-------------|:------------:|
| `GET` | `/api/stock?store_id=X` | Lister les mouvements de stock | Oui |
| `POST` | `/api/stock` | Creer un mouvement de stock | Oui (admin/manager/stock) |
| `POST` | `/api/stock/sync` | Synchroniser des mouvements en lot | Oui |

### Utilisateurs

| Methode | Route | Description | Auth requise |
|---------|-------|-------------|:------------:|
| `GET` | `/api/users?store_id=X` | Lister les employes | Oui (admin/manager) |
| `GET` | `/api/users/:id` | Detail d'un employe | Oui (admin/manager) |
| `POST` | `/api/users` | Creer un employe | Oui (admin) |
| `PUT` | `/api/users/:id` | Modifier un employe | Oui (admin) |
| `DELETE` | `/api/users/:id` | Supprimer un employe | Oui (admin) |

### Synchronisation

| Methode | Route | Description | Auth requise |
|---------|-------|-------------|:------------:|
| `POST` | `/api/sync/push` | Envoyer les modifications locales | Oui |
| `GET` | `/api/sync/pull?since=DATE` | Recuperer les modifications depuis une date | Oui |

### Rapports

| Methode | Route | Description | Auth requise |
|---------|-------|-------------|:------------:|
| `GET` | `/api/reports/daily?store_id=X&date=YYYY-MM-DD` | Rapport journalier | Oui |
| `GET` | `/api/reports/sales?store_id=X&from=DATE&to=DATE` | Rapport de ventes par periode | Oui |

### Sante

| Methode | Route | Description | Auth requise |
|---------|-------|-------------|:------------:|
| `GET` | `/api/health` | Etat du serveur | Non |

### Format des erreurs

Toutes les erreurs sont retournees avec le format :

```json
{
  "error": "Description de l'erreur en francais."
}
```

Codes HTTP utilises :

| Code | Signification |
|------|---------------|
| `200` | Succes |
| `201` | Cree avec succes |
| `204` | Succes sans contenu |
| `400` | Requete invalide (champs manquants) |
| `401` | Non authentifie (token manquant ou invalide) |
| `403` | Non autorise (permissions insuffisantes) |
| `404` | Ressource introuvable |
| `409` | Conflit (email ou PIN deja utilise) |
| `500` | Erreur interne du serveur |

---

## 10. Variables d'environnement

### Backend (`backend/.env`)

| Variable | Defaut | Description |
|----------|--------|-------------|
| `PORT` | `4000` | Port d'ecoute du serveur HTTP |
| `JWT_SECRET` | `pos-manoverde-secret-key-change-in-production` | Cle secrete pour signer les tokens JWT. **A changer imperativement en production.** |
| `DB_PATH` | `./pos.db` | Chemin vers le fichier de base de donnees SQLite |
| `NODE_ENV` | `development` | Environnement (`development` ou `production`) |

### Frontend (`frontend/.env`)

| Variable | Defaut | Description |
|----------|--------|-------------|
| `VITE_SUPABASE_URL` | *(non defini)* | URL du projet Supabase (optionnel) |
| `VITE_SUPABASE_ANON_KEY` | *(non defini)* | Cle anonyme Supabase (optionnel) |

### Docker (`docker-compose.yml` / `.env` racine)

| Variable | Defaut | Description |
|----------|--------|-------------|
| `JWT_SECRET` | `pos-manoverde-production-key` | Transmis au conteneur backend |

---

## 11. Securite

### Authentification JWT

- Les tokens JWT sont generes lors de la connexion et envoyes dans le header `Authorization: Bearer <token>`.
- Le secret JWT (`JWT_SECRET`) doit etre une chaine aleatoire d'au moins 32 caracteres.
- Les tokens expirent apres la duree definie dans le middleware d'authentification.

### Hachage des mots de passe

- Les mots de passe sont haches avec **bcrypt** (facteur de cout 10).
- Les mots de passe en clair ne sont jamais stockes.

### CORS

- En mode local, CORS est configure pour accepter toutes les origines (`origin: '*'`) car le serveur est utilise sur un reseau local.
- En production avec un domaine, configurez CORS pour n'accepter que votre domaine.

### Bonnes pratiques

1. **Changez le `JWT_SECRET` par defaut** avant la mise en production.
2. **Changez le mot de passe admin par defaut** (`admin123`) immediatement.
3. **Utilisez HTTPS** si le serveur est expose sur Internet (pas necessaire en reseau local).
4. **Limitez l'acces reseau** au serveur POS (firewall, VLAN dedie).
5. **Sauvegardez regulierement** la base de donnees.
6. **Surveillez les logs** pour detecter des tentatives d'acces non autorisees.

---

## 12. Deploiement Docker en production

### Dockerfile multi-stage

Le Dockerfile utilise un build multi-stage pour minimiser la taille de l'image :

1. **Stage 1 (builder)** : Installe les dependances avec les outils de compilation (python3, make, g++).
2. **Stage 2 (production)** : Image minimale avec uniquement le runtime Node.js et les fichiers necessaires.

### Commandes Docker utiles

```bash
# Construire l'image
docker-compose build

# Demarrer en arriere-plan
docker-compose up -d

# Arreter
docker-compose down

# Voir l'etat
docker-compose ps

# Logs en temps reel
docker-compose logs -f

# Entrer dans le conteneur
docker exec -it pos-manoverde sh

# Voir l'utilisation des ressources
docker stats pos-manoverde
```

### Configuration du restart

Le conteneur est configure avec `restart: unless-stopped`, ce qui signifie :

- Il redemarre automatiquement apres un crash.
- Il redemarre automatiquement apres un reboot du systeme.
- Il ne redemarre pas si vous l'arretez manuellement avec `docker-compose down`.

---

## 13. Monitoring et health checks

### Health check Docker

Le `docker-compose.yml` inclut un health check qui verifie l'endpoint `/api/health` toutes les 30 secondes :

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:4000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

### Verifier l'etat du conteneur

```bash
# Etat avec health check
docker inspect --format='{{.State.Health.Status}}' pos-manoverde
# healthy | unhealthy | starting

# Derniers resultats du health check
docker inspect --format='{{json .State.Health}}' pos-manoverde | python3 -m json.tool
```

### Script de monitoring

```bash
#!/bin/bash
# monitor-pos.sh -- Verifie que le serveur POS est accessible

URL="http://localhost:4000/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" --connect-timeout 5)

if [ "$RESPONSE" != "200" ]; then
  echo "[ALERT] POS Mano Verde est INACCESSIBLE (HTTP $RESPONSE)"
  # Envoyer une notification (email, SMS, Telegram...)
  # docker-compose restart   # Redemarrage automatique (optionnel)
else
  echo "[OK] POS Mano Verde fonctionne (HTTP $RESPONSE)"
fi
```

### Metriques a surveiller

| Metrique | Comment la verifier | Seuil d'alerte |
|----------|-------------------|---------------|
| **Uptime serveur** | `GET /api/health` -> `uptime` | Alerter si redemarrage inattendu |
| **Clients connectes** | `GET /api/health` -> `connected_clients` | Alerter si 0 clients pendant les heures d'ouverture |
| **Taille de la base** | `ls -lh backend/pos.db` | Alerter si > 1 Go |
| **File de synchronisation** | Nombre de `sync_queue` pending | Alerter si > 100 elements en attente |
| **Espace disque** | `df -h` | Alerter si < 10% libre |
| **Memoire** | `docker stats` | Alerter si > 80% utilise |
