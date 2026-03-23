export default function RestaurantGridCard({
  restaurant,
  getRestaurantImage,
  isFavorite = false,
  favoriteActionId = null,
  onOpenDetails,
  onToggleFavorite,
  onClaim,
  showFavorite = true,
  showClaim = false,
  ownerToken = '',
  isClaimedByOwner = false,
  isClaimedByAnother = false,
}) {
  // Determine claim button state
  let claimButton = null
  if (showClaim) {
    if (isClaimedByOwner) {
      claimButton = (
        <span className="chip" style={{ background: '#22c55e', color: '#fff', padding: '0.45rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, display: 'block', textAlign: 'center' }}>
          ✓ Claimed
        </span>
      )
    } else if (isClaimedByAnother) {
      claimButton = (
        <button disabled style={{ opacity: 0.5, cursor: 'not-allowed', width: '100%' }} title="This restaurant has been claimed by another owner">
          Already Claimed
        </button>
      )
    } else {
      claimButton = (
        <button
          onClick={() => onClaim(restaurant.id)}
          disabled={!ownerToken}
          style={{ width: '100%' }}
          title={!ownerToken ? 'Owner login required to claim' : 'Claim this restaurant'}
        >
          Claim (Owner)
        </button>
      )
    }
  }

  const rawPhoto = String(restaurant?.photo_url ?? '').trim()
  const coverUrl = rawPhoto ? getRestaurantImage(restaurant) : null

  return (
    <article className="restaurant-card">
      {coverUrl && <div className="restaurant-card-cover" style={{ backgroundImage: `url(${coverUrl})` }} />}
      <div className="restaurant-card-body">
        <div className="restaurant-head">
          <h3>{restaurant.name}</h3>
          <span className="chip">{restaurant.cuisine_type}</span>
        </div>
        <p className="muted" style={{ margin: '0.2rem 0 0' }}>{restaurant.city}</p>
        {restaurant.description && (
          <p className="restaurant-card-desc">{restaurant.description}</p>
        )}
        <div className="restaurant-card-actions">
          <button onClick={() => onOpenDetails(restaurant.id)}>Open Details</button>
          {showFavorite && (
            <button
              onClick={() => onToggleFavorite(restaurant.id)}
              disabled={favoriteActionId === restaurant.id}
              style={{
                background: isFavorite ? '#e53e3e' : 'transparent',
                color: isFavorite ? '#fff' : '#e53e3e',
                border: '2px solid #e53e3e',
                borderRadius: '6px',
                padding: '0.45rem 0.8rem',
                cursor: favoriteActionId === restaurant.id ? 'wait' : 'pointer',
                fontWeight: 600,
                transition: 'all 0.15s',
                opacity: favoriteActionId === restaurant.id ? 0.6 : 1,
                width: '100%',
              }}
              title={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
            >
              {favoriteActionId === restaurant.id ? '...' : isFavorite ? '♥ Saved' : '♡ Favourite'}
            </button>
          )}
          {claimButton && (
            <div style={{ width: '100%' }}>{claimButton}</div>
          )}
        </div>
      </div>
    </article>
  )
}
