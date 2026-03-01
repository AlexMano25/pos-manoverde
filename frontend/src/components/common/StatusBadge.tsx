import React from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

// ---------------------------------------------------------------------------
// Status-to-color mapping
// ---------------------------------------------------------------------------

type StatusColor = {
  bg: string
  text: string
}

const STATUS_COLORS: Record<string, StatusColor> = {
  // Order statuses
  paid:         { bg: '#f0fdf4', text: '#16a34a' },
  pending:      { bg: '#fffbeb', text: '#f59e0b' },
  refunded:     { bg: '#fef2f2', text: '#dc2626' },
  cancelled:    { bg: '#f1f5f9', text: '#64748b' },

  // User roles
  admin:        { bg: '#f3e8ff', text: '#7c3aed' },
  manager:      { bg: '#eff6ff', text: '#2563eb' },
  cashier:      { bg: '#f0fdf4', text: '#16a34a' },
  stock:        { bg: '#fffbeb', text: '#f59e0b' },

  // Connection statuses
  connected:    { bg: '#f0fdf4', text: '#16a34a' },
  disconnected: { bg: '#fef2f2', text: '#dc2626' },
  online:       { bg: '#f0fdf4', text: '#16a34a' },
  offline:      { bg: '#fef2f2', text: '#dc2626' },
  'local-only': { bg: '#fffbeb', text: '#f59e0b' },

  // Printer statuses
  printing:     { bg: '#eff6ff', text: '#2563eb' },
  error:        { bg: '#fef2f2', text: '#dc2626' },

  // Generic / active states
  active:       { bg: '#f0fdf4', text: '#16a34a' },
  inactive:     { bg: '#f1f5f9', text: '#64748b' },
}

// Default fallback
const DEFAULT_COLOR: StatusColor = { bg: '#f1f5f9', text: '#64748b' }

// ---------------------------------------------------------------------------
// Label mapping (status key -> display label)
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  paid:         'Paye',
  pending:      'En attente',
  refunded:     'Rembourse',
  cancelled:    'Annule',
  admin:        'Admin',
  manager:      'Manager',
  cashier:      'Caissier',
  stock:        'Stock',
  connected:    'Connecte',
  disconnected: 'Deconnecte',
  online:       'En ligne',
  offline:      'Hors ligne',
  'local-only': 'Local',
  printing:     'Impression',
  error:        'Erreur',
  active:       'Actif',
  inactive:     'Inactif',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalizedStatus = status.toLowerCase().trim()
  const colorConfig = STATUS_COLORS[normalizedStatus] ?? DEFAULT_COLOR
  const label = STATUS_LABELS[normalizedStatus] ?? status

  const isSm = size === 'sm'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: isSm ? '2px 8px' : '3px 10px',
        borderRadius: 20,
        fontSize: isSm ? 11 : 12,
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: 0.2,
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
        backgroundColor: colorConfig.bg,
        color: colorConfig.text,
      }}
    >
      {/* Status dot */}
      <span
        style={{
          width: isSm ? 5 : 6,
          height: isSm ? 5 : 6,
          borderRadius: '50%',
          backgroundColor: colorConfig.text,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  )
}

export default StatusBadge
