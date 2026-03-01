# Guide utilisateur -- POS Mano Verde

Ce guide est destine aux **caissiers** et **vendeurs** qui utilisent POS Mano Verde au quotidien. Il explique pas a pas comment realiser chaque operation de caisse.

---

## Table des matieres

- [1. Connexion a l'application](#1-connexion-a-lapplication)
- [2. L'ecran de caisse (POS)](#2-lecran-de-caisse-pos)
- [3. Faire une vente pas a pas](#3-faire-une-vente-pas-a-pas)
- [4. Rechercher un produit](#4-rechercher-un-produit)
- [5. Appliquer une remise](#5-appliquer-une-remise)
- [6. Choisir le mode de paiement](#6-choisir-le-mode-de-paiement)
- [7. Paiement en especes](#7-paiement-en-especes)
- [8. Impression du ticket via Bluetooth](#8-impression-du-ticket-via-bluetooth)
- [9. Historique des commandes](#9-historique-des-commandes)
- [10. Verifier le stock](#10-verifier-le-stock)
- [11. Que faire en cas de probleme](#11-que-faire-en-cas-de-probleme)
- [12. Raccourcis et astuces](#12-raccourcis-et-astuces)

---

## 1. Connexion a l'application

POS Mano Verde propose deux methodes de connexion :

### Connexion par email et mot de passe

1. Ouvrez l'application dans votre navigateur.
2. Sur l'ecran de connexion, entrez :
   - **Email** : votre adresse email (ex: `caissier1@manoverde.com`)
   - **Mot de passe** : votre mot de passe personnel
3. Cliquez sur **Se connecter**.

### Connexion rapide par PIN

Pour les changements de caissier en cours de journee, utilisez le PIN rapide :

1. Sur l'ecran de connexion, cliquez sur **"Connexion par PIN"**.
2. Saisissez votre code PIN a 4 chiffres sur le pave numerique.
3. La connexion est instantanee.

> **Note** : Le PIN est attribue par votre gerant ou administrateur. Si vous ne connaissez pas votre PIN, demandez-le a votre responsable.

### Deconnexion

Pour vous deconnecter :

1. Cliquez sur votre nom d'utilisateur en haut de l'ecran (dans la barre superieure).
2. Selectionnez **Deconnexion**.

> **Bonne pratique** : Deconnectez-vous toujours en fin de service pour securiser votre session.

---

## 2. L'ecran de caisse (POS)

L'ecran de caisse est divise en deux zones principales :

### Zone gauche : Catalogue produits (60% de l'ecran)

Cette zone affiche tous les produits disponibles a la vente.

| Element | Description |
|---------|-------------|
| **Barre de recherche** | En haut, permet de rechercher un produit par nom, SKU ou code-barres. |
| **Filtres par categorie** | Boutons horizontaux pour filtrer par categorie (Tous, Boissons, Snacking, etc.). |
| **Grille de produits** | Chaque carte affiche le nom, le prix (en FCFA) et le stock disponible. |
| **Indicateur de stock** | Le stock s'affiche en rouge quand il est bas (5 ou moins). Les produits en rupture sont grise et non cliquables. |

### Zone droite : Panier (40% de l'ecran)

Cette zone affiche le contenu du panier en cours.

| Element | Description |
|---------|-------------|
| **En-tete du panier** | Icone de panier, nombre d'articles, bouton "Vider" pour tout supprimer. |
| **Liste des articles** | Chaque article montre le nom, le prix unitaire, la quantite (modifiable), le total, et un bouton de suppression (X). |
| **Sous-total** | Somme des prix avant remise et taxe. |
| **Remise** | Champ de saisie pour appliquer une remise en pourcentage (0-100%). |
| **Taxe** | S'affiche automatiquement si un taux de taxe est configure. |
| **TOTAL** | Montant final a payer, en gros et en bleu. |
| **Boutons de paiement** | 4 boutons : Especes, Carte, MoMo, Virement. |

---

## 3. Faire une vente pas a pas

### Etape 1 : Ajouter des produits au panier

- **Methode 1 -- Clic** : Cliquez sur la carte d'un produit dans la grille. Il est ajoute au panier avec une quantite de 1.
- **Methode 2 -- Recherche** : Tapez le nom ou le code du produit dans la barre de recherche, puis cliquez sur le produit trouve.
- **Methode 3 -- Scanner** : Si vous avez un lecteur de codes-barres, scannez le code-barres du produit. Il s'ajoute automatiquement au panier.

### Etape 2 : Modifier les quantites

Dans le panier, pour chaque article :

- Cliquez sur **+** pour augmenter la quantite.
- Cliquez sur **-** pour diminuer la quantite.
- Ou tapez directement la quantite souhaitee dans le champ numerique.

Si la quantite descend a 0, l'article est retire du panier.

### Etape 3 : Appliquer une remise (optionnel)

Voir la section [5. Appliquer une remise](#5-appliquer-une-remise).

### Etape 4 : Valider le paiement

1. Verifiez le **TOTAL** affiche en bas du panier.
2. Cliquez sur le bouton de paiement correspondant :
   - **Especes** (billet) -- Paiement en liquide.
   - **Carte** (carte) -- Paiement par carte bancaire.
   - **MoMo** (telephone) -- Paiement Mobile Money (Orange Money, MTN MoMo, etc.).
   - **Virement** (fleches) -- Virement bancaire.

3. La fenetre de paiement s'ouvre. Voir la section [6. Choisir le mode de paiement](#6-choisir-le-mode-de-paiement).

### Etape 5 : Finaliser la vente

1. Dans la fenetre de paiement, confirmez le montant.
2. Pour un paiement en especes, entrez le montant recu. Le rendu de monnaie s'affiche automatiquement.
3. Cliquez sur **Valider la vente**.
4. Le ticket s'imprime si une imprimante Bluetooth est connectee.
5. Le panier se vide et vous etes pret pour la vente suivante.

---

## 4. Rechercher un produit

La barre de recherche en haut de la zone produits permet de trouver rapidement un article :

### Par nom

Tapez le debut du nom du produit. Les resultats se filtrent en temps reel.

- Exemple : tapez `caf` pour trouver "Cafe Latte".

### Par SKU (code interne)

Tapez le code SKU du produit.

- Exemple : tapez `CAF-001` pour trouver "Cafe Latte".

### Par code-barres

Tapez ou scannez le code-barres du produit.

- Si vous avez un lecteur de codes-barres USB ou Bluetooth, scannez directement. Le curseur doit etre dans la barre de recherche.

### Filtrer par categorie

Cliquez sur les boutons de categorie sous la barre de recherche :

- **Tous** : affiche tous les produits.
- **Boissons**, **Snacking**, **Boulangerie**, etc. : affiche uniquement les produits de cette categorie.

### Effacer la recherche

Cliquez sur le **X** a droite de la barre de recherche pour effacer le texte et revenir a l'affichage complet.

---

## 5. Appliquer une remise

POS Mano Verde permet d'appliquer une remise en pourcentage sur le total de la commande.

### Comment appliquer une remise

1. Ajoutez tous les produits au panier.
2. Dans la zone du panier (a droite), trouvez la ligne **Remise**.
3. Entrez le pourcentage de remise dans le champ (par exemple : `10` pour 10%).
4. Le montant de la remise s'affiche en rouge et le total se recalcule automatiquement.

### Exemples

| Sous-total | Remise | Montant deduit | Nouveau total |
|-----------|--------|----------------|---------------|
| 5 000 FCFA | 10% | -500 FCFA | 4 500 FCFA |
| 10 000 FCFA | 25% | -2 500 FCFA | 7 500 FCFA |
| 3 000 FCFA | 50% | -1 500 FCFA | 1 500 FCFA |

### Regles

- La remise est entre **0%** et **100%**.
- La remise s'applique sur le sous-total (avant taxe).
- La taxe est calculee sur le montant apres remise.
- Pour annuler la remise, remettez le champ a **0** ou videz-le.

> **Note** : Selon la politique de votre boutique, les remises au-dessus d'un certain seuil peuvent necessiter l'autorisation d'un gerant.

---

## 6. Choisir le mode de paiement

Quatre modes de paiement sont disponibles :

### Especes

Le client paie en billets et pieces. Cliquez sur le bouton **Especes** (icone billet).

Voir la section [7. Paiement en especes](#7-paiement-en-especes) pour le calcul du rendu de monnaie.

### Carte bancaire

Le client paie par carte de credit/debit. Cliquez sur le bouton **Carte** (icone carte).

1. Procedez au paiement sur votre terminal de paiement electronique (TPE) physique.
2. Une fois le paiement confirme sur le TPE, validez la vente dans l'application.

### Mobile Money (MoMo)

Le client paie par Mobile Money (Orange Money, MTN MoMo, etc.). Cliquez sur le bouton **MoMo** (icone telephone).

1. Communiquez le montant au client.
2. Le client effectue le transfert depuis son telephone vers le numero de la boutique.
3. Verifiez la reception du paiement (SMS de confirmation).
4. Validez la vente dans l'application.

### Virement bancaire

Le client paie par virement. Cliquez sur le bouton **Virement** (icone fleches).

1. Communiquez les coordonnees bancaires de la boutique au client.
2. Une fois le virement confirme, validez la vente dans l'application.

---

## 7. Paiement en especes

Lors d'un paiement en especes, la fenetre de paiement affiche :

### Calcul du rendu de monnaie

1. Le **montant a payer** s'affiche en haut.
2. Entrez le **montant recu** du client dans le champ prevu.
3. Le **rendu de monnaie** se calcule automatiquement :

   ```
   Rendu = Montant recu - Total a payer
   ```

### Exemple

| Total a payer | Montant recu | Rendu de monnaie |
|--------------|-------------|-----------------|
| 3 500 FCFA | 5 000 FCFA | 1 500 FCFA |
| 7 200 FCFA | 10 000 FCFA | 2 800 FCFA |

### Boutons de montant rapide

Des boutons de montants courants sont disponibles pour saisir rapidement le montant recu sans taper au clavier (ex: 500, 1000, 2000, 5000, 10000 FCFA).

### Validation

- Si le montant recu est **egal ou superieur** au total, cliquez sur **Valider la vente**.
- Si le montant recu est **inferieur** au total, le bouton de validation est desactive.

---

## 8. Impression du ticket via Bluetooth

POS Mano Verde permet d'imprimer des tickets de caisse sur une imprimante thermique Bluetooth (58mm ou 80mm).

### Prerequis

- Un navigateur compatible Web Bluetooth : **Google Chrome** ou **Microsoft Edge** (pas Firefox ni Safari).
- Une imprimante thermique Bluetooth compatible ESC/POS.
- Le Bluetooth active sur votre appareil.

### Connecter une imprimante

1. Allumez votre imprimante Bluetooth.
2. Dans POS Mano Verde, allez dans **Parametres** > **Imprimante**.
3. Cliquez sur **Rechercher une imprimante**.
4. Une fenetre du navigateur apparait avec la liste des appareils Bluetooth detectes.
5. Selectionnez votre imprimante dans la liste.
6. Cliquez sur **Associer**.
7. Le statut passe a **Connectee** avec le nom de l'imprimante.

### Imprimer un ticket

L'impression se fait automatiquement apres chaque vente si :

- Une imprimante est connectee.
- L'option **Impression automatique** est activee dans les parametres.

Pour imprimer manuellement :

1. Allez dans **Commandes**.
2. Trouvez la commande souhaitee.
3. Cliquez sur **Imprimer le ticket**.

### Contenu du ticket

Le ticket imprime contient :

- Nom et coordonnees de la boutique (en-tete).
- Nom du caissier.
- Date et heure de la vente.
- Liste des articles (nom, quantite, prix unitaire, total par ligne).
- Sous-total, remise, taxe.
- Total a payer.
- Mode de paiement.
- Montant recu et rendu de monnaie (paiement especes).
- Identifiant de la commande (en pied de ticket).

### En cas de probleme d'impression

- **Imprimante non detectee** : Verifiez que le Bluetooth est active et que l'imprimante est allumee.
- **Impression illisible** : Verifiez que le rouleau de papier est correctement installe.
- **Erreur de connexion** : Deconnectez et reconnectez l'imprimante dans les parametres.

---

## 9. Historique des commandes

Pour consulter les ventes passees :

1. Cliquez sur **Commandes** dans le menu de gauche (barre laterale).

### L'ecran des commandes

| Element | Description |
|---------|-------------|
| **Liste des commandes** | Toutes les commandes de la boutique, de la plus recente a la plus ancienne. |
| **Statut** | Badge colore : "Payee" (vert), "En attente" (orange), "Remboursee" (rouge), "Annulee" (gris). |
| **Mode de paiement** | Icone du mode de paiement utilise. |
| **Montant** | Total de la commande en FCFA. |
| **Date/heure** | Date et heure de creation. |

### Filtrer les commandes

- **Par statut** : Utilisez les filtres en haut de la page.
- **Par date** : Selectionnez une plage de dates.
- **Par caissier** : Filtrez par l'employe qui a cree la commande.

### Voir le detail d'une commande

Cliquez sur une commande dans la liste pour voir :

- La liste complete des articles.
- Le sous-total, la remise, la taxe et le total.
- Le mode de paiement utilise.
- Le montant recu et le rendu (si especes).
- L'identifiant de la commande.
- L'heure exacte.

---

## 10. Verifier le stock

Pour verifier la disponibilite d'un produit :

### Depuis l'ecran de caisse

- Le stock de chaque produit est affiche directement sur sa carte dans la grille.
- Les produits avec un stock de **5 ou moins** sont affiches en rouge.
- Les produits a **0** en stock sont grise et affiches comme "Rupture".

### Depuis la page Stock

1. Cliquez sur **Stock** dans le menu de gauche.
2. Vous voyez la liste de tous les produits avec leur stock actuel.
3. Les produits en alerte (stock bas) sont mis en evidence.

> **Note** : En tant que caissier, vous pouvez consulter le stock mais pas le modifier. Les mouvements de stock sont geres par le gerant ou le responsable stock.

---

## 11. Que faire en cas de probleme

### L'application ne se charge pas

1. Verifiez votre connexion WiFi.
2. Verifiez que le serveur est allume et fonctionne.
3. Essayez de recharger la page (F5 ou tirer vers le bas sur mobile).
4. Videz le cache du navigateur si le probleme persiste.

### L'application est hors-ligne

**Pas de panique.** POS Mano Verde fonctionne parfaitement hors-ligne.

- Un indicateur de statut en haut de l'ecran montre si vous etes connecte (vert) ou hors-ligne (orange).
- Toutes les ventes sont enregistrees localement dans le navigateur.
- Les donnees se synchronisent automatiquement quand la connexion est retablie.
- Vous pouvez continuer a vendre normalement.

### L'imprimante Bluetooth est deconnectee

1. Verifiez que l'imprimante est allumee et chargee.
2. Verifiez que le Bluetooth est active sur votre appareil.
3. Allez dans **Parametres** > **Imprimante** et cliquez sur **Reconnecter**.
4. Si ca ne fonctionne pas, cliquez sur **Rechercher une imprimante** pour re-associer.

> **Astuce** : La vente est enregistree meme si l'impression echoue. Vous pouvez reimprimer le ticket plus tard depuis l'historique des commandes.

### Un produit n'apparait pas

- Verifiez que le filtre de categorie n'est pas actif (cliquez sur **Tous**).
- Effacez la barre de recherche.
- Le produit est peut-etre en rupture de stock ou desactive. Contactez votre gerant.

### Le total semble incorrect

- Verifiez les quantites de chaque article dans le panier.
- Verifiez qu'une remise n'est pas appliquee par erreur.
- Verifiez le taux de taxe dans les parametres.

### La synchronisation ne fonctionne pas

- Verifiez que vous etes connecte au WiFi.
- Verifiez que le serveur est allume.
- Un compteur en haut de l'ecran indique le nombre d'elements en attente de synchronisation.
- La synchronisation se fait automatiquement toutes les 30 secondes.
- Vous pouvez forcer une synchronisation dans **Parametres** > **Synchronisation** > **Synchroniser maintenant**.

---

## 12. Raccourcis et astuces

### Gagner du temps

| Astuce | Comment faire |
|--------|---------------|
| **Ajouter rapidement un produit** | Cliquez une fois pour ajouter 1 unite, cliquez plusieurs fois pour augmenter la quantite. |
| **Recherche rapide** | Commencez a taper le nom du produit : les resultats apparaissent instantanement. |
| **Changer de categorie** | Utilisez les boutons de categorie pour ne voir que les produits pertinents. |
| **Vider le panier** | Cliquez sur le bouton rouge "Vider" en haut du panier. |
| **Connexion rapide** | Utilisez votre PIN a 4 chiffres pour vous connecter en 2 secondes. |
| **Scanner les codes-barres** | Utilisez un lecteur de codes-barres USB. Placez le curseur dans la barre de recherche et scannez. |

### Bonnes pratiques

- **Verifiez toujours le total** avant de confirmer le paiement.
- **Comptez le rendu de monnaie** affiche avant de le donner au client.
- **Deconnectez-vous** en fin de service.
- **Signalez** tout produit en rupture de stock a votre gerant.
- **Ne fermez pas le navigateur** pendant une vente en cours.
- **Verifiez l'indicateur de synchronisation** regulierement. S'il y a beaucoup d'elements en attente, contactez votre administrateur.

### Support

En cas de probleme non resolu, contactez :

- Votre **gerant** ou **administrateur** de boutique.
- Le support technique Mano Verde via le bouton **Aide** (icone "?") present sur chaque page de l'application.
