import { useMemo, useState } from 'react'

export default function OwnerReviewsDashboardPage({
  ownerToken,
  ownerRestaurants,
  selectedOwnerRestaurantId,
  setSelectedOwnerRestaurantId,
  ownerRestaurantReviews,
  apiBaseUrl,
}) {
  const [minRatingFilter, setMinRatingFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')

  const visibleReviews = useMemo(() => {
    const minRating = minRatingFilter === 'all' ? null : Number(minRatingFilter)
    const filtered = ownerRestaurantReviews.filter((review) => {
      if (minRating === null) return true
      return Number(review.rating) >= minRating
    })

    const sorted = [...filtered].sort((left, right) => {
      if (sortOrder === 'highest') return Number(right.rating) - Number(left.rating)
      if (sortOrder === 'lowest') return Number(left.rating) - Number(right.rating)
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    })

    return sorted
  }, [ownerRestaurantReviews, minRatingFilter, sortOrder])

  return (
    <section className="panel">
      <h2>Reviews Dashboard (Read-Only)</h2>
      {!ownerToken && <p className="info">Owner login required.</p>}
      {ownerToken && ownerRestaurants.length > 0 && (
        <label>
          Filter by Claimed Restaurant
          <select value={selectedOwnerRestaurantId} onChange={(event) => setSelectedOwnerRestaurantId(event.target.value)}>
            {ownerRestaurants.map((restaurant) => (
              <option key={`owner-reviews-${restaurant.id}`} value={restaurant.id}>
                {restaurant.name} ({restaurant.city})
              </option>
            ))}
          </select>
        </label>
      )}

      {ownerToken && (
        <div className="row wrap">
          <label>
            Min Rating
            <select value={minRatingFilter} onChange={(event) => setMinRatingFilter(event.target.value)}>
              <option value="all">All ratings</option>
              <option value="5">5+</option>
              <option value="4">4+</option>
              <option value="3">3+</option>
              <option value="2">2+</option>
              <option value="1">1+</option>
            </select>
          </label>

          <label>
            Sort
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="newest">Newest first</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
            </select>
          </label>
        </div>
      )}

      <div className="list">
        {visibleReviews.map((review) => (
          <article key={`owner-readonly-${review.id}`} className="card">
            <p><strong>{review.user_name}</strong> • {review.rating}/5</p>
            <p>{review.comment || 'No comment'}</p>
            {review.photo_url && (
              <img
                src={review.photo_url.startsWith('http') ? review.photo_url : `${apiBaseUrl}${review.photo_url}`}
                alt="Review photo"
                style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', marginTop: '0.5rem', objectFit: 'cover', display: 'block' }}
              />
            )}
            <p className="muted">{new Date(review.created_at).toLocaleString()}</p>
          </article>
        ))}
        {ownerToken && visibleReviews.length === 0 && <p className="info">No reviews match the current filters.</p>}
      </div>
    </section>
  )
}
