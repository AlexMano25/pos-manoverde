# Guide gerant -- POS Mano Verde

Ce guide est destine aux **gerants** (role `manager`) et **administrateurs** (role `admin`) de boutique. Il couvre la gestion complete des produits, du stock, des employes, des commandes et des rapports.

---

## Table des matieres

- [1. Tableau de bord](#1-tableau-de-bord)
- [2. Gestion des produits](#2-gestion-des-produits)
- [3. Gestion du stock](#3-gestion-du-stock)
- [4. Gestion des commandes](#4-gestion-des-commandes)
- [5. Gestion des employes](#5-gestion-des-employes)
- [6. Rapports de vente](#6-rapports-de-vente)
- [7. Configuration de la boutique](#7-configuration-de-la-boutique)
- [8. Synchronisation](#8-synchronisation)
- [9. Gestion multi-boutiques](#9-gestion-multi-boutiques)
- [10. Securite et bonnes pratiques](#10-securite-et-bonnes-pratiques)

---

## 1. Tableau de bord

Le tableau de bord est la premiere page affichee apres connexion. Il donne une vue d'ensemble de l'activite de la boutique.

### Indicateurs principaux

| Indicateur | Description |
|------------|-------------|
| **Chiffre d'affaires du jour** | Total des ventes (en FCFA) pour la journee en cours. |
| **Nombre de commandes** | Nombre total de ventes realisees aujourd'hui. |
| **Panier moyen** | Montant moyen par commande (chiffre d'affaires / nombre de commandes). |
| **Benefice brut** | Chiffre d'affaires moins le cout d'achat des produits vendus. |

### Repartition des paiements

Un apercu de la repartition des ventes par mode de paiement :

- **Especes** : montant et pourcentage des ventes en liquide.
- **Carte** : montant et pourcentage des ventes par carte.
- **MoMo** : montant et pourcentage des ventes par Mobile Money.
- **Virement** : montant et pourcentage des ventes par virement.

### Produits les plus vendus

Liste des produits les plus vendus du jour, classee par quantite vendue et chiffre d'affaires genere.

### Utiliser le tableau de bord

- Consultez-le en debut et fin de journee pour suivre l'activite.
- Comparez les ventes jour par jour pour identifier les tendances.
- Identifiez les produits phares et les modes de paiement preferes de vos clients.

---

## 2. Gestion des produits

Cliquez sur **Produits** dans le menu lateral pour acceder a la gestion des produits.

### Vue d'ensemble des produits

La page affiche tous les produits de votre boutique sous forme de liste ou de grille :

- **Nom** du produit
- **Prix de vente** (en FCFA)
- **Cout d'achat** (en FCFA, si renseigne)
- **Stock** actuel
- **Categorie**
- **SKU** (code interne)
- **Statut** : actif ou desactive

### Ajouter un produit

1. Cliquez sur le bouton **Ajouter un produit** (ou **+**).
2. Remplissez le formulaire :

| Champ | Obligatoire | Description |
|-------|:-----------:|-------------|
| **Nom** | Oui | Nom du produit tel qu'il apparaitra en caisse. |
| **Prix de vente** | Oui | Prix en FCFA facture au client. |
| **Cout d'achat** | Non | Prix d'achat pour le calcul de la marge. |
| **Categorie** | Non | Categorie pour organiser les produits (ex: Boissons, Snacking). |
| **Stock initial** | Non | Quantite en stock au moment de l'ajout (par defaut : 0). |
| **SKU** | Non | Code interne du produit (ex: CAF-001). |
| **Code-barres** | Non | Code-barres du produit (EAN-13, UPC, etc.). |
| **Image** | Non | URL d'une image du produit. |

3. Cliquez sur **Enregistrer**.

### Modifier un produit

1. Trouvez le produit dans la liste.
2. Cliquez sur le bouton **Modifier** (icone crayon).
3. Modifiez les champs souhaites.
4. Cliquez sur **Enregistrer**.

> **Attention** : La modification du prix prend effet immediatement pour toutes les nouvelles ventes. Les commandes deja enregistrees conservent l'ancien prix.

### Desactiver un produit

Si un produit n'est plus disponible temporairement :

1. Cliquez sur le bouton **Modifier** du produit.
2. Desactivez l'option **Actif**.
3. Le produit n'apparaitra plus en caisse mais reste dans la base de donnees.

Pour le reactiver, suivez le meme processus et reactivez l'option.

### Supprimer un produit

1. Cliquez sur le bouton **Supprimer** (icone poubelle).
2. Confirmez la suppression.

> **Attention** : La suppression est definitive. Si le produit a deja ete vendu, les commandes passees conservent les informations. Privilegiez la desactivation plutot que la suppression.

### Gestion des categories

Les categories permettent d'organiser les produits pour faciliter la recherche en caisse.

- Les categories sont creees automatiquement quand vous les saisissez dans le champ "Categorie" d'un produit.
- Utilisez des noms coherents et courts (ex: "Boissons", "Snacking", "Boulangerie", "Hygiene").
- Les categories apparaissent comme filtres sur l'ecran de caisse.

### Bonnes pratiques produits

- Definissez un **SKU** unique pour chaque produit pour faciliter la recherche.
- Renseignez le **cout d'achat** pour suivre vos marges.
- Utilisez des **categories** coherentes pour accelerer le travail des caissiers.
- Si vous avez un lecteur de codes-barres, renseignez le **code-barres** de chaque produit.

---

## 3. Gestion du stock

Cliquez sur **Stock** dans le menu lateral pour acceder a la gestion du stock.

### Vue d'ensemble du stock

La page Stock affiche tous les produits avec :

- Le **stock actuel** de chaque produit.
- Le **seuil d'alerte** (stock minimum).
- Un indicateur visuel pour les produits en stock bas (orange) ou en rupture (rouge).
- L'historique des mouvements de stock.

### Types de mouvements de stock

| Type | Code | Description |
|------|------|-------------|
| **Entree** | `in` | Reception de marchandise (achat fournisseur, livraison). |
| **Sortie** | `out` | Sortie manuelle (perte, casse, vol, peremption). |
| **Ajustement** | `adjust` | Correction apres inventaire (le stock reel differe du stock theorique). |
| **Vente** | `sale` | Sortie automatique lors d'une vente (cree automatiquement). |
| **Retour** | `return` | Retour de marchandise (remboursement client). |

### Enregistrer une entree de stock

Quand vous recevez de la marchandise :

1. Allez dans **Stock**.
2. Cliquez sur **Nouveau mouvement** (ou **+**).
3. Selectionnez le **type** : **Entree**.
4. Selectionnez le **produit**.
5. Entrez la **quantite** recue.
6. (Optionnel) Ajoutez une **raison** (ex: "Livraison fournisseur ABC").
7. Cliquez sur **Enregistrer**.

Le stock du produit est mis a jour immediatement.

### Enregistrer une sortie de stock

Pour les pertes, casses ou autres sorties non liees a une vente :

1. Allez dans **Stock**.
2. Cliquez sur **Nouveau mouvement**.
3. Selectionnez le **type** : **Sortie**.
4. Selectionnez le **produit**.
5. Entrez la **quantite** sortie.
6. Ajoutez obligatoirement une **raison** (ex: "Casse", "Peremption", "Vol").
7. Cliquez sur **Enregistrer**.

### Faire un ajustement apres inventaire

Apres un inventaire physique, si le stock reel differe du stock theorique :

1. Allez dans **Stock**.
2. Cliquez sur **Nouveau mouvement**.
3. Selectionnez le **type** : **Ajustement**.
4. Selectionnez le **produit**.
5. Entrez la **difference** :
   - Positive si le stock reel est superieur au stock theorique.
   - Negative si le stock reel est inferieur au stock theorique.
6. Ajoutez une **raison** (ex: "Inventaire du 15/03/2026").
7. Cliquez sur **Enregistrer**.

### Alertes de stock bas

Quand le stock d'un produit descend en dessous du seuil minimum (`min_stock`), une alerte visuelle est declenchee :

- Un badge orange ou rouge apparait a cote du produit.
- Le tableau de bord signale les produits en alerte.

### Configurer le seuil d'alerte

1. Allez dans **Produits**.
2. Modifiez le produit concerne.
3. Definissez le champ **Stock minimum** (ex: 10 pour etre alerte quand le stock descend a 10 unites).

### Historique des mouvements

Chaque mouvement de stock est enregistre avec :

- La date et l'heure.
- Le type de mouvement.
- Le produit concerne.
- La quantite.
- La raison.
- L'employe qui a effectue le mouvement.

Cet historique est utile pour :

- Tracer les entrees et sorties.
- Identifier les causes de ecarts de stock.
- Auditer les mouvements en cas de suspicion de vol ou d'erreur.

---

## 4. Gestion des commandes

Cliquez sur **Commandes** dans le menu lateral pour acceder a l'historique complet des ventes.

### Consulter l'historique

La page affiche toutes les commandes avec :

- L'identifiant unique de la commande.
- La date et l'heure.
- Le caissier qui a realise la vente.
- Le mode de paiement.
- Le montant total.
- Le statut (payee, en attente, remboursee, annulee).

### Filtrer les commandes

Vous pouvez filtrer par :

- **Date** : Selectionnez une plage de dates.
- **Statut** : Payee, En attente, Remboursee, Annulee.
- **Mode de paiement** : Especes, Carte, MoMo, Virement.
- **Caissier** : Filtrer par employe.

### Rembourser une commande

Si un client demande un remboursement :

1. Trouvez la commande dans l'historique.
2. Cliquez sur le detail de la commande.
3. Cliquez sur **Rembourser**.
4. Confirmez le remboursement.

Le remboursement :

- Change le statut de la commande a "Remboursee".
- Restitue les quantites au stock (mouvement de type `return`).
- Est enregistre dans l'historique pour tracabilite.

### Exporter les commandes

Pour exporter les donnees de vente :

1. Selectionnez la plage de dates souhaitee.
2. Cliquez sur **Exporter**.
3. Choisissez le format (CSV recommande pour Excel).
4. Le fichier est telecharge sur votre appareil.

---

## 5. Gestion des employes

Cliquez sur **Employes** dans le menu lateral pour gerer les comptes utilisateurs.

### Roles et permissions

POS Mano Verde definit quatre roles avec des niveaux d'acces differents :

| Role | Code | Acces |
|------|------|-------|
| **Administrateur** | `admin` | Acces complet : configuration, employes, produits, stock, commandes, rapports, parametres. |
| **Gerant** | `manager` | Produits, stock, commandes, rapports. Pas d'acces a la configuration systeme. |
| **Caissier** | `cashier` | Caisse (POS) et consultation des commandes uniquement. |
| **Responsable stock** | `stock` | Gestion du stock et consultation des produits uniquement. |

### Creer un compte employe

1. Allez dans **Employes**.
2. Cliquez sur **Ajouter un employe** (ou **+**).
3. Remplissez le formulaire :

| Champ | Obligatoire | Description |
|-------|:-----------:|-------------|
| **Nom** | Oui | Nom complet de l'employe. |
| **Email** | Oui | Adresse email (sert d'identifiant de connexion). |
| **Mot de passe** | Oui | Mot de passe pour la connexion (6 caracteres minimum). |
| **Role** | Oui | Admin, Gerant, Caissier ou Responsable stock. |
| **PIN** | Non | Code PIN a 4 chiffres pour la connexion rapide en caisse. |
| **Telephone** | Non | Numero de telephone de l'employe. |

4. Cliquez sur **Enregistrer**.

> **Important** : Chaque email doit etre unique. Chaque PIN doit etre unique.

### Modifier un employe

1. Trouvez l'employe dans la liste.
2. Cliquez sur **Modifier**.
3. Modifiez les champs souhaites (nom, role, PIN, telephone).
4. Cliquez sur **Enregistrer**.

### Attribuer un PIN

Le PIN permet aux caissiers de se connecter rapidement sans saisir d'email ni de mot de passe.

1. Modifiez le profil de l'employe.
2. Dans le champ **PIN**, entrez un code a 4 chiffres unique.
3. Enregistrez.

> **Conseil** : Evitez les PINs simples comme 0000, 1111, ou 1234. Choisissez des codes difficiles a deviner.

### Desactiver un employe

Si un employe quitte la boutique ou doit etre temporairement bloque :

1. Trouvez l'employe dans la liste.
2. Cliquez sur **Desactiver**.
3. L'employe ne pourra plus se connecter mais son historique est conserve.

### Supprimer un employe

1. Cliquez sur **Supprimer** a cote de l'employe.
2. Confirmez la suppression.

> **Attention** : Les commandes passees par cet employe restent dans l'historique mais ne seront plus associees a un utilisateur actif.

---

## 6. Rapports de vente

Les rapports vous permettent d'analyser les performances de votre boutique.

### Rapport journalier

Le rapport journalier (accessible depuis le tableau de bord) contient :

- **Chiffre d'affaires total** du jour.
- **Nombre de commandes**.
- **Panier moyen**.
- **Benefice brut** (si les couts d'achat sont renseignes).
- **Repartition par mode de paiement**.
- **Top des produits vendus** (par quantite et par chiffre d'affaires).

### Rapport par periode

Pour analyser une periode specifique :

1. Selectionnez la date de debut et la date de fin.
2. Le rapport affiche :
   - Le chiffre d'affaires total de la periode.
   - Le nombre total de commandes.
   - Le panier moyen.
   - L'evolution du chiffre d'affaires jour par jour.

### Indicateurs de performance

| Indicateur | Formule | Utilite |
|------------|---------|--------|
| **Panier moyen** | CA / Nombre de commandes | Mesure la valeur moyenne des achats. |
| **Marge brute** | (Prix de vente - Cout) / Prix de vente | Rentabilite de chaque produit. |
| **Taux de rotation** | Quantite vendue / Stock moyen | Vitesse de vente des produits. |

### Analyser les rapports

Quelques pistes d'analyse :

- **Comparer les jours de la semaine** : Identifiez les jours de forte et faible activite.
- **Analyser les modes de paiement** : Adaptez vos options selon les preferences clients.
- **Suivre les produits vedettes** : Assurez-vous que les best-sellers sont toujours en stock.
- **Surveiller les marges** : Identifiez les produits peu rentables.

---

## 7. Configuration de la boutique

Cliquez sur **Parametres** dans le menu lateral pour configurer votre boutique.

### Informations generales

| Parametre | Description |
|-----------|-------------|
| **Nom de la boutique** | Nom affiche sur les tickets et dans l'application. |
| **Adresse** | Adresse de la boutique (affichee sur les tickets). |
| **Telephone** | Numero de telephone (affiche sur les tickets). |
| **Type d'activite** | Restaurant, Supermarche, Pharmacie, Mode, Electronique, Services. |

### Parametres financiers

| Parametre | Description |
|-----------|-------------|
| **Devise** | FCFA (XAF) par defaut. |
| **Taux de taxe** | Pourcentage de TVA a appliquer (ex: 19.25% pour le Cameroun). Mettre a 0 si pas de taxe. |
| **Prix TTC** | Si active, les prix affiches incluent deja la taxe. |

### Parametres de caisse

| Parametre | Description |
|-----------|-------------|
| **Impression automatique** | Si active, le ticket s'imprime automatiquement apres chaque vente. |
| **Sons** | Active/desactive les sons de l'interface. |
| **Theme** | Clair ou sombre. |
| **Langue** | Francais ou anglais. |

---

## 8. Synchronisation

POS Mano Verde synchronise les donnees entre tous les terminaux de la boutique.

### Comment fonctionne la synchronisation

1. **Mode normal (en ligne)** : Les donnees sont envoyees au serveur central en temps reel via WebSocket. Tous les terminaux voient les mises a jour instantanement.

2. **Mode hors-ligne** : Les ventes et mouvements de stock sont stockes localement dans le navigateur (IndexedDB via Dexie). Un compteur indique le nombre d'elements en attente de synchronisation.

3. **Retour en ligne** : Quand la connexion est retablie, les donnees en attente sont automatiquement synchronisees vers le serveur. Le processus est :
   - Les modifications locales sont envoyees au serveur (`push`).
   - Les modifications du serveur sont recuperees (`pull`).
   - Les donnees sont fusionnees.

### Indicateur de synchronisation

En haut de l'ecran, un indicateur montre :

- **Point vert** : Connecte au serveur, tout est synchronise.
- **Point orange** : En ligne mais des elements sont en attente de synchronisation.
- **Point rouge** : Hors-ligne, les donnees sont stockees localement.
- **Icone de chargement** : Synchronisation en cours.
- **Compteur** : Nombre d'elements en attente (ex: "3 en attente").

### Frequence de synchronisation

- **Automatique** : Toutes les **30 secondes**, le systeme verifie s'il y a des elements en attente et les synchronise.
- **Temps reel** : Les creations de commandes et mises a jour de stock sont transmises instantanement via WebSocket.
- **Au retour en ligne** : Quand le navigateur detecte le retour de la connexion, une synchronisation est declenchee immediatement.

### Forcer une synchronisation

Si vous voulez synchroniser immediatement sans attendre :

1. Allez dans **Parametres** > **Synchronisation**.
2. Cliquez sur **Synchroniser maintenant**.

### Conflits de synchronisation

En cas de conflit (meme produit modifie sur deux terminaux simultanement) :

- Le serveur applique la regle "dernier ecrivain gagne" (`last-write-wins`).
- Les ventes ne sont jamais perdues : chaque commande a un identifiant unique.

### Donnees synchronisees

| Donnee | Direction | Description |
|--------|-----------|-------------|
| **Produits** | Serveur vers clients | Les modifications de produits (prix, stock, categories) sont propagees a tous les terminaux. |
| **Commandes** | Clients vers serveur | Les ventes enregistrees sur un terminal sont envoyees au serveur et propagees aux autres terminaux. |
| **Mouvements de stock** | Bidirectionnel | Les entrees/sorties de stock sont synchronisees dans les deux sens. |
| **Utilisateurs** | Serveur vers clients | Les modifications de comptes employes sont propagees a tous les terminaux. |

---

## 9. Gestion multi-boutiques

Si vous gerez plusieurs points de vente, POS Mano Verde supporte le multi-boutiques.

### Architecture multi-boutiques

Chaque boutique possede :

- Son propre **identifiant** (`store_id`).
- Ses propres **produits**, **commandes**, **stock** et **employes**.
- Son propre **serveur local** (optionnel).

### Avec Supabase (cloud)

Si vous utilisez la synchronisation cloud via Supabase :

- Chaque boutique est un `store_id` dans la base de donnees Supabase.
- Un administrateur peut voir les donnees de toutes les boutiques.
- Chaque boutique synchronise independamment ses donnees.

### Avec des serveurs locaux independants

Si chaque boutique a son propre serveur local :

- Chaque boutique fonctionne de maniere autonome.
- Les donnees ne sont pas partagees entre les boutiques.
- Cette configuration est la plus simple mais ne permet pas la consolidation des rapports.

### Voir les donnees d'une autre boutique

1. Allez dans **Parametres** > **Boutique**.
2. Selectionnez la boutique souhaitee dans la liste.
3. Les donnees du tableau de bord, des produits et des commandes changent pour afficher celles de la boutique selectionnee.

---

## 10. Securite et bonnes pratiques

### Gestion des mots de passe

- **Changez le mot de passe par defaut** immediatement apres l'installation.
- Utilisez des mots de passe d'au moins **8 caracteres** avec des majuscules, minuscules, chiffres et caracteres speciaux.
- Ne partagez jamais les identifiants de connexion entre employes.
- Chaque employe doit avoir son propre compte.

### Gestion des PINs

- Attribuez un PIN unique a chaque caissier.
- Evitez les PINs previsibles (0000, 1234, date de naissance).
- Changez les PINs regulierement (tous les mois par exemple).
- Desactivez immediatement le PIN d'un employe qui quitte la boutique.

### Sauvegardes

- Les donnees sont stockees dans une base SQLite sur le serveur (`pos.db`).
- **Sauvegardez regulierement** cette base de donnees (copie sur cle USB, disque externe ou cloud).
- Si vous utilisez Docker, sauvegardez le volume de donnees.
- Si vous utilisez Supabase, les donnees sont automatiquement sauvegardees dans le cloud.

### Acces physique

- Verrouillez l'ecran du serveur POS quand il n'est pas utilise.
- Placez le serveur (PC ou Raspberry Pi) dans un endroit securise.
- Restreignez l'acces au reseau WiFi de la caisse.

### Journalisation

- Toutes les actions sont tracees : ventes, mouvements de stock, connexions.
- Consultez regulierement l'historique pour detecter des anomalies.
- En cas de suspicion de fraude, exportez les donnees pour analyse.

### Mise a jour

- Mettez a jour l'application regulierement pour beneficier des corrections de securite.
- Testez les mises a jour sur un environnement de test avant de les deployer en production.
