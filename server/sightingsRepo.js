// CrumbCount data-access layer.
// All database values are passed as parameters instead of being
// concatenated into SQL strings.

export async function getAllIngredients(pool) {
  const result = await pool.query(
    `SELECT
       id,
       name,
       category,
       stock_quantity,
       unit,
       current_price,
       reorder_level,
       created_at,
       updated_at
     FROM ingredients
     ORDER BY name ASC`
  )

  return result.rows
}

export async function getIngredientById(pool, id) {
  const result = await pool.query(
    `SELECT
       id,
       name,
       category,
       stock_quantity,
       unit,
       current_price,
       reorder_level,
       created_at,
       updated_at
     FROM ingredients
     WHERE id = $1`,
    [id]
  )

  return result.rows[0] ?? null
}

export async function createIngredient(
  pool,
  { name, category, stockQuantity, unit, currentPrice, reorderLevel }
) {
  const result = await pool.query(
    `INSERT INTO ingredients
      (name, category, stock_quantity, unit, current_price, reorder_level)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      name,
      category,
      stockQuantity,
      unit,
      currentPrice,
      reorderLevel,
    ]
  )

  return result.rows[0]
}

export async function updateIngredient(
  pool,
  id,
  { name, category, stockQuantity, unit, currentPrice, reorderLevel }
) {
  const result = await pool.query(
    `UPDATE ingredients
     SET
       name = $1,
       category = $2,
       stock_quantity = $3,
       unit = $4,
       current_price = $5,
       reorder_level = $6,
       updated_at = now()
     WHERE id = $7
     RETURNING *`,
    [
      name,
      category,
      stockQuantity,
      unit,
      currentPrice,
      reorderLevel,
      id,
    ]
  )

  return result.rows[0] ?? null
}

export async function updateIngredientStock(pool, id, stockQuantity) {
  const result = await pool.query(
    `UPDATE ingredients
     SET
       stock_quantity = $1,
       updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [stockQuantity, id]
  )

  return result.rows[0] ?? null
}

export async function updateIngredientPrice(pool, id, currentPrice) {
  const result = await pool.query(
    `UPDATE ingredients
     SET
       current_price = $1,
       updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [currentPrice, id]
  )

  return result.rows[0] ?? null
}

export async function removeIngredient(pool, id) {
  const result = await pool.query(
    `DELETE FROM ingredients
     WHERE id = $1
     RETURNING id`,
    [id]
  )

  return result.rowCount > 0
}


export async function getAllRecipes(pool) {
  const result = await pool.query(
    `SELECT
       r.id,
       r.product_name,
       r.yield_amount,
       r.selling_price,
       r.created_at,
       r.updated_at,
       COALESCE(
         json_agg(
           json_build_object(
             'ingredientId', i.id,
             'ingredientName', i.name,
             'quantity', ri.quantity,
             'unit', i.unit,
             'currentPrice', i.current_price
           )
           ORDER BY i.name
         ) FILTER (WHERE i.id IS NOT NULL),
         '[]'
       ) AS ingredients
     FROM recipe_costings r
     LEFT JOIN recipe_ingredients ri
       ON ri.recipe_id = r.id
     LEFT JOIN ingredients i
       ON i.id = ri.ingredient_id
     GROUP BY r.id
     ORDER BY r.product_name ASC`
  )

  return result.rows
}

export async function getRecipeById(pool, id) {
  const result = await pool.query(
    `SELECT
       r.id,
       r.product_name,
       r.yield_amount,
       r.selling_price,
       r.created_at,
       r.updated_at,
       COALESCE(
         json_agg(
           json_build_object(
             'ingredientId', i.id,
             'ingredientName', i.name,
             'quantity', ri.quantity,
             'unit', i.unit,
             'currentPrice', i.current_price
           )
           ORDER BY i.name
         ) FILTER (WHERE i.id IS NOT NULL),
         '[]'
       ) AS ingredients
     FROM recipe_costings r
     LEFT JOIN recipe_ingredients ri
       ON ri.recipe_id = r.id
     LEFT JOIN ingredients i
       ON i.id = ri.ingredient_id
     WHERE r.id = $1
     GROUP BY r.id`,
    [id]
  )

  return result.rows[0] ?? null
}

export async function createRecipe(
  pool,
  { productName, yieldAmount, sellingPrice, ingredients }
) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const recipeResult = await client.query(
      `INSERT INTO recipe_costings
        (product_name, yield_amount, selling_price)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [productName, yieldAmount, sellingPrice]
    )

    const recipe = recipeResult.rows[0]

    for (const ingredient of ingredients) {
      await client.query(
        `INSERT INTO recipe_ingredients
          (recipe_id, ingredient_id, quantity)
         VALUES ($1, $2, $3)`,
        [
          recipe.id,
          ingredient.ingredientId,
          ingredient.quantity,
        ]
      )
    }

    await client.query('COMMIT')

    return getRecipeById(pool, recipe.id)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function updateRecipe(
  pool,
  id,
  { productName, yieldAmount, sellingPrice, ingredients }
) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const recipeResult = await client.query(
      `UPDATE recipe_costings
       SET
         product_name = $1,
         yield_amount = $2,
         selling_price = $3,
         updated_at = now()
       WHERE id = $4
       RETURNING *`,
      [productName, yieldAmount, sellingPrice, id]
    )

    if (recipeResult.rowCount === 0) {
      await client.query('ROLLBACK')
      return null
    }

    await client.query(
      `DELETE FROM recipe_ingredients
       WHERE recipe_id = $1`,
      [id]
    )

    for (const ingredient of ingredients) {
      await client.query(
        `INSERT INTO recipe_ingredients
          (recipe_id, ingredient_id, quantity)
         VALUES ($1, $2, $3)`,
        [
          id,
          ingredient.ingredientId,
          ingredient.quantity,
        ]
      )
    }

    await client.query('COMMIT')

    return getRecipeById(pool, id)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function removeRecipe(pool, id) {
  const result = await pool.query(
    `DELETE FROM recipe_costings
     WHERE id = $1
     RETURNING id`,
    [id]
  )

  return result.rowCount > 0
}