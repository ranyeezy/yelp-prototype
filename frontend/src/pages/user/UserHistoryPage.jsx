import { useState } from 'react'

const STAR = '★'
const STAR_EMPTY = '☆'

function StarDisplay({ rating }) {
  return (
    <span style={{ color: '#e53e3e', fontSize: '1rem', letterSpacing: '1px' }}>
      {Array.from({ length: 5 }, (_, i) => (i < rating ? STAR : STAR_EMPTY)).join('')}
    </span>
  )
}

export default function UserHistoryPage({
  token,
  myReviewHistory,
  myListings,
  reviewMessage,
  reviewSaving,
  updateMyReviewHistoryItem,
  deleteMyReviewHistoryItem,
  openRestaurantDetails,
  navigate,
}) {
  const [activeTab, setActiveTab] = useState('reviews')
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editForm, setEditForm] = useState({ rating: 5, comment: '' })

  if (!token) {
    return (
      <section className="panel stack" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <h2>My History</h2>
        <p className="muted">You need to be logged in to view your history.</p>
        <button className="solid-small" style={{ alignSelf: 'center' }} onClick={() => navigate('/login')}>
          Log In
        </button>
      </section>
    )
  }

  const startEdit = (review) => {
    setEditingReviewId(review.id)
    setEditForm({ rating: review.rating, comment: review.comment || '' })
  }

  const cancelEdit = () => {
    setEditingReviewId(null)
    setEditForm({ rating: 5, comment: '' })
  }

  const saveEdit = async (reviewId) => {
    await updateMyReviewHistoryItem(reviewId, editForm)
    setEditingReviewId(null)
  }

  const tabStyle = (tab) => ({
    padding: '0.45rem 1.2rem',
    borderRadius: '6px',
    border: activeTab === tab ? '2px solid #c53030' : '2px solid #ddd',
    background: activeTab === tab ? '#c53030' : '#fff',
    color: activeTab === tab ? '#fff' : '#444',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9rem',
  })

  return (
    <section className="panel stack">
      <h2>📋 My History</h2>

      {/* Tab switcher */}
      <div className="row" style={{ gap: '0.6rem', marginBottom: '0.5rem' }}>
        <button style={tabStyle('reviews')} onClick={() => setActiveTab('reviews')}>
          Reviews ({myReviewHistory.length})
        </button>
        <button style={tabStyle('listings')} onClick={() => setActiveTab('listings')}>
          Restaurants Added ({myListings.length})
        </button>
      </div>

      {reviewMessage && <p className="info">{reviewMessage}</p>}

      {/* ── REVIEWS TAB ── */}
      {activeTab === 'reviews' && (
        <>
          {myReviewHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p className="muted" style={{ fontSize: '1.05rem' }}>You haven't written any reviews yet.</p>
              <button className="solid-small" style={{ marginTop: '1rem' }} onClick={() => navigate('/write-review')}>
                Write a Review
              </button>
            </div>
          ) : (
            <div className="stack" style={{ gap: '0.9rem' }}>
              {myReviewHistory.map((review) => (
                <div
                  key={review.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '1rem 1.2rem',
                    background: '#fafafa',
                  }}
                >
                  {editingReviewId === review.id ? (
                    /* ── Edit mode ── */
                    <div className="stack" style={{ gap: '0.6rem' }}>
                      <strong style={{ fontSize: '1rem' }}>{review.restaurant_name}</strong>
                      <label style={{ fontSize: '0.85rem', color: '#555' }}>Rating</label>
                      <select
                        value={editForm.rating}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                        style={{ width: '80px', padding: '0.3rem', borderRadius: '6px', border: '1px solid #ccc' }}
                      >
                        {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} ★</option>)}
                      </select>
                      <label style={{ fontSize: '0.85rem', color: '#555' }}>Comment</label>
                      <textarea
                        rows={3}
                        value={editForm.comment}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, comment: e.target.value }))}
                        style={{ borderRadius: '6px', border: '1px solid #ccc', padding: '0.4rem', resize: 'vertical' }}
                      />
                      <div className="row" style={{ gap: '0.5rem' }}>
                        <button
                          className="solid-small"
                          disabled={reviewSaving}
                          onClick={() => saveEdit(review.id)}
                        >
                          {reviewSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button className="ghost-small" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* ── View mode ── */
                    <div className="stack" style={{ gap: '0.35rem' }}>
                      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.3rem' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{review.restaurant_name}</span>
                          {review.restaurant_city && (
                            <span className="muted" style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                              {review.restaurant_city}
                            </span>
                          )}
                        </div>
                        <span className="muted" style={{ fontSize: '0.78rem' }}>
                          {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <StarDisplay rating={review.rating} />
                      {review.comment && (
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#444' }}>{review.comment}</p>
                      )}
                      <div className="row" style={{ gap: '0.5rem', marginTop: '0.4rem' }}>
                        <button
                          className="ghost-small"
                          onClick={() => openRestaurantDetails(review.restaurant_id)}
                        >
                          View Restaurant
                        </button>
                        <button
                          className="ghost-small"
                          onClick={() => startEdit(review)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          style={{ background: 'transparent', color: '#e53e3e', border: '1px solid #e53e3e', borderRadius: '6px', padding: '0.25rem 0.7rem', cursor: 'pointer', fontSize: '0.82rem' }}
                          disabled={reviewSaving}
                          onClick={() => deleteMyReviewHistoryItem(review.id)}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── RESTAURANTS ADDED TAB ── */}
      {activeTab === 'listings' && (
        <>
          {myListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p className="muted" style={{ fontSize: '1.05rem' }}>You haven't added any restaurants yet.</p>
              <button className="solid-small" style={{ marginTop: '1rem' }} onClick={() => navigate('/add-restaurant')}>
                Add a Restaurant
              </button>
            </div>
          ) : (
            <div className="stack" style={{ gap: '0.9rem' }}>
              {myListings.map((restaurant) => (
                <div
                  key={restaurant.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '1rem 1.2rem',
                    background: '#fafafa',
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.3rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{restaurant.name}</span>
                      <span className="chip" style={{ marginLeft: '0.6rem', fontSize: '0.75rem' }}>{restaurant.cuisine_type}</span>
                    </div>
                    <span className="muted" style={{ fontSize: '0.78rem' }}>
                      {new Date(restaurant.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
                    {[restaurant.city, restaurant.state, restaurant.country].filter(Boolean).join(', ')}
                  </p>
                  {restaurant.description && (
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.88rem', color: '#555' }}>{restaurant.description}</p>
                  )}
                  <div style={{ marginTop: '0.6rem' }}>
                    <button className="ghost-small" onClick={() => openRestaurantDetails(restaurant.id)}>
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
