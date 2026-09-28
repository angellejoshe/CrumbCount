-- CrumbCount database schema
-- Inventory and recipe costing tables.

CREATE TABLE IF NOT EXISTS ingredients (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  stock_quantity  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  unit            TEXT NOT NULL,
  current_price   NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_price >= 0),
  reorder_level   NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
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
  quantity       NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),

  UNIQUE (recipe_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS recipe_ingredients_recipe_id_idx
  ON recipe_ingredients (recipe_id);

CREATE INDEX IF NOT EXISTS recipe_ingredients_ingredient_id_idx
  ON recipe_ingredients (ingredient_id);