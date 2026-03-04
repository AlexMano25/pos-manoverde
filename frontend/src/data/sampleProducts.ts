import type { Activity } from '../types'

export type SampleProduct = {
  name: string
  price: number          // in FCFA
  cost?: number          // in FCFA
  stock: number
  category: string       // plain French category name
  unit?: string
  // Activity-specific optional fields
  expiry_date?: string
  dosage?: string
  manufacturer?: string
  room_type?: string
  room_number?: string
  duration_minutes?: number
  weight_kg?: number
  size?: string
  color?: string
  vehicle_type?: string
  author?: string
  isbn?: string
  destination?: string
  age_group?: string
  description?: string
}

export const SAMPLE_PRODUCTS: Partial<Record<Activity, SampleProduct[]>> = {

  // ---------------------------------------------------------------------------
  // PHARMACIE
  // ---------------------------------------------------------------------------
  pharmacy: [
    { name: 'Paracetamol 500mg', price: 500, cost: 250, stock: 200, category: 'Medicaments', unit: 'boite', dosage: '500mg', manufacturer: 'Sanofi (France)' },
    { name: 'Amoxicilline 250mg', price: 1500, cost: 800, stock: 120, category: 'Antibiotiques', unit: 'boite', dosage: '250mg', manufacturer: 'Cipla (Inde)' },
    { name: 'Ibuprofene 400mg', price: 800, cost: 400, stock: 180, category: 'Medicaments', unit: 'boite', dosage: '400mg', manufacturer: 'Pfizer (USA)' },
    { name: 'Vitamine C 1000mg', price: 2500, cost: 1400, stock: 80, category: 'Vitamines', unit: 'boite', dosage: '1000mg', manufacturer: 'Bayer (Allemagne)' },
    { name: 'Pansement adhesif', price: 750, cost: 350, stock: 150, category: 'Materiel medical', unit: 'boite', manufacturer: 'Hansaplast (Allemagne)' },
    { name: 'Sirop contre la toux', price: 2000, cost: 1100, stock: 60, category: 'Medicaments', unit: 'flacon', dosage: '150ml', manufacturer: 'Takeda (Japon)' },
    { name: 'Creme solaire SPF50', price: 4500, cost: 2200, stock: 40, category: 'Parapharmacie', unit: 'tube', manufacturer: 'Natura (Bresil)' },
    { name: 'Thermometre digital', price: 3500, cost: 1800, stock: 40, category: 'Materiel medical', unit: 'piece', manufacturer: 'Omron (Japon)' },
    { name: 'Omeprazole 20mg', price: 1200, cost: 600, stock: 100, category: 'Medicaments', unit: 'boite', dosage: '20mg', manufacturer: 'AstraZeneca (UK)', expiry_date: '2027-09-30' },
    { name: 'Loratadine 10mg', price: 900, cost: 400, stock: 150, category: 'Medicaments', unit: 'boite', dosage: '10mg', manufacturer: 'Teva (Israel)', expiry_date: '2027-11-15' },
    { name: 'Serum physiologique (30 doses)', price: 1800, cost: 900, stock: 90, category: 'Hygiene', unit: 'boite', manufacturer: 'Gilbert (France)', expiry_date: '2028-01-01' },
    { name: 'Couches bebe taille 3 (30 pcs)', price: 5500, cost: 3200, stock: 60, category: 'Bebe', unit: 'paquet', manufacturer: 'Pampers (USA)' },
    { name: 'Lait infantile 1er age 400g', price: 6000, cost: 3800, stock: 40, category: 'Bebe', unit: 'boite', manufacturer: 'Nestle (Suisse)', expiry_date: '2027-06-15' },
    { name: 'Tensiometre bras', price: 18000, cost: 10000, stock: 15, category: 'Materiel medical', unit: 'piece', manufacturer: 'Omron (Japon)' },
    { name: 'Preservatifs (12 pcs)', price: 2000, cost: 1000, stock: 120, category: 'Hygiene', unit: 'boite', manufacturer: 'Durex (UK)', expiry_date: '2028-12-31' },
    { name: 'Multivitamines A-Z', price: 3500, cost: 1800, stock: 70, category: 'Vitamines', unit: 'boite', dosage: '1 comprime/jour', manufacturer: 'Centrum (USA)', expiry_date: '2027-08-20' },
    { name: 'Gel hydroalcoolique 500ml', price: 1500, cost: 700, stock: 200, category: 'Hygiene', unit: 'flacon', manufacturer: 'Anios (France)' },
    { name: 'Masques chirurgicaux (50 pcs)', price: 3000, cost: 1500, stock: 100, category: 'Materiel medical', unit: 'boite', manufacturer: 'Medicom (Canada)' },
  ],

  // ---------------------------------------------------------------------------
  // RESTAURANT
  // ---------------------------------------------------------------------------
  restaurant: [
    { name: 'Ndole (Cameroun)', price: 3000, cost: 1500, stock: 20, category: 'Plats principaux', duration_minutes: 30 },
    { name: 'Jollof Rice (Nigeria)', price: 2500, cost: 1200, stock: 25, category: 'Plats principaux', duration_minutes: 25 },
    { name: 'Pizza Margherita (Italie)', price: 4000, cost: 1800, stock: 30, category: 'Plats principaux', duration_minutes: 20 },
    { name: 'Pad Thai (Thailande)', price: 3500, cost: 1600, stock: 25, category: 'Plats principaux', duration_minutes: 15 },
    { name: 'Burger classique (USA)', price: 3500, cost: 1700, stock: 30, category: 'Plats principaux', duration_minutes: 15 },
    { name: 'Crepe beurre sucre (France)', price: 1500, cost: 600, stock: 40, category: 'Desserts', duration_minutes: 10 },
    { name: 'Empanada de carne (Argentine)', price: 2000, cost: 900, stock: 35, category: 'Entrees', duration_minutes: 12 },
    { name: 'Jus de fruits frais', price: 500, cost: 200, stock: 50, category: 'Boissons', duration_minutes: 5 },
    { name: 'Salade Caesar', price: 2500, cost: 1000, stock: 30, category: 'Entrees', duration_minutes: 10 },
    { name: 'Sushi Maki 12 pcs (Japon)', price: 5000, cost: 2500, stock: 20, category: 'Plats principaux', duration_minutes: 20 },
    { name: 'Tiramisu (Italie)', price: 2000, cost: 800, stock: 25, category: 'Desserts', duration_minutes: 5 },
    { name: 'Poulet Yassa (Senegal)', price: 3500, cost: 1600, stock: 20, category: 'Plats principaux', duration_minutes: 35 },
    { name: 'Tacos al pastor (Mexique)', price: 2500, cost: 1100, stock: 30, category: 'Plats principaux', duration_minutes: 12 },
    { name: 'Soupe Pho (Vietnam)', price: 3000, cost: 1300, stock: 20, category: 'Entrees', duration_minutes: 15 },
    { name: 'Eau minerale 1L', price: 300, cost: 100, stock: 100, category: 'Boissons', duration_minutes: 2 },
    { name: 'Coca-Cola 33cl', price: 500, cost: 250, stock: 80, category: 'Boissons', duration_minutes: 2 },
    { name: 'Menu enfant (plat + boisson)', price: 2000, cost: 900, stock: 30, category: 'Menus', duration_minutes: 15 },
    { name: 'Glace artisanale 2 boules', price: 1500, cost: 500, stock: 40, category: 'Desserts', duration_minutes: 5 },
  ],

  // ---------------------------------------------------------------------------
  // SUPERMARCHE
  // ---------------------------------------------------------------------------
  supermarket: [
    { name: 'Riz Basmati 5kg (Inde)', price: 8000, cost: 5500, stock: 60, category: 'Alimentation', unit: 'sac', weight_kg: 5, manufacturer: 'Tilda', expiry_date: '2027-06-30' },
    { name: 'Huile d\'olive 1L (Espagne)', price: 6000, cost: 4000, stock: 50, category: 'Alimentation', unit: 'bouteille', weight_kg: 1, manufacturer: 'Carbonell', expiry_date: '2027-12-31' },
    { name: 'Coca-Cola 1.5L (USA)', price: 800, cost: 500, stock: 200, category: 'Boissons', unit: 'bouteille', weight_kg: 1.5, manufacturer: 'Coca-Cola', expiry_date: '2027-03-15' },
    { name: 'Baguette tradition (France)', price: 300, cost: 150, stock: 100, category: 'Boulangerie', unit: 'piece', weight_kg: 0.25, expiry_date: '2026-03-04' },
    { name: 'Chips de plantain (Ghana)', price: 1000, cost: 500, stock: 80, category: 'Snacks', unit: 'sachet', weight_kg: 0.15, manufacturer: 'Olu Olu', expiry_date: '2027-09-01' },
    { name: 'Nouilles instantanees (Japon)', price: 500, cost: 250, stock: 150, category: 'Alimentation', unit: 'paquet', weight_kg: 0.1, manufacturer: 'Nissin', expiry_date: '2027-08-20' },
    { name: 'Cafe moulu (Colombie)', price: 4500, cost: 2800, stock: 40, category: 'Boissons', unit: 'paquet', weight_kg: 0.5, manufacturer: 'Juan Valdez', expiry_date: '2027-10-15' },
    { name: 'Fromage Gouda (Pays-Bas)', price: 3500, cost: 2200, stock: 30, category: 'Produits laitiers', unit: 'piece', weight_kg: 0.3, manufacturer: 'Old Amsterdam', expiry_date: '2026-06-15' },
    { name: 'Lait UHT 1L (France)', price: 600, cost: 350, stock: 150, category: 'Produits laitiers', unit: 'brique', weight_kg: 1, manufacturer: 'Lactel', expiry_date: '2026-09-30' },
    { name: 'Sardines en conserve (Maroc)', price: 700, cost: 400, stock: 100, category: 'Conserves', unit: 'boite', weight_kg: 0.12, manufacturer: 'La Belle Iloise', expiry_date: '2028-06-01' },
    { name: 'Eau minerale 6x1.5L', price: 2500, cost: 1600, stock: 80, category: 'Boissons', unit: 'pack', weight_kg: 9, manufacturer: 'Evian', expiry_date: '2027-12-01' },
    { name: 'Savon de Marseille 400g (France)', price: 1200, cost: 600, stock: 70, category: 'Hygiene', unit: 'piece', weight_kg: 0.4 },
    { name: 'Papier toilette (12 rouleaux)', price: 2500, cost: 1400, stock: 60, category: 'Hygiene', unit: 'paquet' },
    { name: 'Detergent lessive 3kg', price: 4000, cost: 2200, stock: 50, category: 'Entretien', unit: 'boite', weight_kg: 3, manufacturer: 'OMO' },
    { name: 'Yaourt nature x8 (France)', price: 1500, cost: 900, stock: 60, category: 'Produits laitiers', unit: 'pack', manufacturer: 'Danone', expiry_date: '2026-04-10' },
    { name: 'Chocolat noir 70% (Belgique)', price: 2000, cost: 1100, stock: 50, category: 'Snacks', unit: 'tablette', weight_kg: 0.1, manufacturer: 'Cote d\'Or', expiry_date: '2027-05-01' },
    { name: 'Spaghetti 500g (Italie)', price: 800, cost: 400, stock: 120, category: 'Alimentation', unit: 'paquet', weight_kg: 0.5, manufacturer: 'Barilla', expiry_date: '2028-03-01' },
    { name: 'Tomates en conserve 400g (Italie)', price: 600, cost: 300, stock: 100, category: 'Conserves', unit: 'boite', weight_kg: 0.4, manufacturer: 'Mutti', expiry_date: '2028-01-15' },
  ],

  // ---------------------------------------------------------------------------
  // BAR
  // ---------------------------------------------------------------------------
  bar: [
    { name: 'Biere Heineken (Pays-Bas)', price: 800, cost: 450, stock: 200, category: 'Bieres', unit: 'bouteille' },
    { name: 'Biere Corona (Mexique)', price: 900, cost: 500, stock: 150, category: 'Bieres', unit: 'bouteille' },
    { name: 'Whisky Johnnie Walker (Ecosse)', price: 3000, cost: 1500, stock: 30, category: 'Spiritueux', unit: 'verre' },
    { name: 'Sake (Japon)', price: 2500, cost: 1200, stock: 20, category: 'Spiritueux', unit: 'verre' },
    { name: 'Caipirinha (Bresil)', price: 2000, cost: 800, stock: 40, category: 'Cocktails', unit: 'verre' },
    { name: 'Vin rouge (Afrique du Sud)', price: 2500, cost: 1200, stock: 25, category: 'Vins', unit: 'verre' },
    { name: 'Brochettes de boeuf', price: 1500, cost: 700, stock: 40, category: 'Snacks', unit: 'portion' },
    { name: 'Mojito (Cuba)', price: 2500, cost: 900, stock: 40, category: 'Cocktails', unit: 'verre' },
    { name: 'Pina Colada (Porto Rico)', price: 2500, cost: 1000, stock: 30, category: 'Cocktails', unit: 'verre' },
    { name: 'Biere Guinness (Irlande)', price: 1000, cost: 600, stock: 100, category: 'Bieres', unit: 'bouteille' },
    { name: 'Vin blanc Chardonnay (France)', price: 3000, cost: 1500, stock: 20, category: 'Vins', unit: 'verre' },
    { name: 'Rhum arrange (Martinique)', price: 2000, cost: 800, stock: 25, category: 'Spiritueux', unit: 'verre' },
    { name: 'Cacahuetes grillees', price: 500, cost: 200, stock: 80, category: 'Snacks', unit: 'portion' },
    { name: 'Eau minerale 50cl', price: 300, cost: 100, stock: 150, category: 'Softs', unit: 'bouteille' },
    { name: 'Jus d\'ananas', price: 600, cost: 250, stock: 60, category: 'Softs', unit: 'verre' },
    { name: 'Tequila Sunrise (Mexique)', price: 3000, cost: 1200, stock: 30, category: 'Cocktails', unit: 'verre' },
    { name: 'Assiette mixte tapas', price: 3500, cost: 1500, stock: 25, category: 'Snacks', unit: 'portion' },
    { name: 'Champagne coupe (France)', price: 5000, cost: 2500, stock: 15, category: 'Vins', unit: 'coupe' },
  ],

  // ---------------------------------------------------------------------------
  // BOULANGERIE
  // ---------------------------------------------------------------------------
  bakery: [
    { name: 'Baguette (France)', price: 200, cost: 100, stock: 200, category: 'Pains', unit: 'piece', weight_kg: 0.25, expiry_date: '2026-03-04' },
    { name: 'Pain naan (Inde)', price: 300, cost: 120, stock: 80, category: 'Pains', unit: 'piece', weight_kg: 0.12, expiry_date: '2026-03-04' },
    { name: 'Croissant au beurre (France)', price: 300, cost: 150, stock: 100, category: 'Viennoiseries', unit: 'piece', weight_kg: 0.08, expiry_date: '2026-03-04' },
    { name: 'Muffin aux myrtilles (USA)', price: 500, cost: 250, stock: 60, category: 'Patisseries', unit: 'piece', weight_kg: 0.12, expiry_date: '2026-03-05' },
    { name: 'Pan de muerto (Mexique)', price: 800, cost: 400, stock: 30, category: 'Pains', unit: 'piece', weight_kg: 0.3, expiry_date: '2026-03-05' },
    { name: 'Gateau d\'anniversaire', price: 15000, cost: 7000, stock: 5, category: 'Patisseries', unit: 'piece', weight_kg: 2, expiry_date: '2026-03-06' },
    { name: 'Pain au chocolat', price: 350, cost: 170, stock: 80, category: 'Viennoiseries', unit: 'piece', weight_kg: 0.08, expiry_date: '2026-03-04' },
    { name: 'Sandwich jambon beurre', price: 1200, cost: 500, stock: 40, category: 'Sandwichs', unit: 'piece', weight_kg: 0.2, expiry_date: '2026-03-04' },
    { name: 'Pain complet', price: 400, cost: 200, stock: 60, category: 'Pains', unit: 'piece', weight_kg: 0.4, expiry_date: '2026-03-05' },
    { name: 'Eclair au chocolat', price: 600, cost: 280, stock: 40, category: 'Patisseries', unit: 'piece', weight_kg: 0.1, expiry_date: '2026-03-05' },
    { name: 'Tarte aux pommes', price: 5000, cost: 2200, stock: 10, category: 'Patisseries', unit: 'piece', weight_kg: 0.8, expiry_date: '2026-03-06' },
    { name: 'Brioche tressee', price: 1500, cost: 700, stock: 30, category: 'Viennoiseries', unit: 'piece', weight_kg: 0.35, expiry_date: '2026-03-05' },
    { name: 'Focaccia aux olives (Italie)', price: 800, cost: 350, stock: 25, category: 'Pains', unit: 'piece', weight_kg: 0.25, expiry_date: '2026-03-04' },
    { name: 'Quiche Lorraine', price: 3500, cost: 1500, stock: 15, category: 'Sandwichs', unit: 'piece', weight_kg: 0.4, expiry_date: '2026-03-05' },
    { name: 'Cafe expresso', price: 300, cost: 100, stock: 100, category: 'Boissons', unit: 'tasse' },
    { name: 'Jus d\'orange frais', price: 500, cost: 200, stock: 60, category: 'Boissons', unit: 'verre' },
    { name: 'Macaron assortis (6 pcs)', price: 3000, cost: 1400, stock: 20, category: 'Patisseries', unit: 'boite', weight_kg: 0.12, expiry_date: '2026-03-06' },
  ],

  // ---------------------------------------------------------------------------
  // HOTEL
  // ---------------------------------------------------------------------------
  hotel: [
    { name: 'Chambre Simple', price: 25000, cost: 8000, stock: 20, category: 'Hebergement', unit: 'nuit', room_type: 'simple' },
    { name: 'Chambre Double', price: 40000, cost: 12000, stock: 15, category: 'Hebergement', unit: 'nuit', room_type: 'double' },
    { name: 'Suite Junior', price: 75000, cost: 25000, stock: 5, category: 'Hebergement', unit: 'nuit', room_type: 'suite_junior' },
    { name: 'Suite Presidentielle', price: 150000, cost: 50000, stock: 2, category: 'Hebergement', unit: 'nuit', room_type: 'suite_presidentielle' },
    { name: 'Petit dejeuner buffet', price: 5000, cost: 2000, stock: 50, category: 'Restauration', unit: 'personne', room_type: 'restaurant' },
    { name: 'Chambre Triple', price: 55000, cost: 16000, stock: 8, category: 'Hebergement', unit: 'nuit', room_type: 'triple' },
    { name: 'Chambre familiale', price: 65000, cost: 20000, stock: 6, category: 'Hebergement', unit: 'nuit', room_type: 'familiale' },
    { name: 'Salle de conference (journee)', price: 100000, cost: 25000, stock: 3, category: 'Evenementiel', unit: 'journee', room_type: 'conference' },
    { name: 'Salle de conference (demi-journee)', price: 60000, cost: 15000, stock: 3, category: 'Evenementiel', unit: 'demi-journee', room_type: 'conference' },
    { name: 'Dejeuner restaurant', price: 8000, cost: 3500, stock: 40, category: 'Restauration', unit: 'personne', room_type: 'restaurant' },
    { name: 'Diner gastronomique', price: 15000, cost: 6000, stock: 30, category: 'Restauration', unit: 'personne', room_type: 'restaurant' },
    { name: 'Service blanchisserie', price: 3000, cost: 1000, stock: 50, category: 'Services', unit: 'prestation' },
    { name: 'Navette aeroport', price: 10000, cost: 4000, stock: 20, category: 'Transport', unit: 'trajet' },
    { name: 'Minibar (consommation)', price: 2000, cost: 800, stock: 100, category: 'Restauration', unit: 'prestation' },
    { name: 'Spa acces (resident)', price: 8000, cost: 2000, stock: 30, category: 'Loisirs', unit: 'entree', duration_minutes: 120 },
    { name: 'Room service petit dejeuner', price: 7000, cost: 2800, stock: 30, category: 'Restauration', unit: 'personne' },
    { name: 'Parking journee', price: 3000, cost: 500, stock: 30, category: 'Services', unit: 'journee' },
  ],

  // ---------------------------------------------------------------------------
  // MODE / FASHION
  // ---------------------------------------------------------------------------
  fashion: [
    { name: 'Robe Ankara (Nigeria)', price: 12000, cost: 6000, stock: 25, category: 'Femme', unit: 'piece', size: 'M', color: 'Multicolore', manufacturer: 'Vlisco' },
    { name: 'Veste en jean (USA)', price: 18000, cost: 9000, stock: 30, category: 'Unisexe', unit: 'piece', size: 'L', color: 'Bleu', manufacturer: 'Levi\'s' },
    { name: 'Foulard en soie (Chine)', price: 8000, cost: 3500, stock: 40, category: 'Accessoires', unit: 'piece', color: 'Rose', manufacturer: 'Hang Zhou Silk' },
    { name: 'Chaussures sport (USA)', price: 25000, cost: 12000, stock: 25, category: 'Chaussures', unit: 'paire', size: '43', color: 'Noir', manufacturer: 'Nike' },
    { name: 'Poncho en alpaga (Perou)', price: 22000, cost: 11000, stock: 15, category: 'Unisexe', unit: 'piece', size: 'Unique', color: 'Beige', manufacturer: 'Artisan peruvien' },
    { name: 'Chemise formelle (Italie)', price: 10000, cost: 5000, stock: 35, category: 'Homme', unit: 'piece', size: 'L', color: 'Blanc', manufacturer: 'Armani' },
    { name: 'Jean slim homme', price: 15000, cost: 7000, stock: 30, category: 'Homme', unit: 'piece', size: '40', color: 'Bleu fonce' },
    { name: 'Robe ete fleurie', price: 9000, cost: 4000, stock: 25, category: 'Femme', unit: 'piece', size: 'S', color: 'Multicolore' },
    { name: 'T-shirt enfant imprime', price: 3000, cost: 1200, stock: 50, category: 'Enfant', unit: 'piece', size: '8 ans', color: 'Bleu' },
    { name: 'Sandales cuir homme', price: 12000, cost: 5500, stock: 20, category: 'Chaussures', unit: 'paire', size: '42', color: 'Marron' },
    { name: 'Sac a main cuir (Italie)', price: 35000, cost: 18000, stock: 10, category: 'Accessoires', unit: 'piece', color: 'Noir', manufacturer: 'Artisan italien' },
    { name: 'Ceinture cuir homme', price: 5000, cost: 2200, stock: 40, category: 'Accessoires', unit: 'piece', size: '95cm', color: 'Noir' },
    { name: 'Pantalon chino femme', price: 8000, cost: 3500, stock: 30, category: 'Femme', unit: 'piece', size: 'M', color: 'Beige' },
    { name: 'Baskets enfant', price: 8000, cost: 3800, stock: 25, category: 'Enfant', unit: 'paire', size: '32', color: 'Blanc' },
    { name: 'Montre bracelet (Suisse)', price: 45000, cost: 25000, stock: 8, category: 'Accessoires', unit: 'piece', color: 'Argent', manufacturer: 'Swatch' },
    { name: 'Costume 2 pieces homme', price: 45000, cost: 22000, stock: 10, category: 'Homme', unit: 'ensemble', size: 'L', color: 'Bleu marine' },
    { name: 'Lunettes de soleil (Italie)', price: 15000, cost: 7000, stock: 20, category: 'Accessoires', unit: 'piece', color: 'Noir', manufacturer: 'Ray-Ban' },
  ],

  // ---------------------------------------------------------------------------
  // ELECTRONIQUE
  // ---------------------------------------------------------------------------
  electronics: [
    { name: 'Smartphone Samsung A15 (Coree du Sud)', price: 120000, cost: 85000, stock: 15, category: 'Telephones', unit: 'piece', manufacturer: 'Samsung' },
    { name: 'Ecouteurs Bluetooth (USA)', price: 15000, cost: 7000, stock: 30, category: 'Accessoires audio', unit: 'piece', manufacturer: 'JBL' },
    { name: 'Tablette Xiaomi (Chine)', price: 85000, cost: 55000, stock: 10, category: 'Tablettes', unit: 'piece', manufacturer: 'Xiaomi' },
    { name: 'Chargeur USB-C universel', price: 5000, cost: 2000, stock: 50, category: 'Accessoires', unit: 'piece', manufacturer: 'Anker (Chine)' },
    { name: 'Television 43 pouces (Japon)', price: 250000, cost: 180000, stock: 5, category: 'TV & Video', unit: 'piece', manufacturer: 'Sony' },
    { name: 'Enceinte portable (Australie)', price: 35000, cost: 18000, stock: 20, category: 'Accessoires audio', unit: 'piece', manufacturer: 'Ultimate Ears' },
    { name: 'Coque telephone universelle', price: 2000, cost: 500, stock: 100, category: 'Accessoires', unit: 'piece' },
    { name: 'Cable HDMI 2m', price: 3000, cost: 1000, stock: 60, category: 'Cables', unit: 'piece' },
    { name: 'Cle USB 64Go', price: 5000, cost: 2500, stock: 40, category: 'Stockage', unit: 'piece', manufacturer: 'SanDisk (USA)' },
    { name: 'Batterie externe 10000mAh', price: 12000, cost: 6000, stock: 25, category: 'Accessoires', unit: 'piece', manufacturer: 'Anker (Chine)' },
    { name: 'Souris sans fil', price: 8000, cost: 3500, stock: 30, category: 'Peripheriques', unit: 'piece', manufacturer: 'Logitech (Suisse)' },
    { name: 'Clavier Bluetooth', price: 12000, cost: 5500, stock: 20, category: 'Peripheriques', unit: 'piece', manufacturer: 'Logitech (Suisse)' },
    { name: 'Imprimante jet d\'encre', price: 45000, cost: 28000, stock: 8, category: 'Imprimantes', unit: 'piece', manufacturer: 'HP (USA)' },
    { name: 'Ventilateur USB bureau', price: 4000, cost: 1800, stock: 35, category: 'Maison', unit: 'piece' },
    { name: 'Lampe LED rechargeable', price: 6000, cost: 2800, stock: 30, category: 'Maison', unit: 'piece' },
    { name: 'Webcam HD 1080p', price: 18000, cost: 9000, stock: 15, category: 'Peripheriques', unit: 'piece', manufacturer: 'Logitech (Suisse)' },
    { name: 'Carte memoire 128Go', price: 8000, cost: 4000, stock: 30, category: 'Stockage', unit: 'piece', manufacturer: 'Samsung' },
    { name: 'Multiprise parafoudre 6 prises', price: 5000, cost: 2200, stock: 40, category: 'Accessoires', unit: 'piece' },
  ],

  // ---------------------------------------------------------------------------
  // SALON DE COIFFURE
  // ---------------------------------------------------------------------------
  hair_salon: [
    { name: 'Coupe homme classique', price: 2000, cost: 500, stock: 50, category: 'Coupes', unit: 'prestation', duration_minutes: 30 },
    { name: 'Coupe femme stylisee', price: 3500, cost: 800, stock: 50, category: 'Coupes', unit: 'prestation', duration_minutes: 45 },
    { name: 'Tresses africaines (Ghana braids)', price: 8000, cost: 2000, stock: 20, category: 'Coiffures', unit: 'prestation', duration_minutes: 120 },
    { name: 'Lissage bresilien', price: 15000, cost: 6000, stock: 15, category: 'Soins', unit: 'prestation', duration_minutes: 120 },
    { name: 'Coloration balayage', price: 10000, cost: 4000, stock: 15, category: 'Soins', unit: 'prestation', duration_minutes: 90 },
    { name: 'Soin keratine (Japon)', price: 12000, cost: 5000, stock: 20, category: 'Soins', unit: 'prestation', duration_minutes: 60 },
    { name: 'Coupe enfant', price: 1500, cost: 400, stock: 50, category: 'Coupes', unit: 'prestation', duration_minutes: 20 },
    { name: 'Barbe taille et rasage', price: 1500, cost: 300, stock: 50, category: 'Coupes', unit: 'prestation', duration_minutes: 20 },
    { name: 'Coloration complete', price: 8000, cost: 3000, stock: 20, category: 'Colorations', unit: 'prestation', duration_minutes: 75 },
    { name: 'Meches et reflets', price: 12000, cost: 5000, stock: 15, category: 'Colorations', unit: 'prestation', duration_minutes: 90 },
    { name: 'Tissage complet', price: 20000, cost: 8000, stock: 10, category: 'Coiffures', unit: 'prestation', duration_minutes: 150 },
    { name: 'Defrisage', price: 6000, cost: 2500, stock: 20, category: 'Soins', unit: 'prestation', duration_minutes: 60 },
    { name: 'Shampooing + brushing', price: 3000, cost: 800, stock: 40, category: 'Soins', unit: 'prestation', duration_minutes: 40 },
    { name: 'Masque capillaire profond', price: 5000, cost: 1800, stock: 25, category: 'Soins', unit: 'prestation', duration_minutes: 30 },
    { name: 'Shampoing professionnel (vente)', price: 4500, cost: 2200, stock: 30, category: 'Produits', unit: 'flacon' },
    { name: 'Huile capillaire argan (Maroc)', price: 3500, cost: 1500, stock: 25, category: 'Produits', unit: 'flacon' },
    { name: 'Permanente', price: 10000, cost: 4000, stock: 15, category: 'Soins', unit: 'prestation', duration_minutes: 120 },
  ],

  // ---------------------------------------------------------------------------
  // SPA
  // ---------------------------------------------------------------------------
  spa: [
    { name: 'Massage thai (Thailande)', price: 18000, cost: 5000, stock: 20, category: 'Massages', unit: 'seance', duration_minutes: 60 },
    { name: 'Hammam traditionnel (Maroc)', price: 12000, cost: 3500, stock: 15, category: 'Soins corps', unit: 'seance', duration_minutes: 60 },
    { name: 'Soin visage a l\'aloe vera (Mexique)', price: 10000, cost: 3000, stock: 20, category: 'Soins visage', unit: 'seance', duration_minutes: 45 },
    { name: 'Manucure japonaise', price: 6000, cost: 1800, stock: 30, category: 'Beaute', unit: 'prestation', duration_minutes: 30 },
    { name: 'Massage aux pierres chaudes (USA)', price: 20000, cost: 6000, stock: 15, category: 'Massages', unit: 'seance', duration_minutes: 75 },
    { name: 'Gommage au cafe (Bresil)', price: 10000, cost: 3000, stock: 15, category: 'Soins corps', unit: 'seance', duration_minutes: 50 },
    { name: 'Massage suedois', price: 15000, cost: 4500, stock: 20, category: 'Massages', unit: 'seance', duration_minutes: 60 },
    { name: 'Soin anti-age visage', price: 18000, cost: 6000, stock: 15, category: 'Soins visage', unit: 'seance', duration_minutes: 60 },
    { name: 'Enveloppement algues marines', price: 14000, cost: 4500, stock: 15, category: 'Soins corps', unit: 'seance', duration_minutes: 45 },
    { name: 'Pedicure complete', price: 7000, cost: 2000, stock: 25, category: 'Beaute', unit: 'prestation', duration_minutes: 45 },
    { name: 'Forfait detente demi-journee', price: 35000, cost: 12000, stock: 10, category: 'Forfaits', unit: 'forfait', duration_minutes: 240 },
    { name: 'Massage en duo', price: 30000, cost: 9000, stock: 10, category: 'Massages', unit: 'seance', duration_minutes: 60 },
    { name: 'Epilation cire jambes completes', price: 8000, cost: 2500, stock: 20, category: 'Beaute', unit: 'prestation', duration_minutes: 30 },
    { name: 'Bain aromatique aux huiles', price: 10000, cost: 3000, stock: 15, category: 'Soins corps', unit: 'seance', duration_minutes: 30 },
    { name: 'Reflexologie plantaire (Chine)', price: 12000, cost: 3500, stock: 20, category: 'Massages', unit: 'seance', duration_minutes: 45 },
    { name: 'Huile essentielle lavande (vente)', price: 5000, cost: 2500, stock: 25, category: 'Produits', unit: 'flacon' },
    { name: 'Forfait mariee complet', price: 50000, cost: 18000, stock: 5, category: 'Forfaits', unit: 'forfait', duration_minutes: 300 },
  ],

  // ---------------------------------------------------------------------------
  // SALLE DE SPORT / GYM
  // ---------------------------------------------------------------------------
  gym: [
    { name: 'Abonnement mensuel', price: 25000, cost: 5000, stock: 100, category: 'Abonnements', unit: 'mois', duration_minutes: 0 },
    { name: 'Seance coaching personnel', price: 10000, cost: 3000, stock: 30, category: 'Coaching', unit: 'seance', duration_minutes: 60 },
    { name: 'Cours de yoga (Inde)', price: 3500, cost: 900, stock: 40, category: 'Cours', unit: 'seance', duration_minutes: 60 },
    { name: 'Cours de capoeira (Bresil)', price: 4000, cost: 1000, stock: 30, category: 'Cours', unit: 'seance', duration_minutes: 45 },
    { name: 'Acces piscine', price: 5000, cost: 1000, stock: 40, category: 'Acces', unit: 'entree', duration_minutes: 120 },
    { name: 'Abonnement trimestriel', price: 60000, cost: 12000, stock: 50, category: 'Abonnements', unit: 'trimestre', duration_minutes: 0 },
    { name: 'Abonnement annuel', price: 200000, cost: 40000, stock: 30, category: 'Abonnements', unit: 'annee', duration_minutes: 0 },
    { name: 'Cours de boxe', price: 4000, cost: 1200, stock: 25, category: 'Cours', unit: 'seance', duration_minutes: 60 },
    { name: 'Cours de pilates', price: 3500, cost: 900, stock: 30, category: 'Cours', unit: 'seance', duration_minutes: 50 },
    { name: 'Cours de spinning', price: 3000, cost: 800, stock: 30, category: 'Cours', unit: 'seance', duration_minutes: 45 },
    { name: 'Bilan corporel complet', price: 8000, cost: 2000, stock: 20, category: 'Coaching', unit: 'seance', duration_minutes: 45 },
    { name: 'Programme nutrition personnalise', price: 15000, cost: 4000, stock: 15, category: 'Coaching', unit: 'programme', duration_minutes: 60 },
    { name: 'Proteines Whey 1kg', price: 18000, cost: 10000, stock: 25, category: 'Supplements', unit: 'pot', weight_kg: 1 },
    { name: 'T-shirt sport (marque gym)', price: 8000, cost: 3500, stock: 30, category: 'Boutique', unit: 'piece' },
    { name: 'Bouteille eau sport 750ml', price: 3000, cost: 1200, stock: 40, category: 'Boutique', unit: 'piece' },
    { name: 'Ticket entree journaliere', price: 5000, cost: 1000, stock: 50, category: 'Acces', unit: 'entree', duration_minutes: 0 },
    { name: 'Casier mensuel', price: 5000, cost: 1000, stock: 30, category: 'Services', unit: 'mois' },
  ],

  // ---------------------------------------------------------------------------
  // PISCINE / POOL
  // ---------------------------------------------------------------------------
  pool: [
    { name: 'Entree adulte', price: 3000, cost: 500, stock: 100, category: 'Entrees', unit: 'entree', duration_minutes: 180 },
    { name: 'Entree enfant', price: 1500, cost: 300, stock: 100, category: 'Entrees', unit: 'entree', duration_minutes: 180 },
    { name: 'Cours de natation', price: 7000, cost: 2000, stock: 20, category: 'Cours', unit: 'seance', duration_minutes: 45 },
    { name: 'Location maillot', price: 2000, cost: 500, stock: 20, category: 'Location', unit: 'piece', duration_minutes: 180 },
    { name: 'Boisson fraiche', price: 1000, cost: 400, stock: 50, category: 'Boissons', unit: 'bouteille', duration_minutes: 0 },
    { name: 'Abonnement mensuel adulte', price: 20000, cost: 5000, stock: 50, category: 'Abonnements', unit: 'mois' },
    { name: 'Abonnement mensuel enfant', price: 12000, cost: 3000, stock: 50, category: 'Abonnements', unit: 'mois' },
    { name: 'Cours aquagym', price: 5000, cost: 1500, stock: 25, category: 'Cours', unit: 'seance', duration_minutes: 45 },
    { name: 'Cours bebe nageur', price: 6000, cost: 1800, stock: 15, category: 'Cours', unit: 'seance', duration_minutes: 30, age_group: '6-36 mois' },
    { name: 'Location serviette', price: 500, cost: 100, stock: 50, category: 'Location', unit: 'piece' },
    { name: 'Location bonnet de bain', price: 300, cost: 80, stock: 60, category: 'Location', unit: 'piece' },
    { name: 'Location lunettes de natation', price: 500, cost: 150, stock: 30, category: 'Location', unit: 'piece' },
    { name: 'Fete d\'anniversaire (10 enfants)', price: 50000, cost: 20000, stock: 5, category: 'Evenements', unit: 'forfait', duration_minutes: 180 },
    { name: 'Location ligne d\'eau privee', price: 10000, cost: 2000, stock: 6, category: 'Location', unit: 'heure', duration_minutes: 60 },
    { name: 'Snack sandwich', price: 1500, cost: 600, stock: 40, category: 'Restauration', unit: 'piece' },
    { name: 'Glace (2 boules)', price: 1000, cost: 400, stock: 50, category: 'Restauration', unit: 'portion' },
  ],

  // ---------------------------------------------------------------------------
  // LAVAGE AUTO / CAR WASH
  // ---------------------------------------------------------------------------
  car_wash: [
    { name: 'Lavage simple exterieur', price: 2000, cost: 500, stock: 50, category: 'Lavage', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 20 },
    { name: 'Lavage complet', price: 5000, cost: 1200, stock: 50, category: 'Lavage', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 45 },
    { name: 'Lavage interieur', price: 3000, cost: 800, stock: 50, category: 'Lavage', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 30 },
    { name: 'Polissage carrosserie', price: 15000, cost: 5000, stock: 20, category: 'Soins', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 90 },
    { name: 'Lavage moto', price: 1000, cost: 300, stock: 50, category: 'Lavage', unit: 'prestation', vehicle_type: 'moto', duration_minutes: 15 },
    { name: 'Nettoyage moteur', price: 8000, cost: 2500, stock: 30, category: 'Soins', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 40 },
    { name: 'Lavage SUV / 4x4 complet', price: 7000, cost: 1800, stock: 30, category: 'Lavage', unit: 'prestation', vehicle_type: '4x4', duration_minutes: 60 },
    { name: 'Traitement cuir sieges', price: 10000, cost: 3500, stock: 15, category: 'Soins', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 60 },
    { name: 'Desodorisation habitacle', price: 5000, cost: 1500, stock: 25, category: 'Soins', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 30 },
    { name: 'Nettoyage tapis et moquettes', price: 4000, cost: 1200, stock: 30, category: 'Lavage', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 35 },
    { name: 'Forfait mensuel illimite', price: 25000, cost: 8000, stock: 20, category: 'Abonnements', unit: 'mois', vehicle_type: 'voiture' },
    { name: 'Lavage bus / minibus', price: 15000, cost: 5000, stock: 10, category: 'Lavage', unit: 'prestation', vehicle_type: 'bus', duration_minutes: 90 },
    { name: 'Protection cire carrosserie', price: 12000, cost: 4000, stock: 15, category: 'Soins', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 60 },
    { name: 'Nettoyage jantes et pneus', price: 3000, cost: 800, stock: 40, category: 'Lavage', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 20 },
    { name: 'Renovation phares', price: 8000, cost: 2500, stock: 20, category: 'Soins', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 45 },
    { name: 'Desinfection complete vehicule', price: 6000, cost: 2000, stock: 25, category: 'Soins', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 30 },
  ],

  // ---------------------------------------------------------------------------
  // STATION SERVICE / GAS STATION
  // ---------------------------------------------------------------------------
  gas_station: [
    { name: 'Super sans plomb (litre)', price: 730, cost: 680, stock: 5000, category: 'Carburants', unit: 'litre', vehicle_type: 'voiture' },
    { name: 'Gasoil (litre)', price: 720, cost: 670, stock: 5000, category: 'Carburants', unit: 'litre', vehicle_type: 'voiture' },
    { name: 'Huile moteur Castrol 1L (UK)', price: 5000, cost: 3000, stock: 50, category: 'Lubrifiants', unit: 'bouteille', vehicle_type: 'voiture' },
    { name: 'Lave-glace 2L', price: 2500, cost: 1200, stock: 30, category: 'Entretien', unit: 'bidon', vehicle_type: 'voiture' },
    { name: 'Gonflage pneus', price: 500, cost: 100, stock: 100, category: 'Services', unit: 'prestation', vehicle_type: 'voiture' },
    { name: 'Petrole lampant (litre)', price: 600, cost: 500, stock: 2000, category: 'Carburants', unit: 'litre' },
    { name: 'Gaz domestique 12.5kg', price: 6500, cost: 5000, stock: 50, category: 'Gaz', unit: 'bouteille', weight_kg: 12.5 },
    { name: 'Gaz domestique 6kg', price: 3500, cost: 2700, stock: 60, category: 'Gaz', unit: 'bouteille', weight_kg: 6 },
    { name: 'Huile moteur synthetique 5W-40 4L', price: 18000, cost: 12000, stock: 20, category: 'Lubrifiants', unit: 'bidon', manufacturer: 'Total (France)' },
    { name: 'Eau minerale 1.5L', price: 500, cost: 250, stock: 200, category: 'Boissons', unit: 'bouteille' },
    { name: 'Biscuits divers', price: 300, cost: 150, stock: 150, category: 'Snacks', unit: 'paquet' },
    { name: 'Liquide de refroidissement 1L', price: 3500, cost: 2000, stock: 25, category: 'Entretien', unit: 'bouteille' },
    { name: 'Desodorisant voiture', price: 1500, cost: 600, stock: 40, category: 'Accessoires', unit: 'piece' },
    { name: 'Chargeur telephone voiture', price: 3000, cost: 1200, stock: 30, category: 'Accessoires', unit: 'piece' },
    { name: 'Sandwichs frais', price: 1200, cost: 500, stock: 30, category: 'Snacks', unit: 'piece', expiry_date: '2026-03-05' },
    { name: 'Cafe a emporter', price: 500, cost: 150, stock: 100, category: 'Boissons', unit: 'tasse' },
  ],

  // ---------------------------------------------------------------------------
  // BLANCHISSERIE / LAUNDRY
  // ---------------------------------------------------------------------------
  laundry: [
    { name: 'Lavage 5kg', price: 2500, cost: 800, stock: 50, category: 'Lavage', unit: 'charge', duration_minutes: 60 },
    { name: 'Lavage 10kg', price: 4000, cost: 1200, stock: 50, category: 'Lavage', unit: 'charge', duration_minutes: 90 },
    { name: 'Repassage chemise', price: 500, cost: 150, stock: 100, category: 'Repassage', unit: 'piece', duration_minutes: 10 },
    { name: 'Nettoyage costume complet', price: 3500, cost: 1200, stock: 30, category: 'Nettoyage a sec', unit: 'piece', duration_minutes: 120 },
    { name: 'Nettoyage robe', price: 2500, cost: 800, stock: 30, category: 'Nettoyage a sec', unit: 'piece', duration_minutes: 120 },
    { name: 'Repassage pantalon', price: 400, cost: 120, stock: 100, category: 'Repassage', unit: 'piece', duration_minutes: 8 },
    { name: 'Nettoyage manteau / veste', price: 3000, cost: 1000, stock: 30, category: 'Nettoyage a sec', unit: 'piece', duration_minutes: 120 },
    { name: 'Lavage rideaux (paire)', price: 4000, cost: 1500, stock: 20, category: 'Lavage', unit: 'paire', duration_minutes: 120 },
    { name: 'Lavage couette', price: 5000, cost: 1800, stock: 15, category: 'Lavage', unit: 'piece', duration_minutes: 120 },
    { name: 'Repassage drap housse', price: 600, cost: 200, stock: 40, category: 'Repassage', unit: 'piece', duration_minutes: 15 },
    { name: 'Nettoyage cravate', price: 800, cost: 300, stock: 30, category: 'Nettoyage a sec', unit: 'piece', duration_minutes: 60 },
    { name: 'Service express (+50%)', price: 1500, cost: 500, stock: 50, category: 'Services', unit: 'supplement', duration_minutes: 0 },
    { name: 'Lavage nappe grande', price: 2000, cost: 700, stock: 25, category: 'Lavage', unit: 'piece', duration_minutes: 60 },
    { name: 'Detachage special', price: 2000, cost: 800, stock: 30, category: 'Services', unit: 'prestation', duration_minutes: 30 },
    { name: 'Nettoyage robe de mariee', price: 15000, cost: 5000, stock: 5, category: 'Nettoyage a sec', unit: 'piece', duration_minutes: 240 },
    { name: 'Livraison a domicile', price: 1000, cost: 500, stock: 50, category: 'Services', unit: 'trajet' },
  ],

  // ---------------------------------------------------------------------------
  // REPARATION AUTO / AUTO REPAIR
  // ---------------------------------------------------------------------------
  auto_repair: [
    { name: 'Vidange moteur', price: 15000, cost: 6000, stock: 30, category: 'Entretien', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 45 },
    { name: 'Pneus Michelin (France) x4', price: 80000, cost: 55000, stock: 10, category: 'Pneus', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 60 },
    { name: 'Diagnostic electronique', price: 10000, cost: 2000, stock: 50, category: 'Diagnostic', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 30 },
    { name: 'Plaquettes freins Bosch (Allemagne)', price: 25000, cost: 12000, stock: 15, category: 'Freinage', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 90 },
    { name: 'Batterie Varta (Allemagne)', price: 45000, cost: 30000, stock: 10, category: 'Electricite', unit: 'piece', vehicle_type: 'voiture', duration_minutes: 20 },
    { name: 'Revision complete (30000 km)', price: 50000, cost: 20000, stock: 20, category: 'Entretien', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 180 },
    { name: 'Remplacement courroie distribution', price: 75000, cost: 35000, stock: 10, category: 'Entretien', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 240 },
    { name: 'Changement amortisseurs (x2)', price: 40000, cost: 22000, stock: 10, category: 'Suspension', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 120 },
    { name: 'Remplacement embrayage', price: 80000, cost: 45000, stock: 5, category: 'Transmission', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 300 },
    { name: 'Recharge climatisation', price: 20000, cost: 8000, stock: 20, category: 'Climatisation', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 45 },
    { name: 'Equilibrage 4 roues', price: 8000, cost: 2000, stock: 30, category: 'Pneus', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 30 },
    { name: 'Geometrie / Parallelisme', price: 12000, cost: 3000, stock: 20, category: 'Pneus', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 45 },
    { name: 'Remplacement pare-brise', price: 60000, cost: 35000, stock: 8, category: 'Carrosserie', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 120 },
    { name: 'Changement bougies (x4)', price: 12000, cost: 5000, stock: 20, category: 'Electricite', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 30 },
    { name: 'Controle technique', price: 25000, cost: 8000, stock: 30, category: 'Diagnostic', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 60 },
    { name: 'Depannage sur route', price: 20000, cost: 8000, stock: 10, category: 'Services', unit: 'prestation', vehicle_type: 'voiture', duration_minutes: 60 },
  ],

  // ---------------------------------------------------------------------------
  // GARDERIE / DAYCARE
  // ---------------------------------------------------------------------------
  daycare: [
    { name: 'Garde journee complete', price: 5000, cost: 2000, stock: 30, category: 'Garde', unit: 'journee', age_group: '1-3 ans' },
    { name: 'Garde demi-journee', price: 3000, cost: 1200, stock: 30, category: 'Garde', unit: 'demi-journee', age_group: '1-3 ans' },
    { name: 'Repas enfant', price: 1500, cost: 700, stock: 50, category: 'Restauration', unit: 'repas', age_group: '1-5 ans' },
    { name: 'Activites d\'eveil', price: 2000, cost: 500, stock: 30, category: 'Activites', unit: 'seance', age_group: '2-5 ans' },
    { name: 'Pack couches (10)', price: 3000, cost: 1800, stock: 40, category: 'Fournitures', unit: 'pack', age_group: '0-2 ans' },
    { name: 'Inscription mensuelle', price: 50000, cost: 20000, stock: 30, category: 'Inscription', unit: 'mois', age_group: '1-5 ans' },
    { name: 'Inscription trimestrielle', price: 130000, cost: 55000, stock: 20, category: 'Inscription', unit: 'trimestre', age_group: '1-5 ans' },
    { name: 'Gouter apres-midi', price: 500, cost: 200, stock: 50, category: 'Restauration', unit: 'gouter', age_group: '1-5 ans' },
    { name: 'Atelier peinture / arts', price: 1500, cost: 400, stock: 25, category: 'Activites', unit: 'seance', age_group: '3-5 ans' },
    { name: 'Atelier musique', price: 2000, cost: 600, stock: 20, category: 'Activites', unit: 'seance', age_group: '2-5 ans' },
    { name: 'Sortie educative', price: 5000, cost: 2500, stock: 15, category: 'Sorties', unit: 'sortie', age_group: '3-5 ans' },
    { name: 'Garde supplementaire (heure)', price: 1000, cost: 400, stock: 50, category: 'Garde', unit: 'heure', age_group: '1-5 ans' },
    { name: 'Kit linge de rechange', price: 3000, cost: 1500, stock: 20, category: 'Fournitures', unit: 'kit', age_group: '1-3 ans' },
    { name: 'Assurance annuelle', price: 10000, cost: 6000, stock: 30, category: 'Services', unit: 'annee', age_group: '0-5 ans' },
    { name: 'Photo de classe', price: 2000, cost: 800, stock: 30, category: 'Services', unit: 'photo', age_group: '1-5 ans' },
    { name: 'Fete de fin d\'annee (participation)', price: 3000, cost: 1500, stock: 30, category: 'Evenements', unit: 'enfant', age_group: '1-5 ans' },
  ],

  // ---------------------------------------------------------------------------
  // ECOLE / SCHOOL
  // ---------------------------------------------------------------------------
  school: [
    { name: 'Inscription annuelle', price: 150000, cost: 50000, stock: 100, category: 'Inscription', unit: 'annee', age_group: '6-12 ans' },
    { name: 'Kit fournitures scolaires', price: 25000, cost: 15000, stock: 80, category: 'Fournitures', unit: 'kit', age_group: '6-12 ans' },
    { name: 'Uniforme complet', price: 15000, cost: 8000, stock: 60, category: 'Uniforme', unit: 'ensemble', age_group: '6-12 ans' },
    { name: 'Cantine mensuelle', price: 20000, cost: 12000, stock: 100, category: 'Restauration', unit: 'mois', age_group: '6-12 ans' },
    { name: 'Transport scolaire mensuel', price: 15000, cost: 8000, stock: 50, category: 'Transport', unit: 'mois', age_group: '6-12 ans' },
    { name: 'Inscription trimestrielle', price: 50000, cost: 18000, stock: 100, category: 'Inscription', unit: 'trimestre', age_group: '6-12 ans' },
    { name: 'Tenue de sport', price: 8000, cost: 4000, stock: 60, category: 'Uniforme', unit: 'ensemble', age_group: '6-12 ans' },
    { name: 'Manuel de mathematiques', price: 5000, cost: 3000, stock: 80, category: 'Manuels', unit: 'exemplaire', age_group: '6-12 ans' },
    { name: 'Manuel de francais', price: 5000, cost: 3000, stock: 80, category: 'Manuels', unit: 'exemplaire', age_group: '6-12 ans' },
    { name: 'Cours de soutien (heure)', price: 5000, cost: 2000, stock: 30, category: 'Soutien', unit: 'heure', age_group: '6-18 ans' },
    { name: 'Activite sportive extra-scolaire', price: 10000, cost: 4000, stock: 40, category: 'Activites', unit: 'mois', age_group: '6-18 ans' },
    { name: 'Atelier informatique', price: 8000, cost: 3000, stock: 30, category: 'Activites', unit: 'mois', age_group: '10-18 ans' },
    { name: 'Excursion scolaire', price: 10000, cost: 5000, stock: 50, category: 'Sorties', unit: 'sortie', age_group: '6-18 ans' },
    { name: 'Photo de classe', price: 3000, cost: 1000, stock: 100, category: 'Services', unit: 'photo', age_group: '6-18 ans' },
    { name: 'Assurance scolaire annuelle', price: 5000, cost: 3000, stock: 100, category: 'Services', unit: 'annee', age_group: '6-18 ans' },
    { name: 'Certificat de scolarite', price: 1000, cost: 200, stock: 100, category: 'Services', unit: 'document', age_group: '6-18 ans' },
  ],

  // ---------------------------------------------------------------------------
  // MENAGE A DOMICILE / HOME CLEANING
  // ---------------------------------------------------------------------------
  home_cleaning: [
    { name: 'Menage 2 heures', price: 5000, cost: 2000, stock: 50, category: 'Menage', unit: 'prestation', duration_minutes: 120 },
    { name: 'Menage 4 heures', price: 8000, cost: 3500, stock: 50, category: 'Menage', unit: 'prestation', duration_minutes: 240 },
    { name: 'Grand menage complet', price: 20000, cost: 8000, stock: 20, category: 'Menage', unit: 'prestation', duration_minutes: 480 },
    { name: 'Repassage (panier)', price: 3000, cost: 1000, stock: 40, category: 'Repassage', unit: 'panier', duration_minutes: 60 },
    { name: 'Lavage vitres', price: 4000, cost: 1500, stock: 30, category: 'Nettoyage', unit: 'prestation', duration_minutes: 90 },
    { name: 'Nettoyage cuisine en profondeur', price: 8000, cost: 3000, stock: 25, category: 'Nettoyage', unit: 'prestation', duration_minutes: 120 },
    { name: 'Nettoyage salle de bain', price: 5000, cost: 2000, stock: 30, category: 'Nettoyage', unit: 'prestation', duration_minutes: 60 },
    { name: 'Nettoyage moquette / tapis', price: 6000, cost: 2500, stock: 20, category: 'Nettoyage', unit: 'prestation', duration_minutes: 90 },
    { name: 'Desinfection complete', price: 15000, cost: 6000, stock: 15, category: 'Desinfection', unit: 'prestation', duration_minutes: 180 },
    { name: 'Nettoyage apres travaux', price: 25000, cost: 10000, stock: 10, category: 'Nettoyage', unit: 'prestation', duration_minutes: 480 },
    { name: 'Menage regulier (abonnement semaine)', price: 15000, cost: 6000, stock: 20, category: 'Abonnements', unit: 'semaine', duration_minutes: 120 },
    { name: 'Nettoyage canape / meubles rembourres', price: 8000, cost: 3000, stock: 15, category: 'Nettoyage', unit: 'prestation', duration_minutes: 90 },
    { name: 'Nettoyage terrasse / balcon', price: 5000, cost: 2000, stock: 25, category: 'Nettoyage', unit: 'prestation', duration_minutes: 60 },
    { name: 'Nettoyage demenagement (entrant)', price: 18000, cost: 7000, stock: 10, category: 'Nettoyage', unit: 'prestation', duration_minutes: 360 },
    { name: 'Nettoyage demenagement (sortant)', price: 18000, cost: 7000, stock: 10, category: 'Nettoyage', unit: 'prestation', duration_minutes: 360 },
    { name: 'Nettoyage matelas', price: 5000, cost: 1800, stock: 20, category: 'Desinfection', unit: 'prestation', duration_minutes: 45 },
  ],

  // ---------------------------------------------------------------------------
  // FLEURISTE / FLORIST
  // ---------------------------------------------------------------------------
  florist: [
    { name: 'Roses rouges (Kenya)', price: 1500, cost: 500, stock: 100, category: 'Fleurs', unit: 'tige', color: 'Rouge' },
    { name: 'Tulipes (Pays-Bas)', price: 2000, cost: 800, stock: 60, category: 'Fleurs', unit: 'tige', color: 'Jaune' },
    { name: 'Orchidee Phalaenopsis (Thailande)', price: 25000, cost: 12000, stock: 10, category: 'Plantes', unit: 'pot', color: 'Blanc' },
    { name: 'Bouquet de proteas (Afrique du Sud)', price: 18000, cost: 8000, stock: 15, category: 'Bouquets', unit: 'bouquet', color: 'Rose' },
    { name: 'Decoration evenement', price: 100000, cost: 40000, stock: 5, category: 'Evenementiel', unit: 'prestation', color: 'Sur mesure' },
    { name: 'Bouquet du jour (mixte)', price: 8000, cost: 3000, stock: 20, category: 'Bouquets', unit: 'bouquet', color: 'Multicolore' },
    { name: 'Lys blancs', price: 2500, cost: 1000, stock: 40, category: 'Fleurs', unit: 'tige', color: 'Blanc' },
    { name: 'Tournesols', price: 1500, cost: 600, stock: 50, category: 'Fleurs', unit: 'tige', color: 'Jaune' },
    { name: 'Bouquet mariage classique', price: 35000, cost: 15000, stock: 5, category: 'Mariage', unit: 'bouquet', color: 'Blanc' },
    { name: 'Boutonniere mariage', price: 5000, cost: 2000, stock: 15, category: 'Mariage', unit: 'piece', color: 'Blanc' },
    { name: 'Couronne funeraire', price: 40000, cost: 18000, stock: 5, category: 'Deuil', unit: 'piece', color: 'Blanc' },
    { name: 'Gerbe funeraire', price: 25000, cost: 10000, stock: 8, category: 'Deuil', unit: 'piece', color: 'Blanc' },
    { name: 'Plante verte d\'interieur (Ficus)', price: 12000, cost: 5000, stock: 15, category: 'Plantes', unit: 'pot', color: 'Vert' },
    { name: 'Cactus decoratif', price: 4000, cost: 1500, stock: 25, category: 'Plantes', unit: 'pot', color: 'Vert' },
    { name: 'Composition florale table', price: 15000, cost: 6000, stock: 10, category: 'Compositions', unit: 'piece', color: 'Sur mesure' },
    { name: 'Livraison bouquet', price: 2000, cost: 800, stock: 50, category: 'Services', unit: 'livraison' },
  ],

  // ---------------------------------------------------------------------------
  // ANIMALERIE / PET SHOP
  // ---------------------------------------------------------------------------
  pet_shop: [
    { name: 'Croquettes chien Royal Canin (France)', price: 15000, cost: 9000, stock: 30, category: 'Alimentation chien', unit: 'sac', weight_kg: 5 },
    { name: 'Croquettes chat Whiskas (USA)', price: 8000, cost: 5000, stock: 30, category: 'Alimentation chat', unit: 'sac', weight_kg: 2 },
    { name: 'Litiere chat 5L', price: 5000, cost: 2500, stock: 25, category: 'Hygiene', unit: 'sac', weight_kg: 3 },
    { name: 'Jouet pour chien (Australie)', price: 3500, cost: 1500, stock: 25, category: 'Accessoires', unit: 'piece', weight_kg: 0.2 },
    { name: 'Shampoing animal 250ml', price: 4000, cost: 2000, stock: 20, category: 'Hygiene', unit: 'flacon', weight_kg: 0.3 },
    { name: 'Laisse et collier chien', price: 5000, cost: 2200, stock: 25, category: 'Accessoires', unit: 'ensemble' },
    { name: 'Panier pour chien (taille M)', price: 12000, cost: 6000, stock: 10, category: 'Accessoires', unit: 'piece' },
    { name: 'Nourriture poisson (flocons)', price: 2000, cost: 900, stock: 30, category: 'Alimentation poisson', unit: 'boite', weight_kg: 0.05 },
    { name: 'Toilettage chien complet', price: 8000, cost: 3000, stock: 20, category: 'Toilettage', unit: 'prestation', duration_minutes: 60 },
    { name: 'Toilettage chat', price: 6000, cost: 2200, stock: 15, category: 'Toilettage', unit: 'prestation', duration_minutes: 45 },
    { name: 'Anti-puces et tiques (pipette)', price: 5000, cost: 2500, stock: 40, category: 'Sante', unit: 'pipette' },
    { name: 'Vermifuge chien', price: 3000, cost: 1500, stock: 35, category: 'Sante', unit: 'comprime' },
    { name: 'Arbre a chat', price: 20000, cost: 10000, stock: 8, category: 'Accessoires', unit: 'piece' },
    { name: 'Aquarium 60L complet', price: 35000, cost: 18000, stock: 5, category: 'Aquariophilie', unit: 'piece' },
    { name: 'Cage oiseau (moyenne)', price: 15000, cost: 7000, stock: 8, category: 'Accessoires', unit: 'piece' },
    { name: 'Graines pour oiseaux 1kg', price: 2500, cost: 1200, stock: 25, category: 'Alimentation oiseau', unit: 'sac', weight_kg: 1 },
    { name: 'Os a macher (lot de 5)', price: 2000, cost: 800, stock: 30, category: 'Friandises', unit: 'lot' },
  ],

  // ---------------------------------------------------------------------------
  // LIBRAIRIE / BOOKSTORE
  // ---------------------------------------------------------------------------
  bookstore: [
    { name: 'Le Petit Prince (France)', price: 5000, cost: 2800, stock: 30, category: 'Romans', unit: 'exemplaire', author: 'Antoine de Saint-Exupery', isbn: '978-2-07-061275-8' },
    { name: 'Cent ans de solitude (Colombie)', price: 8000, cost: 4500, stock: 20, category: 'Romans', unit: 'exemplaire', author: 'Gabriel Garcia Marquez', isbn: '978-2-02-023818-0' },
    { name: 'L\'Art de la guerre (Chine)', price: 6000, cost: 3000, stock: 25, category: 'Essais', unit: 'exemplaire', author: 'Sun Tzu', isbn: '978-2-08-070753-7' },
    { name: 'Manuel scolaire CM2', price: 5000, cost: 3000, stock: 50, category: 'Scolaire', unit: 'exemplaire', author: 'Editions EDICEF', isbn: '978-2-84-129456-7' },
    { name: 'Cahier 200 pages', price: 1000, cost: 500, stock: 200, category: 'Papeterie', unit: 'piece' },
    { name: 'Dictionnaire Larousse (France)', price: 12000, cost: 7000, stock: 15, category: 'References', unit: 'exemplaire', author: 'Larousse', isbn: '978-2-03-590120-0' },
    { name: 'Stylo bille (lot de 10)', price: 1500, cost: 600, stock: 100, category: 'Papeterie', unit: 'lot' },
    { name: 'Agenda 2026-2027', price: 3000, cost: 1500, stock: 40, category: 'Papeterie', unit: 'piece' },
    { name: 'Bande dessinee Tintin', price: 6000, cost: 3200, stock: 25, category: 'BD & Mangas', unit: 'exemplaire', author: 'Herge' },
    { name: 'Manga One Piece (tome)', price: 4000, cost: 2000, stock: 30, category: 'BD & Mangas', unit: 'exemplaire', author: 'Eiichiro Oda' },
    { name: 'Livre de cuisine africaine', price: 8000, cost: 4000, stock: 15, category: 'Pratique', unit: 'exemplaire' },
    { name: 'Atlas du monde', price: 15000, cost: 8000, stock: 10, category: 'References', unit: 'exemplaire' },
    { name: 'Carte cadeau librairie', price: 10000, cost: 10000, stock: 30, category: 'Cartes cadeaux', unit: 'carte' },
    { name: 'Calculatrice scientifique', price: 8000, cost: 4500, stock: 25, category: 'Papeterie', unit: 'piece', manufacturer: 'Casio (Japon)' },
    { name: 'Globe terrestre decoratif', price: 12000, cost: 6000, stock: 8, category: 'Cadeaux', unit: 'piece' },
    { name: 'Magazine mensuel (dernier numero)', price: 2000, cost: 1200, stock: 30, category: 'Magazines', unit: 'exemplaire' },
    { name: 'Trousse scolaire', price: 2500, cost: 1200, stock: 40, category: 'Papeterie', unit: 'piece' },
  ],

  // ---------------------------------------------------------------------------
  // IMPRIMERIE / PRINTING
  // ---------------------------------------------------------------------------
  printing: [
    { name: 'Impression A4 noir et blanc', price: 50, cost: 15, stock: 5000, category: 'Impressions', unit: 'page' },
    { name: 'Impression A4 couleur', price: 150, cost: 50, stock: 5000, category: 'Impressions', unit: 'page' },
    { name: 'Photocopie A4', price: 25, cost: 10, stock: 10000, category: 'Copies', unit: 'page' },
    { name: 'Reliure document', price: 2000, cost: 800, stock: 100, category: 'Finition', unit: 'piece' },
    { name: 'Carte de visite (100 pcs)', price: 10000, cost: 4000, stock: 50, category: 'Cartes', unit: 'lot' },
    { name: 'Impression A3 couleur', price: 300, cost: 100, stock: 2000, category: 'Impressions', unit: 'page' },
    { name: 'Flyers A5 (500 pcs)', price: 25000, cost: 10000, stock: 20, category: 'Marketing', unit: 'lot' },
    { name: 'Affiche A2 couleur', price: 3000, cost: 1200, stock: 100, category: 'Affiches', unit: 'piece' },
    { name: 'Banner / Banderole 3m', price: 15000, cost: 6000, stock: 15, category: 'Grand format', unit: 'piece' },
    { name: 'Impression T-shirt (transfert)', price: 5000, cost: 2000, stock: 30, category: 'Textile', unit: 'piece' },
    { name: 'Scan document A4', price: 100, cost: 20, stock: 5000, category: 'Numerisation', unit: 'page' },
    { name: 'Plastification A4', price: 500, cost: 150, stock: 500, category: 'Finition', unit: 'page' },
    { name: 'Tampon encreur personnalise', price: 8000, cost: 3000, stock: 20, category: 'Tampons', unit: 'piece' },
    { name: 'Brochure A4 (20 pages, 100 ex.)', price: 50000, cost: 22000, stock: 10, category: 'Marketing', unit: 'lot' },
    { name: 'Calendrier mural personnalise', price: 5000, cost: 2000, stock: 30, category: 'Produits personnalises', unit: 'piece' },
    { name: 'Impression photo 10x15', price: 200, cost: 80, stock: 1000, category: 'Photos', unit: 'piece' },
    { name: 'Impression mug personnalise', price: 4000, cost: 1800, stock: 25, category: 'Produits personnalises', unit: 'piece' },
  ],

  // ---------------------------------------------------------------------------
  // IMMOBILIER / REAL ESTATE
  // ---------------------------------------------------------------------------
  real_estate: [
    { name: 'Location bureau mensuel', price: 150000, cost: 20000, stock: 10, category: 'Location', unit: 'mois', size: '30m2' },
    { name: 'Location appartement mensuel', price: 200000, cost: 30000, stock: 8, category: 'Location', unit: 'mois', size: '70m2' },
    { name: 'Visite guidee bien', price: 10000, cost: 3000, stock: 50, category: 'Services', unit: 'visite', size: 'Variable' },
    { name: 'Estimation bien immobilier', price: 50000, cost: 10000, stock: 20, category: 'Services', unit: 'prestation', size: 'Variable' },
    { name: 'Commission vente (5%)', price: 500000, cost: 50000, stock: 10, category: 'Commissions', unit: 'transaction', size: 'Variable', description: 'Commission sur vente immobiliere' },
    { name: 'Location studio mensuel', price: 100000, cost: 15000, stock: 12, category: 'Location', unit: 'mois', size: '25m2' },
    { name: 'Location maison mensuel', price: 350000, cost: 50000, stock: 5, category: 'Location', unit: 'mois', size: '120m2' },
    { name: 'Location local commercial', price: 250000, cost: 35000, stock: 6, category: 'Location', unit: 'mois', size: '50m2' },
    { name: 'Location entrepot', price: 180000, cost: 25000, stock: 4, category: 'Location', unit: 'mois', size: '200m2' },
    { name: 'Frais de dossier locataire', price: 25000, cost: 5000, stock: 50, category: 'Services', unit: 'dossier' },
    { name: 'Etat des lieux (entrant/sortant)', price: 15000, cost: 5000, stock: 30, category: 'Services', unit: 'prestation' },
    { name: 'Gestion locative mensuelle', price: 30000, cost: 8000, stock: 20, category: 'Gestion', unit: 'mois', description: 'Gestion complete d\'un bien locatif' },
    { name: 'Commission location (1 mois)', price: 200000, cost: 30000, stock: 15, category: 'Commissions', unit: 'transaction' },
    { name: 'Terrain a vendre (par m2)', price: 15000, cost: 2000, stock: 20, category: 'Vente terrain', unit: 'm2', size: 'Variable' },
    { name: 'Photos professionnelles bien', price: 20000, cost: 8000, stock: 20, category: 'Services', unit: 'prestation' },
    { name: 'Diagnostic immobilier complet', price: 40000, cost: 15000, stock: 15, category: 'Services', unit: 'prestation' },
  ],

  // ---------------------------------------------------------------------------
  // AGENCE DE VOYAGE / TRAVEL AGENCY
  // ---------------------------------------------------------------------------
  travel_agency: [
    { name: 'Vol Douala - Paris (France)', price: 350000, cost: 280000, stock: 20, category: 'Vols internationaux', unit: 'billet', destination: 'Paris', duration_minutes: 360 },
    { name: 'Circuit safari (Kenya)', price: 250000, cost: 150000, stock: 10, category: 'Circuits', unit: 'personne', destination: 'Nairobi', duration_minutes: 4320 },
    { name: 'Sejour plage (Thailande)', price: 400000, cost: 250000, stock: 8, category: 'Sejours', unit: 'personne', destination: 'Bangkok', duration_minutes: 10080 },
    { name: 'Assistance visa (Canada)', price: 50000, cost: 15000, stock: 20, category: 'Visas', unit: 'dossier', destination: 'Ottawa', duration_minutes: 0 },
    { name: 'Assurance voyage internationale', price: 15000, cost: 8000, stock: 50, category: 'Assurances', unit: 'contrat', destination: 'International', duration_minutes: 0 },
    { name: 'Vol Douala - Istanbul (Turquie)', price: 280000, cost: 220000, stock: 15, category: 'Vols internationaux', unit: 'billet', destination: 'Istanbul', duration_minutes: 420 },
    { name: 'Vol domestique aller simple', price: 50000, cost: 38000, stock: 30, category: 'Vols domestiques', unit: 'billet', destination: 'National', duration_minutes: 60 },
    { name: 'Sejour Dubai (5 nuits)', price: 500000, cost: 350000, stock: 8, category: 'Sejours', unit: 'personne', destination: 'Dubai', duration_minutes: 7200 },
    { name: 'Assistance visa (USA)', price: 80000, cost: 25000, stock: 15, category: 'Visas', unit: 'dossier', destination: 'Washington', duration_minutes: 0 },
    { name: 'Assistance visa (Schengen)', price: 60000, cost: 20000, stock: 20, category: 'Visas', unit: 'dossier', destination: 'Europe', duration_minutes: 0 },
    { name: 'Transfert aeroport', price: 10000, cost: 4000, stock: 50, category: 'Transferts', unit: 'trajet', destination: 'Local' },
    { name: 'Location voiture (par jour)', price: 25000, cost: 12000, stock: 10, category: 'Location', unit: 'jour', destination: 'Local' },
    { name: 'Reservation hotel (par nuit)', price: 30000, cost: 22000, stock: 30, category: 'Hebergement', unit: 'nuit', destination: 'International' },
    { name: 'Excursion locale guidee', price: 15000, cost: 6000, stock: 20, category: 'Excursions', unit: 'personne', destination: 'Local', duration_minutes: 480 },
    { name: 'Pelerinage (Arabie Saoudite)', price: 1500000, cost: 1100000, stock: 5, category: 'Circuits', unit: 'personne', destination: 'La Mecque', duration_minutes: 20160 },
    { name: 'Photos et copies dossier visa', price: 5000, cost: 1500, stock: 50, category: 'Services', unit: 'dossier' },
  ],

  // ---------------------------------------------------------------------------
  // SERVICES DIVERS / SERVICES
  // ---------------------------------------------------------------------------
  services: [
    { name: 'Consultation 30 minutes', price: 10000, cost: 2000, stock: 50, category: 'Consultations', unit: 'seance', duration_minutes: 30 },
    { name: 'Consultation 1 heure', price: 18000, cost: 4000, stock: 50, category: 'Consultations', unit: 'seance', duration_minutes: 60 },
    { name: 'Abonnement mensuel', price: 50000, cost: 10000, stock: 30, category: 'Abonnements', unit: 'mois', duration_minutes: 0 },
    { name: 'Formation (journee)', price: 25000, cost: 8000, stock: 20, category: 'Formations', unit: 'journee', duration_minutes: 480 },
    { name: 'Depannage urgence', price: 15000, cost: 5000, stock: 30, category: 'Interventions', unit: 'prestation', duration_minutes: 60 },
    { name: 'Support informatique (heure)', price: 8000, cost: 2500, stock: 40, category: 'Support IT', unit: 'heure', duration_minutes: 60 },
    { name: 'Installation logiciel', price: 5000, cost: 1500, stock: 30, category: 'Support IT', unit: 'prestation', duration_minutes: 30 },
    { name: 'Reparation ordinateur', price: 15000, cost: 5000, stock: 20, category: 'Reparations', unit: 'prestation', duration_minutes: 120 },
    { name: 'Reparation smartphone', price: 10000, cost: 4000, stock: 20, category: 'Reparations', unit: 'prestation', duration_minutes: 60 },
    { name: 'Creation site web vitrine', price: 150000, cost: 50000, stock: 10, category: 'Digital', unit: 'projet', duration_minutes: 0 },
    { name: 'Formation groupe (demi-journee)', price: 50000, cost: 15000, stock: 10, category: 'Formations', unit: 'session', duration_minutes: 240 },
    { name: 'Audit / Diagnostic', price: 30000, cost: 10000, stock: 15, category: 'Consultations', unit: 'prestation', duration_minutes: 120 },
    { name: 'Installation reseau / WiFi', price: 25000, cost: 10000, stock: 10, category: 'Installations', unit: 'prestation', duration_minutes: 180 },
    { name: 'Maintenance mensuelle', price: 20000, cost: 6000, stock: 20, category: 'Abonnements', unit: 'mois', duration_minutes: 0 },
    { name: 'Traduction document (par page)', price: 3000, cost: 1000, stock: 50, category: 'Traduction', unit: 'page', duration_minutes: 60 },
    { name: 'Conseil juridique (heure)', price: 25000, cost: 8000, stock: 15, category: 'Consultations', unit: 'heure', duration_minutes: 60 },
  ],
}
