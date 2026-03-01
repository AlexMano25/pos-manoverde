# POS Mano Verde

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js)]()
[![React](https://img.shields.io/badge/react-19-61DAFB?logo=react)]()

**Systeme de caisse (POS) moderne, hors-ligne, concu pour les commerces en Afrique.**

POS Mano Verde est une application de point de vente qui fonctionne aussi bien en ligne qu'hors-ligne. Concue pour les realites du terrain africain -- coupures de courant, connexion intermittente, paiement mobile -- elle permet a n'importe quel commerce de gerer ses ventes, son stock et ses employes depuis un navigateur web.

<!-- ![Screenshot POS Mano Verde](docs/assets/screenshot-pos.png) -->

---

## Fonctionnalites principales

- **Fonctionnement hors-ligne** -- Toutes les ventes sont enregistrees localement (IndexedDB) et synchronisees automatiquement quand la connexion revient.
- **Multi-terminaux** -- Un serveur local + plusieurs tablettes/telephones connectes en WiFi. Synchronisation en temps reel via WebSocket.
- **Paiements multiples** -- Especes, Carte bancaire, Mobile Money (MoMo), Virement.
- **Impression Bluetooth** -- Impression de tickets de caisse sur imprimante thermique via Web Bluetooth API.
- **Gestion du stock** -- Entrees, sorties, ajustements, alertes de stock bas.
- **Tableau de bord** -- Chiffre d'affaires du jour, commandes, produits les plus vendus.
- **Multi-langues** -- Interface en francais et anglais.
- **Multi-secteurs** -- Restaurant, supermarche, pharmacie, mode, electronique, services.
- **Roles et permissions** -- Admin, gerant, caissier, responsable stock.
- **Connexion rapide par PIN** -- Les caissiers se connectent avec un code PIN a 4 chiffres.
- **PWA installable** -- L'application s'installe comme une application native sur mobile et desktop.
- **Cloud optionnel** -- Synchronisation vers Supabase pour la sauvegarde et le multi-boutiques.
- **Docker ready** -- Deploiement en production avec un seul `docker-compose up`.

---

## Stack technique

| Composant     | Technologie                                         |
|---------------|------------------------------------------------------|
| **Frontend**  | React 19, TypeScript, Vite 7, Zustand, Dexie (IndexedDB) |
| **Backend**   | Node.js 20, Express 5, better-sqlite3, Socket.IO    |
| **Cloud**     | Supabase (optionnel -- Postgres, Realtime, Auth)     |
| **Impression**| Web Bluetooth API, ESC/POS                           |
| **PWA**       | vite-plugin-pwa, Workbox                             |
| **Deploy**    | Docker, Vercel (frontend), Raspberry Pi              |
| **Monnaie**   | FCFA (XAF)                                           |

---

## Demarrage rapide

```bash
# 1. Cloner le depot
git clone https://github.com/manoverde/pos-app.git && cd pos-app

# 2. Installer les dependances et demarrer le serveur
cd backend && npm install && npm run dev

# 3. Dans un autre terminal, demarrer le frontend
cd frontend && npm install && npm run dev
```

L'application est accessible sur `http://localhost:5173`.
Identifiants par defaut : **admin@manoverde.com** / **admin123** (PIN : **1234**).

---

## Documentation

| Document | Description |
|----------|-------------|
| [Guide d'installation](docs/GUIDE_INSTALLATION.md) | Installation locale, Docker, Raspberry Pi, cloud |
| [Guide utilisateur](docs/GUIDE_UTILISATEUR.md) | Guide complet pour les caissiers et vendeurs |
| [Guide gerant](docs/GUIDE_GERANT.md) | Gestion des produits, stock, employes, rapports |
| [Guide administrateur](docs/GUIDE_ADMIN.md) | Architecture, API, base de donnees, deploiement |
| [FAQ](docs/FAQ.md) | Questions frequentes (30+) |

---

## Contribuer

Les contributions sont les bienvenues. Avant de soumettre une Pull Request :

1. Forkez le depot.
2. Creez une branche pour votre fonctionnalite : `git checkout -b feature/ma-fonctionnalite`.
3. Commitez vos changements : `git commit -m "Ajout de ma fonctionnalite"`.
4. Poussez votre branche : `git push origin feature/ma-fonctionnalite`.
5. Ouvrez une Pull Request.

Conventions de code :
- Frontend : TypeScript strict, composants fonctionnels React.
- Backend : JavaScript (CommonJS), Express 5.
- Commits en francais ou anglais, format conventionnel.

---

## Licence

Ce projet est distribue sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de details.

---

## Credits

Developpe par **[Mano Verde SA](https://manoverde.com)** -- Douala, Cameroun.

> *Simplifier le commerce en Afrique, une caisse a la fois.*
