import { useState, useEffect, useMemo } from 'react'
import {
  Wrench,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  Settings,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useAuthStore } from '../stores/authStore'
import { useMaintenanceStore } from '../stores/maintenanceStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type {
  MaintenanceTask,
  MaintenanceStatus,
  MaintenanceType,
  MaintenancePriority,
} from '../types'

// ── Color palette ─────────────────────────────────────────────────────────

const C = {
  primary: '#78716c',
  primaryLight: '#f5f5f4',
  primaryDark: '#57534e',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  success: '#16a34a',
  successBg: '#f0fdf4',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#2563eb',
  infoBg: '#eff6ff',
} as const

// ── Status config ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<MaintenanceStatus, { color: string; bg: string }> = {
  scheduled:   { color: '#2563eb', bg: '#eff6ff' },
  in_progress: { color: '#f59e0b', bg: '#fffbeb' },
  completed:   { color: '#16a34a', bg: '#f0fdf4' },
  overdue:     { color: '#dc2626', bg: '#fef2f2' },
  cancelled:   { color: '#64748b', bg: '#f8fafc' },
}

const ALL_STATUSES: MaintenanceStatus[] = ['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled']

// ── Priority config ───────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<MaintenancePriority, { color: string; bg: string }> = {
  low:      { color: '#64748b', bg: '#f8fafc' },
  medium:   { color: '#2563eb', bg: '#eff6ff' },
  high:     { color: '#f59e0b', bg: '#fffbeb' },
  critical: { color: '#dc2626', bg: '#fef2f2' },
}

const ALL_PRIORITIES: MaintenancePriority[] = ['low', 'medium', 'high', 'critical']

// ── Type config ───────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<MaintenanceType, { color: string; bg: string }> = {
  preventive: { color: '#2563eb', bg: '#eff6ff' },
  corrective: { color: '#f59e0b', bg: '#fffbeb' },
  emergency:  { color: '#dc2626', bg: '#fef2f2' },
  inspection: { color: '#16a34a', bg: '#f0fdf4' },
}

const ALL_TYPES: MaintenanceType[] = ['preventive', 'corrective', 'emergency', 'inspection']

type MaintenanceRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
const ALL_RECURRENCES: MaintenanceRecurrence[] = ['none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly']

// ── Component ─────────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const {
    tasks,
    loading,
    filterStatus,
    filterType,
    filterPriority,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    startTask,
    completeTask,
    cancelTask,
    getOverdueTasks,
    getMonthlyCost,
    setFilterStatus,
    setFilterType,
    setFilterPriority,
  } = useMaintenanceStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'
  const userId = user?.id || ''
  const userName = user?.name || ''

  // i18n
  const tr = (t as Record<string, any>).maintenance || {} as Record<string, string>
  const tCommon = (t as Record<string, any>).common || {}

  const L = {
    title: tr.title || 'Maintenance & Equipment',
    addTask: tr.addTask || 'Add Task',
    editTask: tr.editTask || 'Edit Task',
    viewTask: tr.viewTask || 'Task Details',
    totalTasks: tr.totalTasks || 'Total Tasks',
    scheduledTasks: tr.scheduledTasks || 'Scheduled',
    overdueTasks: tr.overdueTasks || 'Overdue',
    monthlyCost: tr.monthlyCost || 'Monthly Cost',
    taskNumber: tr.taskNumber || 'Task #',
    taskTitle: tr.taskTitle || 'Title',
    description: tr.description || 'Description',
    equipmentName: tr.equipmentName || 'Equipment',
    equipmentId: tr.equipmentId || 'Equipment ID',
    location: tr.location || 'Location',
    type: tr.type || 'Type',
    priority: tr.priority || 'Priority',
    status: tr.status || 'Status',
    assignedTo: tr.assignedTo || 'Assigned To',
    scheduledDate: tr.scheduledDate || 'Scheduled Date',
    dueDate: tr.dueDate || 'Due Date',
    cost: tr.cost || 'Cost',
    vendor: tr.vendor || 'Vendor',
    recurrence: tr.recurrence || 'Recurrence',
    partsUsed: tr.partsUsed || 'Parts Used',
    notes: tr.notes || 'Notes',
    actions: tr.actions || 'Actions',
    allStatuses: tr.allStatuses || 'All Statuses',
    allTypes: tr.allTypes || 'All Types',
    allPriorities: tr.allPriorities || 'All Priorities',
    noTasks: tr.noTasks || 'No maintenance tasks yet',
    noTasksDesc: tr.noTasksDesc || 'Start tracking maintenance by adding a new task.',
    noResults: tr.noResults || 'No tasks match your filters',
    noResultsDesc: tr.noResultsDesc || 'Try adjusting the filters or search query.',
    start: tr.start || 'Start',
    complete: tr.complete || 'Complete',
    cancel: tCommon.cancel || 'Cancel',
    cancelTask: tr.cancelTask || 'Cancel Task',
    reschedule: tr.reschedule || 'Reschedule',
    delete: tr.delete || 'Delete',
    save: tCommon.save || 'Save',
    search: tCommon.search || 'Search',
    tasksCount: tr.tasksCount || 'tasks',
    deleteConfirm: tr.deleteConfirm || 'Are you sure you want to delete this maintenance task?',
    completionCost: tr.completionCost || 'Completion Cost',
    completedBy: tr.completedBy || 'Completed By',
    completedAt: tr.completedAt || 'Completed At',
    startedAt: tr.startedAt || 'Started At',
    createdAt: tr.createdAt || 'Created At',
    lastMaintenance: tr.lastMaintenance || 'Last Maintenance',
    nextMaintenance: tr.nextMaintenance || 'Next Maintenance',
    // Status labels
    st_scheduled: tr.st_scheduled || 'Scheduled',
    st_in_progress: tr.st_in_progress || 'In Progress',
    st_completed: tr.st_completed || 'Completed',
    st_overdue: tr.st_overdue || 'Overdue',
    st_cancelled: tr.st_cancelled || 'Cancelled',
    // Priority labels
    pr_low: tr.pr_low || 'Low',
    pr_medium: tr.pr_medium || 'Medium',
    pr_high: tr.pr_high || 'High',
    pr_critical: tr.pr_critical || 'Critical',
    // Type labels
    tp_preventive: tr.tp_preventive || 'Preventive',
    tp_corrective: tr.tp_corrective || 'Corrective',
    tp_emergency: tr.tp_emergency || 'Emergency',
    tp_inspection: tr.tp_inspection || 'Inspection',
    // Recurrence labels
    rec_none: tr.rec_none || 'None',
    rec_daily: tr.rec_daily || 'Daily',
    rec_weekly: tr.rec_weekly || 'Weekly',
    rec_monthly: tr.rec_monthly || 'Monthly',
    rec_quarterly: tr.rec_quarterly || 'Quarterly',
    rec_yearly: tr.rec_yearly || 'Yearly',
  }

  const statusLabel = (s: MaintenanceStatus): string => (L as Record<string, string>)[`st_${s}`] || s
  const priorityLabel = (p: MaintenancePriority): string => (L as Record<string, string>)[`pr_${p}`] || p
  const typeLabel = (tp: MaintenanceType): string => (L as Record<string, string>)[`tp_${tp}`] || tp
  const recLabel = (r: MaintenanceRecurrence): string => (L as Record<string, string>)[`rec_${r}`] || r

  // ── Local state ───────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null)
  const [viewingTask, setViewingTask] = useState<MaintenanceTask | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showCompleteModal, setShowCompleteModal] = useState<string | null>(null)
  const [completeCost, setCompleteCost] = useState('')

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formEquipmentName, setFormEquipmentName] = useState('')
  const [formEquipmentId, setFormEquipmentId] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formType, setFormType] = useState<MaintenanceType>('preventive')
  const [formPriority, setFormPriority] = useState<MaintenancePriority>('medium')
  const [formAssignedTo, setFormAssignedTo] = useState('')
  const [formScheduledDate, setFormScheduledDate] = useState(new Date().toISOString().slice(0, 10))
  const [formDueDate, setFormDueDate] = useState('')
  const [formCost, setFormCost] = useState('')
  const [formVendor, setFormVendor] = useState('')
  const [formRecurrence, setFormRecurrence] = useState<MaintenanceRecurrence>('none')
  const [formPartsUsed, setFormPartsUsed] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // ── Load data on mount ────────────────────────────────────────────────

  useEffect(() => {
    loadTasks(storeId)
  }, [storeId, loadTasks])

  // ── Filtered and searched tasks ─────────────────────────────────────

  const filteredTasks = useMemo(() => {
    let result = [...tasks]

    if (filterStatus !== 'all') {
      result = result.filter((tk) => tk.status === filterStatus)
    }
    if (filterType !== 'all') {
      result = result.filter((tk) => tk.type === filterType)
    }
    if (filterPriority !== 'all') {
      result = result.filter((tk) => tk.priority === filterPriority)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (tk) =>
          tk.title.toLowerCase().includes(q) ||
          tk.equipment_name.toLowerCase().includes(q) ||
          tk.task_number.toLowerCase().includes(q) ||
          (tk.description && tk.description.toLowerCase().includes(q)) ||
          (tk.location && tk.location.toLowerCase().includes(q)) ||
          (tk.assigned_to_name && tk.assigned_to_name.toLowerCase().includes(q)) ||
          (tk.vendor && tk.vendor.toLowerCase().includes(q))
      )
    }

    return result
  }, [tasks, filterStatus, filterType, filterPriority, searchQuery])

  // ── Stats ─────────────────────────────────────────────────────────────

  const monthlyCost = getMonthlyCost(storeId)
  const overdueTasks = getOverdueTasks(storeId)

  const scheduledCount = useMemo(
    () => tasks.filter((tk) => tk.status === 'scheduled').length,
    [tasks]
  )

  // ── Form helpers ──────────────────────────────────────────────────────

  function resetForm() {
    setFormTitle('')
    setFormDescription('')
    setFormEquipmentName('')
    setFormEquipmentId('')
    setFormLocation('')
    setFormType('preventive')
    setFormPriority('medium')
    setFormAssignedTo('')
    setFormScheduledDate(new Date().toISOString().slice(0, 10))
    setFormDueDate('')
    setFormCost('')
    setFormVendor('')
    setFormRecurrence('none')
    setFormPartsUsed('')
    setFormNotes('')
    setEditingTask(null)
  }

  function openAddModal() {
    resetForm()
    setShowModal(true)
  }

  function openEditModal(task: MaintenanceTask) {
    setEditingTask(task)
    setFormTitle(task.title)
    setFormDescription(task.description || '')
    setFormEquipmentName(task.equipment_name)
    setFormEquipmentId(task.equipment_id || '')
    setFormLocation(task.location || '')
    setFormType(task.type)
    setFormPriority(task.priority)
    setFormAssignedTo(task.assigned_to_name || '')
    setFormScheduledDate(task.scheduled_date.slice(0, 10))
    setFormDueDate(task.due_date ? task.due_date.slice(0, 10) : '')
    setFormCost(task.cost !== undefined ? task.cost.toString() : '')
    setFormVendor(task.vendor || '')
    setFormRecurrence((task.recurrence || 'none') as MaintenanceRecurrence)
    setFormPartsUsed(task.parts_used ? task.parts_used.join(', ') : '')
    setFormNotes(task.notes || '')
    setShowModal(true)
  }

  async function handleSave() {
    if (!formTitle.trim() || !formEquipmentName.trim()) return

    setFormSaving(true)
    try {
      const parsedParts = formPartsUsed
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)

      const data = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        equipment_name: formEquipmentName.trim(),
        equipment_id: formEquipmentId.trim() || undefined,
        location: formLocation.trim() || undefined,
        type: formType,
        priority: formPriority,
        status: 'scheduled' as MaintenanceStatus,
        assigned_to: undefined,
        assigned_to_name: formAssignedTo.trim() || undefined,
        scheduled_date: new Date(formScheduledDate).toISOString(),
        due_date: formDueDate ? new Date(formDueDate).toISOString() : undefined,
        cost: formCost ? parseFloat(formCost) : undefined,
        vendor: formVendor.trim() || undefined,
        recurrence: formRecurrence !== 'none' ? formRecurrence : undefined,
        parts_used: parsedParts.length > 0 ? parsedParts : undefined,
        notes: formNotes.trim() || undefined,
      }

      if (editingTask) {
        await updateTask(editingTask.id, data)
      } else {
        await addTask(storeId, data)
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('[MaintenancePage] Save error:', error)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTask(id)
      setDeleteTarget(null)
    } catch (error) {
      console.error('[MaintenancePage] Delete error:', error)
    }
  }

  async function handleStart(id: string) {
    try {
      await startTask(id)
    } catch (error) {
      console.error('[MaintenancePage] Start error:', error)
    }
  }

  async function handleComplete(id: string) {
    try {
      const costValue = completeCost ? parseFloat(completeCost) : undefined
      await completeTask(id, userId, userName, costValue)
      setShowCompleteModal(null)
      setCompleteCost('')
    } catch (error) {
      console.error('[MaintenancePage] Complete error:', error)
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelTask(id)
    } catch (error) {
      console.error('[MaintenancePage] Cancel error:', error)
    }
  }

  async function handleReschedule(id: string) {
    openEditModal(tasks.find((tk) => tk.id === id)!)
  }

  function isOverdue(task: MaintenanceTask): boolean {
    if (task.status === 'completed' || task.status === 'cancelled') return false
    if (!task.due_date) return false
    return new Date(task.due_date) < new Date()
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return iso.slice(0, 10)
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────

  const s = {
    page: {
      padding: rv(12, 20, 24),
      backgroundColor: C.bg,
      minHeight: '100vh',
    } as React.CSSProperties,

    header: {
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      flexDirection: isMobile ? 'column' : 'row',
      gap: 12,
      marginBottom: rv(16, 20, 24),
    } as React.CSSProperties,

    title: {
      margin: 0,
      fontSize: rv(20, 24, 28),
      fontWeight: 700,
      color: C.text,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    } as React.CSSProperties,

    addBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 20px',
      backgroundColor: C.primary,
      color: '#ffffff',
      border: 'none',
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      whiteSpace: 'nowrap',
    } as React.CSSProperties,

    statsGrid: {
      display: 'grid',
      gridTemplateColumns: rv('1fr 1fr', 'repeat(4, 1fr)', 'repeat(4, 1fr)'),
      gap: rv(10, 14, 16),
      marginBottom: rv(16, 20, 24),
    } as React.CSSProperties,

    statCard: {
      backgroundColor: C.card,
      borderRadius: 12,
      padding: rv(14, 18, 20),
      border: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    } as React.CSSProperties,

    statLabel: {
      fontSize: rv(11, 12, 13),
      fontWeight: 500,
      color: C.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    } as React.CSSProperties,

    statValue: {
      fontSize: rv(18, 22, 26),
      fontWeight: 700,
      color: C.text,
    } as React.CSSProperties,

    filterBar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: rv(8, 10, 12),
      alignItems: 'center',
      marginBottom: rv(16, 20, 24),
      backgroundColor: C.card,
      padding: rv(12, 14, 16),
      borderRadius: 12,
      border: `1px solid ${C.border}`,
    } as React.CSSProperties,

    searchInput: {
      flex: 1,
      minWidth: rv(140, 180, 220),
      padding: '9px 12px 9px 36px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      color: C.text,
      backgroundColor: C.bg,
      outline: 'none',
    } as React.CSSProperties,

    selectInput: {
      padding: '9px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      color: C.text,
      backgroundColor: C.bg,
      outline: 'none',
      cursor: 'pointer',
      minWidth: rv(100, 130, 150),
    } as React.CSSProperties,

    tableWrapper: {
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
      marginBottom: rv(16, 20, 24),
    } as React.CSSProperties,

    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    } as React.CSSProperties,

    th: {
      padding: '12px 16px',
      textAlign: 'left' as const,
      fontSize: 12,
      fontWeight: 600,
      color: C.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      borderBottom: `2px solid ${C.border}`,
      backgroundColor: '#f8fafc',
      whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,

    td: {
      padding: '12px 16px',
      fontSize: 14,
      color: C.text,
      borderBottom: `1px solid ${C.border}`,
      verticalAlign: 'middle' as const,
    } as React.CSSProperties,

    badge: (color: string, bg: string) =>
      ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        color,
        backgroundColor: bg,
        whiteSpace: 'nowrap',
      } as React.CSSProperties),

    actionBtn: (color: string) =>
      ({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        border: 'none',
        borderRadius: 6,
        backgroundColor: 'transparent',
        color,
        cursor: 'pointer',
        transition: 'background-color 0.15s',
      } as React.CSSProperties),

    // Mobile card layout
    mobileCard: {
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      padding: 14,
      marginBottom: 10,
    } as React.CSSProperties,

    mobileCardRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    } as React.CSSProperties,

    // Form styles
    formGroup: {
      marginBottom: 16,
    } as React.CSSProperties,

    formLabel: {
      display: 'block',
      marginBottom: 6,
      fontSize: 13,
      fontWeight: 600,
      color: C.text,
    } as React.CSSProperties,

    formInput: {
      width: '100%',
      padding: '10px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      color: C.text,
      backgroundColor: '#ffffff',
      outline: 'none',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,

    formTextarea: {
      width: '100%',
      padding: '10px 12px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      color: C.text,
      backgroundColor: '#ffffff',
      outline: 'none',
      boxSizing: 'border-box' as const,
      resize: 'vertical' as const,
      minHeight: 70,
      fontFamily: 'inherit',
    } as React.CSSProperties,

    formRow: {
      display: 'grid',
      gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr'),
      gap: 12,
    } as React.CSSProperties,

    formFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 20,
      paddingTop: 16,
      borderTop: `1px solid ${C.border}`,
    } as React.CSSProperties,

    cancelBtn: {
      padding: '10px 20px',
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 500,
      color: C.textSecondary,
      backgroundColor: '#ffffff',
      cursor: 'pointer',
    } as React.CSSProperties,

    saveBtn: {
      padding: '10px 24px',
      border: 'none',
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: C.primary,
      cursor: 'pointer',
      opacity: formSaving ? 0.7 : 1,
    } as React.CSSProperties,

    // Detail row for view modal
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '10px 0',
      borderBottom: `1px solid ${C.border}`,
      gap: 12,
    } as React.CSSProperties,

    detailLabel: {
      fontSize: 13,
      fontWeight: 600,
      color: C.textSecondary,
      minWidth: 120,
      flexShrink: 0,
    } as React.CSSProperties,

    detailValue: {
      fontSize: 14,
      color: C.text,
      textAlign: 'right' as const,
      wordBreak: 'break-word' as const,
    } as React.CSSProperties,

    // Empty state
    emptyState: {
      textAlign: 'center' as const,
      padding: rv(40, 60, 80),
      color: C.textSecondary,
    } as React.CSSProperties,

    emptyIcon: {
      marginBottom: 16,
      color: C.textMuted,
    } as React.CSSProperties,

    emptyTitle: {
      fontSize: 18,
      fontWeight: 600,
      color: C.text,
      margin: '0 0 8px',
    } as React.CSSProperties,

    emptyDesc: {
      fontSize: 14,
      color: C.textSecondary,
      margin: 0,
    } as React.CSSProperties,

    // Loading
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 60,
      color: C.textSecondary,
      fontSize: 15,
    } as React.CSSProperties,
  }

  // ── Loading state ─────────────────────────────────────────────────────

  if (loading && tasks.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.loadingContainer}>
          <div style={{ textAlign: 'center' }}>
            <Wrench size={40} style={{ marginBottom: 12, color: C.primary, opacity: 0.5 }} />
            <div>Loading maintenance tasks...</div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={s.header}>
        <h1 style={s.title}>
          <Wrench size={rv(22, 26, 28)} color={C.primary} />
          {L.title}
        </h1>
        <button
          style={s.addBtn}
          onClick={openAddModal}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = C.primaryDark
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = C.primary
          }}
        >
          <Plus size={18} />
          {L.addTask}
        </button>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div style={s.statsGrid}>
        {/* Total Tasks */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.primaryLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={18} color={C.primary} />
            </div>
            <span style={s.statLabel}>{L.totalTasks}</span>
          </div>
          <div style={s.statValue}>{tasks.length}</div>
        </div>

        {/* Scheduled Tasks */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.infoBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={18} color={C.info} />
            </div>
            <span style={s.statLabel}>{L.scheduledTasks}</span>
          </div>
          <div style={s.statValue}>{scheduledCount}</div>
        </div>

        {/* Overdue Tasks */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.dangerBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} color={C.danger} />
            </div>
            <span style={s.statLabel}>{L.overdueTasks}</span>
          </div>
          <div style={{ ...s.statValue, color: overdueTasks.length > 0 ? C.danger : C.text }}>
            {overdueTasks.length}
          </div>
        </div>

        {/* Monthly Cost */}
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.warningBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DollarSign size={18} color={C.warning} />
            </div>
            <span style={s.statLabel}>{L.monthlyCost}</span>
          </div>
          <div style={s.statValue}>{formatCurrency(monthlyCost, currency)}</div>
        </div>
      </div>

      {/* ── Filters bar ─────────────────────────────────────────────────── */}
      <div style={s.filterBar}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: rv(140, 180, 220) }}>
          <Search
            size={16}
            color={C.textMuted}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder={L.search + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={s.searchInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as MaintenanceStatus | 'all')}
          style={s.selectInput}
        >
          <option value="all">{L.allStatuses}</option>
          {ALL_STATUSES.map((st) => (
            <option key={st} value={st}>
              {statusLabel(st)}
            </option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as MaintenanceType | 'all')}
          style={s.selectInput}
        >
          <option value="all">{L.allTypes}</option>
          {ALL_TYPES.map((tp) => (
            <option key={tp} value={tp}>
              {typeLabel(tp)}
            </option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as MaintenancePriority | 'all')}
          style={s.selectInput}
        >
          <option value="all">{L.allPriorities}</option>
          {ALL_PRIORITIES.map((pr) => (
            <option key={pr} value={pr}>
              {priorityLabel(pr)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Task list ────────────────────────────────────────────────────── */}
      {tasks.length === 0 ? (
        /* Empty state - no tasks at all */
        <div style={{ ...s.tableWrapper, ...s.emptyState }}>
          <div style={s.emptyIcon}>
            <Wrench size={48} />
          </div>
          <h3 style={s.emptyTitle}>{L.noTasks}</h3>
          <p style={s.emptyDesc}>{L.noTasksDesc}</p>
          <button
            style={{ ...s.addBtn, marginTop: 20 }}
            onClick={openAddModal}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = C.primaryDark
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = C.primary
            }}
          >
            <Plus size={18} />
            {L.addTask}
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Empty state - filters returned nothing */
        <div style={{ ...s.tableWrapper, ...s.emptyState }}>
          <div style={s.emptyIcon}>
            <Search size={48} />
          </div>
          <h3 style={s.emptyTitle}>{L.noResults}</h3>
          <p style={s.emptyDesc}>{L.noResultsDesc}</p>
        </div>
      ) : isMobile ? (
        /* ── Mobile cards ──────────────────────────────────────────────── */
        <div>
          <div
            style={{
              fontSize: 12,
              color: C.textSecondary,
              marginBottom: 10,
              fontWeight: 500,
            }}
          >
            {filteredTasks.length} {L.tasksCount}
          </div>
          {filteredTasks.map((task) => {
            const stCfg = STATUS_CONFIG[task.status]
            const prCfg = PRIORITY_CONFIG[task.priority]
            const tpCfg = TYPE_CONFIG[task.type]
            const overdueFlag = isOverdue(task)

            return (
              <div
                key={task.id}
                style={{
                  ...s.mobileCard,
                  ...(overdueFlag ? { borderColor: C.danger, backgroundColor: '#fffbfb' } : {}),
                }}
              >
                {/* Top row: task number + priority */}
                <div style={s.mobileCardRow}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>
                    {task.task_number}
                  </span>
                  <span style={s.badge(prCfg.color, prCfg.bg)}>
                    {priorityLabel(task.priority)}
                  </span>
                </div>

                {/* Title */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.text,
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {task.title}
                </div>

                {/* Equipment & location */}
                <div
                  style={{
                    fontSize: 12,
                    color: C.textSecondary,
                    marginBottom: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Settings size={11} />
                    {task.equipment_name}
                  </span>
                  {task.location && (
                    <span>{task.location}</span>
                  )}
                </div>

                {/* Type, status, date */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={s.badge(tpCfg.color, tpCfg.bg)}>
                    {typeLabel(task.type)}
                  </span>
                  <span style={s.badge(stCfg.color, stCfg.bg)}>
                    {statusLabel(task.status)}
                  </span>
                  {overdueFlag && (
                    <span style={s.badge(C.danger, C.dangerBg)}>
                      <AlertTriangle size={10} />
                      {L.st_overdue}
                    </span>
                  )}
                </div>

                {/* Dates & cost */}
                <div
                  style={{
                    fontSize: 12,
                    color: C.textSecondary,
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Calendar size={11} />
                    {formatDate(task.scheduled_date)}
                  </span>
                  {task.due_date && (
                    <span style={{ color: overdueFlag ? C.danger : C.textSecondary }}>
                      Due: {formatDate(task.due_date)}
                    </span>
                  )}
                  {task.cost !== undefined && task.cost > 0 && (
                    <span style={{ fontWeight: 600 }}>
                      {formatCurrency(task.cost, currency)}
                    </span>
                  )}
                </div>

                {/* Assigned to */}
                {task.assigned_to_name && (
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>
                    {L.assignedTo}: {task.assigned_to_name}
                  </div>
                )}

                {/* Action buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: `1px solid ${C.border}`,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={() => setViewingTask(task)}
                    style={{
                      ...s.actionBtn(C.info),
                      width: 'auto',
                      padding: '5px 10px',
                      fontSize: 12,
                    }}
                    title={L.viewTask}
                  >
                    <Eye size={13} />
                  </button>

                  <button
                    onClick={() => openEditModal(task)}
                    style={{
                      ...s.actionBtn(C.primary),
                      width: 'auto',
                      padding: '5px 10px',
                      fontSize: 12,
                    }}
                    title={L.editTask}
                  >
                    <Edit size={13} />
                  </button>

                  {task.status === 'scheduled' && (
                    <button
                      onClick={() => handleStart(task.id)}
                      style={{
                        ...s.actionBtn(C.info),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.start}
                    >
                      <Clock size={13} />
                    </button>
                  )}

                  {(task.status === 'scheduled' || task.status === 'in_progress') && (
                    <button
                      onClick={() => {
                        setCompleteCost(task.cost !== undefined ? task.cost.toString() : '')
                        setShowCompleteModal(task.id)
                      }}
                      style={{
                        ...s.actionBtn(C.success),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.complete}
                    >
                      <CheckCircle size={13} />
                    </button>
                  )}

                  {(task.status === 'scheduled' || task.status === 'in_progress') && (
                    <button
                      onClick={() => handleCancel(task.id)}
                      style={{
                        ...s.actionBtn(C.textMuted),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.cancelTask}
                    >
                      <AlertTriangle size={13} />
                    </button>
                  )}

                  {task.status === 'overdue' && (
                    <button
                      onClick={() => handleReschedule(task.id)}
                      style={{
                        ...s.actionBtn(C.warning),
                        width: 'auto',
                        padding: '5px 10px',
                        fontSize: 12,
                      }}
                      title={L.reschedule}
                    >
                      <Calendar size={13} />
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteTarget(task.id)}
                    style={{
                      ...s.actionBtn(C.danger),
                      width: 'auto',
                      padding: '5px 10px',
                      fontSize: 12,
                      marginLeft: 'auto',
                    }}
                    title={L.delete}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Desktop/tablet table ──────────────────────────────────────── */
        <div style={s.tableWrapper}>
          <div
            style={{
              padding: '10px 16px',
              borderBottom: `1px solid ${C.border}`,
              fontSize: 12,
              color: C.textSecondary,
              fontWeight: 500,
            }}
          >
            {filteredTasks.length} {L.tasksCount}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>{L.taskNumber}</th>
                  <th style={s.th}>{L.taskTitle}</th>
                  <th style={s.th}>{L.equipmentName}</th>
                  <th style={s.th}>{L.type}</th>
                  <th style={s.th}>{L.priority}</th>
                  <th style={s.th}>{L.status}</th>
                  <th style={s.th}>{L.scheduledDate}</th>
                  <th style={s.th}>{L.dueDate}</th>
                  <th style={s.th}>{L.assignedTo}</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>{L.cost}</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>{L.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const stCfg = STATUS_CONFIG[task.status]
                  const prCfg = PRIORITY_CONFIG[task.priority]
                  const tpCfg = TYPE_CONFIG[task.type]
                  const overdueFlag = isOverdue(task)

                  return (
                    <tr
                      key={task.id}
                      style={{
                        transition: 'background-color 0.15s',
                        ...(overdueFlag ? { backgroundColor: '#fffbfb' } : {}),
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = overdueFlag ? '#fff5f5' : '#f8fafc'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = overdueFlag ? '#fffbfb' : ''
                      }}
                    >
                      <td style={s.td}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>
                          {task.task_number}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.title}
                        </div>
                        {task.location && (
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                            {task.location}
                          </div>
                        )}
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Settings size={13} color={C.textMuted} />
                          <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.equipment_name}
                          </span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(tpCfg.color, tpCfg.bg)}>
                          {typeLabel(task.type)}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={s.badge(prCfg.color, prCfg.bg)}>
                          {priorityLabel(task.priority)}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                          <span style={s.badge(stCfg.color, stCfg.bg)}>
                            {statusLabel(task.status)}
                          </span>
                          {overdueFlag && (
                            <AlertTriangle size={14} color={C.danger} />
                          )}
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                          <Calendar size={13} color={C.textMuted} />
                          {formatDate(task.scheduled_date)}
                        </span>
                      </td>
                      <td style={s.td}>
                        {task.due_date ? (
                          <span style={{ whiteSpace: 'nowrap', color: overdueFlag ? C.danger : C.text, fontWeight: overdueFlag ? 600 : 400 }}>
                            {formatDate(task.due_date)}
                          </span>
                        ) : (
                          <span style={{ color: C.textMuted }}>--</span>
                        )}
                      </td>
                      <td style={{ ...s.td, fontSize: 13, color: C.textSecondary }}>
                        {task.assigned_to_name || '--'}
                      </td>
                      <td style={{ ...s.td, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {task.cost !== undefined && task.cost > 0
                          ? formatCurrency(task.cost, currency)
                          : <span style={{ color: C.textMuted }}>--</span>
                        }
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          <button
                            onClick={() => setViewingTask(task)}
                            style={s.actionBtn(C.info)}
                            title={L.viewTask}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = C.infoBg
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => openEditModal(task)}
                            style={s.actionBtn(C.primary)}
                            title={L.editTask}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = C.primaryLight
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Edit size={15} />
                          </button>

                          {task.status === 'scheduled' && (
                            <button
                              onClick={() => handleStart(task.id)}
                              style={s.actionBtn(C.info)}
                              title={L.start}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.infoBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <Clock size={15} />
                            </button>
                          )}

                          {(task.status === 'scheduled' || task.status === 'in_progress') && (
                            <button
                              onClick={() => {
                                setCompleteCost(task.cost !== undefined ? task.cost.toString() : '')
                                setShowCompleteModal(task.id)
                              }}
                              style={s.actionBtn(C.success)}
                              title={L.complete}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.successBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <CheckCircle size={15} />
                            </button>
                          )}

                          {(task.status === 'scheduled' || task.status === 'in_progress') && (
                            <button
                              onClick={() => handleCancel(task.id)}
                              style={s.actionBtn(C.textMuted)}
                              title={L.cancelTask}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f1f5f9'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <AlertTriangle size={15} />
                            </button>
                          )}

                          {task.status === 'overdue' && (
                            <button
                              onClick={() => handleReschedule(task.id)}
                              style={s.actionBtn(C.warning)}
                              title={L.reschedule}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = C.warningBg
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <Calendar size={15} />
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteTarget(task.id)}
                            style={s.actionBtn(C.danger)}
                            title={L.delete}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = C.dangerBg
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add / Edit Task Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingTask ? L.editTask : L.addTask}
        size="lg"
      >
        {/* Title & Equipment Name */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.taskTitle} *</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={L.taskTitle + '...'}
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.equipmentName} *</label>
            <input
              type="text"
              value={formEquipmentName}
              onChange={(e) => setFormEquipmentName(e.target.value)}
              placeholder={L.equipmentName + '...'}
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>
        </div>

        {/* Description */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.description}</label>
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder={L.description + '...'}
            style={s.formTextarea}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Equipment ID & Location */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.equipmentId}</label>
            <input
              type="text"
              value={formEquipmentId}
              onChange={(e) => setFormEquipmentId(e.target.value)}
              placeholder={L.equipmentId + '...'}
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.location}</label>
            <input
              type="text"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder={L.location + '...'}
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>
        </div>

        {/* Type & Priority */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.type}</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as MaintenanceType)}
              style={{ ...s.formInput, cursor: 'pointer' }}
            >
              {ALL_TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {typeLabel(tp)}
                </option>
              ))}
            </select>
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.priority}</label>
            <select
              value={formPriority}
              onChange={(e) => setFormPriority(e.target.value as MaintenancePriority)}
              style={{ ...s.formInput, cursor: 'pointer' }}
            >
              {ALL_PRIORITIES.map((pr) => (
                <option key={pr} value={pr}>
                  {priorityLabel(pr)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assigned To & Vendor */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.assignedTo}</label>
            <input
              type="text"
              value={formAssignedTo}
              onChange={(e) => setFormAssignedTo(e.target.value)}
              placeholder={L.assignedTo + '...'}
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.vendor}</label>
            <input
              type="text"
              value={formVendor}
              onChange={(e) => setFormVendor(e.target.value)}
              placeholder={L.vendor + '...'}
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>
        </div>

        {/* Scheduled Date & Due Date */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.scheduledDate} *</label>
            <input
              type="date"
              value={formScheduledDate}
              onChange={(e) => setFormScheduledDate(e.target.value)}
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.dueDate}</label>
            <input
              type="date"
              value={formDueDate}
              onChange={(e) => setFormDueDate(e.target.value)}
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>
        </div>

        {/* Cost & Recurrence */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.cost}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formCost}
              onChange={(e) => setFormCost(e.target.value)}
              placeholder="0.00"
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>

          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.recurrence}</label>
            <select
              value={formRecurrence}
              onChange={(e) => setFormRecurrence(e.target.value as MaintenanceRecurrence)}
              style={{ ...s.formInput, cursor: 'pointer' }}
            >
              {ALL_RECURRENCES.map((rec) => (
                <option key={rec} value={rec}>
                  {recLabel(rec)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Parts Used */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>
            {L.partsUsed}
            <span style={{ fontWeight: 400, color: C.textMuted, fontSize: 11, marginLeft: 6 }}>
              (comma-separated)
            </span>
          </label>
          <input
            type="text"
            value={formPartsUsed}
            onChange={(e) => setFormPartsUsed(e.target.value)}
            placeholder="Filter, Belt, Gasket..."
            style={s.formInput}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
          {formPartsUsed.trim() && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {formPartsUsed
                .split(',')
                .map((part) => part.trim())
                .filter(Boolean)
                .map((part, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 500,
                      backgroundColor: C.primaryLight,
                      color: C.primary,
                    }}
                  >
                    {part}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.notes}</label>
          <textarea
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder={L.notes + '...'}
            style={s.formTextarea}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          />
        </div>

        {/* Form footer */}
        <div style={s.formFooter}>
          <button
            style={s.cancelBtn}
            onClick={() => {
              setShowModal(false)
              resetForm()
            }}
          >
            {L.cancel}
          </button>
          <button
            style={s.saveBtn}
            onClick={handleSave}
            disabled={formSaving || !formTitle.trim() || !formEquipmentName.trim()}
          >
            {formSaving ? 'Saving...' : L.save}
          </button>
        </div>
      </Modal>

      {/* ── View Task Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={viewingTask !== null}
        onClose={() => setViewingTask(null)}
        title={L.viewTask}
        size="lg"
      >
        {viewingTask && (() => {
          const vt = viewingTask
          const vtStatus = STATUS_CONFIG[vt.status]
          const vtPriority = PRIORITY_CONFIG[vt.priority]
          const vtType = TYPE_CONFIG[vt.type]

          return (
            <div>
              {/* Header badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                <span style={s.badge(vtType.color, vtType.bg)}>
                  {typeLabel(vt.type)}
                </span>
                <span style={s.badge(vtPriority.color, vtPriority.bg)}>
                  {priorityLabel(vt.priority)}
                </span>
                <span style={s.badge(vtStatus.color, vtStatus.bg)}>
                  {statusLabel(vt.status)}
                </span>
                {isOverdue(vt) && (
                  <span style={s.badge(C.danger, C.dangerBg)}>
                    <AlertTriangle size={10} />
                    {L.st_overdue}
                  </span>
                )}
              </div>

              {/* Task number & title */}
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.taskNumber}</span>
                <span style={{ ...s.detailValue, fontWeight: 600 }}>{vt.task_number}</span>
              </div>

              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.taskTitle}</span>
                <span style={s.detailValue}>{vt.title}</span>
              </div>

              {vt.description && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.description}</span>
                  <span style={s.detailValue}>{vt.description}</span>
                </div>
              )}

              {/* Equipment info */}
              <div style={{
                backgroundColor: C.primaryLight,
                borderRadius: 10,
                padding: 14,
                margin: '16px 0',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 10 }}>
                  <Settings size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  {L.equipmentName}
                </div>
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.equipmentName}</span>
                  <span style={s.detailValue}>{vt.equipment_name}</span>
                </div>
                {vt.equipment_id && (
                  <div style={s.detailRow}>
                    <span style={s.detailLabel}>{L.equipmentId}</span>
                    <span style={s.detailValue}>{vt.equipment_id}</span>
                  </div>
                )}
                {vt.location && (
                  <div style={{ ...s.detailRow, borderBottom: 'none' }}>
                    <span style={s.detailLabel}>{L.location}</span>
                    <span style={s.detailValue}>{vt.location}</span>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{L.scheduledDate}</span>
                <span style={s.detailValue}>
                  <Calendar size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  {formatDate(vt.scheduled_date)}
                </span>
              </div>

              {vt.due_date && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.dueDate}</span>
                  <span style={{
                    ...s.detailValue,
                    color: isOverdue(vt) ? C.danger : C.text,
                    fontWeight: isOverdue(vt) ? 600 : 400,
                  }}>
                    {formatDate(vt.due_date)}
                  </span>
                </div>
              )}

              {vt.started_at && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.startedAt}</span>
                  <span style={s.detailValue}>{formatDate(vt.started_at)}</span>
                </div>
              )}

              {vt.completed_at && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.completedAt}</span>
                  <span style={s.detailValue}>{formatDate(vt.completed_at)}</span>
                </div>
              )}

              {vt.completed_by_name && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.completedBy}</span>
                  <span style={s.detailValue}>{vt.completed_by_name}</span>
                </div>
              )}

              {/* Assignment & vendor */}
              {vt.assigned_to_name && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.assignedTo}</span>
                  <span style={s.detailValue}>{vt.assigned_to_name}</span>
                </div>
              )}

              {vt.vendor && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.vendor}</span>
                  <span style={s.detailValue}>{vt.vendor}</span>
                </div>
              )}

              {/* Cost */}
              {vt.cost !== undefined && vt.cost > 0 && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.cost}</span>
                  <span style={{ ...s.detailValue, fontWeight: 700, color: C.primary }}>
                    <DollarSign size={14} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                    {formatCurrency(vt.cost, currency)}
                  </span>
                </div>
              )}

              {/* Recurrence */}
              {vt.recurrence && vt.recurrence !== 'none' && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.recurrence}</span>
                  <span style={s.detailValue}>{recLabel(vt.recurrence as MaintenanceRecurrence)}</span>
                </div>
              )}

              {/* Last / Next maintenance */}
              {vt.last_maintenance && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.lastMaintenance}</span>
                  <span style={s.detailValue}>{formatDate(vt.last_maintenance)}</span>
                </div>
              )}

              {vt.next_maintenance && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.nextMaintenance}</span>
                  <span style={s.detailValue}>{formatDate(vt.next_maintenance)}</span>
                </div>
              )}

              {/* Parts used */}
              {vt.parts_used && vt.parts_used.length > 0 && (
                <div style={s.detailRow}>
                  <span style={s.detailLabel}>{L.partsUsed}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
                    {vt.parts_used.map((part, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 500,
                          backgroundColor: C.primaryLight,
                          color: C.primary,
                        }}
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {vt.notes && (
                <div style={{ ...s.detailRow, borderBottom: 'none' }}>
                  <span style={s.detailLabel}>{L.notes}</span>
                  <span style={{ ...s.detailValue, whiteSpace: 'pre-wrap' }}>{vt.notes}</span>
                </div>
              )}

              {/* Created at */}
              <div style={{
                fontSize: 11,
                color: C.textMuted,
                marginTop: 16,
                textAlign: 'right',
              }}>
                {L.createdAt}: {formatDate(vt.created_at)}
              </div>

              {/* Action buttons in view modal */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 20,
                paddingTop: 16,
                borderTop: `1px solid ${C.border}`,
                flexWrap: 'wrap',
              }}>
                {vt.status === 'scheduled' && (
                  <button
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#ffffff',
                      backgroundColor: C.info,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onClick={() => {
                      handleStart(vt.id)
                      setViewingTask(null)
                    }}
                  >
                    <Clock size={14} />
                    {L.start}
                  </button>
                )}

                {(vt.status === 'scheduled' || vt.status === 'in_progress') && (
                  <button
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#ffffff',
                      backgroundColor: C.success,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onClick={() => {
                      setCompleteCost(vt.cost !== undefined ? vt.cost.toString() : '')
                      setShowCompleteModal(vt.id)
                      setViewingTask(null)
                    }}
                  >
                    <CheckCircle size={14} />
                    {L.complete}
                  </button>
                )}

                {(vt.status === 'scheduled' || vt.status === 'in_progress') && (
                  <button
                    style={{
                      padding: '8px 16px',
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      color: C.textSecondary,
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onClick={() => {
                      handleCancel(vt.id)
                      setViewingTask(null)
                    }}
                  >
                    <AlertTriangle size={14} />
                    {L.cancelTask}
                  </button>
                )}

                {vt.status === 'overdue' && (
                  <button
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#ffffff',
                      backgroundColor: C.warning,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onClick={() => {
                      setViewingTask(null)
                      handleReschedule(vt.id)
                    }}
                  >
                    <Calendar size={14} />
                    {L.reschedule}
                  </button>
                )}

                <button
                  style={{
                    padding: '8px 16px',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: C.textSecondary,
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                  }}
                  onClick={() => setViewingTask(null)}
                >
                  {L.cancel}
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ── Complete Task Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={showCompleteModal !== null}
        onClose={() => {
          setShowCompleteModal(null)
          setCompleteCost('')
        }}
        title={L.complete}
        size="sm"
      >
        <div style={{ padding: '10px 0' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: C.successBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle size={24} color={C.success} />
          </div>
          <p style={{ fontSize: 15, color: C.text, margin: '0 0 16px', lineHeight: 1.5, textAlign: 'center' }}>
            {L.completionCost}
          </p>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.cost}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={completeCost}
              onChange={(e) => setCompleteCost(e.target.value)}
              placeholder="0.00"
              style={s.formInput}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.primary
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 }}>
            <button
              style={s.cancelBtn}
              onClick={() => {
                setShowCompleteModal(null)
                setCompleteCost('')
              }}
            >
              {L.cancel}
            </button>
            <button
              style={{
                ...s.saveBtn,
                backgroundColor: C.success,
                opacity: 1,
              }}
              onClick={() => showCompleteModal && handleComplete(showCompleteModal)}
            >
              {L.complete}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={L.delete}
        size="sm"
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: C.dangerBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Trash2 size={24} color={C.danger} />
          </div>
          <p style={{ fontSize: 15, color: C.text, margin: '0 0 24px', lineHeight: 1.5 }}>
            {L.deleteConfirm}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button
              style={s.cancelBtn}
              onClick={() => setDeleteTarget(null)}
            >
              {L.cancel}
            </button>
            <button
              style={{
                ...s.saveBtn,
                backgroundColor: C.danger,
                opacity: 1,
              }}
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              {L.delete}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
