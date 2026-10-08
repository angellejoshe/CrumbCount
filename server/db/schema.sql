-- CrumbCount database schema
-- Inventory and recipe costing tables.

CREATE TABLE IF NOT EXISTS ingredients (
  id                           SERIAL PRIMARY KEY,
  name                         TEXT NOT NULL,
  category                     TEXT NOT NULL,

  -- How much of the purchased stock is currently available.
  -- Example: 1 pack, 2.5 kg, 3 bottles.
  stock_quantity               NUMERIC(12, 3) NOT NULL DEFAULT 0
                               CHECK (stock_quantity >= 0),

  -- Unit used when the ingredient is purchased/stored.
  -- Examples: pack, kg, bottle, piece.
  purchase_unit                TEXT NOT NULL,

  -- Price paid for one purchase unit.
  -- Example: ₱120 per pack.
  current_price                NUMERIC(12, 2) NOT NULL DEFAULT 0
                               CHECK (current_price >= 0),

  -- How many recipe units are contained in one purchase unit.
  -- Example: 1 pack = 1000 g, so this is 1000.
  quantity_per_purchase_unit  NUMERIC(12, 3) NOT NULL
                               CHECK (quantity_per_purchase_unit > 0),

  -- Unit used by recipes.
  -- Examples: g, ml, piece.
  recipe_unit                  TEXT NOT NULL,

  -- Reorder level is measured using the purchase unit.
  reorder_level                NUMERIC(12, 3) NOT NULL DEFAULT 0
                               CHECK (reorder_level >= 0),

  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ingredients_name_idx
  ON ingredients (name);

CREATE INDEX IF NOT EXISTS ingredients_category_idx
  ON ingredients (category);


CREATE TABLE IF NOT EXISTS recipe_costings (
  id             SERIAL PRIMARY KEY,
  product_name   TEXT NOT NULL,
  yield_amount   INTEGER NOT NULL CHECK (yield_amount > 0),
  selling_price  NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id             SERIAL PRIMARY KEY,
  recipe_id      INTEGER NOT NULL
                 REFERENCES recipe_costings(id)
                 ON DELETE CASCADE,

  ingredient_id  INTEGER NOT NULL
                 REFERENCES ingredients(id)
                 ON DELETE RESTRICT,

  -- Quantity is always expressed using the ingredient's recipe_unit.
  -- Example: 120 g of brown sugar = 120.
  quantity       NUMERIC(12, 3) NOT NULL
                 CHECK (quantity > 0),

  UNIQUE (recipe_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS recipe_ingredients_recipe_id_idx
  ON recipe_ingredients(recipe_id);

CREATE INDEX IF NOT EXISTS recipe_ingredients_ingredient_id_idx
  ON recipe_ingredients(ingredient_id);