// The real CrumbCount client API.
// Every function here communicates with the Express backend.

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const API_KEY = import.meta.env.VITE_API_KEY

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`

    try {
      const body = await response.json()

      if (body?.error) {
        message = body.error
      }
    } catch {
      // Response was not JSON.
    }

    throw new Error(message)
  }

  return response.status === 204 ? null : response.json()
}

// --------------------------------------------------
// Ingredients / Inventory
// --------------------------------------------------

export const listIngredients = () =>
  request('/api/ingredients')

export const getIngredient = (id) =>
  request(`/api/ingredients/${id}`)

export const createIngredient = (input) =>
  request('/api/ingredients', {
    method: 'POST',
    body: JSON.stringify(input),
  })

export const updateIngredient = (id, input) =>
  request(`/api/ingredients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })

export const updateIngredientStock = (id, stockQuantity) =>
  request(`/api/ingredients/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stockQuantity }),
  })

export const updateIngredientPrice = (id, currentPrice) =>
  request(`/api/ingredients/${id}/price`, {
    method: 'PATCH',
    body: JSON.stringify({ currentPrice }),
  })

export const deleteIngredient = (id) =>
  request(`/api/ingredients/${id}`, {
    method: 'DELETE',
  })

// --------------------------------------------------
// Recipe Costing
// --------------------------------------------------

export const listRecipes = () =>
  request('/api/recipes')

export const getRecipe = (id) =>
  request(`/api/recipes/${id}`)

export const createRecipe = (input) =>
  request('/api/recipes', {
    method: 'POST',
    body: JSON.stringify(input),
  })

export const updateRecipe = (id, input) =>
  request(`/api/recipes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })

export const deleteRecipe = (id) =>
  request(`/api/recipes/${id}`, {
    method: 'DELETE',
  })