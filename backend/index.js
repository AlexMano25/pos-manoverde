const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

const dataFile = path.join(__dirname, 'data.json')

const defaultData = {
  products: [
    { id: 'p1', name: 'Café Latte', price: 1500, stock: 24, category: 'Boissons', sku: 'CAF-001' },
    { id: 'p2', name: 'Sandwich Poulet', price: 2500, stock: 16, category: 'Snacking', sku: 'SND-002' },
    { id: 'p3', name: 'Eau 1.5L', price: 500, stock: 42, category: 'Boissons', sku: 'EAU-015' },
    { id: 'p4', name: 'Croissant', price: 600, stock: 18, category: 'Boulangerie', sku: 'BAK-010' }
  ],
  orders: [],
  employees: [
    { id: 'e1', name: 'Responsable', role: 'manager', phone: '+237 6XX XXX XXX' },
    { id: 'e2', name: 'Caissier', role: 'cashier' }
  ]
}

const loadData = () => {
  if (!fs.existsSync(dataFile)) return defaultData
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'))
  } catch {
    return defaultData
  }
}

const saveData = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2))
}

app.get('/', (req, res) => res.send('POS backend OK'))

app.get('/api/products', (req, res) => {
  const data = loadData()
  res.json(data.products)
})

app.post('/api/products', (req, res) => {
  const data = loadData()
  const product = { id: crypto.randomUUID(), ...req.body }
  data.products.push(product)
  saveData(data)
  res.status(201).json(product)
})

app.patch('/api/products/:id', (req, res) => {
  const data = loadData()
  const idx = data.products.findIndex((p) => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  data.products[idx] = { ...data.products[idx], ...req.body }
  saveData(data)
  res.json(data.products[idx])
})

app.delete('/api/products/:id', (req, res) => {
  const data = loadData()
  data.products = data.products.filter((p) => p.id !== req.params.id)
  saveData(data)
  res.json({ ok: true })
})

app.get('/api/orders', (req, res) => {
  const data = loadData()
  res.json(data.orders)
})

app.post('/api/orders', (req, res) => {
  const data = loadData()
  const order = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...req.body }
  data.orders.unshift(order)
  saveData(data)
  res.status(201).json(order)
})

app.get('/api/employees', (req, res) => {
  const data = loadData()
  res.json(data.employees)
})

app.get('/api/stock', (req, res) => {
  const data = loadData()
  res.json(
    data.products.map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      category: p.category
    }))
  )
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
