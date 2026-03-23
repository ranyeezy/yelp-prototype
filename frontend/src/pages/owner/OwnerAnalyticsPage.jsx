import { useMemo } from 'react'

export default function OwnerAnalyticsPage({
  ownerToken,
  ownerDashboard,
  ownerRestaurants,
  getRestaurantImage,
  selectedOwnerRestaurantId,
  setSelectedOwnerRestaurantId,
  ownerRestaurantReviews,
}) {
  const selectedRestaurant = useMemo(
    () => ownerRestaurants.find((restaurant) => String(restaurant.id) === String(selectedOwnerRestaurantId)) ?? null,
    [ownerRestaurants, selectedOwnerRestaurantId],
  )

  const restaurantSentiment = useMemo(() => {
    if (!ownerRestaurantReviews.length) {
      return {
        positive: 0,
        neutral: 0,
        negative: 0,
        label: 'Neutral',
      }
    }

    let positive = 0
    let neutral = 0
    let negative = 0

    ownerRestaurantReviews.forEach((review) => {
      const rating = Number(review.rating)
      if (rating >= 4) positive += 1
      else if (rating <= 2) negative += 1
      else neutral += 1
    })

    let label = 'Neutral'
    if (positive > Math.max(neutral, negative)) label = 'Mostly Positive'
    if (negative > Math.max(neutral, positive)) label = 'Mostly Negative'

    return { positive, neutral, negative, label }
  }, [ownerRestaurantReviews])

  return (
    <>
      <section className="panel">
        <h2>Owner Analytics Dashboard</h2>
        {!ownerToken && <p className="info">Owner login required to view analytics.</p>}
        {ownerDashboard && (
          <div className="stats-grid">
            <article className="metric-card">
              <span>Claimed</span>
              <strong>{ownerDashboard.claimed_restaurants}</strong>
            </article>
            <article className="metric-card">
              <span>Total Views (Favorites Proxy)</span>
              <strong>{ownerDashboard.total_views ?? 0}</strong>
            </article>
            <article className="metric-card">
              <span>Total Reviews</span>
              <strong>{ownerDashboard.total_reviews}</strong>
            </article>
            <article className="metric-card">
              <span>Avg Rating</span>
              <strong>{ownerDashboard.avg_rating ?? 'N/A'}</strong>
            </article>
          </div>
        )}

        {ownerDashboard && (
          <div className="stack" style={{ marginTop: '0.8rem' }}>
            <h3>Ratings Distribution</h3>
            <p className="muted">
              5★: {ownerDashboard.ratings_distribution?.['5'] ?? 0} •
              {' '}4★: {ownerDashboard.ratings_distribution?.['4'] ?? 0} •
              {' '}3★: {ownerDashboard.ratings_distribution?.['3'] ?? 0} •
              {' '}2★: {ownerDashboard.ratings_distribution?.['2'] ?? 0} •
              {' '}1★: {ownerDashboard.ratings_distribution?.['1'] ?? 0}
            </p>

            <h3>Public Sentiment</h3>
            <p className="muted">
              {ownerDashboard.sentiment_summary} (Positive: {ownerDashboard.positive_reviews ?? 0},
              {' '}Neutral: {ownerDashboard.neutral_reviews ?? 0}, Negative: {ownerDashboard.negative_reviews ?? 0})
            </p>
          </div>
        )}

        {ownerDashboard?.recent_reviews?.length > 0 && (
          <div className="list">
            <h3>Recent Reviews</h3>
            {ownerDashboard.recent_reviews.map((item) => (
              <article key={`owner-review-${item.review_id}`} className="card">
                <p><strong>{item.restaurant_name}</strong> • {item.rating}/5</p>
                <p>{item.comment || 'No comment'}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {ownerToken && ownerRestaurants.length > 0 && (
        <section className="panel">
          <h2>Restaurant-Level Analytics</h2>

          <label>
            Select Claimed Restaurant
            <select value={selectedOwnerRestaurantId} onChange={(event) => setSelectedOwnerRestaurantId(event.target.value)}>
              {ownerRestaurants.map((restaurant) => (
                <option key={`owner-analytics-${restaurant.id}`} value={restaurant.id}>
                  {restaurant.name} ({restaurant.city})
                </option>
              ))}
            </select>
          </label>

          {selectedRestaurant && (
            <div className="stats-grid">
              <article className="metric-card">
                <span>Restaurant</span>
                <strong>{selectedRestaurant.name}</strong>
              </article>
              <article className="metric-card">
                <span>Avg Rating</span>
                <strong>{selectedRestaurant.avg_rating ?? 'N/A'}</strong>
              </article>
              <article className="metric-card">
                <span>Review Count</span>
                <strong>{selectedRestaurant.review_count ?? 0}</strong>
              </article>
            </div>
          )}

          <p className="muted" style={{ marginTop: '0.6rem' }}>
            Sentiment: {restaurantSentiment.label} (Positive: {restaurantSentiment.positive}, Neutral: {restaurantSentiment.neutral}, Negative: {restaurantSentiment.negative})
          </p>

          <div className="list">
            <h3>Recent Reviews (Selected Restaurant)</h3>
            {ownerRestaurantReviews.slice(0, 10).map((review) => (
              <article key={`selected-review-${review.id}`} className="card">
                <p><strong>{review.user_name}</strong> • {review.rating}/5</p>
                <p>{review.comment || 'No comment'}</p>
                <p className="muted">{new Date(review.created_at).toLocaleString()}</p>
              </article>
            ))}
            {ownerRestaurantReviews.length === 0 && <p className="info">No reviews yet for selected restaurant.</p>}
          </div>
        </section>
      )}

      {ownerToken && ownerRestaurants.length > 0 && (
        <section className="panel">
          <h2>Claimed Restaurants Snapshot</h2>
          <div className="restaurant-grid">
            {ownerRestaurants.map((restaurant) => (
              <article key={`owner-${restaurant.id}`} className="restaurant-card">
                <div className="restaurant-card-cover" style={{ backgroundImage: `url(${getRestaurantImage(restaurant)})` }} />
                <h3>{restaurant.name}</h3>
                <p className="muted">{restaurant.cuisine_type} • {restaurant.city}</p>
                <p>Avg Rating: {restaurant.avg_rating ?? 'N/A'}</p>
                <p>Review Count: {restaurant.review_count}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
