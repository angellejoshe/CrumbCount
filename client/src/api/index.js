import * as mockApi from './mockApi.js'
import * as httpApi from './httpApi.js'

// Use the mock API only when explicitly enabled.
// The real Express API is now the default for CrumbCount.
export const USING_MOCK_API =
  import.meta.env.VITE_USE_MOCK_API === 'true'

const implementation = USING_MOCK_API ? mockApi : httpApi

export const {
  listIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  updateIngredientStock,
  updateIngredientPrice,
  deleteIngredient,
  listRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} = implementation