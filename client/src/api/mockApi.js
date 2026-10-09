const STORAGE_KEY = 'crumbcount:personal:v2'

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))
const copy = (value) => JSON.parse(JSON.stringify(value))

function readState() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    const initialState = {
      ingredients: [],
      recipes: [],
      nextIngredientId: 1,
      nextRecipeId: 1,
    }
    writeState(initialState)
    return initialState
  }

  try {
    return JSON.parse(stored)
  } catch (error) {
    throw new Error('CrumbCount data is corrupted in this browser.', {
      cause: error,
    })
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  return state
}

function getIngredient(state, id) {
  return state.ingredients.find((ingredient) => ingredient.id === Number(id))
}

function getRecipe(state, recipe) {
  return {
    id: recipe.id,
    product_name: recipe.product_name,
    yield_amount: recipe.yield_amount,
    selling_price: recipe.selling_price,
    created_at: recipe.created_at,
    updated_at: recipe.updated_at,
    ingredients: recipe.ingredients
      .map((item) => {
        const ingredient = getIngredient(state, item.ingredientId)
        if (!ingredient) return null

        return {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          quantity: item.quantity,
          purchaseUnit: ingredient.purchase_unit,
          currentPrice: ingredient.current_price,
          quantityPerPurchaseUnit: ingredient.quantity_per_purchase_unit,
          recipeUnit: ingredient.recipe_unit,
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)),
  }
}

async function listIngredients() {
  await delay()
  return readState().ingredients
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
}

async function getIngredientById(id) {
  await delay()
  const ingredient = getIngredient(readState(), id)
  if (!ingredient) throw new Error('Ingredient not found')
  return ingredient
}

async function createIngredient(input) {
  await delay()
  const state = readState()
  const now = new Date().toISOString()
  const ingredient = {
    id: state.nextIngredientId++,
    name: input.name,
    category: input.category,
    stock_quantity: input.stockQuantity,
    purchase_unit: input.purchaseUnit,
    current_price: input.currentPrice,
    quantity_per_purchase_unit: input.quantityPerPurchaseUnit,
    recipe_unit: input.recipeUnit,
    reorder_level: input.reorderLevel,
    created_at: now,
    updated_at: now,
  }
  state.ingredients.push(ingredient)
  writeState(state)
  return ingredient
}

async function updateIngredient(id, input) {
  await delay()
  const state = readState()
  const ingredient = getIngredient(state, id)
  if (!ingredient) throw new Error('Ingredient not found')

  Object.assign(ingredient, {
    name: input.name,
    category: input.category,
    stock_quantity: input.stockQuantity,
    purchase_unit: input.purchaseUnit,
    current_price: input.currentPrice,
    quantity_per_purchase_unit: input.quantityPerPurchaseUnit,
    recipe_unit: input.recipeUnit,
    reorder_level: input.reorderLevel,
    updated_at: new Date().toISOString(),
  })
  writeState(state)
  return ingredient
}

async function updateIngredientStock(id, stockQuantity) {
  await delay()
  const state = readState()
  const ingredient = getIngredient(state, id)
  if (!ingredient) throw new Error('Ingredient not found')

  ingredient.stock_quantity = stockQuantity
  ingredient.updated_at = new Date().toISOString()
  writeState(state)
  return ingredient
}

async function updateIngredientPrice(id, currentPrice) {
  await delay()
  const state = readState()
  const ingredient = getIngredient(state, id)
  if (!ingredient) throw new Error('Ingredient not found')

  ingredient.current_price = currentPrice
  ingredient.updated_at = new Date().toISOString()
  writeState(state)
  return ingredient
}

async function deleteIngredient(id) {
  await delay()
  const state = readState()
  if (!getIngredient(state, id)) throw new Error('Ingredient not found')
  if (state.recipes.some((recipe) =>
    recipe.ingredients.some((item) => item.ingredientId === Number(id))
  )) {
    throw new Error('Ingredient is used by a recipe and cannot be deleted')
  }

  state.ingredients = state.ingredients.filter(
    (ingredient) => ingredient.id !== Number(id)
  )
  writeState(state)
}

async function listRecipes() {
  await delay()
  const state = readState()
  return state.recipes
    .slice()
    .sort((a, b) => a.product_name.localeCompare(b.product_name))
    .map((recipe) => getRecipe(state, recipe))
}

async function getRecipeById(id) {
  await delay()
  const state = readState()
  const recipe = state.recipes.find((item) => item.id === Number(id))
  if (!recipe) throw new Error('Recipe not found')
  return getRecipe(state, recipe)
}

function validateRecipeIngredients(state, ingredients) {
  for (const item of ingredients) {
    if (!getIngredient(state, item.ingredientId)) {
      throw new Error(`Ingredient ${item.ingredientId} not found`)
    }
  }
}

async function createRecipe(input) {
  await delay()
  const state = readState()
  validateRecipeIngredients(state, input.ingredients)
  const now = new Date().toISOString()
  const recipe = {
    id: state.nextRecipeId++,
    product_name: input.productName,
    yield_amount: input.yieldAmount,
    selling_price: input.sellingPrice,
    created_at: now,
    updated_at: now,
    ingredients: copy(input.ingredients),
  }
  state.recipes.push(recipe)
  writeState(state)
  return getRecipe(state, recipe)
}

async function updateRecipe(id, input) {
  await delay()
  const state = readState()
  const recipe = state.recipes.find((item) => item.id === Number(id))
  if (!recipe) throw new Error('Recipe not found')
  validateRecipeIngredients(state, input.ingredients)

  Object.assign(recipe, {
    product_name: input.productName,
    yield_amount: input.yieldAmount,
    selling_price: input.sellingPrice,
    updated_at: new Date().toISOString(),
    ingredients: copy(input.ingredients),
  })
  writeState(state)
  return getRecipe(state, recipe)
}

async function deleteRecipe(id) {
  await delay()
  const state = readState()
  if (!state.recipes.some((recipe) => recipe.id === Number(id))) {
    throw new Error('Recipe not found')
  }
  state.recipes = state.recipes.filter((recipe) => recipe.id !== Number(id))
  writeState(state)
}

export {
  listIngredients,
  getIngredientById as getIngredient,
  createIngredient,
  updateIngredient,
  updateIngredientStock,
  updateIngredientPrice,
  deleteIngredient,
  listRecipes,
  getRecipeById as getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
}
