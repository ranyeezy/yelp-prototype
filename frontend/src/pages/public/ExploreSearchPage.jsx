import RestaurantGridCard from '../../components/RestaurantGridCard'

export default function ExploreSearchPage({
  loadingRestaurants,
  loadRestaurants,
  restaurantQuery,
  setRestaurantQuery,
  restaurants,
  restaurantsMessage,
  favoritesMessage,
  favoriteRestaurantIds,
  favoriteActionId,
  toggleFavorite,
  claimRestaurantForOwner,
  ownerClaimedRestaurantIds,
  globallyClaimedRestaurantIds,
  ownerToken,
  getRestaurantImage,
  openRestaurantDetails,
}) {
  return (
    <>
      <section className="panel">
        <h2>Explore / Search Restaurants</h2>
        <div className="row wrap">
          <input
            placeholder="Keyword"
            value={restaurantQuery.keyword}
            onChange={(event) => setRestaurantQuery((prev) => ({ ...prev, keyword: event.target.value }))}
          />
          <input
            placeholder="City"
            value={restaurantQuery.city}
            onChange={(event) => setRestaurantQuery((prev) => ({ ...prev, city: event.target.value }))}
          />
          <input
            placeholder="Cuisine"
            value={restaurantQuery.cuisine_type}
            onChange={(event) => setRestaurantQuery((prev) => ({ ...prev, cuisine_type: event.target.value }))}
          />
          <button onClick={loadRestaurants} disabled={loadingRestaurants}>Search</button>
        </div>

        {loadingRestaurants && <p className="info">Loading restaurants...</p>}
        {restaurantsMessage && <p className="info">{restaurantsMessage}</p>}
        {favoritesMessage && <p className="info">{favoritesMessage}</p>}
        {!loadingRestaurants && restaurants.length === 0 && <p className="info">No restaurants to display yet.</p>}

        <div className="restaurant-grid">
          {restaurants.map((restaurant) => (
            <RestaurantGridCard
              key={restaurant.id}
              restaurant={restaurant}
              getRestaurantImage={getRestaurantImage}
              isFavorite={favoriteRestaurantIds.has(restaurant.id)}
              favoriteActionId={favoriteActionId}
              onOpenDetails={openRestaurantDetails}
              onToggleFavorite={toggleFavorite}
              onClaim={claimRestaurantForOwner}
              showClaim
              ownerToken={ownerToken}
              isClaimedByOwner={ownerClaimedRestaurantIds.has(restaurant.id)}
              isClaimedByAnother={
                !ownerClaimedRestaurantIds.has(restaurant.id) &&
                globallyClaimedRestaurantIds.has(restaurant.id)
              }
            />
          ))}
        </div>
      </section>
    </>
  )
}
