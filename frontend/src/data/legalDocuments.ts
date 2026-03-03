import { LEGAL_DOCUMENTS_EN } from './legalDocs/en'
import { LEGAL_DOCUMENTS_ES } from './legalDocs/es'
import { LEGAL_DOCUMENTS_DE } from './legalDocs/de'
import { LEGAL_DOCUMENTS_IT } from './legalDocs/it'
import { LEGAL_DOCUMENTS_ZH } from './legalDocs/zh'
import { LEGAL_DOCUMENTS_AR } from './legalDocs/ar'

export type LegalDocType = 'cgv' | 'rgpd' | 'terms'

export interface LegalSection {
  title: string
  content: string[]  // paragraphs
}

export interface LegalDocument {
  title: string
  lastUpdated: string
  sections: LegalSection[]
}

// French (default) legal documents
const LEGAL_DOCUMENTS_FR: Record<LegalDocType, LegalDocument> = {
  cgv: {
    title: 'Conditions Generales de Vente',
    lastUpdated: '2025-01-15',
    sections: [
      {
        title: 'Article 1 - Objet',
        content: [
          'Les presentes Conditions Generales de Vente (ci-apres "CGV") regissent les relations contractuelles entre Mano Verde SA, societe anonyme de droit camerounais dont le siege social est situe a Douala, Cameroun (ci-apres "le Prestataire"), et toute personne physique ou morale souscrivant a ses services (ci-apres "le Client").',
          'Le Prestataire propose une plateforme de caisse enregistreuse (Point of Sale) accessible en mode SaaS (Software as a Service) via l\'application web pos.manoverde.com. Ce service permet la gestion des ventes, l\'edition de tickets de caisse, la gestion des stocks, le suivi de la tresorerie, et la synchronisation des donnees entre plusieurs appareils et activites commerciales.',
          'L\'utilisation de la plateforme POS Mano Verde implique l\'acceptation pleine et entiere des presentes CGV par le Client.',
        ],
      },
      {
        title: 'Article 2 - Acces au service',
        content: [
          'L\'acces au service necessite la creation d\'un compte utilisateur sur la plateforme. Le Client doit fournir des informations exactes et a jour lors de l\'inscription, notamment son nom, son adresse email, son numero de telephone, et les informations relatives a son activite commerciale.',
          'Le Client doit etre age d\'au moins 18 ans ou avoir la capacite juridique necessaire pour conclure un contrat dans sa juridiction de residence. En cas d\'utilisation du service pour le compte d\'une personne morale, le Client declare avoir l\'autorite necessaire pour engager ladite entite.',
          'Le compte est personnel et le Client est responsable de la confidentialite de ses identifiants de connexion. Toute utilisation du service effectuee avec les identifiants du Client est reputee avoir ete faite par celui-ci.',
        ],
      },
      {
        title: 'Article 3 - Tarification',
        content: [
          'Le Prestataire propose plusieurs formules d\'abonnement : un plan gratuit avec des fonctionnalites limitees, et des plans payants offrant des fonctionnalites avancees. Les tarifs en vigueur sont affiches sur la page de tarification de la plateforme.',
          'En complement des plans fixes, le Prestataire propose un modele de facturation a l\'usage ("Pay-as-you-grow") au tarif de 0,02 USD par ticket de caisse emis. Chaque nouveau compte beneficie d\'un credit initial de 10 USD, permettant l\'emission de 500 tickets sans frais supplementaires.',
          'Les tarifs sont exprimes en dollars americains (USD) et sont susceptibles d\'etre modifies. Toute modification tarifaire sera communiquee au Client avec un preavis de trente (30) jours. Les tarifs applicables sont ceux en vigueur au moment de la souscription ou du renouvellement de l\'abonnement.',
        ],
      },
      {
        title: 'Article 4 - Moyens de paiement',
        content: [
          'Le Client peut regler ses abonnements et consommations par les moyens de paiement suivants : Orange Money, MTN Mobile Money, et carte bancaire (Visa, Mastercard).',
          'Les paiements par mobile money sont traites en temps reel. Les paiements par carte bancaire sont securises par un prestataire de paiement tiers conforme aux normes PCI-DSS.',
          'En cas d\'echec de paiement, le Prestataire se reserve le droit de suspendre l\'acces aux fonctionnalites payantes du service apres notification au Client. Le Client dispose d\'un delai de quinze (15) jours pour regulariser sa situation.',
        ],
      },
      {
        title: 'Article 5 - Duree et resiliation',
        content: [
          'Les abonnements mensuels sont souscrits pour une duree d\'un mois, renouvelable tacitement. Les abonnements annuels sont souscrits pour une duree de douze (12) mois, renouvelable tacitement.',
          'Le Client peut resilier son abonnement a tout moment depuis les parametres de son compte. La resiliation prend effet a la fin de la periode d\'abonnement en cours. Aucun remboursement au prorata ne sera effectue pour la periode restante.',
          'En cas de resiliation, les donnees du Client sont conservees pendant une duree de trente (30) jours, durant laquelle le Client peut demander l\'exportation de ses donnees. Passe ce delai, les donnees sont definitivement supprimees.',
          'Le Prestataire se reserve le droit de resilier le compte d\'un Client en cas de violation des presentes CGV, apres mise en demeure restee sans effet pendant un delai de sept (7) jours.',
        ],
      },
      {
        title: 'Article 6 - Responsabilite',
        content: [
          'Le Prestataire s\'engage a fournir le service avec diligence et conformement aux regles de l\'art. Toutefois, le service est fourni "en l\'etat" et le Prestataire ne garantit pas un fonctionnement ininterrompu ou exempt d\'erreurs.',
          'La responsabilite du Prestataire ne saurait etre engagee en cas de force majeure, de dysfonctionnement du reseau Internet, de panne des equipements du Client, ou de toute cause exterieure au Prestataire.',
          'En tout etat de cause, la responsabilite totale du Prestataire au titre du present contrat est limitee au montant des sommes effectivement versees par le Client au cours des douze (12) derniers mois precedant le fait generateur de responsabilite. Le Prestataire ne pourra en aucun cas etre tenu responsable des dommages indirects, pertes de benefices, pertes de donnees ou pertes d\'exploitation.',
        ],
      },
      {
        title: 'Article 7 - Propriete intellectuelle',
        content: [
          'La plateforme POS Mano Verde, incluant son code source, son interface graphique, ses algorithmes, sa documentation et tous les elements qui la composent, est la propriete exclusive de Mano Verde SA.',
          'L\'abonnement confere au Client un droit d\'utilisation personnel, non exclusif et non transferable du service, pour la duree de l\'abonnement. Ce droit ne confere aucun droit de propriete sur le logiciel ou ses composants.',
          'Toute reproduction, representation, modification, distribution ou exploitation de la plateforme ou de ses elements, en tout ou partie, sans l\'autorisation prealable et ecrite de Mano Verde SA est strictement interdite et constitue une contrefacon sanctionnee par les lois en vigueur.',
        ],
      },
      {
        title: 'Article 8 - Droit applicable et juridiction competente',
        content: [
          'Les presentes CGV sont regies par le droit camerounais et, le cas echeant, par les dispositions du droit uniforme de l\'Organisation pour l\'Harmonisation en Afrique du Droit des Affaires (OHADA).',
          'En cas de litige relatif a l\'interpretation ou a l\'execution des presentes CGV, les parties s\'efforceront de trouver une solution amiable. A defaut d\'accord amiable dans un delai de trente (30) jours, le litige sera soumis aux tribunaux competents de Douala, Cameroun.',
          'Pour toute reclamation, le Client peut contacter le Prestataire a l\'adresse suivante : direction@manoverde.com.',
        ],
      },
    ],
  },

  rgpd: {
    title: 'Politique de Protection des Donnees Personnelles',
    lastUpdated: '2025-01-15',
    sections: [
      {
        title: 'Article 1 - Donnees collectees',
        content: [
          'Dans le cadre de l\'utilisation de la plateforme POS Mano Verde, le Prestataire collecte les categories de donnees personnelles suivantes :',
          'Donnees d\'identification : nom, prenom, adresse email, numero de telephone, adresse postale du siege de l\'activite commerciale.',
          'Donnees relatives a l\'activite commerciale : nom de l\'entreprise, secteur d\'activite, numero d\'identification fiscale (le cas echeant), informations sur les produits et services proposes.',
          'Donnees transactionnelles : historique des ventes, montants des transactions, modes de paiement utilises par les clients du Client, tickets de caisse emis.',
          'Donnees techniques : adresse IP, type de navigateur, systeme d\'exploitation, donnees de connexion et de navigation sur la plateforme.',
        ],
      },
      {
        title: 'Article 2 - Finalite du traitement',
        content: [
          'Les donnees personnelles collectees sont traitees pour les finalites suivantes :',
          'Fonctionnement du service : creation et gestion du compte utilisateur, traitement des transactions, synchronisation des donnees entre appareils, generation de rapports et statistiques.',
          'Facturation et gestion commerciale : emission des factures, gestion des abonnements, suivi de la consommation (nombre de tickets emis), recouvrement des paiements.',
          'Support technique : traitement des demandes d\'assistance, resolution des incidents techniques, amelioration continue du service.',
          'Analyses et ameliorations : analyse anonymisee des usages pour ameliorer la plateforme, detection et prevention des fraudes, etudes statistiques agregees.',
        ],
      },
      {
        title: 'Article 3 - Base legale du traitement',
        content: [
          'Le traitement des donnees personnelles repose sur les bases legales suivantes :',
          'Le consentement de l\'utilisateur, recueilli lors de l\'inscription sur la plateforme et pouvant etre retire a tout moment depuis les parametres du compte.',
          'La necessite contractuelle : le traitement des donnees est indispensable a l\'execution du contrat de service entre le Prestataire et le Client, notamment pour la fourniture du service de caisse enregistreuse et la facturation.',
          'L\'interet legitime du Prestataire : amelioration du service, prevention de la fraude, securite de la plateforme.',
          'Les obligations legales : conservation des donnees financieres conformement aux obligations comptables et fiscales applicables.',
        ],
      },
      {
        title: 'Article 4 - Duree de conservation',
        content: [
          'Les donnees personnelles sont conservees pendant la duree suivante :',
          'Donnees du compte actif : les donnees sont conservees pendant toute la duree de l\'utilisation active du service, puis pendant une duree de trois (3) ans a compter de la derniere connexion du Client.',
          'Donnees financieres et transactionnelles : conformement aux obligations legales comptables et fiscales, ces donnees sont conservees pendant une duree de dix (10) ans.',
          'Donnees techniques (logs de connexion) : ces donnees sont conservees pendant une duree de douze (12) mois.',
          'A l\'expiration de ces delais, les donnees sont definitivement supprimees ou anonymisees de maniere irreversible.',
        ],
      },
      {
        title: 'Article 5 - Partage des donnees',
        content: [
          'Mano Verde SA s\'engage a ne jamais vendre, louer ou ceder les donnees personnelles de ses Clients a des tiers a des fins commerciales ou publicitaires.',
          'Les donnees peuvent etre partagees avec les prestataires techniques suivants, strictement necessaires au fonctionnement du service :',
          'Supabase (hebergement de la base de donnees et authentification) : les donnees sont hebergees sur des serveurs securises. Supabase est conforme aux normes de securite de l\'industrie.',
          'Vercel (hebergement de l\'application web et CDN) : seul le code de l\'application est heberge sur Vercel. Aucune donnee personnelle n\'est stockee sur les serveurs de Vercel.',
          'Les prestataires de paiement (pour le traitement des transactions financieres) : seules les donnees strictement necessaires au traitement du paiement sont transmises.',
          'Les donnees peuvent egalement etre communiquees aux autorites competentes en cas d\'obligation legale ou sur decision de justice.',
        ],
      },
      {
        title: 'Article 6 - Securite des donnees',
        content: [
          'Mano Verde SA met en oeuvre des mesures techniques et organisationnelles appropriees pour proteger les donnees personnelles contre tout acces non autorise, toute modification, divulgation ou destruction.',
          'Les mesures de securite incluent notamment : le chiffrement des donnees en transit (TLS/SSL) et au repos, l\'implementation de politiques de securite au niveau des lignes de la base de donnees (Row Level Security - RLS) garantissant que chaque Client n\'accede qu\'a ses propres donnees, l\'utilisation de l\'infrastructure securisee de Supabase.',
          'Les mots de passe des utilisateurs sont haches a l\'aide d\'algorithmes de hachage securises et ne sont jamais stockes en clair.',
          'Le Prestataire s\'engage a notifier les Clients concernes et les autorites competentes en cas de violation de donnees personnelles, conformement aux dispositions legales applicables.',
        ],
      },
      {
        title: 'Article 7 - Droits des utilisateurs',
        content: [
          'Conformement a la reglementation applicable en matiere de protection des donnees personnelles, le Client dispose des droits suivants :',
          'Droit d\'acces : le Client peut obtenir la confirmation que des donnees le concernant sont ou ne sont pas traitees, et obtenir une copie de ces donnees.',
          'Droit de rectification : le Client peut demander la correction de donnees inexactes ou incompletes le concernant.',
          'Droit a l\'effacement : le Client peut demander la suppression de ses donnees personnelles, sous reserve des obligations legales de conservation.',
          'Droit a la portabilite : le Client peut obtenir ses donnees dans un format structure, couramment utilise et lisible par machine (export CSV ou JSON), afin de les transmettre a un autre prestataire.',
          'Droit d\'opposition : le Client peut s\'opposer au traitement de ses donnees pour des motifs legitimes.',
          'Pour exercer ces droits, le Client peut adresser sa demande par email a : direction@manoverde.com. Le Prestataire s\'engage a repondre dans un delai de trente (30) jours.',
        ],
      },
      {
        title: 'Article 8 - Cookies',
        content: [
          'La plateforme POS Mano Verde utilise exclusivement des cookies techniques strictement necessaires au fonctionnement du service. Ces cookies permettent la gestion de la session utilisateur, la memorisation des preferences de langue et le maintien de la connexion.',
          'Aucun cookie de tracage, de publicite ou d\'analyse comportementale n\'est utilise sur la plateforme.',
          'Ces cookies techniques etant indispensables au fonctionnement du service, ils ne necessitent pas le consentement prealable de l\'utilisateur conformement aux dispositions legales applicables.',
        ],
      },
      {
        title: 'Article 9 - Contact du Delegue a la Protection des Donnees',
        content: [
          'Pour toute question relative a la protection de vos donnees personnelles ou pour exercer vos droits, vous pouvez contacter notre Delegue a la Protection des Donnees (DPO) a l\'adresse suivante :',
          'Email : direction@manoverde.com',
          'Adresse postale : Mano Verde SA, Douala, Cameroun.',
          'Vous disposez egalement du droit d\'introduire une reclamation aupres de l\'autorite de controle competente si vous estimez que le traitement de vos donnees personnelles n\'est pas conforme a la reglementation applicable.',
        ],
      },
    ],
  },

  terms: {
    title: 'Conditions d\'Utilisation',
    lastUpdated: '2025-01-15',
    sections: [
      {
        title: 'Article 1 - Acceptation des conditions',
        content: [
          'L\'acces et l\'utilisation de la plateforme POS Mano Verde (ci-apres "le Service") sont subordonnes a l\'acceptation prealable et sans reserve des presentes Conditions d\'Utilisation.',
          'En creant un compte ou en utilisant le Service, l\'utilisateur reconnait avoir lu, compris et accepte les presentes Conditions d\'Utilisation dans leur integralite. Si l\'utilisateur n\'accepte pas ces conditions, il doit s\'abstenir d\'utiliser le Service.',
          'Les presentes Conditions d\'Utilisation completent les Conditions Generales de Vente (CGV) et la Politique de Protection des Donnees Personnelles (RGPD) accessibles depuis la plateforme.',
        ],
      },
      {
        title: 'Article 2 - Description du service',
        content: [
          'POS Mano Verde est un systeme de caisse enregistreuse (Point of Sale) en ligne accessible via navigateur web. Le Service offre les fonctionnalites suivantes :',
          'Gestion des ventes et emission de tickets de caisse, gestion des produits et du catalogue, suivi des stocks et des mouvements de tresorerie, generation de rapports et de statistiques commerciales.',
          'Le Service fonctionne en mode hors-ligne : l\'utilisateur peut continuer a enregistrer des ventes meme en l\'absence de connexion Internet. Les donnees sont automatiquement synchronisees avec le cloud lorsque la connexion est retablie.',
          'La synchronisation cloud permet a l\'utilisateur d\'acceder a ses donnees depuis plusieurs appareils et de gerer plusieurs activites commerciales depuis un seul compte.',
        ],
      },
      {
        title: 'Article 3 - Creation de compte',
        content: [
          'Pour utiliser le Service, l\'utilisateur doit creer un compte en fournissant des informations exactes, completes et a jour. L\'utilisateur s\'engage a mettre a jour ses informations en cas de changement.',
          'Chaque adresse email ne peut etre associee qu\'a un seul compte utilisateur. Un compte utilisateur peut toutefois gerer plusieurs organisations et activites commerciales.',
          'L\'utilisateur est seul responsable de la securite de son mot de passe et de la confidentialite de ses identifiants de connexion. En cas de suspicion d\'utilisation non autorisee de son compte, l\'utilisateur doit en informer immediatement le Prestataire a l\'adresse direction@manoverde.com.',
          'Le Prestataire se reserve le droit de refuser la creation d\'un compte ou de suspendre un compte existant en cas de non-respect des presentes conditions.',
        ],
      },
      {
        title: 'Article 4 - Utilisation acceptable',
        content: [
          'Le Service est destine exclusivement a un usage commercial legal. L\'utilisateur s\'engage a utiliser le Service conformement aux lois et reglementations en vigueur dans sa juridiction.',
          'Sont strictement interdites les utilisations suivantes : l\'utilisation du Service pour des activites frauduleuses, illegales ou contraires a l\'ordre public ; la tentative d\'acces non autorise aux systemes, serveurs ou reseaux du Prestataire ; la decompilation, le desassemblage, la retro-ingenierie ou toute tentative d\'extraction du code source de la plateforme.',
          'Sont egalement interdites : la transmission de virus, logiciels malveillants ou tout code nuisible via le Service ; l\'utilisation de robots, scrapers ou tout outil automatise pour acceder au Service sans autorisation ; la surcharge intentionnelle des serveurs ou toute action susceptible de perturber le fonctionnement du Service.',
          'En cas de violation des presentes regles d\'utilisation, le Prestataire se reserve le droit de suspendre ou de supprimer immediatement le compte de l\'utilisateur, sans preavis ni indemnite.',
        ],
      },
      {
        title: 'Article 5 - Contenu utilisateur',
        content: [
          'L\'utilisateur conserve l\'entiere propriete de l\'ensemble des donnees qu\'il saisit et stocke sur la plateforme (donnees produits, transactions, informations clients, rapports, etc.).',
          'En utilisant le Service, l\'utilisateur accorde a Mano Verde SA une licence limitee, non exclusive et revocable pour traiter, stocker et afficher ces donnees dans le seul but de fournir le Service. Cette licence prend fin automatiquement a la suppression du compte.',
          'L\'utilisateur garantit que les donnees qu\'il saisit sur la plateforme ne violent aucun droit de propriete intellectuelle de tiers et ne contiennent aucun contenu illegal, diffamatoire ou prejudiciable.',
          'Le Prestataire n\'exerce aucun controle editorial sur le contenu saisi par l\'utilisateur et ne saurait etre tenu responsable de ce contenu.',
        ],
      },
      {
        title: 'Article 6 - Disponibilite du service',
        content: [
          'Le Prestataire s\'efforce d\'assurer la disponibilite du Service 24 heures sur 24 et 7 jours sur 7. Toutefois, le Service est fourni sur la base du "meilleur effort" et le Prestataire ne garantit pas une disponibilite ininterrompue.',
          'Le Prestataire se reserve le droit de suspendre temporairement l\'acces au Service pour des operations de maintenance, de mise a jour ou d\'amelioration. Les maintenances planifiees seront, dans la mesure du possible, effectuees en dehors des heures de forte utilisation et annoncees a l\'avance.',
          'Le plan gratuit ne beneficie d\'aucun accord de niveau de service (SLA). Les plans payants beneficient d\'un objectif de disponibilite de 99,5%, hors periodes de maintenance planifiee et cas de force majeure.',
          'Le mode hors-ligne integre au Service permet a l\'utilisateur de continuer a travailler meme en cas d\'indisponibilite temporaire de la connexion Internet ou des serveurs.',
        ],
      },
      {
        title: 'Article 7 - Multi-activite',
        content: [
          'Le Service permet a l\'utilisateur de gerer plusieurs activites commerciales (boutiques, restaurants, services, etc.) depuis un seul et meme compte utilisateur.',
          'Chaque activite constitue un espace de travail distinct avec ses propres produits, transactions, stocks et rapports. Les donnees de chaque activite sont cloisonnees et ne sont pas partagees entre les differentes activites, sauf choix explicite de l\'utilisateur.',
          'La facturation est calculee par activite : le nombre de tickets emis et les fonctionnalites utilisees sont comptabilises separement pour chaque activite. L\'utilisateur peut souscrire a des plans differents pour chacune de ses activites.',
        ],
      },
      {
        title: 'Article 8 - Suspension et resiliation',
        content: [
          'Le Prestataire se reserve le droit de suspendre temporairement ou definitivement l\'acces au Service en cas de :',
          'Violation des presentes Conditions d\'Utilisation ou des Conditions Generales de Vente ; utilisation du Service a des fins illegales ou frauduleuses ; non-paiement des sommes dues apres mise en demeure restee sans effet ; comportement susceptible de porter atteinte a la securite, a l\'integrite ou au bon fonctionnement du Service.',
          'En cas de suspension, l\'utilisateur sera notifie par email a l\'adresse associee a son compte. L\'utilisateur pourra contester la suspension en adressant une reclamation motivee a direction@manoverde.com dans un delai de quinze (15) jours.',
          'L\'utilisateur peut resilier son compte a tout moment depuis les parametres de son compte ou en adressant une demande a direction@manoverde.com.',
        ],
      },
      {
        title: 'Article 9 - Limitation de responsabilite',
        content: [
          'Le Prestataire ne saurait etre tenu responsable des dommages indirects, accessoires, speciaux ou consecutifs resultant de l\'utilisation ou de l\'impossibilite d\'utiliser le Service, y compris mais sans s\'y limiter : les pertes de benefices, les pertes de donnees, les interruptions d\'activite, les pertes de clientele.',
          'La responsabilite totale du Prestataire envers l\'utilisateur, quelle qu\'en soit la cause, est limitee au montant total des sommes effectivement versees par l\'utilisateur au cours des douze (12) mois precedant l\'evenement ayant donne lieu a la reclamation.',
          'Cette limitation de responsabilite s\'applique dans toute la mesure permise par la loi applicable et subsiste meme en cas de resolution ou de resiliation du contrat.',
        ],
      },
      {
        title: 'Article 10 - Modifications des conditions',
        content: [
          'Le Prestataire se reserve le droit de modifier les presentes Conditions d\'Utilisation a tout moment. Les modifications seront notifiees aux utilisateurs par email et/ou par une notification visible sur la plateforme.',
          'Les utilisateurs disposent d\'un delai de trente (30) jours a compter de la notification pour prendre connaissance des nouvelles conditions. L\'utilisation continue du Service apres ce delai vaut acceptation des nouvelles conditions.',
          'Si l\'utilisateur n\'accepte pas les nouvelles conditions, il peut resilier son compte avant l\'expiration du delai de trente jours. Dans ce cas, les anciennes conditions restent applicables jusqu\'a la date effective de resiliation.',
          'Les modifications substantielles affectant les droits de l\'utilisateur ou la tarification feront l\'objet d\'une communication specifique et detaillee.',
        ],
      },
      {
        title: 'Article 11 - Contact',
        content: [
          'Pour toute question, reclamation ou demande relative au Service ou aux presentes Conditions d\'Utilisation, l\'utilisateur peut contacter le Prestataire par les moyens suivants :',
          'Email : direction@manoverde.com',
          'Adresse postale : Mano Verde SA, Douala, Cameroun.',
          'Le Prestataire s\'engage a accuser reception de toute demande dans un delai de quarante-huit (48) heures ouvrables et a fournir une reponse circonstanciee dans un delai de trente (30) jours.',
          'Les presentes Conditions d\'Utilisation sont regies par le droit camerounais. Tout litige sera soumis aux tribunaux competents de Douala, Cameroun, apres tentative de resolution amiable.',
        ],
      },
    ],
  },
}

const ALL_LEGAL_DOCS: Record<string, Record<LegalDocType, LegalDocument>> = {
  fr: LEGAL_DOCUMENTS_FR,
  en: LEGAL_DOCUMENTS_EN,
  es: LEGAL_DOCUMENTS_ES,
  de: LEGAL_DOCUMENTS_DE,
  it: LEGAL_DOCUMENTS_IT,
  zh: LEGAL_DOCUMENTS_ZH,
  ar: LEGAL_DOCUMENTS_AR,
}

export function getLegalDocuments(lang: string): Record<LegalDocType, LegalDocument> {
  return ALL_LEGAL_DOCS[lang] || LEGAL_DOCUMENTS_FR
}
