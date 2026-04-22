export default function OwnerProfilePage({
  ownerToken,
  ownerMessage,
  currentOwner,
}) {
  return (
    <section className="panel">
      <h2>Profile Management</h2>
      {!ownerToken && <p className="info">Owner login required to update restaurant profiles.</p>}

      {ownerToken && currentOwner && (
        <div className="stack" style={{ marginBottom: '1rem', background: 'var(--surface-accent, #f5f5f5)', padding: '0.8rem', borderRadius: '8px' }}>
          <h3>Owner Account Info</h3>
          <p><strong>Name:</strong> {currentOwner.name}</p>
          <p><strong>Email:</strong> {currentOwner.email}</p>
          <p><strong>Restaurant Location:</strong> {currentOwner.restaurant_location ?? 'Not set'}</p>
        </div>
      )}


      {currentOwner && <p className="success">Owner logged in as: {currentOwner.name}</p>}
      {ownerMessage && <p className="info">{ownerMessage}</p>}
    </section>
  )
}
