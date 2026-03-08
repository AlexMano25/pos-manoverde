import { useState, useEffect, useMemo } from 'react'
import {
  CookingPot,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  Clock,
  DollarSign,
  TrendingUp,
  Layers,
  PlayCircle,
  CheckCircle2,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useAuthStore } from '../stores/authStore'
import { useRecipeStore } from '../stores/recipeStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type {
  Recipe,
  RecipeStatus,
  RecipeIngredient,
  ProductionStatus,
} from '../types'

// ── Color palette (violet) ──────────────────────────────────────────────────

const C = {
  primary: '#7c3aed',
  primaryLight: '#ede9fe',
  primaryDark: '#6d28d9',
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

// ── Status config ───────────────────────────────────────────────────────────

const RECIPE_STATUS_CONFIG: Record<RecipeStatus, { color: string; bg: string }> = {
  active:   { color: '#16a34a', bg: '#f0fdf4' },
  draft:    { color: '#f59e0b', bg: '#fffbeb' },
  archived: { color: '#64748b', bg: '#f8fafc' },
}

const PRODUCTION_STATUS_CONFIG: Record<ProductionStatus, { color: string; bg: string }> = {
  planned:     { color: '#2563eb', bg: '#eff6ff' },
  in_progress: { color: '#f59e0b', bg: '#fffbeb' },
  completed:   { color: '#16a34a', bg: '#f0fdf4' },
  cancelled:   { color: '#dc2626', bg: '#fef2f2' },
}

// ── Constants ───────────────────────────────────────────────────────────────

const ALL_RECIPE_STATUSES: RecipeStatus[] = ['active', 'draft', 'archived']
const ALL_PRODUCTION_STATUSES: ProductionStatus[] = ['planned', 'in_progress', 'completed', 'cancelled']

const RECIPE_CATEGORIES = [
  'appetizer', 'main_course', 'dessert', 'beverage', 'side_dish',
  'sauce', 'dough', 'pastry', 'salad', 'soup', 'bread', 'other',
]

const INGREDIENT_UNITS = [
  'g', 'kg', 'ml', 'l', 'unit', 'tbsp', 'tsp', 'cup', 'oz', 'lb', 'piece',
]

// ── Component ───────────────────────────────────────────────────────────────

export default function RecipesPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const { isMobile, rv } = useResponsive()
  const {
    recipes,
    batches,
    loading,
    filterStatus,
    filterCategory,
    loadRecipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    loadBatches,
    addBatch,
    deleteBatch,
    startProduction,
    completeProduction,
    getAvgCost,
    getAvgMargin,
    setFilterStatus,
    setFilterCategory,
  } = useRecipeStore()

  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency || 'XAF'
  const userId = user?.id || ''
  const userName = user?.name || ''

  // ── i18n ────────────────────────────────────────────────────────────────

  const tr = (t as Record<string, any>).recipes || {} as Record<string, string>
  const tCommon = (t as Record<string, any>).common || {}

  const L = {
    title: tr.title || 'Recipes & Production',
    recipesTab: tr.recipesTab || 'Recipes',
    productionTab: tr.productionTab || 'Production',
    addRecipe: tr.addRecipe || 'Add Recipe',
    editRecipe: tr.editRecipe || 'Edit Recipe',
    viewRecipe: tr.viewRecipe || 'View Recipe',
    totalRecipes: tr.totalRecipes || 'Total Recipes',
    activeRecipes: tr.activeRecipes || 'Active Recipes',
    avgCost: tr.avgCost || 'Avg Cost',
    avgMargin: tr.avgMargin || 'Avg Margin',
    name: tr.name || 'Name',
    category: tr.category || 'Category',
    description: tr.description || 'Description',
    outputProduct: tr.outputProduct || 'Output Product',
    outputQuantity: tr.outputQuantity || 'Output Quantity',
    ingredients: tr.ingredients || 'Ingredients',
    addIngredient: tr.addIngredient || 'Add Ingredient',
    productName: tr.productName || 'Product Name',
    quantity: tr.quantity || 'Quantity',
    unit: tr.unit || 'Unit',
    unitCost: tr.unitCost || 'Unit Cost',
    totalCost: tr.totalCost || 'Total Cost',
    instructions: tr.instructions || 'Instructions',
    prepTime: tr.prepTime || 'Prep Time (min)',
    cookTime: tr.cookTime || 'Cook Time (min)',
    sellingPrice: tr.sellingPrice || 'Selling Price',
    margin: tr.margin || 'Margin',
    status: tr.status || 'Status',
    allergens: tr.allergens || 'Allergens',
    tags: tr.tags || 'Tags',
    allStatuses: tr.allStatuses || 'All Statuses',
    allCategories: tr.allCategories || 'All Categories',
    noRecipes: tr.noRecipes || 'No recipes yet',
    noRecipesDesc: tr.noRecipesDesc || 'Start by creating your first recipe.',
    noResults: tr.noResults || 'No recipes match your filters',
    noResultsDesc: tr.noResultsDesc || 'Try adjusting the filters or search query.',
    deleteConfirm: tr.deleteConfirm || 'Are you sure you want to delete this recipe?',
    deleteBatchConfirm: tr.deleteBatchConfirm || 'Are you sure you want to delete this batch?',
    // Production
    totalBatches: tr.totalBatches || 'Total Batches',
    planned: tr.planned || 'Planned',
    inProgress: tr.inProgress || 'In Progress',
    completedToday: tr.completedToday || 'Completed Today',
    addBatch: tr.addBatch || 'Add Batch',
    batchNumber: tr.batchNumber || 'Batch #',
    recipeName: tr.recipeName || 'Recipe',
    plannedDate: tr.plannedDate || 'Planned Date',
    producedBy: tr.producedBy || 'Produced By',
    actualCost: tr.actualCost || 'Actual Cost',
    notes: tr.notes || 'Notes',
    selectRecipe: tr.selectRecipe || 'Select Recipe',
    startProduction: tr.startProduction || 'Start',
    completeProduction: tr.completeProduction || 'Complete',
    noBatches: tr.noBatches || 'No production batches yet',
    noBatchesDesc: tr.noBatchesDesc || 'Start by scheduling a production batch.',
    noBatchResults: tr.noBatchResults || 'No batches match your filters',
    // Common
    save: tCommon.save || 'Save',
    cancel: tCommon.cancel || 'Cancel',
    search: tCommon.search || 'Search',
    delete: tCommon.delete || 'Delete',
    actions: tCommon.actions || 'Actions',
    // Status labels
    st_active: tr.st_active || 'Active',
    st_draft: tr.st_draft || 'Draft',
    st_archived: tr.st_archived || 'Archived',
    st_planned: tr.st_planned || 'Planned',
    st_in_progress: tr.st_in_progress || 'In Progress',
    st_completed: tr.st_completed || 'Completed',
    st_cancelled: tr.st_cancelled || 'Cancelled',
    // Category labels
    cat_appetizer: tr.cat_appetizer || 'Appetizer',
    cat_main_course: tr.cat_main_course || 'Main Course',
    cat_dessert: tr.cat_dessert || 'Dessert',
    cat_beverage: tr.cat_beverage || 'Beverage',
    cat_side_dish: tr.cat_side_dish || 'Side Dish',
    cat_sauce: tr.cat_sauce || 'Sauce',
    cat_dough: tr.cat_dough || 'Dough',
    cat_pastry: tr.cat_pastry || 'Pastry',
    cat_salad: tr.cat_salad || 'Salad',
    cat_soup: tr.cat_soup || 'Soup',
    cat_bread: tr.cat_bread || 'Bread',
    cat_other: tr.cat_other || 'Other',
  }

  const recipeStatusLabel = (s: RecipeStatus): string => (L as Record<string, string>)[`st_${s}`] || s
  const prodStatusLabel = (s: ProductionStatus): string => (L as Record<string, string>)[`st_${s}`] || s
  const catLabel = (c: string): string => (L as Record<string, string>)[`cat_${c}`] || c

  // ── Tab state ──────────────────────────────────────────────────────────

  type Tab = 'recipes' | 'production'
  const [activeTab, setActiveTab] = useState<Tab>('recipes')

  // ── Recipes local state ────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null)
  const [deleteRecipeTarget, setDeleteRecipeTarget] = useState<string | null>(null)

  // Recipe form
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('other')
  const [formDescription, setFormDescription] = useState('')
  const [formOutputProduct, setFormOutputProduct] = useState('')
  const [formOutputQty, setFormOutputQty] = useState('1')
  const [formIngredients, setFormIngredients] = useState<RecipeIngredient[]>([])
  const [formInstructions, setFormInstructions] = useState('')
  const [formPrepTime, setFormPrepTime] = useState('')
  const [formCookTime, setFormCookTime] = useState('')
  const [formSellingPrice, setFormSellingPrice] = useState('')
  const [formRecipeStatus, setFormRecipeStatus] = useState<RecipeStatus>('draft')
  const [formAllergens, setFormAllergens] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // ── Production local state ─────────────────────────────────────────────

  const [batchSearch, setBatchSearch] = useState('')
  const [batchStatusFilter, setBatchStatusFilter] = useState<ProductionStatus | 'all'>('all')
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [deleteBatchTarget, setDeleteBatchTarget] = useState<string | null>(null)

  // Batch form
  const [batchRecipeId, setBatchRecipeId] = useState('')
  const [batchQuantity, setBatchQuantity] = useState('1')
  const [batchPlannedDate, setBatchPlannedDate] = useState(new Date().toISOString().slice(0, 10))
  const [batchNotes, setBatchNotes] = useState('')
  const [batchSaving, setBatchSaving] = useState(false)

  // ── Load data on mount ─────────────────────────────────────────────────

  useEffect(() => {
    loadRecipes(storeId)
    loadBatches(storeId)
  }, [storeId, loadRecipes, loadBatches])

  // ── Filtered recipes ───────────────────────────────────────────────────

  const filteredRecipes = useMemo(() => {
    let result = [...recipes]
    if (filterStatus !== 'all') {
      result = result.filter((r) => r.status === filterStatus)
    }
    if (filterCategory !== 'all') {
      result = result.filter((r) => r.category === filterCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.category && r.category.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          (r.tags && r.tags.some((tag) => tag.toLowerCase().includes(q)))
      )
    }
    return result
  }, [recipes, filterStatus, filterCategory, searchQuery])

  // ── Filtered batches ───────────────────────────────────────────────────

  const filteredBatches = useMemo(() => {
    let result = [...batches]
    if (batchStatusFilter !== 'all') {
      result = result.filter((b) => b.status === batchStatusFilter)
    }
    if (batchSearch.trim()) {
      const q = batchSearch.toLowerCase()
      result = result.filter(
        (b) =>
          b.batch_number.toLowerCase().includes(q) ||
          b.recipe_name.toLowerCase().includes(q) ||
          (b.produced_by_name && b.produced_by_name.toLowerCase().includes(q)) ||
          (b.notes && b.notes.toLowerCase().includes(q))
      )
    }
    return result
  }, [batches, batchStatusFilter, batchSearch])

  // ── Recipe stats ───────────────────────────────────────────────────────

  const totalRecipes = recipes.length
  const activeRecipes = useMemo(
    () => recipes.filter((r) => r.status === 'active').length,
    [recipes]
  )
  const avgCost = getAvgCost(storeId)
  const avgMargin = getAvgMargin(storeId)

  // ── Batch stats ────────────────────────────────────────────────────────

  const totalBatches = batches.length
  const plannedCount = useMemo(
    () => batches.filter((b) => b.status === 'planned').length,
    [batches]
  )
  const inProgressCount = useMemo(
    () => batches.filter((b) => b.status === 'in_progress').length,
    [batches]
  )
  const completedTodayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return batches.filter(
      (b) => b.status === 'completed' && b.completed_at && b.completed_at.slice(0, 10) === today
    ).length
  }, [batches])

  // ── Recipe form helpers ────────────────────────────────────────────────

  function resetRecipeForm() {
    setFormName('')
    setFormCategory('other')
    setFormDescription('')
    setFormOutputProduct('')
    setFormOutputQty('1')
    setFormIngredients([])
    setFormInstructions('')
    setFormPrepTime('')
    setFormCookTime('')
    setFormSellingPrice('')
    setFormRecipeStatus('draft')
    setFormAllergens('')
    setFormTags('')
    setEditingRecipe(null)
  }

  function openAddRecipeModal() {
    resetRecipeForm()
    setShowRecipeModal(true)
  }

  function openEditRecipeModal(recipe: Recipe) {
    setEditingRecipe(recipe)
    setFormName(recipe.name)
    setFormCategory(recipe.category || 'other')
    setFormDescription(recipe.description || '')
    setFormOutputProduct(recipe.output_product_name || '')
    setFormOutputQty(String(recipe.output_quantity))
    setFormIngredients(recipe.ingredients ? [...recipe.ingredients] : [])
    setFormInstructions(recipe.instructions || '')
    setFormPrepTime(recipe.prep_time_minutes != null ? String(recipe.prep_time_minutes) : '')
    setFormCookTime(recipe.cook_time_minutes != null ? String(recipe.cook_time_minutes) : '')
    setFormSellingPrice(recipe.selling_price != null ? String(recipe.selling_price) : '')
    setFormRecipeStatus(recipe.status)
    setFormAllergens(recipe.allergens ? recipe.allergens.join(', ') : '')
    setFormTags(recipe.tags ? recipe.tags.join(', ') : '')
    setShowRecipeModal(true)
  }

  function addIngredientRow() {
    setFormIngredients((prev) => [
      ...prev,
      { product_id: '', product_name: '', quantity: 0, unit: 'g', unit_cost: 0, total_cost: 0 },
    ])
  }

  function updateIngredient(index: number, field: keyof RecipeIngredient, value: string | number) {
    setFormIngredients((prev) => {
      const updated = [...prev]
      const item = { ...updated[index] }
      if (field === 'product_name') {
        item.product_name = value as string
      } else if (field === 'quantity') {
        item.quantity = Number(value) || 0
        item.total_cost = item.quantity * item.unit_cost
      } else if (field === 'unit') {
        item.unit = value as string
      } else if (field === 'unit_cost') {
        item.unit_cost = Number(value) || 0
        item.total_cost = item.quantity * item.unit_cost
      }
      updated[index] = item
      return updated
    })
  }

  function removeIngredient(index: number) {
    setFormIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  const computedTotalCost = useMemo(
    () => formIngredients.reduce((sum, ing) => sum + ing.total_cost, 0),
    [formIngredients]
  )

  const computedMargin = useMemo(() => {
    const sp = parseFloat(formSellingPrice)
    if (!sp || sp <= 0 || computedTotalCost <= 0) return 0
    return ((sp - computedTotalCost) / sp) * 100
  }, [formSellingPrice, computedTotalCost])

  async function handleSaveRecipe() {
    if (!formName.trim()) return
    setFormSaving(true)

    try {
      const parsedAllergens = formAllergens
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)
      const parsedTags = formTags
        .split(',')
        .map((tg) => tg.trim())
        .filter(Boolean)

      const sp = parseFloat(formSellingPrice) || undefined
      const tc = computedTotalCost
      const mp = sp && tc > 0 ? Math.round(((sp - tc) / sp) * 10000) / 100 : undefined

      const data: Omit<Recipe, 'id' | 'store_id' | 'synced' | 'created_at' | 'updated_at'> = {
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim() || undefined,
        output_product_name: formOutputProduct.trim() || undefined,
        output_quantity: parseInt(formOutputQty) || 1,
        ingredients: formIngredients,
        instructions: formInstructions.trim() || undefined,
        prep_time_minutes: parseInt(formPrepTime) || undefined,
        cook_time_minutes: parseInt(formCookTime) || undefined,
        total_cost: tc,
        selling_price: sp,
        margin_percent: mp,
        status: formRecipeStatus,
        allergens: parsedAllergens.length > 0 ? parsedAllergens : undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      }

      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, data)
      } else {
        await addRecipe(storeId, data)
      }

      setShowRecipeModal(false)
      resetRecipeForm()
    } catch (error) {
      console.error('[RecipesPage] Save recipe error:', error)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDeleteRecipe(id: string) {
    try {
      await deleteRecipe(id)
      setDeleteRecipeTarget(null)
    } catch (error) {
      console.error('[RecipesPage] Delete recipe error:', error)
    }
  }

  // ── Batch form helpers ─────────────────────────────────────────────────

  function resetBatchForm() {
    setBatchRecipeId('')
    setBatchQuantity('1')
    setBatchPlannedDate(new Date().toISOString().slice(0, 10))
    setBatchNotes('')
  }

  function openAddBatchModal() {
    resetBatchForm()
    setShowBatchModal(true)
  }

  async function handleSaveBatch() {
    if (!batchRecipeId) return
    setBatchSaving(true)

    try {
      const recipe = recipes.find((r) => r.id === batchRecipeId)
      if (!recipe) return

      await addBatch(storeId, {
        recipe_id: recipe.id,
        recipe_name: recipe.name,
        quantity: parseInt(batchQuantity) || 1,
        status: 'planned',
        planned_date: new Date(batchPlannedDate).toISOString(),
        notes: batchNotes.trim() || undefined,
      })

      setShowBatchModal(false)
      resetBatchForm()
    } catch (error) {
      console.error('[RecipesPage] Save batch error:', error)
    } finally {
      setBatchSaving(false)
    }
  }

  async function handleStartBatch(id: string) {
    try {
      await startProduction(id, userId, userName)
    } catch (error) {
      console.error('[RecipesPage] Start batch error:', error)
    }
  }

  async function handleCompleteBatch(id: string) {
    try {
      const batch = batches.find((b) => b.id === id)
      const recipe = batch ? recipes.find((r) => r.id === batch.recipe_id) : undefined
      const cost = recipe && batch ? recipe.total_cost * batch.quantity : undefined
      await completeProduction(id, cost)
    } catch (error) {
      console.error('[RecipesPage] Complete batch error:', error)
    }
  }

  async function handleDeleteBatch(id: string) {
    try {
      await deleteBatch(id)
      setDeleteBatchTarget(null)
    } catch (error) {
      console.error('[RecipesPage] Delete batch error:', error)
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────

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

  // ── Styles ─────────────────────────────────────────────────────────────

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

    tabBar: {
      display: 'flex',
      gap: 0,
      marginBottom: rv(16, 20, 24),
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
    } as React.CSSProperties,

    tab: (active: boolean) =>
      ({
        flex: 1,
        padding: '12px 20px',
        border: 'none',
        backgroundColor: active ? C.primary : 'transparent',
        color: active ? '#ffffff' : C.textSecondary,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'all 0.2s',
      } as React.CSSProperties),

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

    cardGrid: {
      display: 'grid',
      gridTemplateColumns: rv('1fr', '1fr 1fr', 'repeat(3, 1fr)'),
      gap: rv(10, 14, 16),
      marginBottom: rv(16, 20, 24),
    } as React.CSSProperties,

    recipeCard: {
      backgroundColor: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      padding: rv(14, 16, 18),
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'box-shadow 0.2s',
      cursor: 'default',
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
      opacity: formSaving || batchSaving ? 0.7 : 1,
    } as React.CSSProperties,

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

    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 60,
      color: C.textSecondary,
      fontSize: 15,
    } as React.CSSProperties,

    ingredientTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: 8,
    } as React.CSSProperties,

    ingTh: {
      padding: '8px 6px',
      textAlign: 'left' as const,
      fontSize: 11,
      fontWeight: 600,
      color: C.textSecondary,
      textTransform: 'uppercase' as const,
      borderBottom: `1px solid ${C.border}`,
    } as React.CSSProperties,

    ingTd: {
      padding: '6px',
      fontSize: 13,
      borderBottom: `1px solid ${C.border}`,
      verticalAlign: 'middle' as const,
    } as React.CSSProperties,

    ingInput: {
      width: '100%',
      padding: '6px 8px',
      border: `1px solid ${C.border}`,
      borderRadius: 6,
      fontSize: 13,
      color: C.text,
      backgroundColor: '#ffffff',
      outline: 'none',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,
  }

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading && recipes.length === 0 && batches.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.loadingContainer}>
          <div style={{ textAlign: 'center' }}>
            <CookingPot size={40} style={{ marginBottom: 12, color: C.primary, opacity: 0.5 }} />
            <div>Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render helpers ─────────────────────────────────────────────────────

  function renderStatCard(
    icon: React.ReactNode,
    iconBg: string,
    label: string,
    value: React.ReactNode
  ) {
    return (
      <div style={s.statCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
          <span style={s.statLabel}>{label}</span>
        </div>
        <div style={s.statValue}>{value}</div>
      </div>
    )
  }

  // ── Recipes tab render ─────────────────────────────────────────────────

  function renderRecipesTab() {
    return (
      <>
        {/* Stats */}
        <div style={s.statsGrid}>
          {renderStatCard(
            <Layers size={18} color={C.primary} />,
            C.primaryLight,
            L.totalRecipes,
            totalRecipes
          )}
          {renderStatCard(
            <CheckCircle2 size={18} color={C.success} />,
            C.successBg,
            L.activeRecipes,
            activeRecipes
          )}
          {renderStatCard(
            <DollarSign size={18} color={C.info} />,
            C.infoBg,
            L.avgCost,
            formatCurrency(avgCost, currency)
          )}
          {renderStatCard(
            <TrendingUp size={18} color={C.primary} />,
            C.primaryLight,
            L.avgMargin,
            avgMargin > 0 ? `${avgMargin.toFixed(1)}%` : '--'
          )}
        </div>

        {/* Filters */}
        <div style={s.filterBar}>
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
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as RecipeStatus | 'all')}
            style={s.selectInput}
          >
            <option value="all">{L.allStatuses}</option>
            {ALL_RECIPE_STATUSES.map((st) => (
              <option key={st} value={st}>{recipeStatusLabel(st)}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={s.selectInput}
          >
            <option value="all">{L.allCategories}</option>
            {RECIPE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{catLabel(cat)}</option>
            ))}
          </select>
        </div>

        {/* Recipe cards */}
        {recipes.length === 0 ? (
          <div style={{ ...s.tableWrapper, ...s.emptyState }}>
            <div style={s.emptyIcon}>
              <CookingPot size={48} />
            </div>
            <h3 style={s.emptyTitle}>{L.noRecipes}</h3>
            <p style={s.emptyDesc}>{L.noRecipesDesc}</p>
            <button
              style={{ ...s.addBtn, marginTop: 20 }}
              onClick={openAddRecipeModal}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.primaryDark }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary }}
            >
              <Plus size={18} />
              {L.addRecipe}
            </button>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div style={{ ...s.tableWrapper, ...s.emptyState }}>
            <div style={s.emptyIcon}>
              <Search size={48} />
            </div>
            <h3 style={s.emptyTitle}>{L.noResults}</h3>
            <p style={s.emptyDesc}>{L.noResultsDesc}</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 10, fontWeight: 500 }}>
              {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'}
            </div>
            <div style={s.cardGrid}>
              {filteredRecipes.map((recipe) => {
                const stCfg = RECIPE_STATUS_CONFIG[recipe.status]
                const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)

                return (
                  <div
                    key={recipe.id}
                    style={s.recipeCard}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
                  >
                    {/* Top: name + status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>
                        {recipe.name}
                      </div>
                      <span style={s.badge(stCfg.color, stCfg.bg)}>
                        {recipeStatusLabel(recipe.status)}
                      </span>
                    </div>

                    {/* Category */}
                    {recipe.category && (
                      <div style={{ fontSize: 12, color: C.primary, fontWeight: 600 }}>
                        {catLabel(recipe.category)}
                      </div>
                    )}

                    {/* Info row: ingredients + time */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: C.textSecondary }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Layers size={13} />
                        {recipe.ingredients.length} {L.ingredients.toLowerCase()}
                      </span>
                      {totalTime > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={13} />
                          {totalTime} min
                        </span>
                      )}
                    </div>

                    {/* Cost + Price + Margin */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 13 }}>
                      <div>
                        <span style={{ color: C.textMuted, fontSize: 11 }}>{L.totalCost}: </span>
                        <span style={{ fontWeight: 600, color: C.text }}>
                          {formatCurrency(recipe.total_cost, currency)}
                        </span>
                      </div>
                      {recipe.selling_price != null && recipe.selling_price > 0 && (
                        <div>
                          <span style={{ color: C.textMuted, fontSize: 11 }}>{L.sellingPrice}: </span>
                          <span style={{ fontWeight: 600, color: C.text }}>
                            {formatCurrency(recipe.selling_price, currency)}
                          </span>
                        </div>
                      )}
                      {recipe.margin_percent != null && (
                        <div>
                          <span style={{ color: C.textMuted, fontSize: 11 }}>{L.margin}: </span>
                          <span
                            style={{
                              fontWeight: 600,
                              color: recipe.margin_percent >= 30 ? C.success : recipe.margin_percent >= 15 ? C.warning : C.danger,
                            }}
                          >
                            {recipe.margin_percent.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 4,
                        paddingTop: 8,
                        borderTop: `1px solid ${C.border}`,
                        marginTop: 2,
                      }}
                    >
                      <button
                        onClick={() => setViewingRecipe(recipe)}
                        style={s.actionBtn(C.primary)}
                        title={L.viewRecipe}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.primaryLight }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => openEditRecipeModal(recipe)}
                        style={s.actionBtn(C.info)}
                        title={L.editRecipe}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.infoBg }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteRecipeTarget(recipe.id)}
                        style={{ ...s.actionBtn(C.danger), marginLeft: 'auto' }}
                        title={L.delete}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerBg }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </>
    )
  }

  // ── Production tab render ──────────────────────────────────────────────

  function renderProductionTab() {
    return (
      <>
        {/* Stats */}
        <div style={s.statsGrid}>
          {renderStatCard(
            <Layers size={18} color={C.primary} />,
            C.primaryLight,
            L.totalBatches,
            totalBatches
          )}
          {renderStatCard(
            <Clock size={18} color={C.info} />,
            C.infoBg,
            L.planned,
            plannedCount
          )}
          {renderStatCard(
            <PlayCircle size={18} color={C.warning} />,
            C.warningBg,
            L.inProgress,
            inProgressCount
          )}
          {renderStatCard(
            <CheckCircle2 size={18} color={C.success} />,
            C.successBg,
            L.completedToday,
            completedTodayCount
          )}
        </div>

        {/* Filters */}
        <div style={s.filterBar}>
          <div style={{ position: 'relative', flex: 1, minWidth: rv(140, 180, 220) }}>
            <Search
              size={16}
              color={C.textMuted}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder={L.search + '...'}
              value={batchSearch}
              onChange={(e) => setBatchSearch(e.target.value)}
              style={s.searchInput}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>

          <select
            value={batchStatusFilter}
            onChange={(e) => setBatchStatusFilter(e.target.value as ProductionStatus | 'all')}
            style={s.selectInput}
          >
            <option value="all">{L.allStatuses}</option>
            {ALL_PRODUCTION_STATUSES.map((st) => (
              <option key={st} value={st}>{prodStatusLabel(st)}</option>
            ))}
          </select>
        </div>

        {/* Batch list */}
        {batches.length === 0 ? (
          <div style={{ ...s.tableWrapper, ...s.emptyState }}>
            <div style={s.emptyIcon}>
              <CookingPot size={48} />
            </div>
            <h3 style={s.emptyTitle}>{L.noBatches}</h3>
            <p style={s.emptyDesc}>{L.noBatchesDesc}</p>
            <button
              style={{ ...s.addBtn, marginTop: 20 }}
              onClick={openAddBatchModal}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.primaryDark }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary }}
            >
              <Plus size={18} />
              {L.addBatch}
            </button>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div style={{ ...s.tableWrapper, ...s.emptyState }}>
            <div style={s.emptyIcon}>
              <Search size={48} />
            </div>
            <h3 style={s.emptyTitle}>{L.noBatchResults}</h3>
            <p style={s.emptyDesc}>{L.noResultsDesc}</p>
          </div>
        ) : isMobile ? (
          /* Mobile batch cards */
          <div>
            <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 10, fontWeight: 500 }}>
              {filteredBatches.length} {filteredBatches.length === 1 ? 'batch' : 'batches'}
            </div>
            {filteredBatches.map((batch) => {
              const stCfg = PRODUCTION_STATUS_CONFIG[batch.status]
              return (
                <div key={batch.id} style={s.mobileCard}>
                  <div style={s.mobileCardRow}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>
                      {batch.batch_number}
                    </span>
                    <span style={s.badge(stCfg.color, stCfg.bg)}>
                      {prodStatusLabel(batch.status)}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                    {batch.recipe_name}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: C.textSecondary, marginBottom: 8 }}>
                    <span>Qty: {batch.quantity}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={11} />
                      {formatDate(batch.planned_date)}
                    </span>
                    {batch.produced_by_name && <span>{batch.produced_by_name}</span>}
                  </div>

                  {batch.actual_cost != null && (
                    <div style={{ fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: C.textMuted }}>{L.actualCost}: </span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(batch.actual_cost, currency)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6, paddingTop: 10, borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
                    {batch.status === 'planned' && (
                      <button
                        onClick={() => handleStartBatch(batch.id)}
                        style={{
                          ...s.actionBtn(C.warning),
                          width: 'auto',
                          padding: '5px 10px',
                          fontSize: 12,
                          gap: 4,
                          display: 'inline-flex',
                        }}
                        title={L.startProduction}
                      >
                        <PlayCircle size={13} />
                      </button>
                    )}
                    {batch.status === 'in_progress' && (
                      <button
                        onClick={() => handleCompleteBatch(batch.id)}
                        style={{
                          ...s.actionBtn(C.success),
                          width: 'auto',
                          padding: '5px 10px',
                          fontSize: 12,
                          gap: 4,
                          display: 'inline-flex',
                        }}
                        title={L.completeProduction}
                      >
                        <CheckCircle2 size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteBatchTarget(batch.id)}
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
          /* Desktop batch table */
          <div style={s.tableWrapper}>
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>
              {filteredBatches.length} {filteredBatches.length === 1 ? 'batch' : 'batches'}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>{L.batchNumber}</th>
                    <th style={s.th}>{L.recipeName}</th>
                    <th style={{ ...s.th, textAlign: 'center' }}>{L.quantity}</th>
                    <th style={s.th}>{L.status}</th>
                    <th style={s.th}>{L.plannedDate}</th>
                    <th style={s.th}>{L.producedBy}</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>{L.actualCost}</th>
                    <th style={{ ...s.th, textAlign: 'center' }}>{L.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map((batch) => {
                    const stCfg = PRODUCTION_STATUS_CONFIG[batch.status]
                    return (
                      <tr
                        key={batch.id}
                        style={{ transition: 'background-color 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '' }}
                      >
                        <td style={s.td}>
                          <span style={{ fontWeight: 600, color: C.primary, fontSize: 13 }}>
                            {batch.batch_number}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={{ fontWeight: 500 }}>{batch.recipe_name}</span>
                        </td>
                        <td style={{ ...s.td, textAlign: 'center', fontWeight: 600 }}>
                          {batch.quantity}
                        </td>
                        <td style={s.td}>
                          <span style={s.badge(stCfg.color, stCfg.bg)}>
                            {prodStatusLabel(batch.status)}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                            <Clock size={13} color={C.textMuted} />
                            {formatDate(batch.planned_date)}
                          </span>
                        </td>
                        <td style={{ ...s.td, fontSize: 13, color: C.textSecondary }}>
                          {batch.produced_by_name || '--'}
                        </td>
                        <td style={{ ...s.td, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {batch.actual_cost != null ? formatCurrency(batch.actual_cost, currency) : '--'}
                        </td>
                        <td style={{ ...s.td, textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                            {batch.status === 'planned' && (
                              <button
                                onClick={() => handleStartBatch(batch.id)}
                                style={s.actionBtn(C.warning)}
                                title={L.startProduction}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.warningBg }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                              >
                                <PlayCircle size={15} />
                              </button>
                            )}
                            {batch.status === 'in_progress' && (
                              <button
                                onClick={() => handleCompleteBatch(batch.id)}
                                style={s.actionBtn(C.success)}
                                title={L.completeProduction}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.successBg }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                              >
                                <CheckCircle2 size={15} />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteBatchTarget(batch.id)}
                              style={s.actionBtn(C.danger)}
                              title={L.delete}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerBg }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
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
      </>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>
          <CookingPot size={rv(22, 26, 28)} color={C.primary} />
          {L.title}
        </h1>
        <button
          style={s.addBtn}
          onClick={activeTab === 'recipes' ? openAddRecipeModal : openAddBatchModal}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.primaryDark }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary }}
        >
          <Plus size={18} />
          {activeTab === 'recipes' ? L.addRecipe : L.addBatch}
        </button>
      </div>

      {/* Tab switcher */}
      <div style={s.tabBar}>
        <button
          style={s.tab(activeTab === 'recipes')}
          onClick={() => setActiveTab('recipes')}
        >
          <CookingPot size={16} />
          {L.recipesTab}
        </button>
        <button
          style={s.tab(activeTab === 'production')}
          onClick={() => setActiveTab('production')}
        >
          <PlayCircle size={16} />
          {L.productionTab}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'recipes' ? renderRecipesTab() : renderProductionTab()}

      {/* ── Add/Edit Recipe Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={showRecipeModal}
        onClose={() => {
          setShowRecipeModal(false)
          resetRecipeForm()
        }}
        title={editingRecipe ? L.editRecipe : L.addRecipe}
        size="lg"
      >
        {/* Name & Category */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.name} *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={L.name + '...'}
              style={s.formInput}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.category}</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              style={{ ...s.formInput, cursor: 'pointer' }}
            >
              {RECIPE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{catLabel(cat)}</option>
              ))}
            </select>
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
            onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
          />
        </div>

        {/* Output product & quantity */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.outputProduct}</label>
            <input
              type="text"
              value={formOutputProduct}
              onChange={(e) => setFormOutputProduct(e.target.value)}
              placeholder={L.outputProduct + '...'}
              style={s.formInput}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.outputQuantity}</label>
            <input
              type="number"
              min="1"
              value={formOutputQty}
              onChange={(e) => setFormOutputQty(e.target.value)}
              style={s.formInput}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>
        </div>

        {/* Ingredients */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.ingredients}</label>
          {formIngredients.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: 8 }}>
              <table style={s.ingredientTable}>
                <thead>
                  <tr>
                    <th style={s.ingTh}>{L.productName}</th>
                    <th style={{ ...s.ingTh, width: 80 }}>{L.quantity}</th>
                    <th style={{ ...s.ingTh, width: 80 }}>{L.unit}</th>
                    <th style={{ ...s.ingTh, width: 90 }}>{L.unitCost}</th>
                    <th style={{ ...s.ingTh, width: 90 }}>{L.totalCost}</th>
                    <th style={{ ...s.ingTh, width: 36 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formIngredients.map((ing, idx) => (
                    <tr key={idx}>
                      <td style={s.ingTd}>
                        <input
                          type="text"
                          value={ing.product_name}
                          onChange={(e) => updateIngredient(idx, 'product_name', e.target.value)}
                          placeholder={L.productName}
                          style={s.ingInput}
                        />
                      </td>
                      <td style={s.ingTd}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ing.quantity || ''}
                          onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                          style={s.ingInput}
                        />
                      </td>
                      <td style={s.ingTd}>
                        <select
                          value={ing.unit}
                          onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                          style={{ ...s.ingInput, cursor: 'pointer' }}
                        >
                          {INGREDIENT_UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </td>
                      <td style={s.ingTd}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ing.unit_cost || ''}
                          onChange={(e) => updateIngredient(idx, 'unit_cost', e.target.value)}
                          style={s.ingInput}
                        />
                      </td>
                      <td style={{ ...s.ingTd, fontWeight: 600, fontSize: 13, textAlign: 'right' }}>
                        {formatCurrency(ing.total_cost, currency)}
                      </td>
                      <td style={s.ingTd}>
                        <button
                          onClick={() => removeIngredient(idx)}
                          style={{
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: C.danger,
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Total cost display */}
          {formIngredients.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '8px 0',
                fontSize: 14,
                fontWeight: 700,
                color: C.text,
                borderTop: `1px solid ${C.border}`,
                marginBottom: 8,
              }}
            >
              {L.totalCost}: {formatCurrency(computedTotalCost, currency)}
            </div>
          )}

          <button
            onClick={addIngredientRow}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              border: `1px dashed ${C.primary}`,
              borderRadius: 8,
              backgroundColor: C.primaryLight,
              color: C.primary,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            {L.addIngredient}
          </button>
        </div>

        {/* Instructions */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.instructions}</label>
          <textarea
            value={formInstructions}
            onChange={(e) => setFormInstructions(e.target.value)}
            placeholder={L.instructions + '...'}
            style={{ ...s.formTextarea, minHeight: 100 }}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
          />
        </div>

        {/* Prep time & Cook time */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.prepTime}</label>
            <input
              type="number"
              min="0"
              value={formPrepTime}
              onChange={(e) => setFormPrepTime(e.target.value)}
              placeholder="0"
              style={s.formInput}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.cookTime}</label>
            <input
              type="number"
              min="0"
              value={formCookTime}
              onChange={(e) => setFormCookTime(e.target.value)}
              placeholder="0"
              style={s.formInput}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>
        </div>

        {/* Selling price & Status */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.sellingPrice}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formSellingPrice}
              onChange={(e) => setFormSellingPrice(e.target.value)}
              placeholder="0.00"
              style={s.formInput}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
            {computedMargin > 0 && (
              <div style={{ fontSize: 12, marginTop: 4, color: computedMargin >= 30 ? C.success : computedMargin >= 15 ? C.warning : C.danger, fontWeight: 600 }}>
                {L.margin}: {computedMargin.toFixed(1)}%
              </div>
            )}
          </div>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.status}</label>
            <select
              value={formRecipeStatus}
              onChange={(e) => setFormRecipeStatus(e.target.value as RecipeStatus)}
              style={{ ...s.formInput, cursor: 'pointer' }}
            >
              {ALL_RECIPE_STATUSES.map((st) => (
                <option key={st} value={st}>{recipeStatusLabel(st)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Allergens & Tags */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>
              {L.allergens}
              <span style={{ fontWeight: 400, color: C.textMuted, fontSize: 11, marginLeft: 6 }}>
                (comma-separated)
              </span>
            </label>
            <input
              type="text"
              value={formAllergens}
              onChange={(e) => setFormAllergens(e.target.value)}
              placeholder="gluten, dairy, nuts..."
              style={s.formInput}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
            {formAllergens.trim() && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {formAllergens
                  .split(',')
                  .map((a) => a.trim())
                  .filter(Boolean)
                  .map((a, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor: C.dangerBg,
                        color: C.danger,
                      }}
                    >
                      {a}
                    </span>
                  ))}
              </div>
            )}
          </div>
          <div style={s.formGroup}>
            <label style={s.formLabel}>
              {L.tags}
              <span style={{ fontWeight: 400, color: C.textMuted, fontSize: 11, marginLeft: 6 }}>
                (comma-separated)
              </span>
            </label>
            <input
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="popular, seasonal, vegan..."
              style={s.formInput}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
            {formTags.trim() && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {formTags
                  .split(',')
                  .map((tg) => tg.trim())
                  .filter(Boolean)
                  .map((tg, i) => (
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
                      {tg}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Form footer */}
        <div style={s.formFooter}>
          <button
            style={s.cancelBtn}
            onClick={() => {
              setShowRecipeModal(false)
              resetRecipeForm()
            }}
          >
            {L.cancel}
          </button>
          <button
            style={s.saveBtn}
            onClick={handleSaveRecipe}
            disabled={formSaving || !formName.trim()}
          >
            {formSaving ? 'Saving...' : L.save}
          </button>
        </div>
      </Modal>

      {/* ── View Recipe Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={viewingRecipe !== null}
        onClose={() => setViewingRecipe(null)}
        title={viewingRecipe?.name || L.viewRecipe}
        size="lg"
      >
        {viewingRecipe && (
          <div>
            {/* Status + Category */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={s.badge(RECIPE_STATUS_CONFIG[viewingRecipe.status].color, RECIPE_STATUS_CONFIG[viewingRecipe.status].bg)}>
                {recipeStatusLabel(viewingRecipe.status)}
              </span>
              {viewingRecipe.category && (
                <span style={s.badge(C.primary, C.primaryLight)}>
                  {catLabel(viewingRecipe.category)}
                </span>
              )}
            </div>

            {/* Description */}
            {viewingRecipe.description && (
              <div style={{ marginBottom: 16, fontSize: 14, color: C.textSecondary, lineHeight: 1.5 }}>
                {viewingRecipe.description}
              </div>
            )}

            {/* Output */}
            {viewingRecipe.output_product_name && (
              <div style={{ marginBottom: 16, padding: 12, backgroundColor: C.primaryLight, borderRadius: 8, fontSize: 13 }}>
                <strong>{L.outputProduct}:</strong> {viewingRecipe.output_product_name} (x{viewingRecipe.output_quantity})
              </div>
            )}

            {/* Time */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              {viewingRecipe.prep_time_minutes != null && viewingRecipe.prep_time_minutes > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.textSecondary }}>
                  <Clock size={14} color={C.info} />
                  {L.prepTime}: {viewingRecipe.prep_time_minutes} min
                </div>
              )}
              {viewingRecipe.cook_time_minutes != null && viewingRecipe.cook_time_minutes > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.textSecondary }}>
                  <Clock size={14} color={C.warning} />
                  {L.cookTime}: {viewingRecipe.cook_time_minutes} min
                </div>
              )}
            </div>

            {/* Ingredients */}
            {viewingRecipe.ingredients.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: C.text }}>
                  {L.ingredients} ({viewingRecipe.ingredients.length})
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={s.ingredientTable}>
                    <thead>
                      <tr>
                        <th style={s.ingTh}>{L.productName}</th>
                        <th style={s.ingTh}>{L.quantity}</th>
                        <th style={s.ingTh}>{L.unit}</th>
                        <th style={{ ...s.ingTh, textAlign: 'right' }}>{L.unitCost}</th>
                        <th style={{ ...s.ingTh, textAlign: 'right' }}>{L.totalCost}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingRecipe.ingredients.map((ing, idx) => (
                        <tr key={idx}>
                          <td style={s.ingTd}>{ing.product_name}</td>
                          <td style={s.ingTd}>{ing.quantity}</td>
                          <td style={s.ingTd}>{ing.unit}</td>
                          <td style={{ ...s.ingTd, textAlign: 'right' }}>
                            {formatCurrency(ing.unit_cost, currency)}
                          </td>
                          <td style={{ ...s.ingTd, textAlign: 'right', fontWeight: 600 }}>
                            {formatCurrency(ing.total_cost, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, marginTop: 6 }}>
                  {L.totalCost}: {formatCurrency(viewingRecipe.total_cost, currency)}
                </div>
              </div>
            )}

            {/* Financials */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              {viewingRecipe.selling_price != null && viewingRecipe.selling_price > 0 && (
                <div style={{ fontSize: 14 }}>
                  <span style={{ color: C.textMuted }}>{L.sellingPrice}: </span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(viewingRecipe.selling_price, currency)}</span>
                </div>
              )}
              {viewingRecipe.margin_percent != null && (
                <div style={{ fontSize: 14 }}>
                  <span style={{ color: C.textMuted }}>{L.margin}: </span>
                  <span style={{ fontWeight: 700, color: viewingRecipe.margin_percent >= 30 ? C.success : viewingRecipe.margin_percent >= 15 ? C.warning : C.danger }}>
                    {viewingRecipe.margin_percent.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* Instructions */}
            {viewingRecipe.instructions && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: C.text }}>{L.instructions}</h4>
                <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6, whiteSpace: 'pre-wrap', backgroundColor: C.bg, padding: 12, borderRadius: 8 }}>
                  {viewingRecipe.instructions}
                </div>
              </div>
            )}

            {/* Allergens */}
            {viewingRecipe.allergens && viewingRecipe.allergens.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: C.text }}>{L.allergens}</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {viewingRecipe.allergens.map((a, i) => (
                    <span key={i} style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, backgroundColor: C.dangerBg, color: C.danger }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {viewingRecipe.tags && viewingRecipe.tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: C.text }}>{L.tags}</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {viewingRecipe.tags.map((tg, i) => (
                    <span key={i} style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500, backgroundColor: C.primaryLight, color: C.primary }}>
                      {tg}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Add Batch Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showBatchModal}
        onClose={() => {
          setShowBatchModal(false)
          resetBatchForm()
        }}
        title={L.addBatch}
        size="md"
      >
        {/* Recipe selection */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.selectRecipe} *</label>
          <select
            value={batchRecipeId}
            onChange={(e) => setBatchRecipeId(e.target.value)}
            style={{ ...s.formInput, cursor: 'pointer' }}
          >
            <option value="">{L.selectRecipe}...</option>
            {recipes
              .filter((r) => r.status === 'active')
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({formatCurrency(r.total_cost, currency)})
                </option>
              ))}
          </select>
        </div>

        {/* Quantity & Planned date */}
        <div style={s.formRow}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.quantity}</label>
            <input
              type="number"
              min="1"
              value={batchQuantity}
              onChange={(e) => setBatchQuantity(e.target.value)}
              style={s.formInput}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{L.plannedDate}</label>
            <input
              type="date"
              value={batchPlannedDate}
              onChange={(e) => setBatchPlannedDate(e.target.value)}
              style={s.formInput}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
            />
          </div>
        </div>

        {/* Notes */}
        <div style={s.formGroup}>
          <label style={s.formLabel}>{L.notes}</label>
          <textarea
            value={batchNotes}
            onChange={(e) => setBatchNotes(e.target.value)}
            placeholder={L.notes + '...'}
            style={s.formTextarea}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.border }}
          />
        </div>

        {/* Form footer */}
        <div style={s.formFooter}>
          <button
            style={s.cancelBtn}
            onClick={() => {
              setShowBatchModal(false)
              resetBatchForm()
            }}
          >
            {L.cancel}
          </button>
          <button
            style={s.saveBtn}
            onClick={handleSaveBatch}
            disabled={batchSaving || !batchRecipeId}
          >
            {batchSaving ? 'Saving...' : L.save}
          </button>
        </div>
      </Modal>

      {/* ── Delete Recipe Confirmation ───────────────────────────────────── */}
      <Modal
        isOpen={deleteRecipeTarget !== null}
        onClose={() => setDeleteRecipeTarget(null)}
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
            <button style={s.cancelBtn} onClick={() => setDeleteRecipeTarget(null)}>
              {L.cancel}
            </button>
            <button
              style={{ ...s.saveBtn, backgroundColor: C.danger }}
              onClick={() => deleteRecipeTarget && handleDeleteRecipe(deleteRecipeTarget)}
            >
              {L.delete}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Batch Confirmation ────────────────────────────────────── */}
      <Modal
        isOpen={deleteBatchTarget !== null}
        onClose={() => setDeleteBatchTarget(null)}
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
            {L.deleteBatchConfirm}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button style={s.cancelBtn} onClick={() => setDeleteBatchTarget(null)}>
              {L.cancel}
            </button>
            <button
              style={{ ...s.saveBtn, backgroundColor: C.danger }}
              onClick={() => deleteBatchTarget && handleDeleteBatch(deleteBatchTarget)}
            >
              {L.delete}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
