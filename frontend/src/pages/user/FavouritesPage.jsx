export default function FavouritesPage({
  token,
  favoriteRestaurants,
  favoriteRestaurantIds,
  favoriteActionId,
  toggleFavorite,
  favoritesMessage,
  getRestaurantImage,
  openRestaurantDetails,
  navigate,
}) {
  if (!token) {
    return (
      <section className="panel stack" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <h2>My Favourites</h2>
        <p className="muted">You need to be logged in to view your favourite restaurants.</p>
        <button className="solid-small" style={{ alignSelf: 'center' }} onClick={() => navigate('/login')}>
          Log In
        </button>
      </section>
    )
  }

  return (
    <section className="panel stack">
      <h2>❤️ My Favourites</h2>

      {favoritesMessage && <p className="info">{favoritesMessage}</p>}

      {favoriteRestaurants.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p className="muted" style={{ fontSize: '1.1rem' }}>You haven't favourited any restaurants yet.</p>
          <p className="muted">Head to <strong>Explore</strong> and click the ♥ on any restaurant to save it here.</p>
          <button className="solid-small" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
            Explore Restaurants
          </button>
        </div>
      ) : (
        <>
          <p className="muted">{favoriteRestaurants.length} saved restaurant{favoriteRestaurants.length !== 1 ? 's' : ''}</p>
          <div className="restaurant-grid">
            {favoriteRestaurants.map((restaurant) => (
              <article key={restaurant.id} className="restaurant-card">
                <div
                  className="restaurant-card-cover"
                  style={{ backgroundImage: `url(${getRestaurantImage(restaurant)})` }}
                />
                <div className="restaurant-head">
                  <h3>{restaurant.name}</h3>
                  <span className="chip">{restaurant.cuisine_type}</span>
                </div>
                <p className="muted">{restaurant.city}</p>
                {restaurant.description && (
                  <p style={{ fontSize: '0.85rem', color: '#555' }}>{restaurant.description}</p>
                )}
                <div className="row wrap" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button onClick={() => openRestaurantDetails(restaurant.id)}>Open Details</button>
                  <button
                    onClick={() => toggleFavorite(restaurant.id)}
                    disabled={favoriteActionId === restaurant.id}
                    style={{
                      background: '#e53e3e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.4rem 0.9rem',
                      cursor: favoriteActionId === restaurant.id ? 'wait' : 'pointer',
                      opacity: favoriteActionId === restaurant.id ? 0.6 : 1,
                    }}
                    title="Remove from favourites"
                  >
                    {favoriteActionId === restaurant.id ? '...' : '♥ Remove'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
