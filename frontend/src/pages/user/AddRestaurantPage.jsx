export default function AddRestaurantPage({
  submitListing,
  listingForm,
  setListingForm,
  listingSaving,
  listingMessage,
  token,
  myListings,
  editingListingId,
  editingListingForm,
  setEditingListingForm,
  saveListingEdit,
  listingActionId,
  setEditingListingId,
  startEditListing,
  deleteListing,
  getRestaurantImage,
  listingPhotoFile,
  setListingPhotoFile,
  listingPhotoUploading,
  uploadListingPhoto,
}) {
  return (
    <section className="panel">
      <h2>Add / Edit Restaurant Form</h2>
      <form onSubmit={submitListing} className="stack">
        <div className="row wrap">
          <input placeholder="Restaurant name" value={listingForm.name} onChange={(event) => setListingForm((prev) => ({ ...prev, name: event.target.value }))} required />
          <input placeholder="Cuisine" value={listingForm.cuisine_type} onChange={(event) => setListingForm((prev) => ({ ...prev, cuisine_type: event.target.value }))} required />
          <input placeholder="Address" value={listingForm.address} onChange={(event) => setListingForm((prev) => ({ ...prev, address: event.target.value }))} required />
          <input placeholder="City" value={listingForm.city} onChange={(event) => setListingForm((prev) => ({ ...prev, city: event.target.value }))} required />
          <input placeholder="State" value={listingForm.state} onChange={(event) => setListingForm((prev) => ({ ...prev, state: event.target.value }))} />
          <input placeholder="Zip" value={listingForm.zip} onChange={(event) => setListingForm((prev) => ({ ...prev, zip: event.target.value }))} />
          <input placeholder="Contact phone (optional)" value={listingForm.phone} onChange={(event) => setListingForm((prev) => ({ ...prev, phone: event.target.value }))} />
          <input placeholder="Hours (optional, e.g. Mon–Fri 11am–10pm)" value={listingForm.hours} onChange={(event) => setListingForm((prev) => ({ ...prev, hours: event.target.value }))} />
          <input placeholder="Price tier (1-4)" value={listingForm.price_tier} onChange={(event) => setListingForm((prev) => ({ ...prev, price_tier: event.target.value }))} />
          <div className="field-block" style={{ minWidth: '220px', flex: '1 1 220px' }}>
            <span>Upload restaurant photo</span>
            <input
              className="profile-file-input"
              type="file"
              accept="image/*"
              onChange={(event) => setListingPhotoFile(event.target.files?.[0] ?? null)}
              disabled={listingPhotoUploading}
            />
          </div>
        </div>
        <button type="button" onClick={uploadListingPhoto} disabled={listingPhotoUploading || !listingPhotoFile}>
          {listingPhotoUploading ? 'Uploading...' : 'Upload Photo'}
        </button>
        {listingForm.photo_url && <p className="info">Restaurant photo uploaded and ready for this listing.</p>}
        <textarea placeholder="Description" value={listingForm.description} onChange={(event) => setListingForm((prev) => ({ ...prev, description: event.target.value }))} />
        <button type="submit" disabled={listingSaving}>{listingSaving ? 'Creating...' : 'Create Listing'}</button>
      </form>
      {listingMessage && <p className="info">{listingMessage}</p>}

      {token && myListings.length === 0 && <p className="info">You have no listings yet. Create your first restaurant above.</p>}

      <div className="restaurant-grid">
        {myListings.map((listing) => (
          <article key={`my-${listing.id}`} className="restaurant-card">
            {String(listing?.photo_url ?? '').trim() && <div className="restaurant-card-cover" style={{ backgroundImage: `url(${getRestaurantImage(listing)})` }} />}
            <div className="restaurant-head">
              <h3>{listing.name}</h3>
              <span className="chip">{listing.cuisine_type}</span>
            </div>
            <p className="muted">{listing.city}</p>

            {editingListingId === listing.id ? (
              <div className="stack">
                <textarea value={editingListingForm.description} onChange={(event) => setEditingListingForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Edit description" />
                <input value={editingListingForm.price_tier} onChange={(event) => setEditingListingForm((prev) => ({ ...prev, price_tier: event.target.value }))} placeholder="Edit price tier" />
                <div className="row wrap">
                  <button onClick={() => saveListingEdit(listing.id)} disabled={listingActionId === listing.id}>Save</button>
                  <button onClick={() => setEditingListingId(null)} disabled={listingActionId === listing.id}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                {listing.description && <p>{listing.description}</p>}
                <p>Price Tier: {listing.price_tier ?? 'N/A'}</p>
                <div className="row wrap">
                  <button onClick={() => startEditListing(listing)} disabled={listingActionId === listing.id}>Edit</button>
                  <button onClick={() => deleteListing(listing.id)} disabled={listingActionId === listing.id}>Delete</button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
