export default function OwnerLayout({ ownerToken, currentOwner, currentPath, navigate, ownerLogout, children }) {
  // Tabs shown only when logged in as owner
  const ownerTabs = [
    { label: 'Profile', path: '/owner/profile' },
    { label: 'Add a Restaurant', path: '/owner/manage-restaurant' },
    { label: 'Edit Restaurants', path: '/owner/edit-restaurant' },
    { label: 'Claim', path: '/owner/claim' },
    { label: 'Reviews', path: '/owner/reviews' },
    { label: 'Analytics', path: '/owner/analytics' },
  ]

  // Tabs shown only when NOT logged in
  const guestTabs = [
    { label: 'Owner Login', path: '/owner/login' },
    { label: 'Owner Sign Up', path: '/owner/signup' },
  ]

  const tabs = ownerToken ? ownerTabs : guestTabs

  return (
    <div className="owner-layout stack">
      <section className="panel panel-accent owner-layout-header">
        {/* Row 1: title only — logout lives in the global top bar */}
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ margin: 0 }}>Owner Workspace</h2>
        </div>

        {/* Row 2: navigation tabs */}
        <div className="row wrap" style={{ marginTop: '0.6rem', gap: '0.4rem' }}>
          {tabs.map((link) => (
            <button
              key={link.path}
              type="button"
              className={`owner-nav-btn ${currentPath === link.path ? 'active' : ''}`}
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </button>
          ))}
        </div>
      </section>

      {children}
    </div>
  )
}
