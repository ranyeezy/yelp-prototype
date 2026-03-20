import { useEffect, useMemo, useState } from 'react'
import './App.css'

function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState('http://127.0.0.1:8000')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [token, setToken] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [authMessage, setAuthMessage] = useState('')

  const [ownerAuthMode, setOwnerAuthMode] = useState('login')
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', password: '' })
  const [ownerToken, setOwnerToken] = useState('')
  const [currentOwner, setCurrentOwner] = useState(null)
  const [ownerMessage, setOwnerMessage] = useState('')
  const [ownerClaimRestaurantId, setOwnerClaimRestaurantId] = useState('')
  const [ownerRestaurants, setOwnerRestaurants] = useState([])
  const [ownerDashboard, setOwnerDashboard] = useState(null)

  const [restaurantQuery, setRestaurantQuery] = useState({ keyword: '', city: '', cuisine_type: '' })
  const [restaurants, setRestaurants] = useState([])
  const [restaurantsMessage, setRestaurantsMessage] = useState('')
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)
  const [myListings, setMyListings] = useState([])
  const [listingMessage, setListingMessage] = useState('')
  const [listingForm, setListingForm] = useState({
    name: '',
    cuisine_type: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    description: '',
    price_tier: '',
  })
  const [editingListingId, setEditingListingId] = useState(null)
  const [editingListingForm, setEditingListingForm] = useState({ description: '', price_tier: '' })

  const [favoriteRestaurantIds, setFavoriteRestaurantIds] = useState(new Set())
  const [favoritesMessage, setFavoritesMessage] = useState('')

  const [preferencesForm, setPreferencesForm] = useState({
    cuisines: '',
    price_min: '',
    price_max: '',
    preferred_locations: '',
    search_radius: '',
    dietary_needs: '',
    ambiance: '',
    sort_preference: '',
  })
  const [preferencesMessage, setPreferencesMessage] = useState('')

  const [activeRestaurantId, setActiveRestaurantId] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewMessage, setReviewMessage] = useState('')

  const [aiInput, setAiInput] = useState('')
  const [aiConversation, setAiConversation] = useState([])
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [aiFilters, setAiFilters] = useState(null)
  const [aiMessage, setAiMessage] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const activeRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === activeRestaurantId) ?? null,
    [restaurants, activeRestaurantId],
  )

  const apiRequest = async (path, options = {}) => {
    const { authToken, ...fetchOptions } = options
    const headers = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers ?? {}),
    }

    const hasAuthTokenOverride = Object.prototype.hasOwnProperty.call(options, 'authToken')
    const resolvedToken = hasAuthTokenOverride ? authToken : token
    if (resolvedToken) {
      headers.Authorization = `Bearer ${resolvedToken}`
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...fetchOptions,
      headers,
    })

    if (response.status === 204) {
      return null
    }

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      const detail = data?.detail ?? 'Request failed'
      throw new Error(typeof detail === 'string' ? detail : 'Request failed')
    }
    return data
  }

  const loadCurrentUser = async () => {
    if (!token) return
    try {
      const user = await apiRequest('/users/me')
      setCurrentUser(user)
    } catch {
      setCurrentUser(null)
    }
  }

  const loadCurrentOwner = async () => {
    if (!ownerToken) return
    try {
      const owner = await apiRequest('/owners/me', { authToken: ownerToken })
      setCurrentOwner(owner)
    } catch {
      setCurrentOwner(null)
    }
  }

  const loadOwnerData = async () => {
    if (!ownerToken) {
      setOwnerRestaurants([])
      setOwnerDashboard(null)
      return
    }

    try {
      const [restaurantsData, dashboardData] = await Promise.all([
        apiRequest('/owners/restaurants', { authToken: ownerToken }),
        apiRequest('/owners/dashboard', { authToken: ownerToken }),
      ])
      setOwnerRestaurants(restaurantsData)
      setOwnerDashboard(dashboardData)
    } catch {
      setOwnerRestaurants([])
      setOwnerDashboard(null)
    }
  }

  const loadRestaurants = async () => {
    setLoadingRestaurants(true)
    setRestaurantsMessage('')
    try {
      const params = new URLSearchParams()
      Object.entries(restaurantQuery).forEach(([key, value]) => {
        if (value.trim()) params.append(key, value.trim())
      })
      const query = params.toString()
      const data = await apiRequest(`/restaurants${query ? `?${query}` : ''}`, { method: 'GET' })
      setRestaurants(data)
      if (data.length === 0) setRestaurantsMessage('No restaurants found for current filters.')
    } catch (error) {
      setRestaurants([])
      setRestaurantsMessage(error.message)
    } finally {
      setLoadingRestaurants(false)
    }
  }

  const loadFavorites = async () => {
    if (!token) {
      setFavoriteRestaurantIds(new Set())
      return
    }
    try {
      const data = await apiRequest('/favorites/me')
      setFavoriteRestaurantIds(new Set(data.map((item) => item.restaurant.id)))
    } catch {
      setFavoriteRestaurantIds(new Set())
    }
  }

  const loadPreferences = async () => {
    if (!token) {
      setPreferencesForm({
        cuisines: '',
        price_min: '',
        price_max: '',
        preferred_locations: '',
        search_radius: '',
        dietary_needs: '',
        ambiance: '',
        sort_preference: '',
      })
      return
    }

    try {
      const data = await apiRequest('/preferences/me', { method: 'GET' })
      setPreferencesForm({
        cuisines: data.cuisines ?? '',
        price_min: data.price_min ?? '',
        price_max: data.price_max ?? '',
        preferred_locations: data.preferred_locations ?? '',
        search_radius: data.search_radius ?? '',
        dietary_needs: data.dietary_needs ?? '',
        ambiance: data.ambiance ?? '',
        sort_preference: data.sort_preference ?? '',
      })
    } catch {
      setPreferencesMessage('Unable to load preferences right now.')
    }
  }

  const loadMyListings = async () => {
    if (!token || !currentUser) {
      setMyListings([])
      return
    }
    try {
      const allRestaurants = await apiRequest('/restaurants', { method: 'GET' })
      setMyListings(allRestaurants.filter((restaurant) => restaurant.listed_by_user_id === currentUser.id))
    } catch {
      setMyListings([])
    }
  }

  const loadReviews = async (restaurantId) => {
    if (!restaurantId) {
      setReviews([])
      return
    }
    try {
      const data = await apiRequest(`/reviews/restaurant/${restaurantId}`, { method: 'GET' })
      setReviews(data)
    } catch {
      setReviews([])
    }
  }

  useEffect(() => {
    loadRestaurants()
  }, [])

  useEffect(() => {
    loadCurrentUser()
    loadFavorites()
    loadPreferences()
  }, [token])

  useEffect(() => {
    loadMyListings()
  }, [token, currentUser])

  useEffect(() => {
    loadCurrentOwner()
    loadOwnerData()
  }, [ownerToken])

  useEffect(() => {
    loadReviews(activeRestaurantId)
  }, [activeRestaurantId])

  const onAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthMessage('')
    try {
      if (authMode === 'signup') {
        await apiRequest('/auth/users/signup', {
          method: 'POST',
          body: JSON.stringify(authForm),
          headers: {},
        })
      }

      const loginData = await apiRequest('/auth/users/login', {
        method: 'POST',
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password,
        }),
        headers: {},
      })
      setToken(loginData.access_token)
      setAuthMessage('Authenticated successfully.')
    } catch (error) {
      setAuthMessage(error.message)
    }
  }

  const toggleFavorite = async (restaurantId) => {
    setFavoritesMessage('')
    if (!token) {
      setFavoritesMessage('Please login to manage favorites.')
      return
    }

    try {
      if (favoriteRestaurantIds.has(restaurantId)) {
        await apiRequest(`/favorites/${restaurantId}`, { method: 'DELETE' })
      } else {
        await apiRequest(`/favorites/${restaurantId}`, { method: 'POST', headers: {} })
      }
      await loadFavorites()
    } catch (error) {
      setFavoritesMessage(error.message)
    }
  }

  const submitReview = async (event) => {
    event.preventDefault()
    setReviewMessage('')

    if (!token) {
      setReviewMessage('Please login to post a review.')
      return
    }

    if (!activeRestaurantId) {
      setReviewMessage('Select a restaurant first.')
      return
    }

    try {
      await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          restaurant_id: activeRestaurantId,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment,
        }),
        headers: {},
      })
      setReviewForm({ rating: 5, comment: '' })
      setReviewMessage('Review added successfully.')
      await loadReviews(activeRestaurantId)
    } catch (error) {
      setReviewMessage(error.message)
    }
  }

  const savePreferences = async (event) => {
    event.preventDefault()
    setPreferencesMessage('')
    if (!token) {
      setPreferencesMessage('Please login to update preferences.')
      return
    }

    try {
      await apiRequest('/preferences/me', {
        method: 'PUT',
        body: JSON.stringify({
          cuisines: preferencesForm.cuisines || null,
          price_min: preferencesForm.price_min ? Number(preferencesForm.price_min) : null,
          price_max: preferencesForm.price_max ? Number(preferencesForm.price_max) : null,
          preferred_locations: preferencesForm.preferred_locations || null,
          search_radius: preferencesForm.search_radius ? Number(preferencesForm.search_radius) : null,
          dietary_needs: preferencesForm.dietary_needs || null,
          ambiance: preferencesForm.ambiance || null,
          sort_preference: preferencesForm.sort_preference || null,
        }),
        headers: {},
      })
      setPreferencesMessage('Preferences saved successfully.')
    } catch (error) {
      setPreferencesMessage(error.message)
    }
  }

  const submitListing = async (event) => {
    event.preventDefault()
    setListingMessage('')

    if (!token) {
      setListingMessage('Please login to create a listing.')
      return
    }

    try {
      const payload = {
        name: listingForm.name,
        cuisine_type: listingForm.cuisine_type,
        address: listingForm.address,
        city: listingForm.city,
        state: listingForm.state || null,
        zip: listingForm.zip || null,
        description: listingForm.description || null,
        price_tier: listingForm.price_tier ? Number(listingForm.price_tier) : null,
      }

      await apiRequest('/restaurants', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {},
      })

      setListingForm({
        name: '',
        cuisine_type: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        description: '',
        price_tier: '',
      })
      setListingMessage('Restaurant listed successfully.')
      await loadRestaurants()
      await loadMyListings()
    } catch (error) {
      setListingMessage(error.message)
    }
  }

  const startEditListing = (listing) => {
    setEditingListingId(listing.id)
    setEditingListingForm({
      description: listing.description || '',
      price_tier: listing.price_tier ?? '',
    })
  }

  const saveListingEdit = async (listingId) => {
    setListingMessage('')
    try {
      await apiRequest(`/restaurants/${listingId}`, {
        method: 'PUT',
        body: JSON.stringify({
          description: editingListingForm.description || null,
          price_tier: editingListingForm.price_tier ? Number(editingListingForm.price_tier) : null,
        }),
        headers: {},
      })
      setEditingListingId(null)
      setListingMessage('Listing updated successfully.')
      await loadRestaurants()
      await loadMyListings()
    } catch (error) {
      setListingMessage(error.message)
    }
  }

  const deleteListing = async (listingId) => {
    setListingMessage('')
    try {
      await apiRequest(`/restaurants/${listingId}`, { method: 'DELETE' })
      setListingMessage('Listing removed successfully.')
      if (activeRestaurantId === listingId) {
        setActiveRestaurantId(null)
      }
      await loadRestaurants()
      await loadMyListings()
    } catch (error) {
      setListingMessage(error.message)
    }
  }

  const logout = () => {
    setToken('')
    setCurrentUser(null)
    setAuthMessage('Logged out.')
  }

  const onOwnerAuthSubmit = async (event) => {
    event.preventDefault()
    setOwnerMessage('')
    try {
      if (ownerAuthMode === 'signup') {
        await apiRequest('/auth/owners/signup', {
          method: 'POST',
          body: JSON.stringify(ownerForm),
          headers: {},
          authToken: '',
        })
      }

      const loginData = await apiRequest('/auth/owners/login', {
        method: 'POST',
        body: JSON.stringify({
          email: ownerForm.email,
          password: ownerForm.password,
        }),
        headers: {},
        authToken: '',
      })

      setOwnerToken(loginData.access_token)
      setOwnerMessage('Owner authenticated successfully.')
    } catch (error) {
      setOwnerMessage(error.message)
    }
  }

  const claimRestaurantForOwner = async (restaurantId) => {
    setOwnerMessage('')
    if (!ownerToken) {
      setOwnerMessage('Owner login required to claim restaurants.')
      return
    }
    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      setOwnerMessage('Please enter a valid restaurant ID.')
      return
    }
    try {
      await apiRequest(`/owners/restaurants/${restaurantId}/claim`, {
        method: 'POST',
        headers: {},
        authToken: ownerToken,
      })
      setOwnerMessage('Restaurant claimed successfully.')
      setOwnerClaimRestaurantId('')
      await loadOwnerData()
    } catch (error) {
      setOwnerMessage(error.message)
    }
  }

  const ownerLogout = () => {
    setOwnerToken('')
    setCurrentOwner(null)
    setOwnerRestaurants([])
    setOwnerDashboard(null)
    setOwnerMessage('Owner logged out.')
  }

  const submitAiMessage = async (event) => {
    event.preventDefault()
    setAiMessage('')

    if (!token) {
      setAiMessage('Please login as user to use AI assistant.')
      return
    }

    const trimmed = aiInput.trim()
    if (!trimmed) {
      setAiMessage('Please enter a message for the assistant.')
      return
    }

    setAiLoading(true)
    try {
      const history = aiConversation.map((item) => ({ role: item.role, content: item.content }))
      const response = await apiRequest('/ai-assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: trimmed,
          conversation_history: history,
        }),
        headers: {},
      })

      setAiConversation((prev) => [
        ...prev,
        { role: 'user', content: trimmed },
        { role: 'assistant', content: response.reply },
      ])
      setAiRecommendations(response.recommendations ?? [])
      setAiFilters(response.extracted_filters ?? null)
      setAiInput('')
    } catch (error) {
      setAiMessage(error.message)
    } finally {
      setAiLoading(false)
    }
  }

  const formattedFilters = aiFilters ? JSON.stringify(aiFilters, null, 2) : ''

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-brand">
          <span className="brand-pill">Yelp Lab Experience</span>
          <h1>Discover great places. Build great demos.</h1>
          <p>Production-style UI for your Yelp prototype with user, owner, and AI flows.</p>
        </div>
        <div className="hero-meta">
          <p className="pair-credit">Lab Pair 20: Viraat Chaudhary and Raniel Quesada.</p>
        </div>
      </header>

      <section className="panel panel-accent">
        <h2>Control Center</h2>
        <div className="row wrap">
          <input
            value={apiBaseUrl}
            onChange={(event) => setApiBaseUrl(event.target.value)}
            placeholder="http://127.0.0.1:8000"
          />
          <button onClick={loadRestaurants}>Reload Restaurants</button>
          <span className="status-chip">User: {currentUser ? 'Connected' : 'Guest'}</span>
          <span className="status-chip">Owner: {currentOwner ? 'Connected' : 'Guest'}</span>
        </div>
      </section>

      <section className="panel">
        <h2>User Preferences</h2>
        <form onSubmit={savePreferences} className="stack">
          <div className="row wrap">
            <input
              placeholder="Preferred cuisines (comma-separated)"
              value={preferencesForm.cuisines}
              onChange={(event) => setPreferencesForm((prev) => ({ ...prev, cuisines: event.target.value }))}
            />
            <input
              placeholder="Price min (1-4)"
              value={preferencesForm.price_min}
              onChange={(event) => setPreferencesForm((prev) => ({ ...prev, price_min: event.target.value }))}
            />
            <input
              placeholder="Price max (1-4)"
              value={preferencesForm.price_max}
              onChange={(event) => setPreferencesForm((prev) => ({ ...prev, price_max: event.target.value }))}
            />
            <input
              placeholder="Preferred locations"
              value={preferencesForm.preferred_locations}
              onChange={(event) => setPreferencesForm((prev) => ({ ...prev, preferred_locations: event.target.value }))}
            />
            <input
              placeholder="Search radius"
              value={preferencesForm.search_radius}
              onChange={(event) => setPreferencesForm((prev) => ({ ...prev, search_radius: event.target.value }))}
            />
            <input
              placeholder="Dietary needs"
              value={preferencesForm.dietary_needs}
              onChange={(event) => setPreferencesForm((prev) => ({ ...prev, dietary_needs: event.target.value }))}
            />
            <input
              placeholder="Ambiance"
              value={preferencesForm.ambiance}
              onChange={(event) => setPreferencesForm((prev) => ({ ...prev, ambiance: event.target.value }))}
            />
            <input
              placeholder="Sort preference"
              value={preferencesForm.sort_preference}
              onChange={(event) => setPreferencesForm((prev) => ({ ...prev, sort_preference: event.target.value }))}
            />
          </div>
          <div className="row wrap">
            <button type="submit">Save Preferences</button>
            <button type="button" onClick={loadPreferences}>Reload Preferences</button>
          </div>
        </form>
        {preferencesMessage && <p className="info">{preferencesMessage}</p>}
      </section>

      <div className="two-col">
        <section className="panel">
          <h2>User Account</h2>
          <div className="row">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Login</button>
            <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Sign Up</button>
            {token && <button onClick={logout}>Logout</button>}
          </div>

          <form onSubmit={onAuthSubmit} className="stack">
            {authMode === 'signup' && (
              <input
                value={authForm.name}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Full name"
                required
              />
            )}
            <input
              value={authForm.email}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Email"
              type="email"
              required
            />
            <input
              value={authForm.password}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Password"
              type="password"
              required
            />
            <button type="submit">{authMode === 'signup' ? 'Create Account + Login' : 'Login'}</button>
          </form>

          {currentUser && <p className="success">Logged in as: {currentUser.name} ({currentUser.email})</p>}
          {authMessage && <p className="info">{authMessage}</p>}
        </section>

        <section className="panel">
          <h2>Owner Portal</h2>
          <div className="row wrap">
            <button className={ownerAuthMode === 'login' ? 'active' : ''} onClick={() => setOwnerAuthMode('login')}>Owner Login</button>
            <button className={ownerAuthMode === 'signup' ? 'active' : ''} onClick={() => setOwnerAuthMode('signup')}>Owner Sign Up</button>
            {ownerToken && <button onClick={ownerLogout}>Owner Logout</button>}
            {ownerToken && <button onClick={loadOwnerData}>Refresh Dashboard</button>}
          </div>

          <form onSubmit={onOwnerAuthSubmit} className="stack">
            {ownerAuthMode === 'signup' && (
              <input
                value={ownerForm.name}
                onChange={(event) => setOwnerForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Owner full name"
                required
              />
            )}
            <input
              value={ownerForm.email}
              onChange={(event) => setOwnerForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Owner email"
              type="email"
              required
            />
            <input
              value={ownerForm.password}
              onChange={(event) => setOwnerForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Owner password"
              type="password"
              required
            />
            <button type="submit">{ownerAuthMode === 'signup' ? 'Create Owner + Login' : 'Owner Login'}</button>
          </form>

          <div className="row wrap">
            <input
              value={ownerClaimRestaurantId}
              onChange={(event) => setOwnerClaimRestaurantId(event.target.value)}
              placeholder="Restaurant ID to claim"
            />
            <button onClick={() => claimRestaurantForOwner(Number(ownerClaimRestaurantId))}>Claim by ID</button>
          </div>

          {currentOwner && <p className="success">Owner logged in as: {currentOwner.name}</p>}
          {ownerMessage && <p className="info">{ownerMessage}</p>}

          {ownerDashboard && (
            <div className="stats-grid">
              <article className="metric-card">
                <span>Claimed</span>
                <strong>{ownerDashboard.claimed_restaurants}</strong>
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
        </section>
      </div>

      <section className="panel">
        <h2>My Restaurant Listings</h2>
        <form onSubmit={submitListing} className="stack">
          <div className="row wrap">
            <input
              placeholder="Restaurant name"
              value={listingForm.name}
              onChange={(event) => setListingForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <input
              placeholder="Cuisine"
              value={listingForm.cuisine_type}
              onChange={(event) => setListingForm((prev) => ({ ...prev, cuisine_type: event.target.value }))}
              required
            />
            <input
              placeholder="Address"
              value={listingForm.address}
              onChange={(event) => setListingForm((prev) => ({ ...prev, address: event.target.value }))}
              required
            />
            <input
              placeholder="City"
              value={listingForm.city}
              onChange={(event) => setListingForm((prev) => ({ ...prev, city: event.target.value }))}
              required
            />
            <input
              placeholder="State"
              value={listingForm.state}
              onChange={(event) => setListingForm((prev) => ({ ...prev, state: event.target.value }))}
            />
            <input
              placeholder="Zip"
              value={listingForm.zip}
              onChange={(event) => setListingForm((prev) => ({ ...prev, zip: event.target.value }))}
            />
            <input
              placeholder="Price tier (1-4)"
              value={listingForm.price_tier}
              onChange={(event) => setListingForm((prev) => ({ ...prev, price_tier: event.target.value }))}
            />
          </div>
          <textarea
            placeholder="Description"
            value={listingForm.description}
            onChange={(event) => setListingForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <button type="submit">Create Listing</button>
        </form>
        {listingMessage && <p className="info">{listingMessage}</p>}

        <div className="restaurant-grid">
          {myListings.map((listing) => (
            <article key={`my-${listing.id}`} className="restaurant-card">
              <div className="restaurant-head">
                <h3>{listing.name}</h3>
                <span className="chip">{listing.cuisine_type}</span>
              </div>
              <p className="muted">{listing.city}</p>

              {editingListingId === listing.id ? (
                <div className="stack">
                  <textarea
                    value={editingListingForm.description}
                    onChange={(event) => setEditingListingForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Edit description"
                  />
                  <input
                    value={editingListingForm.price_tier}
                    onChange={(event) => setEditingListingForm((prev) => ({ ...prev, price_tier: event.target.value }))}
                    placeholder="Edit price tier"
                  />
                  <div className="row wrap">
                    <button onClick={() => saveListingEdit(listing.id)}>Save</button>
                    <button onClick={() => setEditingListingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {listing.description && <p>{listing.description}</p>}
                  <p>Price Tier: {listing.price_tier ?? 'N/A'}</p>
                  <div className="row wrap">
                    <button onClick={() => startEditListing(listing)}>Edit</button>
                    <button onClick={() => deleteListing(listing.id)}>Delete</button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Restaurants</h2>
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
          <button onClick={loadRestaurants}>Search</button>
        </div>

        {loadingRestaurants && <p className="info">Loading restaurants...</p>}
        {restaurantsMessage && <p className="info">{restaurantsMessage}</p>}
        {favoritesMessage && <p className="info">{favoritesMessage}</p>}

        <div className="restaurant-grid">
          {restaurants.map((restaurant) => (
            <article key={restaurant.id} className="restaurant-card">
              <div className="restaurant-head">
                <h3>{restaurant.name}</h3>
                <span className="chip">{restaurant.cuisine_type}</span>
              </div>
              <p className="muted">{restaurant.city}</p>
              {restaurant.description && <p>{restaurant.description}</p>}
              <div className="row wrap">
                <button onClick={() => setActiveRestaurantId(restaurant.id)}>View Reviews</button>
                <button onClick={() => toggleFavorite(restaurant.id)}>
                  {favoriteRestaurantIds.has(restaurant.id) ? 'Unfavorite' : 'Favorite'}
                </button>
                <button onClick={() => claimRestaurantForOwner(restaurant.id)}>Claim (Owner)</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="two-col">
        <section className="panel">
          <h2>Reviews {activeRestaurant ? `for ${activeRestaurant.name}` : ''}</h2>
          <form onSubmit={submitReview} className="stack">
            <label>
              Rating
              <select
                value={reviewForm.rating}
                onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: event.target.value }))}
              >
                {[1, 2, 3, 4, 5].map((rating) => (
                  <option value={rating} key={rating}>{rating}</option>
                ))}
              </select>
            </label>
            <textarea
              placeholder="Write your review"
              value={reviewForm.comment}
              onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
            />
            <button type="submit">Post Review</button>
          </form>
          {reviewMessage && <p className="info">{reviewMessage}</p>}

          <div className="list">
            {reviews.map((review) => (
              <article key={review.id} className="card">
                <p><strong>{review.rating}/5</strong></p>
                <p>{review.comment || 'No comment'}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>AI Assistant</h2>
          <form onSubmit={submitAiMessage} className="stack">
            <textarea
              placeholder="Ask for recommendations (e.g., affordable Indian food in San Jose)"
              value={aiInput}
              onChange={(event) => setAiInput(event.target.value)}
            />
            <button type="submit" disabled={aiLoading}>
              {aiLoading ? 'Thinking...' : 'Ask Assistant'}
            </button>
          </form>

          {aiMessage && <p className="info">{aiMessage}</p>}

          {aiFilters && (
            <div className="card">
              <h3>Extracted Filters</h3>
              <pre className="filters-block">{formattedFilters}</pre>
            </div>
          )}

          <div className="list">
            {aiConversation.map((msg, index) => (
              <article key={`${msg.role}-${index}`} className="card">
                <p><strong>{msg.role === 'assistant' ? 'Assistant' : 'You'}:</strong> {msg.content}</p>
              </article>
            ))}
          </div>

          <div className="list">
            {aiRecommendations.map((restaurant) => (
              <article key={restaurant.id} className="card">
                <h3>{restaurant.name}</h3>
                <p>{restaurant.cuisine_type} • {restaurant.city}</p>
                <p>Price Tier: {restaurant.price_tier ?? 'N/A'} | Score: {restaurant.score}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      {ownerRestaurants.length > 0 && (
        <section className="panel">
          <h2>Claimed Restaurants Snapshot</h2>
          <div className="restaurant-grid">
            {ownerRestaurants.map((restaurant) => (
              <article key={`owner-${restaurant.id}`} className="restaurant-card">
                <h3>{restaurant.name}</h3>
                <p className="muted">{restaurant.cuisine_type} • {restaurant.city}</p>
                <p>Avg Rating: {restaurant.avg_rating ?? 'N/A'}</p>
                <p>Review Count: {restaurant.review_count}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer className="site-footer">
        <p>Lab Pair 20: Viraat Chaudhary and Raniel Quesada.</p>
      </footer>
    </div>
  )
}

export default App
