export default function OwnerClaimPage({
  ownerToken,
  ownerClaimRestaurantId,
  setOwnerClaimRestaurantId,
  claimRestaurantForOwner,
  ownerMessage,
  restaurants,
  ownerClaimedRestaurantIds,
  globallyClaimedRestaurantIds,
}) {
  // Show only restaurants not yet claimed by anyone
  const claimableRestaurants = restaurants.filter(
    (restaurant) => !globallyClaimedRestaurantIds.has(restaurant.id),
  )

  // Restaurants already claimed by this owner
  const myClaimedRestaurants = restaurants.filter(
    (restaurant) => ownerClaimedRestaurantIds.has(restaurant.id),
  )

  return (
    <section className="panel">
      <h2>Claim / Manage Restaurant</h2>
      {!ownerToken && <p className="info">Owner login required to claim restaurants.</p>}

      {ownerToken && (
        <>
          <div className="row wrap" style={{ marginBottom: '0.8rem' }}>
            <input
              value={ownerClaimRestaurantId}
              onChange={(event) => setOwnerClaimRestaurantId(event.target.value)}
              placeholder="Enter Restaurant ID to claim"
            />
            <button onClick={() => claimRestaurantForOwner(Number(ownerClaimRestaurantId))} disabled={!ownerToken || !ownerClaimRestaurantId}>
              Claim by ID
            </button>
          </div>

          {myClaimedRestaurants.length > 0 && (
            <>
              <h3>Your Claimed Restaurants</h3>
              <div className="list">
                {myClaimedRestaurants.map((restaurant) => (
                  <article key={`my-claimed-${restaurant.id}`} className="card">
                    <p><strong>{restaurant.name}</strong> • {restaurant.city}</p>
                    <p className="muted">ID: {restaurant.id} • {restaurant.cuisine_type}</p>
                    <span className="status-chip">Claimed by you</span>
                  </article>
                ))}
              </div>
            </>
          )}

          <h3>Available to Claim</h3>
          <div className="list">
            {claimableRestaurants.slice(0, 15).map((restaurant) => (
              <article key={`claim-${restaurant.id}`} className="card">
                <p><strong>{restaurant.name}</strong> • {restaurant.city}</p>
                <p className="muted">ID: {restaurant.id} • {restaurant.cuisine_type}</p>
                <button onClick={() => claimRestaurantForOwner(restaurant.id)}>Claim this restaurant</button>
              </article>
            ))}
            {claimableRestaurants.length === 0 && (
              <p className="info">No unclaimed restaurants available right now.</p>
            )}
          </div>
        </>
      )}

      {ownerMessage && <p className="info">{ownerMessage}</p>}
    </section>
  )
}
