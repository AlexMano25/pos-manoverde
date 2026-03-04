import type { ContractTemplate } from '../types'

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  // 1. État des lieux (real_estate)
  {
    key: 'etat_des_lieux',
    i18nKey: 'contracts.etatDesLieux',
    activities: ['real_estate'],
    icon: 'ClipboardCheck',
    fields: [
      { key: 'clientName', i18nKey: 'contracts.clientName', type: 'text', required: true },
      { key: 'propertyAddress', i18nKey: 'contracts.propertyAddress', type: 'textarea', required: true },
      { key: 'inspectionDate', i18nKey: 'contracts.inspectionDate', type: 'date', required: true },
      { key: 'propertyCondition', i18nKey: 'contracts.propertyCondition', type: 'textarea', required: true },
      { key: 'notes', i18nKey: 'contracts.notes', type: 'textarea', required: false },
    ],
  },

  // 2. Bail / Contrat de location (real_estate)
  {
    key: 'bail',
    i18nKey: 'contracts.bail',
    activities: ['real_estate'],
    icon: 'FileText',
    fields: [
      { key: 'tenantName', i18nKey: 'contracts.tenantName', type: 'text', required: true },
      { key: 'tenantAddress', i18nKey: 'contracts.tenantAddress', type: 'text', required: true },
      { key: 'tenantPhone', i18nKey: 'contracts.tenantPhone', type: 'text', required: true },
      { key: 'propertyAddress', i18nKey: 'contracts.propertyAddress', type: 'textarea', required: true },
      { key: 'startDate', i18nKey: 'contracts.startDate', type: 'date', required: true },
      { key: 'endDate', i18nKey: 'contracts.endDate', type: 'date', required: true },
      { key: 'monthlyRent', i18nKey: 'contracts.monthlyRent', type: 'number', required: true },
      { key: 'deposit', i18nKey: 'contracts.deposit', type: 'number', required: true },
      { key: 'notes', i18nKey: 'contracts.notes', type: 'textarea', required: false },
    ],
  },

  // 3. Compromis de vente (real_estate)
  {
    key: 'compromis_vente',
    i18nKey: 'contracts.compromisVente',
    activities: ['real_estate'],
    icon: 'Handshake',
    fields: [
      { key: 'buyerName', i18nKey: 'contracts.buyerName', type: 'text', required: true },
      { key: 'buyerAddress', i18nKey: 'contracts.buyerAddress', type: 'text', required: true },
      { key: 'sellerName', i18nKey: 'contracts.sellerName', type: 'text', required: true },
      { key: 'propertyAddress', i18nKey: 'contracts.propertyAddress', type: 'textarea', required: true },
      { key: 'salePrice', i18nKey: 'contracts.salePrice', type: 'number', required: true },
      { key: 'depositAmount', i18nKey: 'contracts.depositAmount', type: 'number', required: true },
      { key: 'completionDate', i18nKey: 'contracts.completionDate', type: 'date', required: true },
      { key: 'notes', i18nKey: 'contracts.notes', type: 'textarea', required: false },
    ],
  },

  // 4. Devis de réparation (auto_repair)
  {
    key: 'devis_reparation',
    i18nKey: 'contracts.devisReparation',
    activities: ['auto_repair'],
    icon: 'Wrench',
    fields: [
      { key: 'clientName', i18nKey: 'contracts.clientName', type: 'text', required: true },
      { key: 'clientPhone', i18nKey: 'contracts.clientPhone', type: 'text', required: true },
      { key: 'vehicleMake', i18nKey: 'contracts.vehicleMake', type: 'text', required: true },
      { key: 'vehicleModel', i18nKey: 'contracts.vehicleModel', type: 'text', required: true },
      { key: 'vehiclePlate', i18nKey: 'contracts.vehiclePlate', type: 'text', required: true },
      { key: 'repairDescription', i18nKey: 'contracts.repairDescription', type: 'textarea', required: true },
      { key: 'partsEstimate', i18nKey: 'contracts.partsEstimate', type: 'number', required: true },
      { key: 'laborEstimate', i18nKey: 'contracts.laborEstimate', type: 'number', required: true },
      { key: 'estimatedDate', i18nKey: 'contracts.estimatedDate', type: 'date', required: false },
      { key: 'notes', i18nKey: 'contracts.notes', type: 'textarea', required: false },
    ],
  },

  // 5. Facture de travaux (auto_repair)
  {
    key: 'facture_travaux',
    i18nKey: 'contracts.factureTravaux',
    activities: ['auto_repair'],
    icon: 'Receipt',
    fields: [
      { key: 'clientName', i18nKey: 'contracts.clientName', type: 'text', required: true },
      { key: 'clientPhone', i18nKey: 'contracts.clientPhone', type: 'text', required: true },
      { key: 'vehicleMake', i18nKey: 'contracts.vehicleMake', type: 'text', required: true },
      { key: 'vehicleModel', i18nKey: 'contracts.vehicleModel', type: 'text', required: true },
      { key: 'vehiclePlate', i18nKey: 'contracts.vehiclePlate', type: 'text', required: true },
      { key: 'workDescription', i18nKey: 'contracts.workDescription', type: 'textarea', required: true },
      { key: 'partsCost', i18nKey: 'contracts.partsCost', type: 'number', required: true },
      { key: 'laborCost', i18nKey: 'contracts.laborCost', type: 'number', required: true },
      { key: 'completionDate', i18nKey: 'contracts.completionDate', type: 'date', required: true },
      { key: 'notes', i18nKey: 'contracts.notes', type: 'textarea', required: false },
    ],
  },

  // 6. Fiche client / Guest registration (hotel)
  {
    key: 'fiche_client',
    i18nKey: 'contracts.ficheClient',
    activities: ['hotel'],
    icon: 'UserCheck',
    fields: [
      { key: 'guestName', i18nKey: 'contracts.guestName', type: 'text', required: true },
      { key: 'nationality', i18nKey: 'contracts.nationality', type: 'text', required: true },
      { key: 'passportNumber', i18nKey: 'contracts.passportNumber', type: 'text', required: true },
      { key: 'checkInDate', i18nKey: 'contracts.checkInDate', type: 'date', required: true },
      { key: 'checkOutDate', i18nKey: 'contracts.checkOutDate', type: 'date', required: true },
      { key: 'roomNumber', i18nKey: 'contracts.roomNumber', type: 'text', required: true },
      { key: 'numberOfGuests', i18nKey: 'contracts.numberOfGuests', type: 'number', required: true },
      { key: 'notes', i18nKey: 'contracts.notes', type: 'textarea', required: false },
    ],
  },

  // 7. Facture de séjour (hotel)
  {
    key: 'facture_sejour',
    i18nKey: 'contracts.factureSejour',
    activities: ['hotel'],
    icon: 'Receipt',
    fields: [
      { key: 'guestName', i18nKey: 'contracts.guestName', type: 'text', required: true },
      { key: 'roomNumber', i18nKey: 'contracts.roomNumber', type: 'text', required: true },
      { key: 'checkInDate', i18nKey: 'contracts.checkInDate', type: 'date', required: true },
      { key: 'checkOutDate', i18nKey: 'contracts.checkOutDate', type: 'date', required: true },
      { key: 'nightlyRate', i18nKey: 'contracts.nightlyRate', type: 'number', required: true },
      { key: 'numberOfNights', i18nKey: 'contracts.numberOfNights', type: 'number', required: true },
      { key: 'additionalServices', i18nKey: 'contracts.additionalServices', type: 'textarea', required: false },
      { key: 'notes', i18nKey: 'contracts.notes', type: 'textarea', required: false },
    ],
  },

  // 8. Contrat de voyage (travel_agency)
  {
    key: 'contrat_voyage',
    i18nKey: 'contracts.contratVoyage',
    activities: ['travel_agency'],
    icon: 'Plane',
    fields: [
      { key: 'clientName', i18nKey: 'contracts.clientName', type: 'text', required: true },
      { key: 'clientPhone', i18nKey: 'contracts.clientPhone', type: 'text', required: true },
      { key: 'clientEmail', i18nKey: 'contracts.clientEmail', type: 'text', required: false },
      { key: 'destination', i18nKey: 'contracts.destination', type: 'text', required: true },
      { key: 'departureDate', i18nKey: 'contracts.departureDate', type: 'date', required: true },
      { key: 'returnDate', i18nKey: 'contracts.returnDate', type: 'date', required: true },
      { key: 'numberOfPassengers', i18nKey: 'contracts.numberOfPassengers', type: 'number', required: true },
      { key: 'totalPrice', i18nKey: 'contracts.totalPrice', type: 'number', required: true },
      { key: 'services', i18nKey: 'contracts.services', type: 'textarea', required: true },
      { key: 'notes', i18nKey: 'contracts.notes', type: 'textarea', required: false },
    ],
  },

  // 9. Assurance voyage (travel_agency)
  {
    key: 'assurance_voyage',
    i18nKey: 'contracts.assuranceVoyage',
    activities: ['travel_agency'],
    icon: 'Shield',
    fields: [
      { key: 'clientName', i18nKey: 'contracts.clientName', type: 'text', required: true },
      { key: 'clientPhone', i18nKey: 'contracts.clientPhone', type: 'text', required: true },
      { key: 'destination', i18nKey: 'contracts.destination', type: 'text', required: true },
      { key: 'departureDate', i18nKey: 'contracts.departureDate', type: 'date', required: true },
      { key: 'returnDate', i18nKey: 'contracts.returnDate', type: 'date', required: true },
      { key: 'coverageAmount', i18nKey: 'contracts.coverageAmount', type: 'number', required: true },
      { key: 'premiumAmount', i18nKey: 'contracts.premiumAmount', type: 'number', required: true },
      { key: 'notes', i18nKey: 'contracts.notes', type: 'textarea', required: false },
    ],
  },

  // 10. Fiche d'inscription (school, daycare)
  {
    key: 'fiche_inscription',
    i18nKey: 'contracts.ficheInscription',
    activities: ['school', 'daycare'],
    icon: 'GraduationCap',
    fields: [
      { key: 'childName', i18nKey: 'contracts.childName', type: 'text', required: true },
      { key: 'childBirthDate', i18nKey: 'contracts.childBirthDate', type: 'date', required: true },
      { key: 'parentName', i18nKey: 'contracts.parentName', type: 'text', required: true },
      { key: 'parentPhone', i18nKey: 'contracts.parentPhone', type: 'text', required: true },
      { key: 'parentEmail', i18nKey: 'contracts.parentEmail', type: 'text', required: false },
      { key: 'emergencyContact', i18nKey: 'contracts.emergencyContact', type: 'text', required: true },
      { key: 'medicalNotes', i18nKey: 'contracts.medicalNotes', type: 'textarea', required: false },
      { key: 'enrollmentDate', i18nKey: 'contracts.enrollmentDate', type: 'date', required: true },
      { key: 'notes', i18nKey: 'contracts.notes', type: 'textarea', required: false },
    ],
  },

  // 11. Autorisation parentale (school, daycare)
  {
    key: 'autorisation_parentale',
    i18nKey: 'contracts.autorisationParentale',
    activities: ['school', 'daycare'],
    icon: 'ShieldCheck',
    fields: [
      { key: 'childName', i18nKey: 'contracts.childName', type: 'text', required: true },
      { key: 'parentName', i18nKey: 'contracts.parentName', type: 'text', required: true },
      { key: 'parentPhone', i18nKey: 'contracts.parentPhone', type: 'text', required: true },
      { key: 'activityDescription', i18nKey: 'contracts.activityDescription', type: 'textarea', required: true },
      { key: 'activityDate', i18nKey: 'contracts.activityDate', type: 'date', required: true },
      { key: 'notes', i18nKey: 'contracts.notes', type: 'textarea', required: false },
    ],
  },

  // 12. Devis de prestation (services, home_cleaning, printing)
  {
    key: 'devis_prestation',
    i18nKey: 'contracts.devisPrestation',
    activities: ['services', 'home_cleaning', 'printing'],
    icon: 'FileText',
    fields: [
      { key: 'clientName', i18nKey: 'contracts.clientName', type: 'text', required: true },
      { key: 'clientPhone', i18nKey: 'contracts.clientPhone', type: 'text', required: true },
      { key: 'clientAddress', i18nKey: 'contracts.clientAddress', type: 'text', required: false },
      { key: 'serviceDescription', i18nKey: 'contracts.serviceDescription', type: 'textarea', required: true },
      { key: 'estimatedPrice', i18nKey: 'contracts.estimatedPrice', type: 'number', required: true },
      { key: 'estimatedDuration', i18nKey: 'contracts.estimatedDuration', type: 'text', required: false },
      { key: 'validUntil', i18nKey: 'contracts.validUntil', type: 'date', required: false },
      { key: 'notes', i18nKey: 'contracts.notes', type: 'textarea', required: false },
    ],
  },

  // 13. Bon de commande (printing, florist)
  {
    key: 'bon_commande',
    i18nKey: 'contracts.bonCommande',
    activities: ['printing', 'florist'],
    icon: 'ShoppingBag',
    fields: [
      { key: 'clientName', i18nKey: 'contracts.clientName', type: 'text', required: true },
      { key: 'clientPhone', i18nKey: 'contracts.clientPhone', type: 'text', required: true },
      { key: 'items', i18nKey: 'contracts.items', type: 'textarea', required: true },
      { key: 'quantity', i18nKey: 'contracts.quantity', type: 'number', required: true },
      { key: 'totalPrice', i18nKey: 'contracts.totalPrice', type: 'number', required: true },
      { key: 'deliveryDate', i18nKey: 'contracts.deliveryDate', type: 'date', required: true },
      { key: 'notes', i18nKey: 'contracts.notes', type: 'textarea', required: false },
    ],
  },
]

/** Get templates available for a given activity */
export function getTemplatesForActivity(activity: string): ContractTemplate[] {
  return CONTRACT_TEMPLATES.filter(t => t.activities.includes(activity as any))
}
