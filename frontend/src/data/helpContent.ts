// ---------------------------------------------------------------------------
// Contextual Help Content for every page in the POS application
// Language: French (primary language of Mano Verde SA)
// ---------------------------------------------------------------------------

export type HelpSection = {
  title: string
  icon?: string
  content: string
  role?: 'admin' | 'manager' | 'cashier' | 'all'
}

export type PageHelp = {
  pageTitle: string
  overview: string
  sections: HelpSection[]
  tips: string[]
  faq: { question: string; answer: string }[]
}

// ---------------------------------------------------------------------------
// Help content registry
// ---------------------------------------------------------------------------

export const helpContent: Record<string, PageHelp> = {
  // =========================================================================
  // LOGIN
  // =========================================================================
  login: {
    pageTitle: 'Connexion',
    overview:
      "La page de connexion vous permet d'acceder a l'application POS. " +
      "Chaque employe dispose d'un code PIN personnel a 4 chiffres attribue par " +
      "l'administrateur. Ce systeme de connexion rapide est optimise pour un usage " +
      'en caisse, permettant un changement rapide entre les utilisateurs.',
    sections: [
      {
        title: 'Se connecter avec son code PIN',
        icon: '🔑',
        content:
          "1. Saisissez votre code PIN a 4 chiffres sur le pave numerique.\n" +
          "2. L'application vous identifie automatiquement et charge vos droits d'acces.\n" +
          "3. Vous serez redirige vers le tableau de bord ou la page de caisse selon votre role.\n\n" +
          "Le code PIN est personnel et confidentiel. Ne le partagez jamais avec un collegue.",
        role: 'all',
      },
      {
        title: 'Configuration du serveur',
        icon: '🖥️',
        content:
          "Avant la premiere connexion, vous devez configurer l'adresse du serveur :\n\n" +
          "1. Appuyez sur le bouton 'Configurer le serveur' en bas de la page de connexion.\n" +
          "2. Entrez l'adresse IP du serveur principal (ex: 192.168.1.100).\n" +
          "3. Entrez le port (par defaut : 3000).\n" +
          "4. Testez la connexion en appuyant sur 'Tester'.\n" +
          "5. Si le test reussit, enregistrez la configuration.\n\n" +
          "En mode serveur, cette etape n'est pas necessaire car l'appareil EST le serveur.",
        role: 'admin',
      },
      {
        title: 'Mode serveur vs. mode client',
        icon: '📡',
        content:
          "L'application fonctionne selon deux modes :\n\n" +
          "- Mode Serveur : l'appareil est le point central. Il stocke toutes les donnees " +
          "et les autres appareils s'y connectent. Un seul appareil doit etre en mode serveur.\n\n" +
          "- Mode Client : l'appareil se connecte au serveur pour synchroniser les donnees. " +
          "Plusieurs appareils peuvent fonctionner en mode client simultanement.\n\n" +
          "Le mode est choisi lors de la configuration initiale et peut etre modifie dans les parametres.",
        role: 'admin',
      },
      {
        title: 'Depannage de connexion',
        icon: '🔧',
        content:
          "Si vous ne parvenez pas a vous connecter :\n\n" +
          "- Verifiez que le serveur est allume et accessible sur le reseau.\n" +
          "- Assurez-vous que l'adresse IP et le port sont corrects.\n" +
          "- Verifiez que vous etes connecte au meme reseau Wi-Fi que le serveur.\n" +
          "- Redemarrez l'application si le probleme persiste.\n" +
          "- En dernier recours, reinitialiser la configuration du serveur.\n\n" +
          "Si aucun de ces conseils ne fonctionne, contactez votre administrateur.",
        role: 'all',
      },
    ],
    tips: [
      "Memorisez votre code PIN pour une connexion rapide en caisse.",
      "Le mode hors-ligne permet de continuer a travailler meme si le serveur est inaccessible.",
      "En cas de perte de votre PIN, demandez a un administrateur de le reinitialiser depuis la page Employes.",
      "L'application se deconnecte automatiquement apres une periode d'inactivite pour des raisons de securite.",
    ],
    faq: [
      {
        question: "J'ai oublie mon code PIN, que faire ?",
        answer:
          "Demandez a votre administrateur ou manager de reinitialiser votre code PIN " +
          "depuis la page de gestion des employes. Un nouveau PIN temporaire vous sera attribue.",
      },
      {
        question: "Pourquoi la connexion au serveur echoue-t-elle ?",
        answer:
          "Verifiez que le serveur est en marche, que vous etes sur le meme reseau Wi-Fi, " +
          "et que l'adresse IP est correcte. Un pare-feu peut aussi bloquer la connexion.",
      },
      {
        question: "Puis-je utiliser l'application sans serveur ?",
        answer:
          "Oui, en mode serveur local l'appareil fonctionne de maniere autonome. " +
          "En mode client, les donnees sont stockees localement et synchronisees " +
          "lorsque le serveur redevient disponible.",
      },
      {
        question: "Combien de tentatives de connexion ai-je avant blocage ?",
        answer:
          "Il n'y a pas de limite de tentatives, mais chaque essai incorrect est enregistre. " +
          "Contactez votre administrateur si vous ne parvenez pas a retrouver votre PIN.",
      },
    ],
  },

  // =========================================================================
  // SETUP
  // =========================================================================
  setup: {
    pageTitle: 'Configuration initiale',
    overview:
      "La page de configuration initiale apparait au premier lancement de l'application. " +
      "Elle vous guide dans le choix du mode de fonctionnement (serveur ou client), " +
      "la selection de l'activite et les parametres de base du magasin. " +
      "Cette etape est indispensable avant de pouvoir utiliser la caisse.",
    sections: [
      {
        title: "Selection de l'activite",
        icon: '🏪',
        content:
          "Choisissez le type d'activite qui correspond a votre commerce :\n\n" +
          "1. Selectionnez votre secteur d'activite dans la liste proposee.\n" +
          "2. Ce choix determine les categories de produits pre-configurees.\n" +
          "3. Vous pourrez toujours modifier ou ajouter des categories plus tard.\n\n" +
          "Le choix de l'activite influence les rapports et les suggestions de l'application.",
        role: 'admin',
      },
      {
        title: 'Choix du mode serveur/client',
        icon: '🔗',
        content:
          "Decidez comment cet appareil fonctionnera dans votre configuration :\n\n" +
          "Mode Serveur :\n" +
          "- Choisissez ce mode pour l'appareil principal de votre magasin.\n" +
          "- Cet appareil stockera toutes les donnees (produits, commandes, employes).\n" +
          "- Les autres appareils se connecteront a celui-ci.\n" +
          "- Un seul appareil doit etre en mode serveur.\n\n" +
          "Mode Client :\n" +
          "- Choisissez ce mode pour les caisses supplementaires.\n" +
          "- Cet appareil se synchronisera avec le serveur principal.\n" +
          "- Vous devrez entrer l'adresse IP du serveur.\n" +
          "- Les donnees sont gardees en local pour le mode hors-ligne.",
        role: 'admin',
      },
      {
        title: 'Informations du magasin',
        icon: '📋',
        content:
          "Renseignez les informations de base de votre magasin :\n\n" +
          "1. Nom du magasin : apparaitra sur les tickets de caisse.\n" +
          "2. Adresse : utilisee pour les tickets et les rapports.\n" +
          "3. Numero de telephone : affiche sur les tickets.\n" +
          "4. Monnaie : definit la devise utilisee (CHF, EUR, etc.).\n\n" +
          "Ces informations peuvent etre modifiees a tout moment dans les Parametres.",
        role: 'admin',
      },
      {
        title: 'Creation du compte administrateur',
        icon: '👤',
        content:
          "Lors de la premiere configuration, un compte administrateur est cree :\n\n" +
          "1. Entrez le nom complet de l'administrateur.\n" +
          "2. Definissez un code PIN a 4 chiffres.\n" +
          "3. Ce compte aura tous les droits sur l'application.\n" +
          "4. Conservez ce PIN en lieu sur, il sera necessaire pour toute operation d'administration.\n\n" +
          "Vous pourrez ajouter d'autres employes et administrateurs par la suite.",
        role: 'admin',
      },
    ],
    tips: [
      "Notez l'adresse IP du serveur et communiquez-la a vos collegues qui configurent les clients.",
      "Choisissez un code PIN administrateur que vous n'oublierez pas - il est essentiel pour la gestion.",
      "La configuration initiale ne peut etre faite qu'une seule fois. Pour recommencer, il faut reinitialiser l'application.",
      "Verifiez que votre reseau Wi-Fi est stable avant de configurer un appareil en mode client.",
    ],
    faq: [
      {
        question: "Puis-je modifier le mode serveur/client apres la configuration ?",
        answer:
          "Oui, mais cela necessite une reinitialisation partielle. Allez dans Parametres > " +
          "Configuration avancee pour modifier le mode. Attention : le changement peut entrainer " +
          "une perte de donnees locales non synchronisees.",
      },
      {
        question: "Combien d'appareils puis-je connecter en mode client ?",
        answer:
          "Il n'y a pas de limite stricte, mais les performances dependent de votre reseau. " +
          "En pratique, jusqu'a 10 caisses clientes fonctionnent bien sur un reseau Wi-Fi standard.",
      },
      {
        question: "Que se passe-t-il si je choisis la mauvaise activite ?",
        answer:
          "Pas de panique ! L'activite influence uniquement les categories pre-configurees. " +
          "Vous pouvez ajouter, modifier ou supprimer les categories a tout moment depuis " +
          "la page Produits.",
      },
    ],
  },

  // =========================================================================
  // DASHBOARD
  // =========================================================================
  dashboard: {
    pageTitle: 'Tableau de bord',
    overview:
      "Le tableau de bord offre une vue d'ensemble de l'activite de votre magasin. " +
      "Consultez les statistiques de vente, le chiffre d'affaires, les produits les plus vendus " +
      "et l'etat de la synchronisation en un coup d'oeil. Les donnees sont mises a jour " +
      "en temps reel a chaque nouvelle vente.",
    sections: [
      {
        title: "Lecture des statistiques de vente",
        icon: '📊',
        content:
          "Le tableau de bord affiche plusieurs indicateurs cles :\n\n" +
          "- Chiffre d'affaires du jour : total des ventes realisees aujourd'hui.\n" +
          "- Nombre de transactions : combien de ventes ont ete effectuees.\n" +
          "- Panier moyen : montant moyen par transaction.\n" +
          "- Comparaison : evolution par rapport a la veille ou la semaine precedente.\n\n" +
          "Les fleches vertes indiquent une progression, les fleches rouges une baisse.",
        role: 'all',
      },
      {
        title: "Suivi du chiffre d'affaires",
        icon: '💰',
        content:
          "Le graphique de chiffre d'affaires permet de visualiser les tendances :\n\n" +
          "1. Consultez l'evolution quotidienne, hebdomadaire ou mensuelle.\n" +
          "2. Identifiez les jours de forte et faible affluence.\n" +
          "3. Utilisez ces donnees pour planifier vos approvisionnements.\n" +
          "4. Comparez les periodes pour evaluer la croissance.\n\n" +
          "Les managers et administrateurs ont acces a des periodes plus longues.",
        role: 'manager',
      },
      {
        title: 'Actions rapides',
        icon: '⚡',
        content:
          "Depuis le tableau de bord, accedez rapidement aux fonctions principales :\n\n" +
          "- Ouvrir la caisse : lance directement l'interface de vente.\n" +
          "- Voir les commandes recentes : consulter les dernieres transactions.\n" +
          "- Synchroniser : forcer une synchronisation immediate avec le serveur.\n" +
          "- Alertes de stock : voir les produits dont le stock est bas.",
        role: 'all',
      },
      {
        title: "Interpretation des donnees",
        icon: '🔍',
        content:
          "Pour tirer le meilleur parti de vos statistiques :\n\n" +
          "- Un panier moyen en hausse signifie que les clients achetent plus par visite.\n" +
          "- Un nombre de transactions eleve avec un panier moyen bas peut indiquer " +
          "des achats impulsifs ou de petits achats reguliers.\n" +
          "- Surveillez les heures de pointe pour adapter vos effectifs.\n" +
          "- Les produits les plus vendus meritent une attention particuliere au niveau du stock.",
        role: 'manager',
      },
      {
        title: "Etat de la synchronisation",
        icon: '🔄',
        content:
          "L'indicateur de synchronisation en haut de page montre :\n\n" +
          "- Vert (Synchronise) : toutes les donnees sont a jour avec le serveur.\n" +
          "- Bleu (En cours) : une synchronisation est en cours.\n" +
          "- Orange (En attente) : des donnees n'ont pas encore ete synchronisees.\n" +
          "- Rouge (Erreur) : la synchronisation a echoue, verifiez la connexion.\n\n" +
          "Cliquez sur l'indicateur pour forcer une synchronisation manuelle.",
        role: 'all',
      },
      {
        title: "Installer l'application",
        icon: '\uD83D\uDCF2',
        content:
          "POS Mano Verde est une application web progressive (PWA) installable sur tous vos appareils :\n\n" +
          "Android (Chrome) :\n" +
          "1. Appuyez sur le menu \u22ee (3 points) en haut a droite.\n" +
          "2. Selectionnez « Installer l'app » ou « Ajouter a l'ecran d'accueil ».\n" +
          "3. Confirmez — l'app apparait sur votre ecran d'accueil.\n\n" +
          "iOS (Safari) :\n" +
          "1. Appuyez sur le bouton Partager \u2b06 en bas.\n" +
          "2. Selectionnez « Ajouter a l'ecran d'accueil ».\n" +
          "3. Appuyez sur « Ajouter ».\n\n" +
          "Desktop (Chrome/Edge) :\n" +
          "1. Cliquez sur l'icone \u2295 dans la barre d'adresse.\n" +
          "2. Cliquez « Installer » dans la boite de dialogue.\n" +
          "3. L'app s'ouvre dans sa propre fenetre.",
        role: 'all',
      },
    ],
    tips: [
      "Consultez le tableau de bord en debut de journee pour avoir un apercu de la veille.",
      "Les alertes de stock bas meritent une attention immediate pour eviter les ruptures.",
      "Comparez les performances jour par jour pour identifier les tendances.",
      "La synchronisation reguliere garantit que toutes les caisses ont les memes donnees.",
      "Utilisez les actions rapides pour gagner du temps dans votre flux de travail quotidien.",
    ],
    faq: [
      {
        question: "Pourquoi mes statistiques ne sont-elles pas a jour ?",
        answer:
          "Les statistiques sont calculees a partir des donnees synchronisees. Si des ventes " +
          "ont ete effectuees sur un autre appareil et pas encore synchronisees, elles " +
          "n'apparaitront pas. Forcez une synchronisation pour mettre a jour.",
      },
      {
        question: "Puis-je voir les statistiques des jours precedents ?",
        answer:
          "Oui, les managers et administrateurs peuvent naviguer entre les periodes " +
          "(jour, semaine, mois). Les caissiers ont acces uniquement aux statistiques du jour en cours.",
      },
      {
        question: "Que signifie le panier moyen ?",
        answer:
          "Le panier moyen est le montant total des ventes divise par le nombre de transactions. " +
          "Il indique combien chaque client depense en moyenne lors de sa visite.",
      },
      {
        question: "Comment exporter les statistiques ?",
        answer:
          "Les administrateurs peuvent exporter les donnees depuis la page Commandes. " +
          "Le tableau de bord fournit un apercu visuel, tandis que les exports detailles " +
          "sont disponibles dans la section Commandes.",
      },
      {
        question: "Comment installer l'application sur mon appareil ?",
        answer:
          "POS Mano Verde est une PWA installable sans store. Sur Android : menu \u22ee > Installer. " +
          "Sur iOS : Partager \u2b06 > Ecran d'accueil. Sur desktop : icone \u2295 dans la barre d'adresse. " +
          "L'app fonctionne ensuite comme une application native, meme hors-ligne.",
      },
    ],
  },

  // =========================================================================
  // POS (Point of Sale) - Most detailed section
  // =========================================================================
  pos: {
    pageTitle: 'Caisse (Point de Vente)',
    overview:
      "La page Caisse est le coeur de l'application. C'est ici que vous realisez les ventes, " +
      "gerez le panier, appliquez des remises et encaissez les clients. L'interface est " +
      "optimisee pour la rapidite : recherche instantanee de produits, ajout en un clic, " +
      "et gestion simplifiee des paiements. Maitrisez chaque etape pour un service client fluide.",
    sections: [
      {
        title: "Rechercher et ajouter un produit",
        icon: '🔍',
        content:
          "Plusieurs methodes pour trouver et ajouter un produit au panier :\n\n" +
          "Par recherche textuelle :\n" +
          "1. Cliquez dans la barre de recherche en haut de la page.\n" +
          "2. Tapez le nom du produit (la recherche est instantanee).\n" +
          "3. Cliquez sur le produit dans les resultats pour l'ajouter au panier.\n\n" +
          "Par code-barres :\n" +
          "1. Scannez le code-barres avec un lecteur connecte.\n" +
          "2. Le produit est automatiquement ajoute au panier.\n" +
          "3. Si le produit n'est pas reconnu, un message d'erreur s'affiche.\n\n" +
          "Par navigation dans les categories :\n" +
          "1. Utilisez les onglets de categories pour filtrer les produits.\n" +
          "2. Parcourez les produits affiches.\n" +
          "3. Cliquez sur un produit pour l'ajouter au panier.",
        role: 'all',
      },
      {
        title: 'Gerer le panier',
        icon: '🛒',
        content:
          "Le panier se trouve a droite de l'ecran (ou en bas sur mobile) :\n\n" +
          "Modifier la quantite :\n" +
          "- Utilisez les boutons + et - a cote de chaque article.\n" +
          "- Cliquez sur la quantite pour la saisir manuellement.\n\n" +
          "Supprimer un article :\n" +
          "- Cliquez sur l'icone de suppression (poubelle) a cote de l'article.\n" +
          "- Ou reduisez la quantite a zero.\n\n" +
          "Vider le panier :\n" +
          "- Utilisez le bouton 'Vider' pour supprimer tous les articles.\n" +
          "- Une confirmation est demandee pour eviter les erreurs.",
        role: 'all',
      },
      {
        title: 'Appliquer une remise',
        icon: '🏷️',
        content:
          "Deux types de remises sont disponibles :\n\n" +
          "Remise sur un article :\n" +
          "1. Cliquez sur l'article dans le panier.\n" +
          "2. Selectionnez 'Remise' dans les options.\n" +
          "3. Choisissez un pourcentage (5%, 10%, 15%, 20%) ou saisissez un montant.\n" +
          "4. La remise est appliquee immediatement.\n\n" +
          "Remise sur le total :\n" +
          "1. Cliquez sur 'Remise' pres du total du panier.\n" +
          "2. Saisissez le pourcentage ou le montant de la remise.\n" +
          "3. La remise est repartie proportionnellement sur tous les articles.\n\n" +
          "Note : Les caissiers peuvent avoir une limite de remise maximale autorisee " +
          "definie par l'administrateur.",
        role: 'all',
      },
      {
        title: 'Modes de paiement',
        icon: '💳',
        content:
          "Plusieurs modes de paiement sont pris en charge :\n\n" +
          "Especes :\n" +
          "1. Cliquez sur 'Especes' dans la fenetre de paiement.\n" +
          "2. Saisissez le montant recu du client.\n" +
          "3. La monnaie a rendre est calculee automatiquement.\n" +
          "4. Validez pour finaliser la vente.\n\n" +
          "Carte bancaire :\n" +
          "1. Cliquez sur 'Carte' dans la fenetre de paiement.\n" +
          "2. Le montant exact s'affiche.\n" +
          "3. Procedez au paiement sur le terminal de carte.\n" +
          "4. Confirmez le paiement recu.\n\n" +
          "Paiement mixte :\n" +
          "1. Commencez par le premier mode de paiement.\n" +
          "2. Saisissez le montant partiel.\n" +
          "3. Le reste est automatiquement calcule.\n" +
          "4. Completez avec un second mode de paiement.",
        role: 'all',
      },
      {
        title: 'Finaliser une vente',
        icon: '✅',
        content:
          "Etapes pour finaliser une vente :\n\n" +
          "1. Verifiez le contenu du panier et les quantites.\n" +
          "2. Appliquez les remises si necessaire.\n" +
          "3. Cliquez sur le bouton 'Encaisser' en bas du panier.\n" +
          "4. La fenetre de paiement s'ouvre avec le montant total.\n" +
          "5. Selectionnez le mode de paiement.\n" +
          "6. Saisissez le montant recu (pour les especes).\n" +
          "7. Validez la transaction.\n" +
          "8. Le ticket est genere (impression automatique si configuree).\n" +
          "9. Le panier est vide et pret pour la prochaine vente.\n\n" +
          "La commande est enregistree et les stocks sont mis a jour automatiquement.",
        role: 'all',
      },
      {
        title: 'Impression du ticket',
        icon: '🖨️',
        content:
          "La gestion des tickets de caisse :\n\n" +
          "Impression automatique :\n" +
          "- Si une imprimante Bluetooth est configuree, le ticket s'imprime " +
          "automatiquement apres chaque vente.\n" +
          "- Le ticket inclut : nom du magasin, date, articles, total, mode de paiement.\n\n" +
          "Impression manuelle :\n" +
          "1. Depuis l'ecran de confirmation de vente, cliquez sur 'Imprimer'.\n" +
          "2. Vous pouvez aussi reimprimer depuis la page Commandes.\n\n" +
          "Sans imprimante :\n" +
          "- La vente est quand meme enregistree normalement.\n" +
          "- Vous pouvez configurer une imprimante plus tard dans les Parametres.",
        role: 'all',
      },
      {
        title: 'Gestion des erreurs courantes',
        icon: '⚠️',
        content:
          "Situations problematiques et solutions :\n\n" +
          "Produit non trouve :\n" +
          "- Verifiez l'orthographe dans la recherche.\n" +
          "- Le produit n'existe peut-etre pas encore dans la base. " +
          "Demandez a un manager de l'ajouter.\n\n" +
          "Stock insuffisant :\n" +
          "- Un avertissement s'affiche si la quantite demandee depasse le stock.\n" +
          "- Vous pouvez quand meme forcer la vente (selon les permissions).\n\n" +
          "Erreur apres validation :\n" +
          "- Si une erreur se produit, la vente peut etre retrouvee " +
          "dans la page Commandes pour un remboursement.\n\n" +
          "Application lente :\n" +
          "- Synchronisez les donnees pour liberer la memoire locale.\n" +
          "- Fermez et rouvrez l'application si necessaire.",
        role: 'all',
      },
      {
        title: 'Raccourcis et astuces de rapidite',
        icon: '⌨️',
        content:
          "Optimisez votre vitesse d'encaissement :\n\n" +
          "- La barre de recherche est selectionnee automatiquement a l'ouverture de la page.\n" +
          "- Apres un scan de code-barres, le focus revient sur la barre de recherche.\n" +
          "- Un double-clic sur un produit dans le panier ouvre les options de modification.\n" +
          "- Les montants predetermine (5, 10, 20, 50, 100) facilitent l'encaissement en especes.\n" +
          "- Utilisez les categories pour retrouver les produits sans barre-code rapidement.\n" +
          "- Le bouton d'encaissement rapide permet de valider un paiement en especes " +
          "du montant exact en un seul clic.",
        role: 'all',
      },
      {
        title: 'Operations specifiques aux managers',
        icon: '👔',
        content:
          "Operations reservees aux managers et administrateurs :\n\n" +
          "- Appliquer des remises superieures au seuil autorise pour les caissiers.\n" +
          "- Annuler ou modifier une commande deja validee.\n" +
          "- Effectuer un remboursement total ou partiel.\n" +
          "- Consulter les ventes de tous les caissiers.\n" +
          "- Voir l'historique des modifications de prix.\n\n" +
          "Ces actions sont tracees dans le journal d'activite pour la transparence.",
        role: 'manager',
      },
    ],
    tips: [
      "Scannez les code-barres pour une saisie ultra rapide - c'est la methode la plus fiable.",
      "Verifiez toujours le panier avant d'encaisser pour eviter les erreurs.",
      "Utilisez le paiement rapide en especes quand le client donne le montant exact.",
      "En cas de doute sur un prix, consultez la fiche produit avant de valider.",
      "Gardez la barre de recherche vide entre les clients pour un affichage complet des categories.",
      "Si l'imprimante ne repond pas, la vente est quand meme enregistree. Pas de panique.",
      "Lors d'un paiement mixte, commencez toujours par le montant en especes.",
    ],
    faq: [
      {
        question: "Comment annuler un article deja ajoute au panier ?",
        answer:
          "Cliquez sur l'icone poubelle a cote de l'article dans le panier, " +
          "ou reduisez sa quantite a zero avec le bouton -.",
      },
      {
        question: "Puis-je modifier le prix d'un produit directement en caisse ?",
        answer:
          "Non, les prix ne peuvent pas etre modifies en caisse pour eviter les erreurs. " +
          "Utilisez les remises pour ajuster le montant. Les modifications de prix permanentes " +
          "doivent etre faites depuis la page Produits par un manager ou administrateur.",
      },
      {
        question: "Que faire si le client veut payer une partie en especes et une partie par carte ?",
        answer:
          "Utilisez le paiement mixte : lors de l'encaissement, entrez d'abord le montant en " +
          "especes, puis le reste sera automatiquement assigne a la carte bancaire.",
      },
      {
        question: "Comment reimprimer un ticket de caisse ?",
        answer:
          "Allez dans la page Commandes, retrouvez la commande concernee et cliquez sur " +
          "le bouton d'impression. Vous pouvez aussi imprimer directement apres la vente " +
          "depuis l'ecran de confirmation.",
      },
      {
        question: "Le scanner de code-barres ne fonctionne pas, que faire ?",
        answer:
          "Verifiez que le scanner est bien connecte (Bluetooth ou USB). Essayez de " +
          "le reconnecter. En attendant, utilisez la recherche textuelle ou la navigation " +
          "par categories pour ajouter les produits manuellement.",
      },
      {
        question: "Puis-je mettre une vente en pause et servir un autre client ?",
        answer:
          "Actuellement, le panier en cours est sauvegarde localement. Vous pouvez noter " +
          "la vente en attente et la retrouver, mais le panier sera remplace si vous commencez " +
          "une nouvelle vente. Cette fonctionnalite de mise en attente sera amelioree prochainement.",
      },
    ],
  },

  // =========================================================================
  // PRODUCTS
  // =========================================================================
  products: {
    pageTitle: 'Produits',
    overview:
      "La page Produits vous permet de gerer votre catalogue complet : ajouter de nouveaux " +
      "articles, modifier les prix, organiser les categories, gerer les codes-barres et " +
      "suivre les niveaux de stock. Un catalogue bien organise est essentiel pour une " +
      "utilisation fluide de la caisse.",
    sections: [
      {
        title: 'Ajouter un nouveau produit',
        icon: '➕',
        content:
          "Pour ajouter un produit a votre catalogue :\n\n" +
          "1. Cliquez sur le bouton 'Ajouter un produit' en haut de la page.\n" +
          "2. Remplissez les champs obligatoires :\n" +
          "   - Nom du produit : nom clair et descriptif.\n" +
          "   - Prix de vente : prix TTC affiche en caisse.\n" +
          "   - Categorie : selectionnez ou creez une categorie.\n" +
          "3. Champs optionnels recommandes :\n" +
          "   - SKU : code interne unique pour identifier le produit.\n" +
          "   - Code-barres : pour le scan en caisse.\n" +
          "   - Prix d'achat : pour le calcul des marges.\n" +
          "   - Stock initial : quantite disponible.\n" +
          "   - Stock minimum : seuil d'alerte pour le reapprovisionnement.\n" +
          "4. Enregistrez le produit.",
        role: 'manager',
      },
      {
        title: 'Modifier un produit existant',
        icon: '✏️',
        content:
          "Pour modifier les informations d'un produit :\n\n" +
          "1. Recherchez le produit par nom ou code-barres.\n" +
          "2. Cliquez sur le produit pour ouvrir sa fiche.\n" +
          "3. Cliquez sur 'Modifier' pour editer les champs.\n" +
          "4. Modifiez les informations souhaitees.\n" +
          "5. Enregistrez les modifications.\n\n" +
          "Les modifications sont immediatement effectives en caisse apres synchronisation.\n" +
          "L'historique des modifications de prix est conserve.",
        role: 'manager',
      },
      {
        title: 'Gerer les categories',
        icon: '📁',
        content:
          "Les categories organisent vos produits pour une navigation facile en caisse :\n\n" +
          "Creer une categorie :\n" +
          "1. Allez dans l'onglet 'Categories' de la page Produits.\n" +
          "2. Cliquez sur 'Nouvelle categorie'.\n" +
          "3. Entrez le nom et choisissez une couleur.\n" +
          "4. Enregistrez.\n\n" +
          "Organiser les categories :\n" +
          "- Reorganisez l'ordre des categories par glisser-deposer.\n" +
          "- Les categories apparaissent dans cet ordre en caisse.\n" +
          "- Desactivez une categorie pour la masquer temporairement sans la supprimer.",
        role: 'manager',
      },
      {
        title: 'Codes-barres et SKU',
        icon: '📊',
        content:
          "Gestion des identifiants produit :\n\n" +
          "Code-barres :\n" +
          "- Saisissez le code-barres existant du produit (EAN-13, UPC, etc.).\n" +
          "- Le code-barres permet le scan rapide en caisse.\n" +
          "- Chaque code-barres doit etre unique.\n\n" +
          "SKU (Stock Keeping Unit) :\n" +
          "- Code interne pour votre gestion.\n" +
          "- Utile pour les produits sans code-barres.\n" +
          "- Peut suivre votre propre convention de nommage.\n" +
          "- Exemple : FRU-POM-001 pour 'Pommes' dans la categorie 'Fruits'.",
        role: 'manager',
      },
      {
        title: 'Gestion du stock depuis la fiche produit',
        icon: '📦',
        content:
          "Chaque produit affiche son niveau de stock :\n\n" +
          "- Stock actuel : quantite disponible a la vente.\n" +
          "- Stock minimum : seuil en dessous duquel une alerte est declenchee.\n" +
          "- Etat : en stock, stock bas, rupture de stock.\n\n" +
          "Vous pouvez ajuster le stock directement depuis la fiche produit, " +
          "mais pour un suivi complet des mouvements de stock, utilisez la page Stock.",
        role: 'manager',
      },
    ],
    tips: [
      "Utilisez des noms de produits courts et clairs pour faciliter la recherche en caisse.",
      "Attribuez un code-barres a chaque produit pour accelerer l'encaissement.",
      "Definissez toujours un stock minimum pour etre alerte avant la rupture.",
      "Organisez vos categories dans l'ordre le plus logique pour vos caissiers.",
      "Le prix d'achat est important : il permet de calculer votre marge automatiquement.",
    ],
    faq: [
      {
        question: "Puis-je supprimer un produit ?",
        answer:
          "Un produit ne peut pas etre supprime s'il est lie a des commandes existantes. " +
          "Vous pouvez le desactiver pour qu'il n'apparaisse plus en caisse tout en " +
          "conservant l'historique des ventes.",
      },
      {
        question: "Comment ajouter plusieurs produits rapidement ?",
        answer:
          "Utilisez la fonction d'import pour ajouter des produits en masse. " +
          "Preparez un fichier CSV avec les colonnes requises et importez-le " +
          "depuis le menu 'Importer' de la page Produits.",
      },
      {
        question: "Les modifications de prix sont-elles retroactives ?",
        answer:
          "Non, les modifications de prix ne s'appliquent qu'aux futures ventes. " +
          "Les commandes deja enregistrees conservent le prix au moment de la vente.",
      },
      {
        question: "Comment gerer les produits au poids ou a l'unite ?",
        answer:
          "Lors de la creation du produit, selectionnez l'unite de mesure appropriee " +
          "(piece, kg, litre, etc.). En caisse, vous pourrez saisir la quantite " +
          "selon l'unite choisie.",
      },
    ],
  },

  // =========================================================================
  // ORDERS
  // =========================================================================
  orders: {
    pageTitle: 'Commandes',
    overview:
      "La page Commandes centralise l'historique de toutes les ventes realisees. " +
      "Consultez les details de chaque transaction, filtrez par date, caissier ou mode " +
      "de paiement, effectuez des remboursements et exportez les donnees pour votre " +
      "comptabilite.",
    sections: [
      {
        title: "Consulter l'historique des commandes",
        icon: '📋',
        content:
          "La liste des commandes affiche toutes les transactions :\n\n" +
          "1. Les commandes les plus recentes apparaissent en premier.\n" +
          "2. Chaque ligne indique : numero, date, heure, montant, mode de paiement.\n" +
          "3. Les statuts possibles sont : Completee, Remboursee, Partiellement remboursee.\n" +
          "4. Cliquez sur une commande pour voir le detail complet.\n\n" +
          "Le detail affiche tous les articles, les quantites, les prix unitaires, " +
          "les remises appliquees et le caissier qui a effectue la vente.",
        role: 'all',
      },
      {
        title: 'Filtrer et rechercher',
        icon: '🔍',
        content:
          "Utilisez les filtres pour retrouver des commandes specifiques :\n\n" +
          "- Par date : selectionnez une plage de dates (aujourd'hui, cette semaine, ce mois, personnalise).\n" +
          "- Par caissier : filtrez les ventes d'un employe specifique.\n" +
          "- Par mode de paiement : especes, carte ou mixte.\n" +
          "- Par statut : completees, remboursees.\n" +
          "- Par recherche : numero de commande ou nom de client.\n\n" +
          "Les filtres peuvent etre combines pour une recherche precise.",
        role: 'all',
      },
      {
        title: 'Effectuer un remboursement',
        icon: '↩️',
        content:
          "Pour rembourser une commande (managers et admins uniquement) :\n\n" +
          "Remboursement total :\n" +
          "1. Ouvrez la commande a rembourser.\n" +
          "2. Cliquez sur 'Rembourser'.\n" +
          "3. Confirmez le remboursement total.\n" +
          "4. Le stock est automatiquement mis a jour (restitue).\n\n" +
          "Remboursement partiel :\n" +
          "1. Ouvrez la commande.\n" +
          "2. Selectionnez les articles a rembourser.\n" +
          "3. Ajustez les quantites si necessaire.\n" +
          "4. Validez le remboursement partiel.\n\n" +
          "Chaque remboursement est trace et visible dans l'historique.",
        role: 'manager',
      },
      {
        title: 'Exporter les donnees',
        icon: '📤',
        content:
          "Exportez vos donnees de vente pour la comptabilite :\n\n" +
          "1. Definissez la periode souhaitee avec les filtres de date.\n" +
          "2. Cliquez sur 'Exporter' en haut de la page.\n" +
          "3. Choisissez le format : CSV ou PDF.\n" +
          "4. Le fichier est telecharge sur votre appareil.\n\n" +
          "Le fichier CSV est compatible avec Excel et les logiciels de comptabilite. " +
          "Le PDF genere un rapport formate pret a imprimer.",
        role: 'admin',
      },
    ],
    tips: [
      "Exportez regulierement vos donnees de vente pour votre comptabilite.",
      "Verifiez les remboursements en fin de journee pour un suivi precis.",
      "Utilisez le filtre par caissier pour evaluer les performances individuelles.",
      "Le numero de commande est utile pour les clients qui reclament un remboursement.",
      "Les commandes sont conservees indefiniment - aucune donnee n'est supprimee.",
    ],
    faq: [
      {
        question: "Puis-je modifier une commande deja validee ?",
        answer:
          "Non, les commandes validees ne peuvent pas etre modifiees pour des raisons " +
          "de tracabilite comptable. En cas d'erreur, effectuez un remboursement " +
          "puis recreeez la commande correcte.",
      },
      {
        question: "Comment retrouver une commande specifique ?",
        answer:
          "Utilisez la barre de recherche avec le numero de commande, ou combinez " +
          "les filtres (date, caissier, montant) pour retrouver la transaction.",
      },
      {
        question: "Qui peut effectuer un remboursement ?",
        answer:
          "Seuls les managers et administrateurs peuvent effectuer des remboursements. " +
          "Les caissiers doivent faire appel a un responsable.",
      },
      {
        question: "Les remboursements affectent-ils le stock ?",
        answer:
          "Oui, lors d'un remboursement les quantites sont automatiquement restituees " +
          "au stock. Le mouvement est enregistre dans l'historique des stocks.",
      },
    ],
  },

  // =========================================================================
  // STOCK
  // =========================================================================
  stock: {
    pageTitle: 'Gestion du Stock',
    overview:
      "La page Stock offre un suivi complet de vos niveaux d'inventaire. Enregistrez les " +
      "entrees de marchandise, les sorties, les ajustements d'inventaire et les mouvements " +
      "de stock. Les alertes de stock bas vous previennent avant les ruptures pour maintenir " +
      "un service continu.",
    sections: [
      {
        title: 'Mouvements de stock : entrees',
        icon: '📥',
        content:
          "Enregistrer une reception de marchandise :\n\n" +
          "1. Cliquez sur 'Nouveau mouvement' puis 'Entree'.\n" +
          "2. Selectionnez le produit concerne.\n" +
          "3. Saisissez la quantite recue.\n" +
          "4. Ajoutez une note optionnelle (ex: 'Commande fournisseur #123').\n" +
          "5. Validez l'entree.\n\n" +
          "Le stock du produit est immediatement mis a jour. " +
          "L'historique conserve la trace de chaque entree avec la date et l'operateur.",
        role: 'manager',
      },
      {
        title: 'Mouvements de stock : sorties',
        icon: '📤',
        content:
          "Enregistrer une sortie de stock (hors vente) :\n\n" +
          "1. Cliquez sur 'Nouveau mouvement' puis 'Sortie'.\n" +
          "2. Selectionnez le produit.\n" +
          "3. Saisissez la quantite sortie.\n" +
          "4. Indiquez le motif : perte, casse, peremption, don, usage interne.\n" +
          "5. Validez la sortie.\n\n" +
          "Les sorties liees aux ventes sont enregistrees automatiquement par la caisse. " +
          "Utilisez cette fonction uniquement pour les sorties non commerciales.",
        role: 'manager',
      },
      {
        title: 'Ajustement de stock (inventaire)',
        icon: '📊',
        content:
          "Corriger les ecarts entre le stock reel et le stock systeme :\n\n" +
          "1. Cliquez sur 'Nouveau mouvement' puis 'Ajustement'.\n" +
          "2. Selectionnez le produit.\n" +
          "3. Saisissez la quantite reelle comptee.\n" +
          "4. Le systeme calcule automatiquement la difference.\n" +
          "5. Ajoutez un commentaire explicatif.\n" +
          "6. Validez l'ajustement.\n\n" +
          "Les ajustements sont traces et visibles dans l'historique. " +
          "Effectuez des inventaires reguliers pour maintenir la precision des stocks.",
        role: 'manager',
      },
      {
        title: 'Alertes de stock bas',
        icon: '🔔',
        content:
          "Le systeme d'alertes vous previent des stocks critiques :\n\n" +
          "- Un produit en alerte apparait en orange quand le stock est en dessous du seuil minimum.\n" +
          "- Un produit en rupture apparait en rouge quand le stock est a zero.\n" +
          "- Les alertes sont visibles dans la liste des produits et sur le tableau de bord.\n\n" +
          "Pour configurer les seuils :\n" +
          "- Modifiez le 'Stock minimum' dans la fiche de chaque produit.\n" +
          "- Un seuil de 5 a 10 unites est recommande pour les produits a rotation rapide.\n" +
          "- Un seuil de 2 a 3 unites suffit pour les produits a rotation lente.",
        role: 'manager',
      },
      {
        title: "Realiser un inventaire complet",
        icon: '📝',
        content:
          "Etapes pour un inventaire physique :\n\n" +
          "1. Planifiez l'inventaire en dehors des heures d'ouverture si possible.\n" +
          "2. Imprimez ou consultez la liste des produits avec les stocks systeme.\n" +
          "3. Comptez physiquement chaque produit.\n" +
          "4. Saisissez les quantites reelles via les ajustements de stock.\n" +
          "5. Examinez les ecarts importants et identifiez les causes.\n" +
          "6. Validez les ajustements.\n\n" +
          "Un inventaire regulier (mensuel ou trimestriel) est recommande pour la fiabilite de vos donnees.",
        role: 'manager',
      },
    ],
    tips: [
      "Effectuez un inventaire physique au moins une fois par mois pour maintenir la precision.",
      "Enregistrez les pertes et la casse immediatement pour garder le stock a jour.",
      "Definissez des seuils d'alerte realistes pour eviter les ruptures de stock.",
      "Utilisez les commentaires lors des ajustements pour garder une trace des raisons.",
      "Consultez l'historique des mouvements pour identifier les tendances de consommation.",
    ],
    faq: [
      {
        question: "Les ventes mettent-elles automatiquement le stock a jour ?",
        answer:
          "Oui, chaque vente enregistree en caisse deduit automatiquement les quantites " +
          "vendues du stock. Vous n'avez rien a faire manuellement pour les ventes.",
      },
      {
        question: "Comment gerer les produits sans suivi de stock ?",
        answer:
          "Lors de la creation du produit, vous pouvez desactiver le suivi de stock. " +
          "Le produit sera toujours disponible en caisse sans verification de quantite.",
      },
      {
        question: "Puis-je voir l'historique complet des mouvements d'un produit ?",
        answer:
          "Oui, ouvrez la fiche du produit depuis la page Stock et consultez l'onglet " +
          "'Historique'. Tous les mouvements (ventes, entrees, sorties, ajustements) " +
          "y sont listes chronologiquement.",
      },
      {
        question: "Que faire en cas d'ecart de stock important ?",
        answer:
          "Verifiez d'abord les dernieres transactions et mouvements de stock. " +
          "Un ecart peut etre du a des ventes non synchronisees, des pertes non enregistrees " +
          "ou des erreurs de comptage. Signalez les ecarts inexpliques a votre administrateur.",
      },
    ],
  },

  // =========================================================================
  // EMPLOYEES
  // =========================================================================
  employees: {
    pageTitle: 'Employes',
    overview:
      "La page Employes permet de gerer les utilisateurs de l'application. Ajoutez de nouveaux " +
      "employes, attribuez-leur un role et des permissions, definissez leur code PIN et " +
      "suivez leur activite. Chaque employe a un acces personnalise selon son role dans " +
      "le magasin.",
    sections: [
      {
        title: 'Ajouter un employe',
        icon: '👤',
        content:
          "Pour creer un nouveau compte employe :\n\n" +
          "1. Cliquez sur 'Ajouter un employe'.\n" +
          "2. Saisissez le nom complet de l'employe.\n" +
          "3. Selectionnez le role (voir la section 'Roles et permissions').\n" +
          "4. Definissez un code PIN a 4 chiffres.\n" +
          "5. Enregistrez.\n\n" +
          "Communiquez le code PIN a l'employe de maniere confidentielle. " +
          "L'employe pourra se connecter immediatement apres la synchronisation.",
        role: 'admin',
      },
      {
        title: 'Roles et permissions',
        icon: '🛡️',
        content:
          "Quatre roles sont disponibles, chacun avec des droits specifiques :\n\n" +
          "Administrateur (admin) :\n" +
          "- Acces complet a toutes les fonctionnalites.\n" +
          "- Gestion des employes, parametres et configuration.\n" +
          "- Remboursements, exports et rapports complets.\n\n" +
          "Manager :\n" +
          "- Gestion des produits et du stock.\n" +
          "- Consultation des commandes et remboursements.\n" +
          "- Pas d'acces a la gestion des employes ni aux parametres serveur.\n\n" +
          "Caissier (cashier) :\n" +
          "- Utilisation de la caisse (POS) uniquement.\n" +
          "- Consultation de ses propres ventes.\n" +
          "- Pas de modification de produits ni de stock.\n\n" +
          "Gestionnaire de stock (stock) :\n" +
          "- Gestion des stocks : entrees, sorties, ajustements.\n" +
          "- Consultation des produits.\n" +
          "- Pas d'acces a la caisse ni aux commandes.",
        role: 'admin',
      },
      {
        title: 'Gerer le code PIN',
        icon: '🔢',
        content:
          "Le code PIN est le moyen d'authentification de chaque employe :\n\n" +
          "Definir un PIN :\n" +
          "- Le PIN doit comporter exactement 4 chiffres.\n" +
          "- Evitez les PINs trop simples (0000, 1234, 1111).\n" +
          "- Chaque PIN doit etre unique parmi tous les employes.\n\n" +
          "Reinitialiser un PIN :\n" +
          "1. Ouvrez la fiche de l'employe.\n" +
          "2. Cliquez sur 'Modifier le PIN'.\n" +
          "3. Saisissez le nouveau PIN.\n" +
          "4. Enregistrez.\n\n" +
          "L'employe devra utiliser le nouveau PIN lors de sa prochaine connexion.",
        role: 'admin',
      },
      {
        title: "Desactiver un employe",
        icon: '🚫',
        content:
          "Quand un employe quitte le magasin :\n\n" +
          "1. Ouvrez sa fiche employe.\n" +
          "2. Cliquez sur 'Desactiver'.\n" +
          "3. L'employe ne pourra plus se connecter.\n" +
          "4. Son historique de ventes est conserve pour la tracabilite.\n\n" +
          "La desactivation est preferable a la suppression car elle preserve " +
          "l'integrite des donnees historiques. Vous pouvez reactiver un employe " +
          "a tout moment si necessaire.",
        role: 'admin',
      },
    ],
    tips: [
      "Attribuez le role le plus restrictif necessaire - principe du moindre privilege.",
      "Changez regulierement les codes PIN pour renforcer la securite.",
      "Desactivez immediatement les comptes des employes qui quittent l'equipe.",
      "Gardez au moins deux comptes administrateurs actifs en cas d'urgence.",
      "Les PINs simples comme 0000 ou 1234 sont a eviter absolument.",
    ],
    faq: [
      {
        question: "Combien d'employes puis-je ajouter ?",
        answer:
          "Il n'y a pas de limite technique au nombre d'employes. " +
          "Ajoutez autant de comptes que necessaire pour votre equipe.",
      },
      {
        question: "Un employe peut-il avoir plusieurs roles ?",
        answer:
          "Non, chaque employe a un seul role. Si un employe doit alterner entre " +
          "la caisse et la gestion du stock, attribuez-lui le role de manager qui " +
          "englobe les deux fonctions.",
      },
      {
        question: "Que se passe-t-il si deux employes ont le meme PIN ?",
        answer:
          "Le systeme empeche la creation de PINs en double. Chaque code PIN doit " +
          "etre unique pour identifier correctement chaque employe.",
      },
      {
        question: "Puis-je voir les ventes de chaque employe ?",
        answer:
          "Oui, les managers et administrateurs peuvent filtrer les commandes par " +
          "employe depuis la page Commandes. Chaque vente est automatiquement " +
          "associee au caissier qui l'a effectuee.",
      },
    ],
  },

  // =========================================================================
  // SETTINGS
  // =========================================================================
  settings: {
    pageTitle: 'Parametres',
    overview:
      "La page Parametres permet de configurer l'ensemble de l'application : informations " +
      "du magasin, connexion au serveur, imprimante Bluetooth, gestion de la synchronisation " +
      "et preferences generales. Seuls les administrateurs ont acces a cette page.",
    sections: [
      {
        title: 'Configuration du serveur',
        icon: '🖥️',
        content:
          "Gerez la connexion au serveur principal :\n\n" +
          "1. Adresse IP : modifiez l'adresse IP si le serveur change.\n" +
          "2. Port : le port par defaut est 3000.\n" +
          "3. Testez la connexion pour verifier l'accessibilite.\n" +
          "4. Activez ou desactivez la synchronisation automatique.\n" +
          "5. Definissez l'intervalle de synchronisation (5, 10, 15 ou 30 minutes).\n\n" +
          "En mode serveur, ces parametres sont automatiquement configures.",
        role: 'admin',
      },
      {
        title: 'Configurer une imprimante Bluetooth',
        icon: '🖨️',
        content:
          "Etapes pour connecter une imprimante de tickets Bluetooth :\n\n" +
          "1. Allumez l'imprimante et activez son mode Bluetooth.\n" +
          "2. Sur votre appareil, allez dans les parametres Bluetooth du systeme.\n" +
          "3. Appairez l'imprimante avec votre appareil.\n" +
          "4. Revenez dans l'application POS > Parametres > Imprimante.\n" +
          "5. Cliquez sur 'Rechercher les imprimantes'.\n" +
          "6. Selectionnez votre imprimante dans la liste.\n" +
          "7. Cliquez sur 'Tester l'impression' pour verifier.\n" +
          "8. Enregistrez la configuration.\n\n" +
          "Imprimantes compatibles : la plupart des imprimantes thermiques Bluetooth " +
          "58mm et 80mm sont supportees (ESC/POS compatible).\n\n" +
          "Depannage :\n" +
          "- Verifiez que le Bluetooth est active sur votre appareil.\n" +
          "- Redemarrez l'imprimante si elle n'apparait pas.\n" +
          "- Assurez-vous que l'imprimante est chargee ou alimentee.\n" +
          "- Verifiez que le papier thermique est correctement installe.",
        role: 'admin',
      },
      {
        title: 'Gestion de la synchronisation',
        icon: '🔄',
        content:
          "Controlez comment les donnees sont synchronisees :\n\n" +
          "Synchronisation automatique :\n" +
          "- Activez pour une synchronisation periodique automatique.\n" +
          "- Choisissez l'intervalle selon votre usage.\n" +
          "- Recommande pour les environnements multi-caisses.\n\n" +
          "Synchronisation manuelle :\n" +
          "- Utilisez le bouton 'Synchroniser' dans la barre laterale.\n" +
          "- Utile quand la connexion est intermittente.\n\n" +
          "Donnees en attente :\n" +
          "- Le compteur 'En attente' indique les operations non synchronisees.\n" +
          "- Ces donnees sont stockees en securite localement.\n" +
          "- Elles seront envoyees lors de la prochaine synchronisation reussie.",
        role: 'admin',
      },
      {
        title: 'Informations du magasin',
        icon: '🏬',
        content:
          "Modifiez les informations affichees sur les tickets de caisse :\n\n" +
          "1. Nom du magasin.\n" +
          "2. Adresse complete.\n" +
          "3. Numero de telephone.\n" +
          "4. Numero de TVA (si applicable).\n" +
          "5. Message personnalise en bas du ticket (ex: 'Merci de votre visite !').\n\n" +
          "Les modifications sont appliquees immediatement aux nouveaux tickets.",
        role: 'admin',
      },
      {
        title: 'Preferences generales',
        icon: '⚙️',
        content:
          "Autres reglages disponibles :\n\n" +
          "- Langue : changez la langue de l'interface (francais, anglais, espagnol).\n" +
          "- Devise : modifiez la monnaie utilisee (CHF, EUR, USD).\n" +
          "- Format de date : choisissez le format d'affichage.\n" +
          "- Theme : mode clair ou sombre (selon disponibilite).\n" +
          "- Notifications sonores : activez ou desactivez les sons de la caisse.\n" +
          "- Sauvegarde automatique : programmez des sauvegardes regulieres de la base de donnees.",
        role: 'admin',
      },
    ],
    tips: [
      "Testez l'impression apres chaque changement de configuration d'imprimante.",
      "Notez l'adresse IP du serveur quelque part - vous en aurez besoin pour configurer de nouvelles caisses.",
      "Activez la synchronisation automatique pour un fonctionnement sans souci.",
      "Mettez a jour les informations du magasin avant l'ouverture pour des tickets corrects.",
      "Sauvegardez regulierement vos donnees, surtout avant une mise a jour de l'application.",
    ],
    faq: [
      {
        question: "Comment changer la langue de l'application ?",
        answer:
          "Allez dans Parametres > Preferences generales > Langue. Selectionnez la langue " +
          "souhaitee. L'interface sera mise a jour immediatement. Tous les utilisateurs " +
          "de cet appareil verront la meme langue.",
      },
      {
        question: "L'imprimante ne s'imprime pas, que faire ?",
        answer:
          "Verifiez dans l'ordre : 1) L'imprimante est allumee et chargee. " +
          "2) Le Bluetooth est active sur votre appareil. 3) L'imprimante est appairee " +
          "dans les parametres Bluetooth du systeme. 4) L'imprimante est selectionnee " +
          "dans les parametres POS. 5) Testez avec le bouton 'Test d'impression'.",
      },
      {
        question: "Comment reinitialiser completement l'application ?",
        answer:
          "Allez dans Parametres > Configuration avancee > Reinitialiser. " +
          "Attention : cette operation supprime toutes les donnees locales. " +
          "Assurez-vous d'avoir synchronise toutes les donnees avant de proceder.",
      },
      {
        question: "Les parametres sont-ils synchronises entre les appareils ?",
        answer:
          "Les informations du magasin et les donnees metier (produits, employes) sont " +
          "synchronisees. Les parametres de l'appareil (imprimante, mode, langue) restent " +
          "locaux car chaque appareil peut avoir une configuration differente.",
      },
    ],
  },
}

// ---------------------------------------------------------------------------
// Utility: get help content for a given page key, fallback to a default
// ---------------------------------------------------------------------------

export const defaultHelp: PageHelp = {
  pageTitle: 'Aide',
  overview:
    "Bienvenue dans l'aide de l'application POS Mano Verde. " +
    "Selectionnez une page dans le menu pour obtenir de l'aide contextuelle " +
    "sur les fonctionnalites disponibles.",
  sections: [
    {
      title: 'Navigation',
      icon: '🧭',
      content:
        "Utilisez la barre de navigation a gauche (ou en bas sur mobile) " +
        "pour acceder aux differentes sections de l'application. " +
        "Le bouton d'aide est disponible sur chaque page.",
      role: 'all',
    },
  ],
  tips: [
    "Chaque page dispose d'une aide contextuelle adaptee.",
    "Les informations affichees dependent de votre role (admin, manager, caissier).",
  ],
  faq: [
    {
      question: "Comment obtenir de l'aide sur une page specifique ?",
      answer:
        "Cliquez sur le bouton '?' bleu en bas a droite de chaque page " +
        "pour ouvrir l'aide contextuelle.",
    },
    {
      question: "Comment installer l'application ?",
      answer:
        "Sur Android : menu \u22ee > Installer. Sur iOS : Partager \u2b06 > Ecran d'accueil. " +
        "Sur desktop : icone \u2295 dans la barre d'adresse de Chrome/Edge. " +
        "L'app fonctionne comme une application native, meme hors-ligne.",
    },
  ],
}

export function getHelpForPage(pageKey: string): PageHelp {
  return helpContent[pageKey] ?? defaultHelp
}
