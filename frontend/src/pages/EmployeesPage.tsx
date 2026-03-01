import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  Loader2,
  UserCheck,
  UserX,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { db } from '../db/dexie'
import type { User, UserRole } from '../types'
import { generateUUID } from '../utils/uuid'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#2563eb',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
} as const

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrateur',
  manager: 'Manager',
  cashier: 'Caissier',
  stock: 'Gestionnaire stock',
}

const roleColors: Record<UserRole, string> = {
  admin: '#dc2626',
  manager: '#2563eb',
  cashier: '#16a34a',
  stock: '#f59e0b',
}

// ── Employee form state ──────────────────────────────────────────────────

interface EmployeeForm {
  name: string
  email: string
  role: UserRole
  phone: string
  pin: string
}

const emptyForm: EmployeeForm = {
  name: '',
  email: '',
  role: 'cashier',
  phone: '',
  pin: '',
}

// ── Component ────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const { user: currentUser } = useAuthStore()
  const { currentStore, mode } = useAppStore()

  const [employees, setEmployees] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null)
  const [form, setForm] = useState<EmployeeForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingEmployee, setDeletingEmployee] = useState<User | null>(null)

  const loadEmployees = useCallback(async () => {
    if (!currentStore?.id) return
    setLoading(true)
    try {
      let users = await db.users
        .where('store_id')
        .equals(currentStore.id)
        .toArray()

      // Role-based filtering
      if (currentUser?.role === 'manager') {
        users = users.filter((u) => u.role === 'cashier' || u.role === 'stock' || u.id === currentUser.id)
      }

      setEmployees(users)
    } catch (err) {
      console.error('Failed to load employees:', err)
    } finally {
      setLoading(false)
    }
  }, [currentStore?.id, currentUser])

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  const openAddModal = () => {
    setEditingEmployee(null)
    setForm(emptyForm)
    setFormError('')
    setShowModal(true)
  }

  const openEditModal = (emp: User) => {
    setEditingEmployee(emp)
    setForm({
      name: emp.name,
      email: emp.email,
      role: emp.role,
      phone: emp.phone || '',
      pin: emp.pin || '',
    })
    setFormError('')
    setShowModal(true)
  }

  const openDeleteModal = (emp: User) => {
    setDeletingEmployee(emp)
    setShowDeleteModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Le nom est requis')
      return
    }
    if (!form.email.trim()) {
      setFormError('L\'email est requis')
      return
    }
    if (!currentStore) return

    setSaving(true)
    setFormError('')

    try {
      const now = new Date().toISOString()

      if (editingEmployee) {
        await db.users.update(editingEmployee.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          phone: form.phone.trim() || undefined,
          pin: form.pin.trim() || undefined,
          updated_at: now,
        })
      } else {
        const newUser: User = {
          id: generateUUID(),
          store_id: currentStore.id,
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          phone: form.phone.trim() || undefined,
          pin: form.pin.trim() || undefined,
          is_active: true,
          created_at: now,
          updated_at: now,
        }
        await db.users.add(newUser)
      }

      setShowModal(false)
      setForm(emptyForm)
      await loadEmployees()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingEmployee) return
    try {
      // Soft delete: mark as inactive
      await db.users.update(deletingEmployee.id, {
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      setShowDeleteModal(false)
      setDeletingEmployee(null)
      await loadEmployees()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const toggleActive = async (emp: User) => {
    try {
      await db.users.update(emp.id, {
        is_active: !emp.is_active,
        updated_at: new Date().toISOString(),
      })
      await loadEmployees()
    } catch (err) {
      console.error('Toggle active error:', err)
    }
  }

  const updateField = (field: keyof EmployeeForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFormError('')
  }

  // Server mode check
  if (mode === 'client') {
    return (
      <div style={{
        padding: 24,
        backgroundColor: C.bg,
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ textAlign: 'center', color: C.textSecondary }}>
          <Users size={48} color={C.border} style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.text, margin: '0 0 8px' }}>
            Mode client
          </h2>
          <p style={{ fontSize: 14, margin: 0 }}>
            La gestion des employes est disponible uniquement en mode serveur.
          </p>
        </div>
      </div>
    )
  }

  // ── Styles ───────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: 24,
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    color: C.text,
    margin: 0,
  }

  const addBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: C.primary,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const tableCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: `1px solid ${C.border}`,
    backgroundColor: '#f8fafc',
  }

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 14,
    color: C.text,
    borderBottom: `1px solid ${C.border}`,
  }

  const badgeStyle = (bgColor: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    color: bgColor,
    backgroundColor: bgColor + '15',
  })

  const actionBtnStyle = (color: string): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color,
    padding: 6,
    borderRadius: 6,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  // Form styles
  const formFieldStyle: React.CSSProperties = { marginBottom: 16 }
  const formLabelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 6 }
  const formInputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' }
  const formSelectStyle: React.CSSProperties = { ...formInputStyle, cursor: 'pointer', backgroundColor: C.card }
  const formRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
  const formErrorStyle: React.CSSProperties = { backgroundColor: '#fef2f2', color: C.danger, padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12 }
  const formBtnRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }
  const cancelBtnStyle: React.CSSProperties = { padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.border}`, backgroundColor: '#ffffff', color: C.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer' }
  const saveBtnStyle: React.CSSProperties = { padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: C.primary, color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }
  const deleteBtnStyle: React.CSSProperties = { padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: C.danger, color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.textSecondary, fontSize: 16 }}>Chargement des employes...</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Employes</h1>
        <button style={addBtnStyle} onClick={openAddModal}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Table */}
      <div style={tableCardStyle}>
        {employees.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: C.textSecondary }}>
            <Users size={40} color={C.border} style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, margin: 0 }}>Aucun employe enregistre</p>
          </div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Nom</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Telephone</th>
                <th style={thStyle}>Statut</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{emp.name}</td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(roleColors[emp.role])}>
                      {roleLabels[emp.role]}
                    </span>
                  </td>
                  <td style={tdStyle}>{emp.email}</td>
                  <td style={tdStyle}>{emp.phone || '-'}</td>
                  <td style={tdStyle}>
                    <button
                      style={{
                        ...badgeStyle(emp.is_active ? C.success : C.textSecondary),
                        border: 'none',
                        cursor: 'pointer',
                        background: (emp.is_active ? C.success : C.textSecondary) + '15',
                      }}
                      onClick={() => toggleActive(emp)}
                      title={emp.is_active ? 'Desactiver' : 'Activer'}
                    >
                      {emp.is_active ? (
                        <><UserCheck size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Actif</>
                      ) : (
                        <><UserX size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Inactif</>
                      )}
                    </button>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button
                      style={actionBtnStyle(C.primary)}
                      onClick={() => openEditModal(emp)}
                      title="Modifier"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      style={actionBtnStyle(C.danger)}
                      onClick={() => openDeleteModal(emp)}
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEmployee ? 'Modifier l\'employe' : 'Ajouter un employe'}
        size="md"
      >
        {formError && <div style={formErrorStyle}>{formError}</div>}

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>Nom complet *</label>
          <input
            style={formInputStyle}
            type="text"
            placeholder="Ex: Jean Dupont"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
            autoFocus
          />
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>Email *</label>
          <input
            style={formInputStyle}
            type="email"
            placeholder="jean@manoverde.com"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>

        <div style={formRowStyle}>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>Role</label>
            <select
              style={formSelectStyle}
              value={form.role}
              onChange={(e) => updateField('role', e.target.value)}
            >
              {currentUser?.role === 'admin' && <option value="admin">Administrateur</option>}
              {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                <option value="manager">Manager</option>
              )}
              <option value="cashier">Caissier</option>
              <option value="stock">Gestionnaire stock</option>
            </select>
          </div>
          <div style={formFieldStyle}>
            <label style={formLabelStyle}>Telephone</label>
            <input
              style={formInputStyle}
              type="tel"
              placeholder="+237 6XX XXX XXX"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
            />
          </div>
        </div>

        <div style={formFieldStyle}>
          <label style={formLabelStyle}>Code PIN (4-6 chiffres)</label>
          <input
            style={formInputStyle}
            type="password"
            placeholder="Ex: 1234"
            value={form.pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6)
              updateField('pin', val)
            }}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
            maxLength={6}
            inputMode="numeric"
          />
          <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 4, marginBottom: 0 }}>
            Ce PIN permet a l'employe de se connecter rapidement a la caisse.
          </p>
        </div>

        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowModal(false)}>
            Annuler
          </button>
          <button style={saveBtnStyle} onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {saving ? 'Sauvegarde...' : editingEmployee ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <p style={{ fontSize: 14, color: C.text, margin: '0 0 8px' }}>
          Etes-vous sur de vouloir desactiver <strong>{deletingEmployee?.name}</strong> ?
        </p>
        <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
          L'employe ne pourra plus se connecter a la caisse.
        </p>
        <div style={formBtnRowStyle}>
          <button style={cancelBtnStyle} onClick={() => setShowDeleteModal(false)}>
            Annuler
          </button>
          <button style={deleteBtnStyle} onClick={handleDelete}>
            Desactiver
          </button>
        </div>
      </Modal>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
