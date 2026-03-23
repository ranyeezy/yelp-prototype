import { useState } from 'react'

export default function WriteReviewPage({
  restaurants,
  activeRestaurantId,
  setActiveRestaurantId,
  submitReview,
  reviewForm,
  setReviewForm,
  reviewSaving,
  token,
  reviewMessage,
  myReviewHistory,
  updateMyReviewHistoryItem,
  deleteMyReviewHistoryItem,
  reviewPhotoFile,
  setReviewPhotoFile,
  reviewPhotoUploading,
  uploadReviewPhoto,
  apiBaseUrl,
}) {
  const [editingHistoryId, setEditingHistoryId] = useState(null)
  const [editingHistoryForm, setEditingHistoryForm] = useState({ rating: 5, comment: '' })

  const startEditHistoryReview = (item) => {
    setEditingHistoryId(item.id)
    setEditingHistoryForm({
      rating: Number(item.rating ?? 5),
      comment: item.comment ?? '',
    })
  }

  const saveHistoryEdit = async (reviewId) => {
    await updateMyReviewHistoryItem(reviewId, editingHistoryForm)
    setEditingHistoryId(null)
  }

  return (
    <section className="panel">
      <h2>Write Review Form</h2>
      <div className="row wrap">
        <select value={activeRestaurantId ?? ''} onChange={(event) => setActiveRestaurantId(Number(event.target.value) || null)}>
          <option value="">Select a restaurant</option>
          {restaurants.map((restaurant) => (
            <option key={`review-restaurant-${restaurant.id}`} value={restaurant.id}>
              {restaurant.name} ({restaurant.city})
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={submitReview} className="stack">
        <label>
          Rating
          <select value={reviewForm.rating} onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: event.target.value }))}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option value={rating} key={rating}>{rating} ★</option>
            ))}
          </select>
        </label>
        <textarea placeholder="Write your review" value={reviewForm.comment} onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))} />
        <div className="field-block">
          <span>Attach a photo (optional)</span>
          <input
            type="file"
            accept="image/*"
            className="profile-file-input"
            onChange={(event) => setReviewPhotoFile(event.target.files?.[0] ?? null)}
            disabled={reviewPhotoUploading}
          />
        </div>
        <button type="button" onClick={uploadReviewPhoto} disabled={reviewPhotoUploading || !reviewPhotoFile}>
          {reviewPhotoUploading ? 'Uploading...' : 'Upload Photo'}
        </button>
        {reviewForm.photo_url && <p className="info">✓ Photo attached and ready to post.</p>}
        <button type="submit" disabled={reviewSaving || !token || !activeRestaurantId}>
          {reviewSaving ? 'Posting...' : 'Post Review'}
        </button>
      </form>
      {reviewMessage && <p className="info">{reviewMessage}</p>}

      <div className="list">
        <h3>My Review History</h3>
        {token && myReviewHistory.length === 0 && <p className="info">No past reviews yet.</p>}
        {!token && <p className="info">Login to view your review history.</p>}
        {myReviewHistory.map((item) => (
          <article key={`history-${item.id}`} className="card">
            {editingHistoryId === item.id ? (
              <div className="stack">
                <p><strong>{item.restaurant_name}</strong> ({item.restaurant_city || 'N/A'})</p>
                <label>
                  Rating
                  <select
                    value={editingHistoryForm.rating}
                    onChange={(event) => setEditingHistoryForm((prev) => ({ ...prev, rating: Number(event.target.value) }))}
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option value={rating} key={`history-edit-${rating}`}>{rating} ★</option>
                    ))}
                  </select>
                </label>
                <textarea
                  value={editingHistoryForm.comment}
                  onChange={(event) => setEditingHistoryForm((prev) => ({ ...prev, comment: event.target.value }))}
                />
                <div className="row wrap">
                  <button onClick={() => saveHistoryEdit(item.id)} disabled={reviewSaving}>Save</button>
                  <button onClick={() => setEditingHistoryId(null)} disabled={reviewSaving}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <p><strong>{item.restaurant_name}</strong> ({item.restaurant_city || 'N/A'})</p>
                <p>Rating: {item.rating} ★</p>
                <p>{item.comment || 'No comment'}</p>
                {item.photo_url && (
                  <img
                    src={item.photo_url.startsWith('http') ? item.photo_url : `${apiBaseUrl}${item.photo_url}`}
                    alt="Review photo"
                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px', marginTop: '0.5rem', objectFit: 'cover' }}
                  />
                )}
                <p className="muted">Reviewed on: {new Date(item.created_at).toLocaleString()}</p>
                <div className="row wrap">
                  <button onClick={() => startEditHistoryReview(item)} disabled={reviewSaving}>Edit</button>
                  <button onClick={() => deleteMyReviewHistoryItem(item.id)} disabled={reviewSaving}>Delete</button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
