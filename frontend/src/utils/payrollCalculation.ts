// ---------------------------------------------------------------------------
// POS Mano Verde SA -- Payroll Calculation & Employee Performance Engine
// ---------------------------------------------------------------------------

import type { Order, TimeEntry, CommissionRule, User } from '../types'

// -- Employee Performance (Sales) -------------------------------------------

export type EmployeePerformance = {
  userId: string
  userName: string
  role: string
  totalSales: number        // revenue from paid orders
  orderCount: number        // number of orders processed
  avgTicket: number         // average order value
  itemsSold: number         // total items sold
  topCategory: string       // most sold category by revenue
  totalHoursWorked: number  // from time entries
  salesPerHour: number      // revenue per hour worked
  daysPresent: number       // unique days with time entries
  lateArrivals: number      // clock-ins after 9am (configurable)
  overtimeHours: number     // hours over standard daily (8h)
}

export function computeEmployeePerformance(
  users: User[],
  orders: Order[],
  timeEntries: TimeEntry[],
  periodDays: number = 30,
  standardDayHours: number = 8,
  workStartHour: number = 9,
): EmployeePerformance[] {
  const now = new Date()
  const cutoff = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

  const recentOrders = orders.filter(
    o => o.status === 'paid' && new Date(o.created_at) >= cutoff
  )

  const recentEntries = timeEntries.filter(
    e => new Date(e.created_at) >= cutoff
  )

  const results: EmployeePerformance[] = []

  for (const user of users) {
    // Sales metrics
    const userOrders = recentOrders.filter(o => o.user_id === user.id)
    const totalSales = userOrders.reduce((s, o) => s + o.total, 0)
    const orderCount = userOrders.length
    const avgTicket = orderCount > 0 ? totalSales / orderCount : 0
    const itemsSold = userOrders.reduce(
      (s, o) => s + o.items.reduce((ss, i) => ss + i.qty, 0),
      0
    )

    // Top category by revenue
    const catRevenue = new Map<string, number>()
    for (const order of userOrders) {
      for (const item of order.items) {
        const cat = (item as Record<string, unknown>).category as string || 'Other'
        catRevenue.set(cat, (catRevenue.get(cat) || 0) + item.price * item.qty)
      }
    }
    let topCategory = ''
    let maxRev = 0
    for (const [cat, rev] of catRevenue) {
      if (rev > maxRev) { topCategory = cat; maxRev = rev }
    }

    // Time & attendance metrics
    const userEntries = recentEntries.filter(e => e.user_id === user.id)
    const totalHoursWorked = userEntries.reduce((s, e) => s + (e.total_hours || 0), 0)
    const salesPerHour = totalHoursWorked > 0 ? totalSales / totalHoursWorked : 0

    // Unique days present
    const uniqueDays = new Set(
      userEntries.map(e => e.clock_in.slice(0, 10))
    )
    const daysPresent = uniqueDays.size

    // Late arrivals (clock_in after workStartHour)
    let lateArrivals = 0
    for (const entry of userEntries) {
      const clockInHour = new Date(entry.clock_in).getHours()
      if (clockInHour > workStartHour) lateArrivals++
    }

    // Overtime hours (daily hours > standardDayHours)
    const dailyHours = new Map<string, number>()
    for (const entry of userEntries) {
      const day = entry.clock_in.slice(0, 10)
      dailyHours.set(day, (dailyHours.get(day) || 0) + (entry.total_hours || 0))
    }
    let overtimeHours = 0
    for (const hours of dailyHours.values()) {
      if (hours > standardDayHours) {
        overtimeHours += hours - standardDayHours
      }
    }

    results.push({
      userId: user.id,
      userName: user.name,
      role: user.role,
      totalSales: Math.round(totalSales),
      orderCount,
      avgTicket: Math.round(avgTicket),
      itemsSold,
      topCategory,
      totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
      salesPerHour: Math.round(salesPerHour),
      daysPresent,
      lateArrivals,
      overtimeHours: Math.round(overtimeHours * 10) / 10,
    })
  }

  // Sort by totalSales descending
  return results.sort((a, b) => b.totalSales - a.totalSales)
}

// -- Payroll Computation ----------------------------------------------------

export type PayrollComputation = {
  userId: string
  userName: string
  baseSalary: number
  hoursWorked: number
  overtimeHours: number
  overtimePay: number        // overtime_hours * hourly_rate * 1.5
  commissionTotal: number
  tipsTotal: number
  grossPay: number
  deductions: number
  netPay: number
  breakdown: PayrollLineItem[]
}

export type PayrollLineItem = {
  label: string
  amount: number
  type: 'earning' | 'deduction'
}

export function computePayroll(
  user: User,
  timeEntries: TimeEntry[],
  orders: Order[],
  commissionRules: CommissionRule[],
  baseSalary: number,
  periodStart: Date,
  periodEnd: Date,
  overtimeMultiplier: number = 1.5,
  standardMonthlyHours: number = 176, // 22 days * 8 hours
  deductionRate: number = 0,          // tax/social deduction %
): PayrollComputation {
  // Filter entries within period
  const periodEntries = timeEntries.filter(e => {
    const d = new Date(e.clock_in)
    return e.user_id === user.id && d >= periodStart && d <= periodEnd
  })

  const periodOrders = orders.filter(o => {
    const d = new Date(o.created_at)
    return o.user_id === user.id && o.status === 'paid' && d >= periodStart && d <= periodEnd
  })

  // Hours & overtime
  const hoursWorked = periodEntries.reduce((s, e) => s + (e.total_hours || 0), 0)
  const standardDailyHours = 8
  const dailyHours = new Map<string, number>()
  for (const entry of periodEntries) {
    const day = entry.clock_in.slice(0, 10)
    dailyHours.set(day, (dailyHours.get(day) || 0) + (entry.total_hours || 0))
  }
  let overtimeHours = 0
  for (const hours of dailyHours.values()) {
    if (hours > standardDailyHours) {
      overtimeHours += hours - standardDailyHours
    }
  }

  const hourlyRate = standardMonthlyHours > 0 ? baseSalary / standardMonthlyHours : 0
  const overtimePay = Math.round(overtimeHours * hourlyRate * overtimeMultiplier)

  // Commission calculation
  let commissionTotal = 0
  const totalSalesRevenue = periodOrders.reduce((s, o) => s + o.total, 0)

  for (const rule of commissionRules) {
    if (!rule.is_active) continue

    // Check min_sales threshold
    if (rule.min_sales && totalSalesRevenue < rule.min_sales) continue

    if (rule.type === 'percentage') {
      // Filter by eligible categories if specified
      let eligibleRevenue = totalSalesRevenue
      if (rule.product_categories && rule.product_categories.length > 0) {
        eligibleRevenue = 0
        for (const order of periodOrders) {
          for (const item of order.items) {
            const cat = (item as Record<string, unknown>).category as string || ''
            if (rule.product_categories.includes(cat)) {
              eligibleRevenue += item.price * item.qty
            }
          }
        }
      }
      commissionTotal += Math.round(eligibleRevenue * (rule.value / 100))
    } else if (rule.type === 'fixed_per_sale') {
      commissionTotal += periodOrders.length * rule.value
    } else if (rule.type === 'tiered') {
      // Tiered: value applies as % above min_sales threshold
      if (rule.min_sales && totalSalesRevenue > rule.min_sales) {
        const excess = totalSalesRevenue - rule.min_sales
        commissionTotal += Math.round(excess * (rule.value / 100))
      }
    }
  }

  // Tips
  const tipsTotal = periodOrders.reduce(
    (s, o) => s + (o.tip_amount || 0),
    0
  )

  // Build breakdown
  const breakdown: PayrollLineItem[] = [
    { label: 'Base Salary', amount: baseSalary, type: 'earning' },
  ]

  if (overtimePay > 0) {
    breakdown.push({ label: 'Overtime', amount: overtimePay, type: 'earning' })
  }
  if (commissionTotal > 0) {
    breakdown.push({ label: 'Commission', amount: commissionTotal, type: 'earning' })
  }
  if (tipsTotal > 0) {
    breakdown.push({ label: 'Tips', amount: tipsTotal, type: 'earning' })
  }

  const grossPay = baseSalary + overtimePay + commissionTotal + tipsTotal
  const deductions = deductionRate > 0 ? Math.round(grossPay * (deductionRate / 100)) : 0

  if (deductions > 0) {
    breakdown.push({ label: 'Deductions', amount: -deductions, type: 'deduction' })
  }

  const netPay = grossPay - deductions

  return {
    userId: user.id,
    userName: user.name,
    baseSalary,
    hoursWorked: Math.round(hoursWorked * 10) / 10,
    overtimeHours: Math.round(overtimeHours * 10) / 10,
    overtimePay,
    commissionTotal,
    tipsTotal,
    grossPay,
    deductions,
    netPay,
    breakdown,
  }
}

// -- Team Summary -----------------------------------------------------------

export type TeamSummary = {
  totalEmployees: number
  activeToday: number
  avgSalesPerEmployee: number
  topPerformer: { name: string; sales: number } | null
  totalHoursToday: number
  totalSalesThisPeriod: number
}

export function computeTeamSummary(
  performances: EmployeePerformance[],
  timeEntries: TimeEntry[],
): TeamSummary {
  const today = new Date().toISOString().slice(0, 10)
  const todayEntries = timeEntries.filter(e => e.clock_in.startsWith(today))

  const activeToday = new Set(todayEntries.map(e => e.user_id)).size
  const totalHoursToday = todayEntries.reduce((s, e) => s + (e.total_hours || 0), 0)

  const totalSales = performances.reduce((s, p) => s + p.totalSales, 0)
  const avgSales = performances.length > 0 ? totalSales / performances.length : 0

  const top = performances[0] || null
  const topPerformer = top ? { name: top.userName, sales: top.totalSales } : null

  return {
    totalEmployees: performances.length,
    activeToday,
    avgSalesPerEmployee: Math.round(avgSales),
    topPerformer,
    totalHoursToday: Math.round(totalHoursToday * 10) / 10,
    totalSalesThisPeriod: totalSales,
  }
}
