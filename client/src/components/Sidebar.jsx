const navigationItems = [
  { id: 'overview', label: 'Overview', icon: '\u2302' },
  { id: 'inventory', label: 'Inventory', icon: '\u25C7' },
  { id: 'costing', label: 'Recipe costing', icon: '\u2637' },
]

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">B9</div>

        <div>
          <div className="brand-name">crumbcount</div>
          <div className="brand-subtitle">BAKEDBY912</div>
        </div>
      </div>

      <div className="sidebar-divider" />

      <p className="sidebar-label">WORKSPACE</p>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${
              activePage === item.id ? 'nav-item-active' : ''
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>

            <span>{item.label}</span>

            {activePage === item.id && (
              <span className="nav-indicator" aria-hidden="true">
                {'\u2022'}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      <div className="batch-note">
        <p className="batch-note-label">
          {'\u2726'} SMALL BATCH NOTE
        </p>

        <p>
          Keep the numbers tidy, then get back to the good part.
        </p>
      </div>
    </aside>
  )
}