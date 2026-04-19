function StarRating({ rating, max = 5 }) {
  return (
    <span className="rd-stars" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < Math.round(rating) ? 'rd-star rd-star--filled' : 'rd-star'}>★</span>
      ))}
    </span>
  )
}

export default function RestaurantDetailsPage({
  activeRestaurant,
  reviews,
  apiBaseUrl,
  navigate,
}) {
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length)
    : null
  const averageRatingDisplay = averageRating ? averageRating.toFixed(1) : null

  // Build photo list: only use actual uploaded photo_url (no auto-fallback images)
  const photos = []
  if (activeRestaurant) {
    const rawPhoto = String(activeRestaurant?.photo_url ?? '').trim()
    let primary = null
    if (rawPhoto) {
      if (rawPhoto.startsWith('http://') || rawPhoto.startsWith('https://')) {
        primary = rawPhoto
      } else if (rawPhoto.startsWith('/')) {
        primary = `${apiBaseUrl}${rawPhoto}`
      } else {
        primary = `${apiBaseUrl}/${rawPhoto}`
      }
    }
    if (primary) photos.push(primary)
    // extra_photos may be returned by some endpoints
    if (Array.isArray(activeRestaurant.extra_photos)) {
      activeRestaurant.extra_photos.forEach((p) => {
        const url = p.startsWith('http') ? p : `${apiBaseUrl}${p}`
        if (url !== primary) photos.push(url)
      })
    }
  }

  return (
    <section className="panel">
      {!activeRestaurant && <p className="info">Restaurant not found. Return to search and select one.</p>}

      {activeRestaurant && (
        <div className="rd-root">

          {/* ── Section 1: Core info ───────────────────────────────────── */}
          <div className="rd-section">
            <div className="rd-section-header">Restaurant Details</div>
            <div className="rd-info-grid">

              <div className="rd-info-row">
                <span className="rd-label">Name</span>
                <span className="rd-value rd-name">{activeRestaurant.name}</span>
              </div>

              <div className="rd-info-row">
                <span className="rd-label">Cuisine Type</span>
                <span className="rd-value">
                  <span className="rd-tag">{activeRestaurant.cuisine_type || '—'}</span>
                </span>
              </div>

              <div className="rd-info-row">
                <span className="rd-label">Address / Location</span>
                <span className="rd-value">
                  {activeRestaurant.address && <span>{activeRestaurant.address}, </span>}
                  {activeRestaurant.city}{activeRestaurant.state ? `, ${activeRestaurant.state}` : ''}
                  {activeRestaurant.zip ? ` ${activeRestaurant.zip}` : ''}
                  {activeRestaurant.country ? `, ${activeRestaurant.country}` : ''}
                </span>
              </div>

              {activeRestaurant.description && (
                <div className="rd-info-row rd-info-row--full">
                  <span className="rd-label">Description</span>
                  <span className="rd-value rd-description">{activeRestaurant.description}</span>
                </div>
              )}

              {activeRestaurant.price_tier && (
                <div className="rd-info-row">
                  <span className="rd-label">Price Tier</span>
                  <span className="rd-value rd-price">{'$'.repeat(activeRestaurant.price_tier)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Section 2: Hours, Contact, Photos ─────────────────────── */}
          <div className="rd-section">
            <div className="rd-section-header">Hours &amp; Contact</div>
            <div className="rd-info-grid">

              {activeRestaurant.hours ? (
                <div className="rd-info-row">
                  <span className="rd-label">Hours of Operation</span>
                  <span className="rd-value">{activeRestaurant.hours}</span>
                </div>
              ) : (
                <div className="rd-info-row">
                  <span className="rd-label">Hours of Operation</span>
                  <span className="rd-value rd-muted">Not provided</span>
                </div>
              )}

              {activeRestaurant.phone ? (
                <div className="rd-info-row">
                  <span className="rd-label">Contact</span>
                  <span className="rd-value">
                    <a className="rd-link" href={`tel:${activeRestaurant.phone}`}>{activeRestaurant.phone}</a>
                  </span>
                </div>
              ) : (
                <div className="rd-info-row">
                  <span className="rd-label">Contact</span>
                  <span className="rd-value rd-muted">Not provided</span>
                </div>
              )}

              {activeRestaurant.amenities && (
                <div className="rd-info-row rd-info-row--full">
                  <span className="rd-label">Amenities</span>
                  <span className="rd-value">{activeRestaurant.amenities}</span>
                </div>
              )}
            </div>

            {/* Photo strip */}
            {photos.length > 0 && (
              <div className="rd-photos-wrap">
                <div className="rd-photos-label">Photos</div>
                <div className="rd-photo-strip">
                  {photos.map((src, i) => (
                    <div key={i} className="rd-photo-thumb" style={{ backgroundImage: `url(${src})` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Section 3: Reviews ────────────────────────────────────── */}
          <div className="rd-section">
            <div className="rd-section-header rd-section-header--reviews">
              <span>Reviews</span>
              <button
                onClick={() => navigate('/write-review')}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}
              >
                ✏️ Write a Review
              </button>
              <div className="rd-review-summary">
                {averageRatingDisplay ? (
                  <>
                    <StarRating rating={averageRating} />
                    <strong className="rd-avg-num">{averageRatingDisplay}</strong>
                    <span className="rd-review-count">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                  </>
                ) : (
                  <span className="rd-muted">No reviews yet</span>
                )}
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="rd-muted" style={{ padding: '0.75rem 0' }}>No reviews yet. Be the first to review this place!</p>
            ) : (
              <div className="rd-review-list">
                {reviews.map((review) => (
                  <article key={review.id} className="rd-review-card">
                    <div className="rd-review-top">
                      <div className="rd-reviewer-avatar">
                        {(review.user_name || 'U')[0].toUpperCase()}
                      </div>
                      <div className="rd-reviewer-info">
                        <strong>{review.user_name || `User #${review.user_id}`}</strong>
                        <span className="rd-review-date">{new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="rd-review-rating-right">
                        <StarRating rating={Number(review.rating)} />
                        <span className="rd-rating-num">{review.rating}/5</span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="rd-review-comment">{review.comment}</p>
                    )}
                    {review.photo_url && (
                      <img
                        src={review.photo_url.startsWith('http') ? review.photo_url : `${apiBaseUrl}${review.photo_url}`}
                        alt="Review photo"
                        style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', marginTop: '0.6rem', objectFit: 'cover', display: 'block' }}
                      />
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </section>
  )
}
