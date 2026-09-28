-- CrumbCount sample data for development.
--
-- This resets the development database before inserting the initial
-- inventory and recipe costing data.

TRUNCATE TABLE recipe_ingredients, recipe_costings, ingredients
RESTART IDENTITY CASCADE;


INSERT INTO ingredients
  (name, category, stock_quantity, unit, current_price, reorder_level)
VALUES
  ('White Chocolate', 'Chocolate', 2.00, 'kg', 650.00, 0.50),
  ('Butter', 'Dairy', 5.00, 'kg', 450.00, 1.00),
  ('Brown Sugar', 'Sweetener', 3.00, 'kg', 120.00, 0.50),
  ('All-Purpose Flour', 'Flour', 5.00, 'kg', 70.00, 1.00),
  ('Dark Chocolate', 'Chocolate', 2.00, 'kg', 620.00, 0.50),
  ('Pistachio Paste', 'Specialty', 1.00, 'kg', 1620.00, 0.25),
  ('Kataifi', 'Specialty', 1.00, 'kg', 1000.00, 0.25),
  ('Marshmallow', 'Sweetener', 2.70, 'kg', 580.00, 0.50);


INSERT INTO recipe_costings
  (product_name, yield_amount, selling_price)
VALUES
  ('OG Cookie', 12, 65.00),
  ('White Chocolate Cookie', 12, 70.00),
  ('Dubai Cookie', 12, 70.00);


INSERT INTO recipe_ingredients
  (recipe_id, ingredient_id, quantity)
VALUES
  (1, 2, 0.120),
  (1, 3, 0.100),
  (1, 4, 0.250),

  (2, 1, 0.150),
  (2, 2, 0.120),
  (2, 3, 0.100),
  (2, 4, 0.250),

  (3, 1, 0.100),
  (3, 2, 0.120),
  (3, 4, 0.250),
  (3, 6, 0.030),
  (3, 7, 0.020);