export default function OwnerEditRestaurantPage({
  ownerToken,
  ownerRestaurants,
  selectedOwnerRestaurantId,
  setSelectedOwnerRestaurantId,
  ownerRestaurantForm,
  setOwnerRestaurantForm,
  saveOwnerRestaurantDetails,
  ownerRestaurantSaving,
  ownerMessage,
}) {
  return (
    <section className="panel">
      <h2>Edit Claimed Restaurant</h2>
      {!ownerToken && <p className="info">Owner login required to edit restaurants.</p>}

      {ownerToken && ownerRestaurants.length === 0 && (
        <p className="info">No claimed restaurants yet. Claim or post one first.</p>
      )}

      {ownerToken && ownerRestaurants.length > 0 && (
        <div className="stack">
          <label>
            Select Claimed Restaurant
            <select value={selectedOwnerRestaurantId} onChange={(event) => setSelectedOwnerRestaurantId(event.target.value)}>
              {ownerRestaurants.map((restaurant) => (
                <option key={`owner-edit-${restaurant.id}`} value={restaurant.id}>
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
              <input value={ownerRestaurantForm.phone} placeholder="Contact phone" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, phone: event.target.value }))} />
              <input type="number" min="1" max="4" value={ownerRestaurantForm.price_tier} placeholder="Price tier (1-4)" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, price_tier: event.target.value }))} />
            </div>

            <textarea value={ownerRestaurantForm.description} placeholder="Description" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, description: event.target.value }))} />
            <textarea value={ownerRestaurantForm.hours} placeholder="Hours of operation" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, hours: event.target.value }))} />
            <textarea value={ownerRestaurantForm.amenities} placeholder="Amenities" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, amenities: event.target.value }))} />

            <div className="row wrap">
              <input value={ownerRestaurantForm.photo_url} placeholder="Photo URL" onChange={(event) => setOwnerRestaurantForm((prev) => ({ ...prev, photo_url: event.target.value }))} />
            </div>

            <button type="submit" disabled={ownerRestaurantSaving}>{ownerRestaurantSaving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>
      )}

      {ownerMessage && <p className="info">{ownerMessage}</p>}
    </section>
  )
}
