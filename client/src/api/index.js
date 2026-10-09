import * as mockApi from './mockApi.js'
import * as httpApi from './httpApi.js'

// GitHub Pages has no API server, so its workflow enables the browser-local
// demo by default. Set VITE_USE_MOCK_API=false to use the Express API instead.
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