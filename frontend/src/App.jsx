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

  const [favoriteRestaurantIds, setFavoriteRestaurantIds] = useState(new Set())
  const [favoritesMessage, setFavoritesMessage] = useState('')

  const [activeRestaurantId, setActiveRestaurantId] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewMessage, setReviewMessage] = useState('')

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
  }, [token])

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

  return (
    <div className="app-shell">
      <header>
        <h1>Yelp Prototype Frontend</h1>
        <p>Lab demo client for auth, restaurants, favorites, and reviews.</p>
      </header>

      <section className="panel">
        <h2>API Connection</h2>
        <div className="row">
          <input
            value={apiBaseUrl}
            onChange={(event) => setApiBaseUrl(event.target.value)}
            placeholder="http://127.0.0.1:8000"
          />
          <button onClick={loadRestaurants}>Reload Restaurants</button>
        </div>
      </section>

      <section className="panel">
        <h2>User Auth</h2>
        <div className="row">
          <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
            Login
          </button>
          <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>
            Sign Up
          </button>
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

        {currentUser && (
          <p className="success">Logged in as: {currentUser.name} ({currentUser.email})</p>
        )}
        {authMessage && <p className="info">{authMessage}</p>}
      </section>

      <section className="panel">
        <h2>Owner Portal</h2>
        <div className="row wrap">
          <button className={ownerAuthMode === 'login' ? 'active' : ''} onClick={() => setOwnerAuthMode('login')}>
            Owner Login
          </button>
          <button className={ownerAuthMode === 'signup' ? 'active' : ''} onClick={() => setOwnerAuthMode('signup')}>
            Owner Sign Up
          </button>
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
          <button onClick={() => claimRestaurantForOwner(Number(ownerClaimRestaurantId))}>
            Claim by ID
          </button>
        </div>

        {currentOwner && <p className="success">Owner logged in as: {currentOwner.name}</p>}
        {ownerMessage && <p className="info">{ownerMessage}</p>}

        {ownerDashboard && (
          <div className="card">
            <h3>Owner Dashboard</h3>
            <p>Claimed Restaurants: {ownerDashboard.claimed_restaurants}</p>
            <p>Total Reviews: {ownerDashboard.total_reviews}</p>
            <p>Average Rating: {ownerDashboard.avg_rating ?? 'N/A'}</p>
          </div>
        )}

        <div className="list">
          {ownerRestaurants.map((restaurant) => (
            <article key={restaurant.id} className="card">
              <h3>{restaurant.name}</h3>
              <p>{restaurant.cuisine_type} • {restaurant.city}</p>
              <p>Avg Rating: {restaurant.avg_rating ?? 'N/A'}</p>
              <p>Review Count: {restaurant.review_count}</p>
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

        <div className="list">
          {restaurants.map((restaurant) => (
            <article key={restaurant.id} className="card">
              <h3>{restaurant.name}</h3>
              <p>{restaurant.cuisine_type} • {restaurant.city}</p>
              {restaurant.description && <p>{restaurant.description}</p>}
              <div className="row">
                <button onClick={() => setActiveRestaurantId(restaurant.id)}>
                  View Reviews
                </button>
                <button onClick={() => toggleFavorite(restaurant.id)}>
                  {favoriteRestaurantIds.has(restaurant.id) ? 'Unfavorite' : 'Favorite'}
                </button>
                <button onClick={() => claimRestaurantForOwner(restaurant.id)}>
                  Claim (Owner)
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

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
              <p>Rating: {review.rating}/5</p>
              <p>{review.comment || 'No comment'}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default App
