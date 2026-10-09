import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import {
  USING_MOCK_API,
  listIngredients,
  createIngredient,
  updateIngredient,
  updateIngredientStock,
  deleteIngredient as deleteIngredientApi,
  listRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from './api/index.js'

function formatIngredientForDisplay(item) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,

    // Current stock is measured in purchased units.
    // Example: 1 pack, 2 kg, 3 bottles.
    stock: Number(item.stock_quantity),
    purchaseUnit: item.purchase_unit,

    // Price is the price of one purchased unit.
    price: `₱${Number(item.current_price).toLocaleString(
      'en-PH',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`,

    // Example: 1 pack = 1000 g.
    quantityPerPurchaseUnit: Number(
      item.quantity_per_purchase_unit
    ),

    // Unit used by recipes.
    recipeUnit: item.recipe_unit,

    reorderLevel: Number(item.reorder_level),

    updated: item.updated_at
      ? new Date(item.updated_at).toLocaleDateString('en-PH')
      : 'Just now',

    updatedAt: item.updated_at,
  }
}

export default function App() {
  const [activePage, setActivePage] =
    useState('overview')

  const [inventoryItems, setInventoryItems] =
    useState([])

  const [recipeProducts, setRecipeProducts] =
    useState([])

  useEffect(() => {
    let cancelled = false

    async function loadOverviewData() {
      try {
        const [ingredientData, recipeData] = await Promise.all([
          listIngredients(),
          listRecipes(),
        ])

        if (!cancelled) {
          setInventoryItems(
            ingredientData.map(formatIngredientForDisplay)
          )
          setRecipeProducts(
            recipeData.map(formatRecipeForDisplay)
          )
        }
      } catch (error) {
        console.error('Unable to load overview data:', error)
      }
    }

    loadOverviewData()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <main className="main-content">
        <div className="page-content">

          {activePage === 'overview' && (
            <HomePage
              inventoryItems={inventoryItems}
              recipeProducts={recipeProducts}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'inventory' && (
            <InventoryPage
              inventoryItems={inventoryItems}
              setInventoryItems={
                setInventoryItems
              }
            />
          )}

          {activePage === 'costing' && (
            <RecipeCostingPage
              inventoryItems={inventoryItems}
              recipeProducts={recipeProducts}
              setRecipeProducts={
                setRecipeProducts
              }
            />
          )}

        </div>
      </main>
    </div>
  )
}

/* =========================================
   HOME
   ========================================= */

function HomePage({
  inventoryItems,
  recipeProducts,
  onNavigate,
}) {
  const lowStock = inventoryItems.filter((item) => {
    const reorderLevel = Number(item.reorderLevel)

    if (!Number.isFinite(reorderLevel)) {
      return false
    }

    return Number(item.stock) <= reorderLevel
  })

  const inventoryValue = inventoryItems.reduce((total, item) => {
    const stock = Number(item.stock) || 0
    const price = Number(
      String(item.price).replace(/[^0-9.]/g, '')
    ) || 0

    return total + stock * price
  }, 0)

  const averagePieceProfit =
    recipeProducts.length > 0
      ? recipeProducts.reduce((total, product) => {
          const sellingPrice =
            Number(
              String(product.sellingPrice).replace(
                /[^0-9.]/g,
                ''
              )
            ) || 0

          const costPerPiece =
            Number(
              String(product.costPerPiece).replace(
                /[^0-9.]/g,
                ''
              )
            ) || 0

          return (
            total +
            Math.max(0, sellingPrice - costPerPiece)
          )
        }, 0) / recipeProducts.length
      : 0

  const formatCurrency = (value) =>
    `₱${value.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  const summaryCards = [
    {
      label: 'INVENTORY VALUE',
      value: formatCurrency(inventoryValue),
      detail: `${inventoryItems.length} ingredients tracked`,
      icon: '₱',
      tone: 'red',
    },
    {
      label: 'NEEDS A RESTOCK',
      value: String(lowStock.length).padStart(2, '0'),
      detail: 'items below reorder level',
      icon: '△',
      tone: 'yellow',
    },
    {
      label: 'RECIPE LIBRARY',
      value: String(recipeProducts.length).padStart(2, '0'),
      detail: 'costings ready to use',
      icon: '□',
      tone: 'green',
    },
    {
      label: 'AVG. PIECE PROFIT',
      value: formatCurrency(averagePieceProfit),
      detail: 'across current recipes',
      icon: '↗',
      tone: 'gray',
    },
  ]

  const lowStockDisplay = lowStock.length
    ? lowStock.slice(0, 3)
    : inventoryItems.slice(0, 3)

  const recentUpdates = inventoryItems
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.updated || 0).getTime()
      const dateB = new Date(b.updatedAt || b.updated || 0).getTime()
      return dateB - dateA
    })
    .slice(0, 4)
    .map((item, index) => ({
      text: `${item.name} inventory record`,
      time: item.updated || 'Recently updated',
      tone: ['yellow', 'green', 'red', 'gray'][index],
    }))

  return (
    <div className="overview-page">
      <header className="overview-hero">
        <div className="overview-hero-copy">
          <p className="overview-eyebrow">
            GOOD MORNING, BAKER
          </p>

          <h1 className="overview-title">
            Make the next batch
            <em>feel lighter.</em>
          </h1>

          <p className="overview-description">
            A clear view of stock and recipe numbers, so the
            behind-the-scenes stays as satisfying as the
            front counter.
          </p>
        </div>

        <button
          type="button"
          className="overview-add-button"
          onClick={() => onNavigate('inventory')}
        >
          <span>+</span>
          Add stock
        </button>
      </header>

      <section className="overview-summary-grid">
        {summaryCards.map((card) => (
          <article
            className="overview-summary-card"
            key={card.label}
          >
            <div className="overview-summary-top">
              <p>{card.label}</p>

              <span
                className={`overview-summary-icon overview-icon-${card.tone}`}
                aria-hidden="true"
              >
                {card.icon}
              </span>
            </div>

            <strong>{card.value}</strong>

            <span>{card.detail}</span>
          </article>
        ))}
      </section>

      <section className="overview-main-grid">
        <article className="overview-watch-card">
          <div className="overview-card-heading">
            <div>
              <p className="overview-section-eyebrow">
                WATCH LIST
              </p>

              <h2>Low stock, calmly handled</h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('inventory')}
            >
              View inventory →
            </button>
          </div>

          <div className="overview-stock-list">
            {lowStockDisplay.map((item) => {
              const stock = Number(item.stock) || 0
              const reorder = Number(item.reorderLevel) || 1
              const percentage = Math.min(
                100,
                Math.max(8, (stock / reorder) * 100)
              )

              return (
                <div
                  className="overview-stock-row"
                  key={item.name}
                >
                  <div className="overview-stock-icon">
                    ◇
                  </div>

                  <div className="overview-stock-content">
                    <div className="overview-stock-name-row">
                      <strong>{item.name}</strong>
                      <b>
                        {item.stock} {item.purchaseUnit}
                      </b>
                    </div>

                    <div className="overview-stock-bar">
                      <span
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <small>
                      Reorder at {item.reorderLevel ?? '—'}{' '}
                      {item.purchaseUnit}
                    </small>
                  </div>
                </div>
              )
            })}

            {!lowStockDisplay.length && (
              <p className="overview-empty">
                Your pantry is looking good. No low-stock
                items right now.
              </p>
            )}
          </div>
        </article>

        <article className="overview-quick-card">
          <p className="overview-section-eyebrow">
            QUICK MOVES
          </p>

          <h2>Keep the kitchen moving</h2>

          <div className="overview-quick-list">
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
            >
              <span className="overview-quick-icon">
                ◇
              </span>

              <span>Count incoming stock</span>

              <b>→</b>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('costing')}
            >
              <span className="overview-quick-icon">
                ▣
              </span>

              <span>Check a recipe margin</span>

              <b>→</b>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('costing')}
            >
              <span className="overview-quick-icon">
                ▥
              </span>

              <span>Review all products</span>

              <b>→</b>
            </button>
          </div>

          <div className="overview-quick-note">
            Inventory and recipe costing data are saved in
            {USING_MOCK_API
              ? ' this browser.'
              : ' the CrumbCount database.'}
          </div>
        </article>
      </section>

      <section className="overview-updates-card">
        <div className="overview-updates-heading">
          <div>
            <p className="overview-section-eyebrow">
              {USING_MOCK_API ? 'RECENT UPDATES' : 'DATABASE SNAPSHOT'}
            </p>

            <h2>Recent inventory updates</h2>
          </div>

          <span
            className="overview-clock"
            aria-hidden="true"
          >
            ◷
          </span>
        </div>

        <div className="overview-updates-grid">
          {recentUpdates.map((update) => (
            <div
              className="overview-update"
              key={update.text}
            >
              <span
                className={`overview-update-dot overview-dot-${update.tone}`}
              />

              <span>{update.text}</span>

              <small>{update.time}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/* =========================================
   INVENTORY
   ========================================= */

function InventoryPage({
  inventoryItems,
  setInventoryItems,
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] =
    useState('')
  const [stockStatus, setStockStatus] =
    useState('All stock')
  useEffect(() => {
    let cancelled = false

    async function loadIngredients() {
      try {
        setLoading(true)
        setError('')

        const data = await listIngredients()

        const formattedItems = data.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          stock: Number(item.stock_quantity),
          purchaseUnit: item.purchase_unit,
          price: `₱${Number(item.current_price).toLocaleString(
            'en-PH',
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}`,
          quantityPerPurchaseUnit: Number(
            item.quantity_per_purchase_unit
          ),
          recipeUnit: item.recipe_unit,
          reorderLevel: Number(item.reorder_level),
          updated: new Date(
            item.updated_at
          ).toLocaleDateString('en-PH'),
          updatedAt: item.updated_at,
        }))

        if (!cancelled) {
          setInventoryItems(formattedItems)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || 'Unable to load inventory.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadIngredients()

    return () => {
      cancelled = true
    }
  }, [setInventoryItems])
  const [category, setCategory] =
    useState('All categories')

  const [showAddModal, setShowAddModal] =
    useState(false)

  const [editingItem, setEditingItem] =
    useState(null)

  const categories = [
    'All categories',

    ...new Set(
      inventoryItems.map(
        (item) => item.category
      )
    ),
  ]

  const getStockStatus = (item) => {
    const stock = Number(item.stock) || 0
    const reorderLevel = Number(item.reorderLevel) || 0

    if (stock <= 0) {
      return 'Out of stock'
    }

    if (stock <= reorderLevel) {
      return 'Low stock'
    }

    return 'In stock'
  }

  const totalIngredients = inventoryItems.length
  const lowStockCount = inventoryItems.filter(
    (item) => getStockStatus(item) === 'Low stock'
  ).length
  const outOfStockCount = inventoryItems.filter(
    (item) => getStockStatus(item) === 'Out of stock'
  ).length

  const filteredItems =
    inventoryItems.filter((item) => {
      const matchesSearch =
        item.name
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesCategory =
        category === 'All categories' ||
        item.category === category

      const matchesStockStatus =
        stockStatus === 'All stock' ||
        getStockStatus(item) === stockStatus

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStockStatus
      )
    })

  const handleAddIngredient = async (newIngredient) => {
    try {
      setError('')

      const created = await createIngredient({
        name: newIngredient.name,
        category: newIngredient.category,
        stockQuantity: Number(newIngredient.stock),
        purchaseUnit: newIngredient.purchaseUnit,
        currentPrice: Number(
          String(newIngredient.price).replace(/[^0-9.]/g, '')
        ),
        quantityPerPurchaseUnit: Number(
          newIngredient.quantityPerPurchaseUnit
        ),
        recipeUnit: newIngredient.recipeUnit,
        reorderLevel: Number(newIngredient.reorderLevel),
      })

      const formattedItem = {
        id: created.id,
        name: created.name,
        category: created.category,
        stock: Number(created.stock_quantity),
        purchaseUnit: created.purchase_unit,
        price: `₱${Number(created.current_price).toLocaleString(
          'en-PH',
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}`,
        quantityPerPurchaseUnit: Number(
          created.quantity_per_purchase_unit
        ),
        recipeUnit: created.recipe_unit,
        reorderLevel: Number(created.reorder_level),
        updated: new Date(
          created.updated_at
        ).toLocaleDateString('en-PH'),
        updatedAt: created.updated_at,
      }

      setInventoryItems([
        ...inventoryItems,
        formattedItem,
      ])

      setShowAddModal(false)
    } catch (err) {
      setError(
        err.message || 'Unable to add ingredient.'
      )
    }
  }

  const increaseStock = async (item) => {
    try {
      setError('')

      const updated = await updateIngredientStock(
        item.id,
        Number(item.stock) + 1
      )

      setInventoryItems(
        inventoryItems.map((currentItem) =>
          currentItem.id === updated.id
            ? {
                ...currentItem,
                stock: Number(updated.stock_quantity),
                updated: new Date(
                  updated.updated_at
                ).toLocaleDateString('en-PH'),
              }
            : currentItem
        )
      )
    } catch (err) {
      setError(
        err.message || 'Unable to increase stock.'
      )
    }
  }

  const decreaseStock = async (item) => {
    try {
      setError('')

      const nextStock = Math.max(
        0,
        Number(item.stock) - 1
      )

      const updated = await updateIngredientStock(
        item.id,
        nextStock
      )

      setInventoryItems(
        inventoryItems.map((currentItem) =>
          currentItem.id === updated.id
            ? {
                ...currentItem,
                stock: Number(updated.stock_quantity),
                updated: new Date(
                  updated.updated_at
                ).toLocaleDateString('en-PH'),
              }
            : currentItem
        )
      )
    } catch (err) {
      setError(
        err.message || 'Unable to decrease stock.'
      )
    }
  }


  const deleteIngredient = async (item) => {
    const confirmed =
      window.confirm(
        `Delete ${item.name} from your inventory?`
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await deleteIngredientApi(item.id)

      setInventoryItems(
        inventoryItems.filter(
          (currentItem) =>
            currentItem.id !== item.id
        )
      )
    } catch (err) {
      setError(
        err.message || 'Unable to delete ingredient.'
      )
    }
  }

  const handleEditIngredient = async (
    updatedIngredient
  ) => {
    try {
      setError('')

      const currentItem = inventoryItems.find(
        (item) =>
          item.name === updatedIngredient.originalName
      )

      if (!currentItem?.id) {
        throw new Error(
          'Unable to identify the ingredient to update.'
        )
      }

      const updated = await updateIngredient(
        currentItem.id,
        {
          name: updatedIngredient.name,
          category: updatedIngredient.category,
          stockQuantity: Number(updatedIngredient.stock),
          purchaseUnit: updatedIngredient.purchaseUnit,
          currentPrice: Number(
            String(updatedIngredient.price).replace(
              /[^0-9.]/g,
              ''
            )
          ),
          quantityPerPurchaseUnit: Number(
            updatedIngredient.quantityPerPurchaseUnit
          ),
          recipeUnit: updatedIngredient.recipeUnit,
          reorderLevel: Number(
            updatedIngredient.reorderLevel ??
              currentItem.reorderLevel
          ),
        }
      )

      const formattedItem = {
        id: updated.id,
        name: updated.name,
        category: updated.category,
        stock: Number(updated.stock_quantity),
        purchaseUnit: updated.purchase_unit,
        price: `₱${Number(updated.current_price).toLocaleString(
          'en-PH',
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}`,
        quantityPerPurchaseUnit: Number(
          updated.quantity_per_purchase_unit
        ),
        recipeUnit: updated.recipe_unit,
        reorderLevel: Number(updated.reorder_level),
        updated: new Date(
          updated.updated_at
        ).toLocaleDateString('en-PH'),
        updatedAt: updated.updated_at,
      }

      setInventoryItems(
        inventoryItems.map((item) =>
          item.id === formattedItem.id
            ? formattedItem
            : item
        )
      )

      setEditingItem(null)
    } catch (err) {
      setError(
        err.message || 'Unable to update ingredient.'
      )
    }
  }

  return (
    <>
      <header className="inventory-header">
        <div>
          <p className="eyebrow">
            THE PANTRY. ON PAPER
          </p>

          <h1 className="page-title inventory-title">
            Inventory
          </h1>

          <p className="page-description">
            Trustworthy counts, current prices,
            and no mystery about what needs a
            restock.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            setShowAddModal(true)
          }
        >
          + Add ingredient
        </button>
      </header>

      <section className="inventory-summary-grid">
        <article className="inventory-summary-card">
          <span className="inventory-summary-label">TOTAL INGREDIENTS</span>
          <strong>{totalIngredients}</strong>
          <small>ingredients tracked</small>
        </article>

        <article className="inventory-summary-card inventory-summary-warning">
          <span className="inventory-summary-label">LOW STOCK</span>
          <strong>{lowStockCount}</strong>
          <small>below reorder level</small>
        </article>

        <article className="inventory-summary-card inventory-summary-danger">
          <span className="inventory-summary-label">OUT OF STOCK</span>
          <strong>{outOfStockCount}</strong>
          <small>items unavailable</small>
        </article>
      </section>

      <section className="inventory-controls">

        <label className="inventory-search">
          <span aria-hidden="true">
            ▣
          </span>

          <input
            type="search"
            placeholder="Search ingredients..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </label>

        <label className="inventory-category">
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            aria-label="Filter by category"
          >
            {categories.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>

          <span aria-hidden="true">⌄</span>
        </label>

        <label className="inventory-category">
          <select
            value={stockStatus}
            onChange={(event) =>
              setStockStatus(event.target.value)
            }
            aria-label="Filter by stock status"
          >
            <option value="All stock">All stock</option>
            <option value="In stock">In stock</option>
            <option value="Low stock">Low stock</option>
            <option value="Out of stock">Out of stock</option>
          </select>

          <span aria-hidden="true">⌄</span>
        </label>

      </section>

      <section className="ingredients-section">

        <div className="ingredients-heading">
          <h2>
            Ingredients List
          </h2>
        </div>

        <div className="inventory-table-wrapper">

          <table className="inventory-table">

            <thead>
              <tr>
                <th>
                  INGREDIENT
                </th>

                <th>
                  CATEGORY
                </th>

                <th>
                  STOCK
                </th>

                <th>
                  STATUS
                </th>

                <th>
                  PRICE / PURCHASE UNIT
                </th>

                <th>
                  UPDATED
                </th>

                <th>
                  ACTIONS
                </th>
              </tr>
            </thead>

            <tbody>

              {filteredItems.map(
                (item) => (
                  <tr
                    key={item.name}
                  >

                    <td>
                      <div className="table-ingredient">

                        <span className="table-ingredient-icon">
                          {item.name.charAt(
                            0
                          )}
                        </span>

                        <strong>
                          {item.name}
                        </strong>

                      </div>
                    </td>

                    <td>
                      {item.category}
                    </td>

                    <td className="table-stock">
                      {item.stock}{' '}
                      {item.purchaseUnit}
                    </td>

                    <td>
                      <span
                        className={`inventory-status inventory-status-${getStockStatus(item)
                          .toLowerCase()
                          .replaceAll(' ', '-')}`}
                      >
                        {getStockStatus(item)}
                      </span>
                    </td>

                    <td className="table-price">
                      {item.price}
                    </td>

                    <td>
                      {item.updated}
                    </td>

                    <td>

                      <div className="table-actions">

                        <button
                          type="button"
                          aria-label={`Decrease ${item.name}`}
                          onClick={() =>
                            decreaseStock(item)
                          }
                        >
                          −
                        </button>

                        <button
                          type="button"
                          aria-label={`Increase ${item.name}`}
                          onClick={() =>
                            increaseStock(item)
                          }
                        >
                          +
                        </button>

                        <button
                          type="button"
                          aria-label={`Edit ${item.name}`}
                          onClick={() =>
                            setEditingItem(
                              item
                            )
                          }
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          aria-label={`Delete ${item.name}`}
                          onClick={() =>
                            deleteIngredient(
                              item
                            )
                          }
                        >
                          🗑
                        </button>

                      </div>

                    </td>

                  </tr>
                )
              )}

              {filteredItems.length ===
                0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-inventory"
                  >
                    No ingredients found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </section>

      {showAddModal && (
        <AddIngredientModal
          onClose={() =>
            setShowAddModal(false)
          }
          onAdd={
            handleAddIngredient
          }
        />
      )}

      {editingItem && (
        <EditIngredientModal
          item={editingItem}
          onClose={() =>
            setEditingItem(null)
          }
          onSave={
            handleEditIngredient
          }
        />
      )}
    </>
  )
}

/* =========================================
   ADD INGREDIENT MODAL
   ========================================= */

function AddIngredientModal({
  onClose,
  onAdd,
}) {
  const [ingredientName, setIngredientName] =
    useState('')

  const [category, setCategory] =
    useState('Baking basics')

  const [stock, setStock] =
    useState('')

  const [purchaseUnit, setPurchaseUnit] =
    useState('pack')

  const [price, setPrice] =
    useState('')

  const [quantityPerPurchaseUnit, setQuantityPerPurchaseUnit] =
    useState('')

  const [recipeUnit, setRecipeUnit] =
    useState('g')

  const [reorderLevel, setReorderLevel] =
    useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    if (
      !ingredientName.trim() ||
      !stock ||
      !price ||
      !quantityPerPurchaseUnit ||
      !reorderLevel
    ) {
      return
    }

    const formattedPrice =
      `₱${Number(price).toLocaleString(
        'en-PH',
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`

    const newIngredient = {
      name: ingredientName.trim(),
      category,
      stock: Number(stock),
      purchaseUnit,
      price: formattedPrice,
      quantityPerPurchaseUnit:
        Number(quantityPerPurchaseUnit),
      recipeUnit,
      updated: 'Just now',
      reorderLevel: Number(reorderLevel),
    }

    onAdd(newIngredient)
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="ingredient-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-ingredient-title"
      >
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">
              NEW PANTRY ITEM
            </p>

            <h2 id="add-ingredient-title">
              Add an ingredient
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="ingredient-form"
        >
          <div className="ingredient-top-fields">
            <label className="modal-field">
              <span>
                INGREDIENT NAME
                <b>*</b>
              </span>

              <input
                type="text"
                placeholder="e.g. Cocoa powder"
                value={ingredientName}
                onChange={(event) =>
                  setIngredientName(event.target.value)
                }
                required
              />
            </label>

            <label className="modal-field">
              <span>
                CATEGORY
                <b>*</b>
              </span>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
              >
                <option>Baking basics</option>
                <option>Chocolate</option>
                <option>Dairy</option>
                <option>Sweeteners</option>
                <option>Dry Goods</option>
                <option>Nuts & Spreads</option>
                <option>Flavorings</option>
                <option>Other</option>
              </select>
            </label>
          </div>

          <div className="ingredient-middle-fields">
            <label className="modal-field">
              <span>
                STOCK ON HAND
                <b>*</b>
              </span>

              <input
                type="number"
                min="0"
                step="0.001"
                placeholder="0"
                value={stock}
                onChange={(event) =>
                  setStock(event.target.value)
                }
                required
              />

              <small>
                Number of purchased units currently available.
              </small>
            </label>

            <label className="modal-field">
              <span>
                PURCHASE UNIT
                <b>*</b>
              </span>

              <select
                value={purchaseUnit}
                onChange={(event) =>
                  setPurchaseUnit(event.target.value)
                }
              >
                <option value="pack">pack</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="mL">mL</option>
                <option value="bottle">bottle</option>
                <option value="piece">piece</option>
                <option value="dozen">dozen</option>
              </select>
            </label>

            <label className="modal-field">
              <span>
                PRICE PER PURCHASE UNIT
                <b>*</b>
              </span>

              <div className="price-input">
                <span>₱</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(event) =>
                    setPrice(event.target.value)
                  }
                  required
                />
              </div>
            </label>
          </div>

          <div className="ingredient-middle-fields">
            <label className="modal-field">
              <span>
                CONTENT PER PURCHASE UNIT
                <b>*</b>
              </span>

              <input
                type="number"
                min="0.001"
                step="0.001"
                placeholder="e.g. 1000"
                value={quantityPerPurchaseUnit}
                onChange={(event) =>
                  setQuantityPerPurchaseUnit(
                    event.target.value
                  )
                }
                required
              />

              <small>
                Example: 1 pack contains 1000 g.
              </small>
            </label>

            <label className="modal-field">
              <span>
                RECIPE UNIT
                <b>*</b>
              </span>

              <select
                value={recipeUnit}
                onChange={(event) =>
                  setRecipeUnit(event.target.value)
                }
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="mL">mL</option>
                <option value="L">L</option>
                <option value="pcs">pcs</option>
              </select>

              <small>
                Unit used when entering recipe quantities.
              </small>
            </label>

            <label className="modal-field">
              <span>
                REORDER WHEN BELOW
                <b>*</b>
              </span>

              <input
                type="number"
                min="0"
                step="0.001"
                placeholder="0"
                value={reorderLevel}
                onChange={(event) =>
                  setReorderLevel(event.target.value)
                }
                required
              />

              <small>
                Measured in purchase units.
              </small>
            </label>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="modal-create"
            >
              <span>✓</span>
              Add ingredient
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* =========================================
   EDIT INGREDIENT MODAL
   ========================================= */

function EditIngredientModal({
  item,
  onClose,
  onSave,
}) {
  const [ingredientName, setIngredientName] =
    useState(item.name)

  const [category, setCategory] =
    useState(item.category)

  const [stock, setStock] =
    useState(String(item.stock))

  const [purchaseUnit, setPurchaseUnit] =
    useState(item.purchaseUnit || 'pack')

  const [price, setPrice] =
    useState(
      item.price.replace(/[^0-9.]/g, '')
    )

  const [quantityPerPurchaseUnit, setQuantityPerPurchaseUnit] =
    useState(
      String(item.quantityPerPurchaseUnit ?? '')
    )

  const [recipeUnit, setRecipeUnit] =
    useState(item.recipeUnit || 'g')

  const [reorderLevel, setReorderLevel] =
    useState(String(item.reorderLevel ?? ''))

  const handleSubmit = (event) => {
    event.preventDefault()

    if (
      !ingredientName.trim() ||
      !stock ||
      !price ||
      !quantityPerPurchaseUnit
    ) {
      return
    }

    const formattedPrice =
      `₱${Number(price).toLocaleString(
        'en-PH',
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`

    onSave({
      originalName: item.name,
      name: ingredientName.trim(),
      category,
      stock: Number(stock),
      purchaseUnit,
      price: formattedPrice,
      quantityPerPurchaseUnit:
        Number(quantityPerPurchaseUnit),
      recipeUnit,
      reorderLevel: Number(reorderLevel || 0),
    })
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="ingredient-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-ingredient-title"
      >
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">
              UPDATE PANTRY ITEM
            </p>

            <h2 id="edit-ingredient-title">
              Edit ingredient
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="ingredient-form"
        >
          <div className="ingredient-top-fields">
            <label className="modal-field">
              <span>
                INGREDIENT NAME
                <b>*</b>
              </span>

              <input
                type="text"
                value={ingredientName}
                onChange={(event) =>
                  setIngredientName(event.target.value)
                }
                required
              />
            </label>

            <label className="modal-field">
              <span>
                CATEGORY
                <b>*</b>
              </span>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
              >
                <option>Baking basics</option>
                <option>Chocolate</option>
                <option>Dairy</option>
                <option>Sweeteners</option>
                <option>Dry Goods</option>
                <option>Nuts & Spreads</option>
                <option>Flavorings</option>
                <option>Other</option>
              </select>
            </label>
          </div>

          <div className="ingredient-middle-fields">
            <label className="modal-field">
              <span>
                STOCK ON HAND
                <b>*</b>
              </span>

              <input
                type="number"
                min="0"
                step="0.001"
                value={stock}
                onChange={(event) =>
                  setStock(event.target.value)
                }
                required
              />

              <small>
                Number of purchased units currently available.
              </small>
            </label>

            <label className="modal-field">
              <span>
                PURCHASE UNIT
                <b>*</b>
              </span>

              <select
                value={purchaseUnit}
                onChange={(event) =>
                  setPurchaseUnit(event.target.value)
                }
              >
                <option value="pack">pack</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="mL">mL</option>
                <option value="bottle">bottle</option>
                <option value="piece">piece</option>
                <option value="dozen">dozen</option>
              </select>
            </label>

            <label className="modal-field">
              <span>
                PRICE PER PURCHASE UNIT
                <b>*</b>
              </span>

              <div className="price-input">
                <span>₱</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) =>
                    setPrice(event.target.value)
                  }
                  required
                />
              </div>
            </label>
          </div>

          <div className="ingredient-middle-fields">
            <label className="modal-field">
              <span>
                CONTENT PER PURCHASE UNIT
                <b>*</b>
              </span>

              <input
                type="number"
                min="0.001"
                step="0.001"
                value={quantityPerPurchaseUnit}
                onChange={(event) =>
                  setQuantityPerPurchaseUnit(
                    event.target.value
                  )
                }
                required
              />

              <small>
                Example: 1 pack contains 1000 g.
              </small>
            </label>

            <label className="modal-field">
              <span>
                RECIPE UNIT
                <b>*</b>
              </span>

              <select
                value={recipeUnit}
                onChange={(event) =>
                  setRecipeUnit(event.target.value)
                }
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="mL">mL</option>
                <option value="L">L</option>
                <option value="pcs">pcs</option>
              </select>

              <small>
                Unit used when entering recipe quantities.
              </small>
            </label>

            <label className="modal-field">
              <span>
                REORDER WHEN BELOW
                <b>*</b>
              </span>

              <input
                type="number"
                min="0"
                step="0.001"
                value={reorderLevel}
                onChange={(event) =>
                  setReorderLevel(event.target.value)
                }
                required
              />

              <small>
                Measured in purchase units.
              </small>
            </label>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="modal-create"
            >
              <span>✓</span>
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* =========================================
   RECIPE COSTING PAGE
   ========================================= */

function RecipeCostingPage({
  inventoryItems,
  recipeProducts,
  setRecipeProducts,
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadRecipes() {
      try {
        setLoading(true)
        setError('')

        const data = await listRecipes()

        if (!cancelled) {
          setRecipeProducts(
            data.map(formatRecipeForDisplay)
          )
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || 'Unable to load recipe costings.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadRecipes()

    return () => {
      cancelled = true
    }
  }, [setRecipeProducts])

  const filteredProducts = recipeProducts.filter(
    (product) =>
      product.name
        .toLowerCase()
        .includes(search.toLowerCase())
  )

  const handleCreateCosting = async (recipeInput) => {
    try {
      setError('')

      const created = await createRecipe(recipeInput)
      const formattedProduct = formatRecipeForDisplay(created)

      setRecipeProducts([
        formattedProduct,
        ...recipeProducts,
      ])

      setShowModal(false)
    } catch (err) {
      setError(
        err.message || 'Unable to create recipe costing.'
      )
    }
  }

  const handleDeleteRecipe = async (product) => {
    const confirmed = window.confirm(
      `Delete ${product.name} from recipe costings?`
    )

    if (!confirmed) return

    try {
      setError('')
      await deleteRecipe(product.id)
      setRecipeProducts(
        recipeProducts.filter((item) => item.id !== product.id)
      )
    } catch (err) {
      setError(err.message || 'Unable to delete recipe costing.')
    }
  }

  const handleUpdateRecipe = async (recipeInput) => {
    try {
      setError('')
      const updated = await updateRecipe(editingRecipe.id, recipeInput)
      const formattedProduct = formatRecipeForDisplay(updated)

      setRecipeProducts(
        recipeProducts.map((item) =>
          item.id === formattedProduct.id ? formattedProduct : item
        )
      )
      setEditingRecipe(null)
    } catch (err) {
      setError(err.message || 'Unable to update recipe costing.')
    }
  }

  return (
    <>
      <header className="costing-header">
        <div>
          <p className="eyebrow">
            RECIPES THAT PAY THEIR WAY
          </p>

          <h1 className="page-title costing-title">
            Recipe costing
          </h1>

          <p className="page-description">
            See what every batch really costs today,
            using the ingredient prices in your pantry.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          + New costing
        </button>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: '#fff1f1',
            color: '#8a2d2d',
          }}
        >
          {error}
        </div>
      )}

      <section className="costing-controls">
        <label className="costing-search">
          <span aria-hidden="true">
            ▣
          </span>

          <input
            type="search"
            placeholder="Find a product..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <span className="product-count">
          {recipeProducts.length} products · live inventory prices
        </span>
      </section>

      <section className="product-grid">
        {loading && (
          <p>Loading recipe costings...</p>
        )}

        {!loading && filteredProducts.map((product) => (
          <article
            className="product-card"
            key={product.id || product.name}
          >
            <div className="product-card-header">
              <span
                className="product-icon"
                aria-hidden="true"
              />

              <div>
                <h2>{product.name}</h2>

                <p>
                  {product.ingredients} ingredients · batch of{' '}
                  {product.yield} pieces
                </p>
              </div>
            </div>

            <div className="product-cost-grid">
              <div>
                <span>BATCH COST</span>
                <strong>{product.batchCost}</strong>
              </div>

              <div>
                <span>COST / PIECE</span>
                <strong>{product.costPerPiece}</strong>
              </div>

              <div>
                <span>SELL / PIECE</span>
                <strong>{product.sellingPrice}</strong>
              </div>

              <div>
                <span>EST. MARGIN</span>
                <strong>{product.margin}</strong>
              </div>
            </div>

            <div className="product-card-footer">
              <span>
                Updated {product.updated}
              </span>

              <div className="product-card-actions">
                <button
                  type="button"
                  onClick={() => setEditingRecipe(product)}
                >
                  Edit →
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteRecipe(product)}
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}

        {!loading && !filteredProducts.length && (
          <p>No recipe costings found.</p>
        )}
      </section>

      {showModal && (
        <CreateCostingModal
          inventoryItems={inventoryItems}
          onClose={() => setShowModal(false)}
          onCreate={handleCreateCosting}
        />
      )}

      {editingRecipe && (
        <EditCostingModal
          inventoryItems={inventoryItems}
          recipe={editingRecipe}
          onClose={() => setEditingRecipe(null)}
          onUpdate={handleUpdateRecipe}
        />
      )}
    </>
  )
}

function getIngredientCostPerRecipeUnit(item) {
  const currentPrice = Number(item.currentPrice) || 0
  const quantityPerPurchaseUnit =
    Number(item.quantityPerPurchaseUnit) || 0

  if (quantityPerPurchaseUnit <= 0) {
    return 0
  }

  return currentPrice / quantityPerPurchaseUnit
}

function calculateRecipeIngredientCost(item) {
  const quantity = Number(item.quantity) || 0
  const costPerRecipeUnit =
    getIngredientCostPerRecipeUnit(item)

  return quantity * costPerRecipeUnit
}

function formatRecipeForDisplay(recipe) {
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : []

  const batchCost = ingredients.reduce(
    (total, item) =>
      total + calculateRecipeIngredientCost(item),
    0
  )

  const yieldAmount = Number(recipe.yield_amount) || 0
  const sellingPrice = Number(recipe.selling_price) || 0

  const costPerPiece =
    yieldAmount > 0
      ? batchCost / yieldAmount
      : 0

  const profitPerPiece =
    sellingPrice - costPerPiece

  const margin =
    sellingPrice > 0
      ? Math.round(
          (profitPerPiece / sellingPrice) * 100
        )
      : 0

  return {
    id: recipe.id,
    name: recipe.product_name,
    ingredients: ingredients.length,
    yield: yieldAmount,
    batchCost: `₱${batchCost.toFixed(2)}`,
    costPerPiece: `₱${costPerPiece.toFixed(2)}`,
    sellingPrice: `₱${sellingPrice.toFixed(2)}`,
    margin: `${margin}%`,

    rawIngredients: ingredients.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: item.quantity,
      purchaseUnit: item.purchaseUnit,
      currentPrice: Number(item.currentPrice) || 0,
      quantityPerPurchaseUnit:
        Number(item.quantityPerPurchaseUnit) || 0,
      recipeUnit: item.recipeUnit,
    })),

    updated: recipe.updated_at
      ? new Date(recipe.updated_at).toLocaleDateString('en-PH')
      : 'Just now',
  }
}

/* =========================================
   EDIT RECIPE COSTING MODAL
   ========================================= */

function EditCostingModal({
  inventoryItems,
  recipe,
  onClose,
  onUpdate,
}) {
  const [productName, setProductName] =
    useState(recipe.name)

  const [yieldAmount, setYieldAmount] =
    useState(String(recipe.yield))

  const [sellingPrice, setSellingPrice] =
    useState(
      String(recipe.sellingPrice).replace(
        /[^0-9.]/g,
        ''
      )
    )

  const sourceIngredients =
    Array.isArray(recipe.rawIngredients)
      ? recipe.rawIngredients
      : []

  const [ingredients, setIngredients] =
    useState(
      sourceIngredients.length
        ? sourceIngredients.map((item) => ({
            ingredientId: String(
              item.ingredientId
            ),
            quantity: String(
              item.quantity
            ),
          }))
        : [
            {
              ingredientId: String(
                inventoryItems[0]?.id || ''
              ),
              quantity: '0',
            },
          ]
    )

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        ingredientId: String(
          inventoryItems[0]?.id || ''
        ),
        quantity: '0',
      },
    ])
  }

  const removeIngredient = (index) => {
    if (ingredients.length === 1) {
      return
    }

    setIngredients(
      ingredients.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    )
  }

  const updateIngredient = (
    index,
    field,
    value
  ) => {
    setIngredients(
      ingredients.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: value,
              }
            : item
      )
    )
  }

  const getSelectedInventoryItem = (item) =>
    inventoryItems.find(
      (ingredient) =>
        String(ingredient.id) ===
        String(item.ingredientId)
    )

  const batchCost = ingredients.reduce(
    (total, item) => {
      const inventoryItem =
        getSelectedInventoryItem(item)

      if (!inventoryItem) {
        return total
      }

      const currentPrice = Number(
        String(inventoryItem.price).replace(
          /[^0-9.]/g,
          ''
        )
      ) || 0

      const quantityPerPurchaseUnit =
        Number(
          inventoryItem.quantityPerPurchaseUnit
        ) || 0

      const quantity =
        Number(item.quantity) || 0

      if (
        quantityPerPurchaseUnit <= 0
      ) {
        return total
      }

      return (
        total +
        currentPrice /
          quantityPerPurchaseUnit *
          quantity
      )
    },
    0
  )

  const numericYield =
    Number(yieldAmount) || 0

  const numericSellingPrice =
    Number(sellingPrice) || 0

  const costPerPiece =
    numericYield > 0
      ? batchCost / numericYield
      : 0

  const profitPerPiece =
    numericSellingPrice -
    costPerPiece

  const handleSubmit = (event) => {
    event.preventDefault()

    const recipeInput = {
      productName:
        productName.trim(),

      yieldAmount:
        numericYield,

      sellingPrice:
        numericSellingPrice,

      ingredients:
        ingredients
          .filter(
            (item) =>
              item.ingredientId &&
              Number(item.quantity) > 0
          )
          .map((item) => ({
            ingredientId:
              Number(item.ingredientId),
            quantity:
              Number(item.quantity),
          })),
    }

    if (
      !recipeInput.productName ||
      !recipeInput.yieldAmount ||
      !recipeInput.ingredients.length
    ) {
      return
    }

    onUpdate(recipeInput)
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <div
        className="costing-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-costing-title"
      >
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">
              UPDATE THE MATH
            </p>

            <h2 id="edit-costing-title">
              Edit recipe costing
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="modal-body"
        >
          <div className="modal-product-fields">
            <label className="modal-field">
              <span>
                PRODUCT NAME
                <b>*</b>
              </span>

              <input
                type="text"
                value={productName}
                onChange={(event) =>
                  setProductName(
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label className="modal-field">
              <span>
                PIECES PER BATCH
                <b>*</b>
              </span>

              <input
                type="number"
                min="1"
                value={yieldAmount}
                onChange={(event) =>
                  setYieldAmount(
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label className="modal-field">
              <span>
                SELLING PRICE / PIECE
                <b>*</b>
              </span>

              <div className="price-input">
                <span>₱</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sellingPrice}
                  onChange={(event) =>
                    setSellingPrice(
                      event.target.value
                    )
                  }
                  required
                />
              </div>
            </label>
          </div>

          <div className="recipe-ingredients">
            <div className="recipe-heading">
              <div>
                <h3>
                  RECIPE INGREDIENTS
                </h3>

                <p>
                  Enter the quantity using
                  the recipe unit shown below.
                </p>
              </div>

              <button
                type="button"
                className="add-ingredient-button"
                onClick={addIngredient}
              >
                + Add row
              </button>
            </div>

            <div className="recipe-table">
              {ingredients.map(
                (item, index) => {
                  const inventoryItem =
                    getSelectedInventoryItem(
                      item
                    )

                  return (
                    <div
                      className="recipe-row"
                      key={index}
                    >
                      <select
                        value={
                          item.ingredientId
                        }
                        onChange={(event) =>
                          updateIngredient(
                            index,
                            'ingredientId',
                            event.target.value
                          )
                        }
                      >
                        {inventoryItems.map(
                          (inventoryItem) => (
                            <option
                              value={
                                inventoryItem.id
                              }
                              key={
                                inventoryItem.id
                              }
                            >
                              {
                                inventoryItem.name
                              }
                            </option>
                          )
                        )}
                      </select>

                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={
                          item.quantity
                        }
                        onChange={(event) =>
                          updateIngredient(
                            index,
                            'quantity',
                            event.target.value
                          )
                        }
                      />

                      <span className="recipe-unit">
                        {inventoryItem?.recipeUnit ||
                          'unit'}
                      </span>

                      <button
                        type="button"
                        className="remove-ingredient"
                        onClick={() =>
                          removeIngredient(
                            index
                          )
                        }
                        aria-label="Remove ingredient"
                      >
                        ×
                      </button>
                    </div>
                  )
                }
              )}
            </div>
          </div>

          <div className="cost-summary">
            <div>
              <span>BATCH COST</span>
              <strong>
                ₱{batchCost.toFixed(2)}
              </strong>
            </div>

            <div>
              <span>COST / PIECE</span>
              <strong>
                ₱{costPerPiece.toFixed(2)}
              </strong>
            </div>

            <div>
              <span>
                EST. PROFIT / PIECE
              </span>
              <strong>
                ₱{profitPerPiece.toFixed(2)}
              </strong>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="modal-create"
            >
              <span>✓</span>
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* =========================================
   CREATE RECIPE COSTING MODAL
   ========================================= */

function CreateCostingModal({
  inventoryItems,
  onClose,
  onCreate,
}) {
  const [productName, setProductName] =
    useState('')

  const [yieldAmount, setYieldAmount] =
    useState('12')

  const [sellingPrice, setSellingPrice] =
    useState('')

  const [ingredients, setIngredients] =
    useState([
      {
        ingredientId:
          String(inventoryItems[0]?.id || ''),
        quantity: '0',
      },
    ])

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        ingredientId:
          String(inventoryItems[0]?.id || ''),
        quantity: '0',
      },
    ])
  }

  const removeIngredient = (index) => {
    if (ingredients.length === 1) {
      return
    }

    setIngredients(
      ingredients.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    )
  }

  const updateIngredient = (
    index,
    field,
    value
  ) => {
    setIngredients(
      ingredients.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]:
                  value,
              }
            : item
      )
    )
  }

  const getSelectedInventoryItem = (item) =>
    inventoryItems.find(
      (ingredient) =>
        String(ingredient.id) ===
        String(item.ingredientId)
    )

  const calculateCost = () => {
    return ingredients.reduce(
      (total, item) => {
        const inventoryItem =
          getSelectedInventoryItem(item)

        if (!inventoryItem) {
          return total
        }

        const numericPrice =
          Number(
            inventoryItem.price.replace(
              /[^0-9.]/g,
              ''
            )
          ) || 0

        const quantityPerPurchaseUnit =
          Number(
            inventoryItem.quantityPerPurchaseUnit
          ) || 0

        const quantity =
          Number(item.quantity) || 0

        if (
          quantityPerPurchaseUnit <= 0
        ) {
          return total
        }

        return (
          total +
          numericPrice /
            quantityPerPurchaseUnit *
            quantity
        )
      },
      0
    )
  }

  const batchCost =
    calculateCost()

  const numericYield =
    Number(yieldAmount) || 0

  const costPerPiece =
    numericYield > 0
      ? batchCost /
        numericYield
      : 0

  const numericSellingPrice =
    Number(
      sellingPrice
    ) || 0

  const profitPerPiece =
    numericSellingPrice -
    costPerPiece

  const handleSubmit = (
    event
  ) => {
    event.preventDefault()

    if (
      !productName.trim() ||
      !yieldAmount ||
      !sellingPrice
    ) {
      return
    }

    const recipeInput = {
      productName:
        productName.trim(),

      yieldAmount:
        Number(yieldAmount),

      sellingPrice:
        numericSellingPrice,

      ingredients:
        ingredients
          .filter(
            (item) =>
              item.ingredientId &&
              Number(item.quantity) > 0
          )
          .map((item) => ({
            ingredientId:
              Number(
                item.ingredientId
              ),
            quantity:
              Number(
                item.quantity
              ),
          })),
    }

    if (
      !recipeInput.ingredients.length
    ) {
      return
    }

    onCreate(recipeInput)
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <div
        className="costing-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-costing-title"
      >
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">
              MAKE THE MATH USEFUL
            </p>

            <h2 id="create-costing-title">
              Create a recipe costing
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="modal-body"
        >
          <div className="modal-product-fields">
            <label className="modal-field">
              <span>
                PRODUCT NAME
                <b>*</b>
              </span>

              <input
                type="text"
                placeholder="e.g. Sea salt cookie"
                value={productName}
                onChange={(event) =>
                  setProductName(
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label className="modal-field">
              <span>
                PIECES PER BATCH
                <b>*</b>
              </span>

              <input
                type="number"
                min="1"
                value={yieldAmount}
                onChange={(event) =>
                  setYieldAmount(
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label className="modal-field">
              <span>
                SELLING PRICE / PIECE
                <b>*</b>
              </span>

              <div className="price-input">
                <span>₱</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sellingPrice}
                  onChange={(event) =>
                    setSellingPrice(
                      event.target.value
                    )
                  }
                  required
                />
              </div>
            </label>
          </div>

          <div className="recipe-ingredients">
            <div className="recipe-heading">
              <div>
                <h3>
                  RECIPE INGREDIENTS
                </h3>

                <p>
                  Enter the quantity using
                  the recipe unit shown below.
                </p>
              </div>

              <button
                type="button"
                className="add-ingredient-button"
                onClick={
                  addIngredient
                }
              >
                + Add row
              </button>
            </div>

            <div className="recipe-table">
              {ingredients.map(
                (item, index) => {
                  const inventoryItem =
                    getSelectedInventoryItem(
                      item
                    )

                  return (
                    <div
                      className="recipe-row"
                      key={index}
                    >
                      <select
                        value={
                          item.ingredientId
                        }
                        onChange={(event) =>
                          updateIngredient(
                            index,
                            'ingredientId',
                            event.target.value
                          )
                        }
                      >
                        {inventoryItems.map(
                          (
                            inventoryItem
                          ) => (
                            <option
                              value={
                                inventoryItem.id
                              }
                              key={
                                inventoryItem.id
                              }
                            >
                              {
                                inventoryItem.name
                              }
                            </option>
                          )
                        )}
                      </select>

                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={
                          item.quantity
                        }
                        onChange={(event) =>
                          updateIngredient(
                            index,
                            'quantity',
                            event.target.value
                          )
                        }
                      />

                      <span className="recipe-unit">
                        {inventoryItem?.recipeUnit ||
                          'unit'}
                      </span>

                      <button
                        type="button"
                        className="remove-ingredient"
                        onClick={() =>
                          removeIngredient(
                            index
                          )
                        }
                        aria-label="Remove ingredient"
                      >
                        ×
                      </button>
                    </div>
                  )
                }
              )}
            </div>
          </div>

          <div className="cost-summary">
            <div>
              <span>
                BATCH COST
              </span>

              <strong>
                ₱{batchCost.toFixed(
                  2
                )}
              </strong>
            </div>

            <div>
              <span>
                COST / PIECE
              </span>

              <strong>
                ₱{costPerPiece.toFixed(
                  2
                )}
              </strong>
            </div>

            <div>
              <span>
                EST. PROFIT / PIECE
              </span>

              <strong>
                ₱{profitPerPiece.toFixed(
                  2
                )}
              </strong>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="modal-create"
            >
              <span>
                ✓
              </span>

              Create costing
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
