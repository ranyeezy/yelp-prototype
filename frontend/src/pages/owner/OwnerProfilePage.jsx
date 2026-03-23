export default function OwnerProfilePage({
  ownerToken,
  ownerRestaurants,
  selectedOwnerRestaurantId,
  setSelectedOwnerRestaurantId,
  ownerRestaurantForm,
  setOwnerRestaurantForm,
  saveOwnerRestaurantDetails,
  ownerRestaurantSaving,
  ownerEditRestaurantPhotoFile,
  setOwnerEditRestaurantPhotoFile,
  uploadOwnerRestaurantPhoto,
  ownerRestaurantPhotoUploading,
  ownerMessage,
  currentOwner,
}) {
  return (
    <section className="panel">
      <h2>Profile Management</h2>
      {!ownerToken && <p className="info">Owner login required to update restaurant profiles.</p>}

      {ownerToken && currentOwner && (
        <div className="stack" style={{ marginBottom: '1rem', background: 'var(--surface-accent, #f5f5f5)', padding: '0.8rem', borderRadius: '8px' }}>
          <h3>Owner Account Info</h3>
          <p><strong>Name:</strong> {currentOwner.name}</p>
          <p><strong>Email:</strong> {currentOwner.email}</p>
          <p><strong>Restaurant Location:</strong> {currentOwner.restaurant_location ?? 'Not set'}</p>
        </div>
      )}

      {ownerToken && (
        <div className="stack">
          {ownerRestaurants.length === 0 && <p className="info">No claimed restaurants yet. Claim or post one to manage details.</p>}

          {ownerRestaurants.length > 0 && (
            <>
              <h3>Claimed Restaurant Profile Details</h3>
              <label>
                Select Claimed Restaurant
                <select value={selectedOwnerRestaurantId} onChange={(event) => setSelectedOwnerRestaurantId(event.target.value)}>
                  {ownerRestaurants.map((restaurant) => (
                    <option key={`owner-profile-${restaurant.id}`} value={restaurant.id}>
                      {restaurant.name} ({restaurant.city})
                    </option>
                  ))}
                </select>
              </label>

              <form onSubmit={saveOwnerRestaurantDetails} className="stack">
                <div className="row wrap">
                  <input value={ownerRestaurantForm.name} placeholder="Restaurant name" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, name: event.target.value }))} />
                  <input value={ownerRestaurantForm.cuisine_type} placeholder="Cuisine type" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, cuisine_type: event.target.value }))} />
                  <input value={ownerRestaurantForm.address} placeholder="Address" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, address: event.target.value }))} />
                  <input value={ownerRestaurantForm.city} placeholder="City" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, city: event.target.value }))} />
                  <input value={ownerRestaurantForm.state} placeholder="State" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, state: event.target.value }))} />
                  <input value={ownerRestaurantForm.zip} placeholder="Zip" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, zip: event.target.value }))} />
                  <input value={ownerRestaurantForm.country} placeholder="Country" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, country: event.target.value }))} />
                  <input value={ownerRestaurantForm.phone} placeholder="Contact information" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, phone: event.target.value }))} />
                  <input type="number" min="1" max="4" value={ownerRestaurantForm.price_tier} placeholder="Price tier (1-4)" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, price_tier: event.target.value }))} />
                </div>

                <textarea value={ownerRestaurantForm.description} placeholder="Description" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, description: event.target.value }))} />
                <textarea value={ownerRestaurantForm.hours} placeholder="Hours of operation" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, hours: event.target.value }))} />
                <textarea value={ownerRestaurantForm.amenities} placeholder="Amenities" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, amenities: event.target.value }))} />

                <div className="row wrap">
                  <input value={ownerRestaurantForm.photo_url} placeholder="Restaurant photo URL" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, photo_url: event.target.value }))} />
                  <input type="file" accept="image/*" onChange={(event) => setOwnerEditRestaurantPhotoFile(event.target.files?.[0] ?? null)} />
                  <button
                    type="button"
                    onClick={() => uploadOwnerRestaurantPhoto('edit')}
                    disabled={!ownerEditRestaurantPhotoFile || ownerRestaurantPhotoUploading}
                  >
                    {ownerRestaurantPhotoUploading ? 'Uploading...' : 'Upload Restaurant Photo'}
                  </button>
                </div>

                <button type="submit" disabled={ownerRestaurantSaving}>{ownerRestaurantSaving ? 'Saving...' : 'Save Restaurant Profile Details'}</button>
              </form>
            </>
          )}
        </div>
      )}

      {currentOwner && <p className="success">Owner logged in as: {currentOwner.name}</p>}
      {ownerMessage && <p className="info">{ownerMessage}</p>}
    </section>
  )
}
