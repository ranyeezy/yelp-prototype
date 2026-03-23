export default function OwnerManageRestaurantPage({
  ownerToken,
  ownerNewRestaurantForm,
  setOwnerNewRestaurantForm,
  postOwnerNewRestaurant,
  ownerNewRestaurantSaving,
  ownerNewRestaurantPhotoFile,
  setOwnerNewRestaurantPhotoFile,
  uploadOwnerRestaurantPhoto,
  ownerRestaurantPhotoUploading,
  ownerMessage,
}) {
  return (
    <section className="panel">
      <h2>Post a New Restaurant</h2>
      {!ownerToken && <p className="info">Owner login required to post a restaurant.</p>}

      {ownerToken && (
        <form onSubmit={postOwnerNewRestaurant} className="stack">
          <div className="row wrap">
            <input value={ownerNewRestaurantForm.name} placeholder="Restaurant name" onChange={(event) => setOwnerNewRestaurantForm((prev) => ({ ...prev, name: event.target.value }))} required />
            <input value={ownerNewRestaurantForm.cuisine_type} placeholder="Cuisine type" onChange={(event) => setOwnerNewRestaurantForm((prev) => ({ ...prev, cuisine_type: event.target.value }))} required />
            <input value={ownerNewRestaurantForm.address} placeholder="Address" onChange={(event) => setOwnerNewRestaurantForm((prev) => ({ ...prev, address: event.target.value }))} required />
            <input value={ownerNewRestaurantForm.city} placeholder="City" onChange={(event) => setOwnerNewRestaurantForm((prev) => ({ ...prev, city: event.target.value }))} required />
            <input value={ownerNewRestaurantForm.state} placeholder="State" onChange={(event) => setOwnerNewRestaurantForm((prev) => ({ ...prev, state: event.target.value }))} />
            <input value={ownerNewRestaurantForm.zip} placeholder="Zip" onChange={(event) => setOwnerNewRestaurantForm((prev) => ({ ...prev, zip: event.target.value }))} />
            <input value={ownerNewRestaurantForm.country} placeholder="Country" onChange={(event) => setOwnerNewRestaurantForm((prev) => ({ ...prev, country: event.target.value }))} />
            <input value={ownerNewRestaurantForm.phone} placeholder="Contact phone" onChange={(event) => setOwnerNewRestaurantForm((prev) => ({ ...prev, phone: event.target.value }))} />
            <input type="number" min="1" max="4" value={ownerNewRestaurantForm.price_tier} placeholder="Price tier (1-4)" onChange={(event) => setOwnerNewRestaurantForm((prev) => ({ ...prev, price_tier: event.target.value }))} />
          </div>

          <textarea value={ownerNewRestaurantForm.description} placeholder="Description" onChange={(event) => setOwnerNewRestaurantForm((prev) => ({ ...prev, description: event.target.value }))} />
          <textarea value={ownerNewRestaurantForm.hours} placeholder="Hours of operation" onChange={(event) => setOwnerNewRestaurantForm((prev) => ({ ...prev, hours: event.target.value }))} />
          <textarea value={ownerNewRestaurantForm.amenities} placeholder="Amenities" onChange={(event) => setOwnerNewRestaurantForm((prev) => ({ ...prev, amenities: event.target.value }))} />

          <div className="row wrap">
            <input value={ownerNewRestaurantForm.photo_url} placeholder="Photo URL" onChange={(event) => setOwnerNewRestaurantForm((prev) => ({ ...prev, photo_url: event.target.value }))} />
            <input type="file" accept="image/*" onChange={(event) => setOwnerNewRestaurantPhotoFile(event.target.files?.[0] ?? null)} />
            <button
              type="button"
              onClick={() => uploadOwnerRestaurantPhoto('new')}
              disabled={!ownerNewRestaurantPhotoFile || ownerRestaurantPhotoUploading}
            >
              {ownerRestaurantPhotoUploading ? 'Uploading...' : 'Upload New Listing Photo'}
            </button>
          </div>

          <button type="submit" disabled={ownerNewRestaurantSaving}>{ownerNewRestaurantSaving ? 'Posting...' : 'Post Restaurant Listing'}</button>
        </form>
      )}


      {ownerMessage && <p className="info">{ownerMessage}</p>}
    </section>
  )
}
