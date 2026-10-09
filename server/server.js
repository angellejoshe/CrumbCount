import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import { pool } from './db/pool.js'
import * as crumbcount from './sightingsRepo.js'

const app = express()

const expectedToken = process.env.API_ACCESS_TOKEN
const authRequired = process.env.REQUIRE_API_AUTH === 'true' || process.env.NODE_ENV === 'production'

function requireApiAuth(request, response, next) {
  if (!authRequired) {
    return next()
  }

  if (!expectedToken) {
    console.error('API access token is not configured. Set API_ACCESS_TOKEN in the server environment.')
    return response.status(500).json({ error: 'API access is not configured on this server' })
  }

  const providedToken =
    request.headers.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.slice('Bearer '.length).trim()
      : request.headers['x-api-key'] || ''

  if (!providedToken) {
    return response.status(401).json({ error: 'Authentication required' })
  }

  const providedBuffer = Buffer.from(providedToken, 'utf8')
  const expectedBuffer = Buffer.from(expectedToken, 'utf8')

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return response.status(401).json({ error: 'Invalid API key' })
  }

  return next()
}

// Only allow the frontend origins configured for this application.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '100kb' }))
app.use((request, response, next) => {
  if (request.path === '/healthz' || request.path === '/readyz') {
    return next()
  }

  return requireApiAuth(request, response, next)
})

// --------------------------------------------------
// Health checks
// --------------------------------------------------

app.get('/healthz', (request, response) => {
  response.json({ ok: true })
})

app.get('/readyz', async (request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ ok: true, db: 'up' })
  } catch (error) {
    console.error('readyz failed:', error.message)
    response.status(503).json({ ok: false, db: 'down' })
  }
})

// --------------------------------------------------
// Validation helpers
// --------------------------------------------------

function validateId(value) {
  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    return null
  }

  return id
}

function validateIngredient(body) {
  const errors = []

  const name =
    typeof body.name === 'string' ? body.name.trim() : ''

  const category =
    typeof body.category === 'string' ? body.category.trim() : ''

  const unit =
    typeof body.unit === 'string' ? body.unit.trim() : ''

  const stockQuantity = Number(body.stockQuantity)
  const currentPrice = Number(body.currentPrice)
  const reorderLevel = Number(body.reorderLevel)

  if (!name) {
    errors.push('name is required')
  } else if (name.length > 120) {
    errors.push('name must be 120 characters or fewer')
  }

  if (!category) {
    errors.push('category is required')
  } else if (category.length > 80) {
    errors.push('category must be 80 characters or fewer')
  }

  if (!unit) {
    errors.push('unit is required')
  } else if (unit.length > 30) {
    errors.push('unit must be 30 characters or fewer')
  }

  if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
    errors.push('stockQuantity must be a non-negative number')
  }

  if (!Number.isFinite(currentPrice) || currentPrice < 0) {
    errors.push('currentPrice must be a non-negative number')
  }

  if (!Number.isFinite(reorderLevel) || reorderLevel < 0) {
    errors.push('reorderLevel must be a non-negative number')
  }

  return {
    errors,
    value: {
      name,
      category,
      stockQuantity,
      unit,
      currentPrice,
      reorderLevel,
    },
  }
}

function validateRecipe(body) {
  const errors = []

  const productName =
    typeof body.productName === 'string'
      ? body.productName.trim()
      : ''

  const yieldAmount = Number(body.yieldAmount)
  const sellingPrice = Number(body.sellingPrice)

  if (!productName) {
    errors.push('productName is required')
  } else if (productName.length > 120) {
    errors.push('productName must be 120 characters or fewer')
  }

  if (!Number.isInteger(yieldAmount) || yieldAmount <= 0) {
    errors.push('yieldAmount must be a positive whole number')
  }

  if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
    errors.push('sellingPrice must be a non-negative number')
  }

  if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
    errors.push('at least one ingredient is required')
  }

  const ingredients = Array.isArray(body.ingredients)
    ? body.ingredients.map((ingredient) => ({
        ingredientId: Number(ingredient.ingredientId),
        quantity: Number(ingredient.quantity),
      }))
    : []

  for (const ingredient of ingredients) {
    if (
      !Number.isInteger(ingredient.ingredientId) ||
      ingredient.ingredientId <= 0
    ) {
      errors.push('each ingredientId must be a positive whole number')
      break
    }

    if (!Number.isFinite(ingredient.quantity) || ingredient.quantity <= 0) {
      errors.push('each ingredient quantity must be greater than zero')
      break
    }
  }

  return {
    errors,
    value: {
      productName,
      yieldAmount,
      sellingPrice,
      ingredients,
    },
  }
}

// --------------------------------------------------
// Ingredients / Inventory API
// --------------------------------------------------

app.get('/api/ingredients', async (request, response, next) => {
  try {
    response.json(await crumbcount.getAllIngredients(pool))
  } catch (error) {
    next(error)
  }
})

app.get('/api/ingredients/:id', async (request, response, next) => {
  const id = validateId(request.params.id)

  if (!id) {
    return response.status(400).json({ error: 'Invalid ingredient id' })
  }

  try {
    const ingredient = await crumbcount.getIngredientById(pool, id)

    if (!ingredient) {
      return response.status(404).json({ error: 'Ingredient not found' })
    }

    response.json(ingredient)
  } catch (error) {
    next(error)
  }
})

app.post('/api/ingredients', async (request, response, next) => {
  const { errors, value } = validateIngredient(request.body ?? {})

  if (errors.length > 0) {
    return response.status(400).json({
      error: errors.join('; '),
    })
  }

  try {
    const ingredient = await crumbcount.createIngredient(pool, value)
    response.status(201).json(ingredient)
  } catch (error) {
    next(error)
  }
})

app.put('/api/ingredients/:id', async (request, response, next) => {
  const id = validateId(request.params.id)

  if (!id) {
    return response.status(400).json({ error: 'Invalid ingredient id' })
  }

  const { errors, value } = validateIngredient(request.body ?? {})

  if (errors.length > 0) {
    return response.status(400).json({
      error: errors.join('; '),
    })
  }

  try {
    const ingredient = await crumbcount.updateIngredient(
      pool,
      id,
      value
    )

    if (!ingredient) {
      return response.status(404).json({ error: 'Ingredient not found' })
    }

    response.json(ingredient)
  } catch (error) {
    next(error)
  }
})

app.patch('/api/ingredients/:id/stock', async (request, response, next) => {
  const id = validateId(request.params.id)

  if (!id) {
    return response.status(400).json({ error: 'Invalid ingredient id' })
  }

  const stockQuantity = Number(request.body?.stockQuantity)

  if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
    return response.status(400).json({
      error: 'stockQuantity must be a non-negative number',
    })
  }

  try {
    const ingredient = await crumbcount.updateIngredientStock(
      pool,
      id,
      stockQuantity
    )

    if (!ingredient) {
      return response.status(404).json({ error: 'Ingredient not found' })
    }

    response.json(ingredient)
  } catch (error) {
    next(error)
  }
})

app.patch('/api/ingredients/:id/price', async (request, response, next) => {
  const id = validateId(request.params.id)

  if (!id) {
    return response.status(400).json({ error: 'Invalid ingredient id' })
  }

  const currentPrice = Number(request.body?.currentPrice)

  if (!Number.isFinite(currentPrice) || currentPrice < 0) {
    return response.status(400).json({
      error: 'currentPrice must be a non-negative number',
    })
  }

  try {
    const ingredient = await crumbcount.updateIngredientPrice(
      pool,
      id,
      currentPrice
    )

    if (!ingredient) {
      return response.status(404).json({ error: 'Ingredient not found' })
    }

    response.json(ingredient)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/ingredients/:id', async (request, response, next) => {
  const id = validateId(request.params.id)

  if (!id) {
    return response.status(400).json({ error: 'Invalid ingredient id' })
  }

  try {
    const removed = await crumbcount.removeIngredient(pool, id)

    if (!removed) {
      return response.status(404).json({ error: 'Ingredient not found' })
    }

    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

// --------------------------------------------------
// Recipe Costing API
// --------------------------------------------------

app.get('/api/recipes', async (request, response, next) => {
  try {
    response.json(await crumbcount.getAllRecipes(pool))
  } catch (error) {
    next(error)
  }
})

app.get('/api/recipes/:id', async (request, response, next) => {
  const id = validateId(request.params.id)

  if (!id) {
    return response.status(400).json({ error: 'Invalid recipe id' })
  }

  try {
    const recipe = await crumbcount.getRecipeById(pool, id)

    if (!recipe) {
      return response.status(404).json({ error: 'Recipe not found' })
    }

    response.json(recipe)
  } catch (error) {
    next(error)
  }
})

app.post('/api/recipes', async (request, response, next) => {
  const { errors, value } = validateRecipe(request.body ?? {})

  if (errors.length > 0) {
    return response.status(400).json({
      error: errors.join('; '),
    })
  }

  try {
    const recipe = await crumbcount.createRecipe(pool, value)
    response.status(201).json(recipe)
  } catch (error) {
    next(error)
  }
})

app.put('/api/recipes/:id', async (request, response, next) => {
  const id = validateId(request.params.id)

  if (!id) {
    return response.status(400).json({ error: 'Invalid recipe id' })
  }

  const { errors, value } = validateRecipe(request.body ?? {})

  if (errors.length > 0) {
    return response.status(400).json({
      error: errors.join('; '),
    })
  }

  try {
    const recipe = await crumbcount.updateRecipe(
      pool,
      id,
      value
    )

    if (!recipe) {
      return response.status(404).json({ error: 'Recipe not found' })
    }

    response.json(recipe)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/recipes/:id', async (request, response, next) => {
  const id = validateId(request.params.id)

  if (!id) {
    return response.status(400).json({ error: 'Invalid recipe id' })
  }

  try {
    const removed = await crumbcount.removeRecipe(pool, id)

    if (!removed) {
      return response.status(404).json({ error: 'Recipe not found' })
    }

    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

// --------------------------------------------------
// Error handling
// --------------------------------------------------

app.use((request, response) => {
  response.status(404).json({ error: 'No such route' })
})

app.use((error, request, response, next) => {
  console.error(error)
  response.status(500).json({
    error: 'Something went wrong on the server',
  })
})

// --------------------------------------------------
// Start server
// --------------------------------------------------

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
  console.log(`CORS allows: ${allowedOrigins.join(', ')}`)
})