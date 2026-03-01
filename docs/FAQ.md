# FAQ -- POS Mano Verde

Questions frequemment posees, organisees par theme.

---

## Table des matieres

- [Questions generales](#questions-generales)
- [Fonctionnement hors-ligne](#fonctionnement-hors-ligne)
- [Synchronisation](#synchronisation)
- [Impression Bluetooth](#impression-bluetooth)
- [Paiements](#paiements)
- [Produits et stock](#produits-et-stock)
- [Employes et securite](#employes-et-securite)
- [Multi-boutiques](#multi-boutiques)
- [Aspects techniques](#aspects-techniques)
- [Support et migration](#support-et-migration)

---

## Questions generales

### 1. Qu'est-ce que POS Mano Verde ?

POS Mano Verde est un systeme de caisse (Point of Sale) moderne concu pour les commerces en Afrique. C'est une application web qui fonctionne dans un navigateur, capable de tourner hors-ligne et de se synchroniser quand la connexion revient. Elle gere les ventes, le stock, les employes et les rapports.

### 2. Sur quels appareils fonctionne POS Mano Verde ?

L'application fonctionne sur tout appareil disposant d'un navigateur web moderne :

- **Ordinateurs** : Windows, macOS, Linux (Chrome, Edge, Firefox, Safari).
- **Tablettes** : iPad, tablettes Android (Chrome recommande).
- **Telephones** : iPhone, Android (Chrome recommande).

Pour l'impression Bluetooth, utilisez Google Chrome ou Microsoft Edge.

### 3. Ai-je besoin d'une connexion Internet ?

**Non.** POS Mano Verde fonctionne parfaitement hors-ligne. Les ventes sont enregistrees localement et synchronisees automatiquement quand la connexion revient. La seule exception est la premiere installation, qui necessite un acces Internet pour telecharger l'application.

### 4. Quels types de commerces sont supportes ?

L'application est adaptable a tout type de commerce grace a la configuration par type d'activite :

- **Restaurant** / Cafe / Bar
- **Supermarche** / Epicerie / Alimentation
- **Pharmacie** / Parapharmacie
- **Mode** / Pret-a-porter / Chaussures
- **Electronique** / Informatique
- **Services** / Salon de coiffure / Pressing

### 5. Dans quelle devise fonctionne l'application ?

L'application est configuree par defaut en **FCFA** (Franc CFA, code ISO : XAF), la devise utilisee en Afrique centrale (Cameroun, Gabon, Congo, Tchad, RCA, Guinee equatoriale). La devise est configurable dans les parametres.

### 6. L'application est-elle gratuite ?

POS Mano Verde est un logiciel open source distribue sous licence MIT. L'utilisation de l'application elle-meme est gratuite. Les seuls couts eventuels sont :

- L'hebergement si vous choisissez un deploiement cloud (Vercel, Supabase).
- Le materiel (ordinateur, tablette, imprimante Bluetooth).

### 7. Comment installer l'application sur mon ecran d'accueil ?

POS Mano Verde est une PWA (Progressive Web App). Pour l'installer :

1. Ouvrez l'application dans Chrome.
2. Cliquez sur l'icone "Installer" dans la barre d'adresse (ou allez dans le menu Chrome > "Installer l'application").
3. Confirmez l'installation.
4. L'application apparait sur votre ecran d'accueil comme une application native.

---

## Fonctionnement hors-ligne

### 8. Que se passe-t-il si Internet tombe pendant une vente ?

Rien de grave. La vente est enregistree normalement dans la base de donnees locale du navigateur (IndexedDB). Un indicateur orange s'affiche pour indiquer que vous etes hors-ligne. Quand la connexion revient, les donnees sont synchronisees automatiquement.

### 9. Combien de ventes puis-je enregistrer hors-ligne ?

Il n'y a pas de limite pratique. IndexedDB peut stocker des centaines de milliers d'enregistrements. Meme avec des milliers de ventes, l'application reste rapide.

### 10. Les produits sont-ils disponibles hors-ligne ?

Oui. Le catalogue produit est cache localement. Les produits, categories, prix et niveaux de stock sont disponibles meme sans connexion. Cependant, les mises a jour faites par le gerant depuis un autre terminal ne seront visibles qu'apres la reconnexion et la synchronisation.

### 11. Que se passe-t-il si je ferme le navigateur en mode hors-ligne ?

Les donnees sont persistees dans IndexedDB, qui survit a la fermeture du navigateur. Quand vous reouv rez l'application, vos donnees sont toujours la et seront synchronisees des que possible.

### 12. Est-ce que le mode hors-ligne fonctionne sur tous les navigateurs ?

Oui, IndexedDB est supporte par tous les navigateurs modernes (Chrome, Firefox, Safari, Edge). Cependant, certains navigateurs en mode "Navigation privee" peuvent limiter le stockage. Utilisez le mode normal pour un fonctionnement optimal.

---

## Synchronisation

### 13. Comment fonctionne la synchronisation entre terminaux ?

La synchronisation utilise deux mecanismes :

1. **WebSocket (Socket.IO)** : Communication en temps reel. Quand un caissier enregistre une vente, tous les autres terminaux connectes au serveur sont notifies immediatement (mise a jour du stock, nouvelle commande).

2. **File d'attente de synchronisation** : Les modifications faites hors-ligne sont stockees dans une file d'attente (`sync_queue`). Toutes les 30 secondes, le systeme verifie cette file et envoie les elements en attente au serveur.

### 14. A quelle frequence la synchronisation a-t-elle lieu ?

- **En temps reel** : Les evenements importants (nouvelle commande, mise a jour de stock) sont transmis instantanement via WebSocket.
- **Automatique** : Toutes les **30 secondes**, le systeme verifie s'il y a des elements en attente.
- **Au retour en ligne** : Declenchement immediat quand le navigateur detecte le retour de la connexion.
- **Manuelle** : Vous pouvez forcer une synchronisation a tout moment dans les parametres.

### 15. Que se passe-t-il en cas de conflit (meme produit modifie sur deux terminaux) ?

Le systeme applique la regle "dernier ecrivain gagne" (last-write-wins). La modification la plus recente ecrase la precedente. Pour les ventes, il n'y a pas de conflit possible car chaque commande a un identifiant unique.

### 16. Combien d'elements peuvent etre en attente de synchronisation ?

Il n'y a pas de limite technique. Cependant, si vous voyez un nombre eleve d'elements en attente (plus de 100), cela indique un probleme de connexion au serveur. Verifiez votre reseau et l'etat du serveur.

### 17. La synchronisation fonctionne-t-elle avec Supabase (cloud) ?

Oui. Si Supabase est configure (variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`), les donnees sont egalement synchronisees vers la base PostgreSQL dans le cloud, en plus du serveur local. Supabase offre aussi la synchronisation en temps reel via son systeme de subscriptions.

---

## Impression Bluetooth

### 18. Quelles imprimantes sont compatibles ?

POS Mano Verde fonctionne avec toute imprimante thermique Bluetooth supportant le protocole **ESC/POS**. Les marques courantes incluent :

- Epson (TM-T20, TM-T88, TM-m30)
- Star Micronics
- HOIN (HOP-H58, HOP-H80)
- GOOJPRT
- Xprinter
- Milestone

Les imprimantes de largeur **58mm** et **80mm** sont supportees.

### 19. Sur quels navigateurs l'impression Bluetooth fonctionne-t-elle ?

L'impression utilise l'API **Web Bluetooth**, qui est disponible sur :

- **Google Chrome** (desktop et Android) -- recommande
- **Microsoft Edge** (desktop)

Elle **ne fonctionne pas** sur :

- Firefox (pas de support Web Bluetooth)
- Safari (support limite)
- La plupart des navigateurs mobiles iOS

### 20. Mon imprimante n'est pas detectee, que faire ?

1. Verifiez que l'imprimante est **allumee** et que la **batterie** est chargee.
2. Verifiez que le **Bluetooth** est active sur votre appareil.
3. Assurez-vous d'utiliser **Google Chrome** ou **Microsoft Edge**.
4. L'application doit etre en **HTTPS** ou sur **localhost** (requis par Web Bluetooth).
5. Rapprochez l'imprimante de votre appareil (portee Bluetooth : environ 10 metres).
6. Essayez d'eteindre et rallumer l'imprimante, puis relancez la recherche.

### 21. La vente est-elle perdue si l'impression echoue ?

**Non, jamais.** La vente est enregistree independamment de l'impression. Si l'impression echoue, vous pouvez :

1. Corriger le probleme d'imprimante.
2. Reimprimer le ticket depuis l'historique des commandes.

---

## Paiements

### 22. Quels modes de paiement sont disponibles ?

Quatre modes de paiement sont integres :

| Mode | Description |
|------|-------------|
| **Especes** | Paiement en liquide avec calcul automatique du rendu de monnaie. |
| **Carte** | Paiement par carte bancaire (le paiement se fait sur votre TPE physique, la caisse enregistre le mode). |
| **MoMo** | Mobile Money (Orange Money, MTN MoMo, etc.). Le paiement se fait sur le telephone du client. |
| **Virement** | Virement bancaire. |

### 23. L'application traite-t-elle directement les paiements electroniques ?

Non. POS Mano Verde **enregistre** le mode de paiement choisi mais ne traite pas les transactions electroniques. Le paiement par carte se fait sur votre TPE physique, le paiement MoMo se fait via l'application mobile du client. La caisse sert a enregistrer et tracer les ventes.

### 24. Peut-on faire un paiement mixte (par exemple, partie especes + partie MoMo) ?

Dans la version actuelle, un seul mode de paiement est enregistre par commande. Pour un paiement mixte, vous pouvez :

1. Diviser la commande en deux.
2. Ou enregistrer le mode de paiement principal et noter le detail dans les remarques.

---

## Produits et stock

### 25. Comment ajouter des produits en masse ?

Pour le moment, les produits sont ajoutes un par un via l'interface. Pour des imports en masse, un administrateur peut inserer les donnees directement dans la base SQLite :

```sql
INSERT INTO products (id, store_id, name, price, cost, stock, category, sku, is_active, created_at, updated_at)
VALUES ('uuid', 'store-uuid', 'Nom', 1500, 800, 50, 'Categorie', 'SKU-001', 1, datetime('now'), datetime('now'));
```

### 26. Comment fonctionne le suivi du stock ?

Le stock est mis a jour automatiquement :

- **Vente** : Le stock diminue automatiquement du nombre d'unites vendues.
- **Remboursement** : Le stock augmente automatiquement.
- **Mouvements manuels** : Le gerant peut enregistrer des entrees (livraison fournisseur) et des sorties (casse, perte) manuellement.
- **Ajustement** : Apres un inventaire physique, le gerant peut corriger l'ecart.

### 27. Comment etre alerte quand un produit est en stock bas ?

1. Pour chaque produit, definissez un **stock minimum** (seuil d'alerte) dans la fiche produit.
2. Quand le stock descend en dessous de ce seuil, un indicateur visuel s'affiche.
3. Sur l'ecran de caisse, les produits avec un stock de 5 ou moins sont affiches en rouge.
4. Les produits a 0 en stock sont grise avec la mention "Rupture" et ne sont pas cliquables.

### 28. Puis-je desactiver un produit sans le supprimer ?

Oui. Modifiez le produit et desactivez l'option "Actif". Le produit disparaitra de l'ecran de caisse et des recherches, mais restera dans la base de donnees. Les commandes passees contenant ce produit restent intactes. Vous pourrez reactiver le produit a tout moment.

---

## Employes et securite

### 29. Quels sont les differents roles ?

| Role | Acces |
|------|-------|
| **admin** | Acces complet : configuration, employes, produits, stock, commandes, rapports, parametres systeme. |
| **manager** | Produits, stock, commandes, rapports. Pas d'acces a la configuration systeme ni a la gestion des employes. |
| **cashier** | Ecran de caisse uniquement + consultation des commandes. |
| **stock** | Gestion du stock + consultation des produits. |

### 30. Comment changer le mot de passe par defaut ?

1. Connectez-vous avec le compte administrateur par defaut (`admin@manoverde.com` / `admin123`).
2. Allez dans **Parametres** > **Mon compte**.
3. Changez votre mot de passe.

Vous pouvez aussi changer le mot de passe via le menu **Employes** si vous etes administrateur.

### 31. Un employe a oublie son mot de passe, que faire ?

L'administrateur peut reinitialiser le mot de passe d'un employe :

1. Allez dans **Employes**.
2. Trouvez l'employe concerne.
3. Cliquez sur **Modifier**.
4. Saisissez un nouveau mot de passe.
5. Enregistrez et communiquez le nouveau mot de passe a l'employe.

### 32. Comment securiser l'acces a la caisse ?

- Attribuez un **compte individuel** a chaque employe (ne partagez jamais les identifiants).
- Utilisez des **PINs uniques** pour la connexion rapide en caisse.
- **Deconnectez-vous** en fin de service.
- **Desactivez immediatement** les comptes des employes qui quittent l'entreprise.
- Changez les PINs regulierement.

### 33. Les donnees sont-elles securisees ?

- Les **mots de passe** sont haches avec bcrypt (ils ne sont jamais stockes en clair).
- L'**authentification** utilise des tokens JWT signes.
- Les **donnees** sont stockees localement en SQLite (serveur) et IndexedDB (navigateurs).
- Le serveur **n'est pas expose sur Internet** par defaut (reseau local uniquement).
- Si vous utilisez Supabase, les donnees sont protegees par Row Level Security.

---

## Multi-boutiques

### 34. Puis-je gerer plusieurs boutiques ?

Oui. POS Mano Verde supporte le multi-boutiques. Chaque boutique a son propre identifiant (`store_id`) et ses propres donnees (produits, commandes, stock, employes). Deux configurations sont possibles :

1. **Serveurs locaux independants** : Chaque boutique a son propre serveur. Simple mais pas de consolidation des donnees.
2. **Cloud centralise (Supabase)** : Toutes les boutiques synchronisent vers la meme base cloud. Permet la consolidation des rapports et la gestion centralisee.

### 35. Les employes peuvent-ils travailler dans plusieurs boutiques ?

Chaque compte employe est associe a une boutique specifique (`store_id`). Pour qu'un employe travaille dans plusieurs boutiques, creez-lui un compte dans chaque boutique.

---

## Aspects techniques

### 36. Quelles sont les exigences techniques minimales ?

**Serveur (backend)** :
- Node.js 20 ou superieur.
- 2 Go de RAM (4 Go recommande).
- 500 Mo d'espace disque.
- Systeme d'exploitation : Windows 10+, macOS 12+, Ubuntu 22.04+, ou tout systeme supportant Docker.

**Client (navigateur)** :
- Google Chrome 100+ (recommande), Edge 100+, Firefox 100+, Safari 16+.
- Pas d'exigence materielle particuliere (fonctionne sur tablettes et telephones d'entree de gamme).

### 37. L'application fonctionne-t-elle sur un Raspberry Pi ?

Oui. Un Raspberry Pi 4 avec 4 Go de RAM est suffisant pour faire tourner le serveur backend. L'installation est detaillee dans le [guide d'installation](GUIDE_INSTALLATION.md#d-installation-sur-raspberry-pi). C'est une excellente option pour un serveur POS compact et economique.

### 38. Quelle base de donnees est utilisee ?

- **Backend (serveur)** : SQLite via `better-sqlite3`. Base de donnees fichier, sans serveur separe, haute performance en lecture.
- **Frontend (navigateurs)** : IndexedDB via `Dexie.js`. Base de donnees du navigateur, persistante, pour le fonctionnement hors-ligne.

### 39. L'application peut-elle etre deployee sur Vercel ?

Oui. Le frontend est deploye sur Vercel comme une Single Page Application (SPA). Le fichier `vercel.json` configure le build et les rewrites. Cependant, le backend local n'est pas deploye sur Vercel ; il doit tourner sur un serveur local ou dans Docker.

### 40. Comment mettre a jour l'application ?

Voir le [guide administrateur](GUIDE_ADMIN.md#6-mise-a-jour-de-lapplication) pour les procedures detaillees. En resume :

```bash
git pull origin main
cd backend && npm install
cd ../frontend && npm install && npm run build
# Redemarrer le serveur
```

---

## Support et migration

### 41. Comment migrer depuis un autre systeme de caisse ?

Pour migrer vos donnees depuis un autre systeme :

1. **Exportez vos donnees** depuis l'ancien systeme (CSV, Excel, ou base de donnees).
2. **Transformez-les** au format attendu par POS Mano Verde (voir le schema des tables dans le [guide admin](GUIDE_ADMIN.md#4-base-de-donnees-sqlite)).
3. **Importez-les** dans la base SQLite via des requetes SQL INSERT.
4. **Verifiez** que toutes les donnees sont correctes (stock, prix, categories).

Pour les produits, le format minimal est :

```sql
INSERT INTO products (id, store_id, name, price, stock, category, is_active, created_at, updated_at)
VALUES ('uuid-genere', 'votre-store-id', 'Nom du produit', 1500, 50, 'Categorie', 1, datetime('now'), datetime('now'));
```

### 42. Comment contacter le support technique ?

- **Documentation** : Consultez d'abord ce FAQ et les guides.
- **Aide integree** : Cliquez sur le bouton **?** (Aide) present sur chaque page de l'application pour obtenir de l'aide contextuelle.
- **Email** : Contactez le support Mano Verde SA.
- **Telephone** : Appelez le support technique Mano Verde.

### 43. L'application est-elle disponible en anglais ?

Oui. POS Mano Verde est disponible en **francais** et en **anglais**. Pour changer la langue :

1. Allez dans **Parametres** > **Langue**.
2. Selectionnez la langue souhaitee.
3. L'interface se met a jour immediatement.

### 44. Comment signaler un bug ou demander une fonctionnalite ?

1. Verifiez que le probleme n'est pas deja documente dans ce FAQ.
2. Rassemblez les informations utiles : description du probleme, captures d'ecran, navigateur utilise, messages d'erreur.
3. Contactez le support technique ou ouvrez une issue sur le depot GitHub du projet.

### 45. Les mises a jour sont-elles automatiques ?

- **Version cloud (Vercel)** : Oui, les mises a jour sont deployees automatiquement. Rechargez la page pour obtenir la derniere version.
- **Version locale / Docker** : Non, les mises a jour sont manuelles. Suivez la procedure de mise a jour decrite dans le [guide admin](GUIDE_ADMIN.md#6-mise-a-jour-de-lapplication).

---

## Encore des questions ?

Si votre question n'est pas dans cette liste, consultez :

- Le [guide d'installation](GUIDE_INSTALLATION.md) pour les problemes d'installation.
- Le [guide utilisateur](GUIDE_UTILISATEUR.md) pour l'utilisation quotidienne.
- Le [guide gerant](GUIDE_GERANT.md) pour la gestion de la boutique.
- Le [guide administrateur](GUIDE_ADMIN.md) pour les questions techniques.
- Le bouton **Aide** (**?**) present sur chaque page de l'application.
