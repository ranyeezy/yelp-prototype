import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState('http://127.0.0.1:8000')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [token, setToken] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    about_me: '',
    city: '',
    state: '',
    country: '',
    languages: '',
    gender: '',
    profile_photo: '',
  })
  const [profileMessage, setProfileMessage] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  const [ownerAuthMode, setOwnerAuthMode] = useState('login')
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', password: '', restaurant_location: '' })
  const [ownerToken, setOwnerToken] = useState('')
  const [currentOwner, setCurrentOwner] = useState(null)
  const [ownerMessage, setOwnerMessage] = useState('')
  const [ownerAuthLoading, setOwnerAuthLoading] = useState(false)
  const [ownerProfileForm, setOwnerProfileForm] = useState({ name: '', email: '', restaurant_location: '' })
  const [ownerProfileSaving, setOwnerProfileSaving] = useState(false)
  const [ownerClaimRestaurantId, setOwnerClaimRestaurantId] = useState('')
  const [ownerRestaurants, setOwnerRestaurants] = useState([])
  const [ownerDashboard, setOwnerDashboard] = useState(null)

  const [restaurantQuery, setRestaurantQuery] = useState({ keyword: '', city: '', cuisine_type: '' })
  const [restaurants, setRestaurants] = useState([])
  const [restaurantsMessage, setRestaurantsMessage] = useState('')
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)
  const [myListings, setMyListings] = useState([])
  const [listingMessage, setListingMessage] = useState('')
  const [listingSaving, setListingSaving] = useState(false)
  const [listingActionId, setListingActionId] = useState(null)
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
  const [favoriteActionId, setFavoriteActionId] = useState(null)

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
  const [preferencesSaving, setPreferencesSaving] = useState(false)

  const [activeRestaurantId, setActiveRestaurantId] = useState(null)
  const [reviews, setReviews] = useState([])
  const [myReviewHistory, setMyReviewHistory] = useState([])
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewMessage, setReviewMessage] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)

  const [aiInput, setAiInput] = useState('')
  const [aiConversation, setAiConversation] = useState([])
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [aiFilters, setAiFilters] = useState(null)
  const [aiMessage, setAiMessage] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const countryOptions = ['United States', 'Canada', 'Mexico', 'India', 'United Kingdom', 'Other']

  const activeRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === activeRestaurantId) ?? null,
    [restaurants, activeRestaurantId],
  )

  const apiRequest = useCallback(async (path, options = {}) => {
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
  }, [apiBaseUrl, token])

  const loadCurrentUser = useCallback(async () => {
    if (!token) return
    try {
      const user = await apiRequest('/users/me')
      setCurrentUser(user)
    } catch {
      setCurrentUser(null)
    }
  }, [token, apiRequest])

  const loadCurrentOwner = useCallback(async () => {
    if (!ownerToken) return
    try {
      const owner = await apiRequest('/owners/me', { authToken: ownerToken })
      setCurrentOwner(owner)
    } catch {
      setCurrentOwner(null)
    }
  }, [ownerToken, apiRequest])

  const loadOwnerData = useCallback(async () => {
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
  }, [ownerToken, apiRequest])

  const loadRestaurants = useCallback(async () => {
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
  }, [restaurantQuery, apiRequest])

  const loadFavorites = useCallback(async () => {
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
  }, [token, apiRequest])

  const loadPreferences = useCallback(async () => {
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
  }, [token, apiRequest])

  const loadMyListings = useCallback(async () => {
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
  }, [token, currentUser, apiRequest])

  const loadReviews = useCallback(async (restaurantId) => {
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
  }, [apiRequest])

  const loadMyReviewHistory = useCallback(async () => {
    if (!token) {
      setMyReviewHistory([])
      return
    }
    try {
      const data = await apiRequest('/reviews/me', { method: 'GET' })
      setMyReviewHistory(data)
    } catch {
      setMyReviewHistory([])
    }
  }, [token, apiRequest])

  useEffect(() => {
    loadRestaurants()
  }, [loadRestaurants])

  useEffect(() => {
    loadCurrentUser()
    loadFavorites()
    loadPreferences()
  }, [loadCurrentUser, loadFavorites, loadPreferences])

  useEffect(() => {
    loadMyReviewHistory()
  }, [loadMyReviewHistory])

  useEffect(() => {
    loadMyListings()
  }, [loadMyListings])

  useEffect(() => {
    loadCurrentOwner()
    loadOwnerData()
  }, [loadCurrentOwner, loadOwnerData])

  useEffect(() => {
    if (!currentOwner) {
      setOwnerProfileForm({ name: '', email: '', restaurant_location: '' })
      return
    }
    setOwnerProfileForm({
      name: currentOwner.name ?? '',
      email: currentOwner.email ?? '',
      restaurant_location: currentOwner.restaurant_location ?? '',
    })
  }, [currentOwner])

  useEffect(() => {
    loadReviews(activeRestaurantId)
  }, [activeRestaurantId, loadReviews])

  useEffect(() => {
    if (!currentUser) {
      setProfileForm({
        name: '',
        email: '',
        phone: '',
        about_me: '',
        city: '',
        state: '',
        country: '',
        languages: '',
        gender: '',
        profile_photo: '',
      })
      return
    }

    setProfileForm({
      name: currentUser.name ?? '',
      email: currentUser.email ?? '',
      phone: currentUser.phone ?? '',
      about_me: currentUser.about_me ?? '',
      city: currentUser.city ?? '',
      state: currentUser.state ?? '',
      country: currentUser.country ?? '',
      languages: currentUser.languages ?? '',
      gender: currentUser.gender ?? '',
      profile_photo: currentUser.profile_photo ?? '',
    })
  }, [currentUser])

  const onAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthMessage('')
    setAuthLoading(true)
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
    } finally {
      setAuthLoading(false)
    }
  }

  const toggleFavorite = async (restaurantId) => {
    setFavoritesMessage('')
    if (!token) {
      setFavoritesMessage('Please login to manage favorites.')
      return
    }

    setFavoriteActionId(restaurantId)
    try {
      if (favoriteRestaurantIds.has(restaurantId)) {
        await apiRequest(`/favorites/${restaurantId}`, { method: 'DELETE' })
      } else {
        await apiRequest(`/favorites/${restaurantId}`, { method: 'POST', headers: {} })
      }
      await loadFavorites()
    } catch (error) {
      setFavoritesMessage(error.message)
    } finally {
      setFavoriteActionId(null)
    }
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setProfileMessage('')

    if (!token) {
      setProfileMessage('Please login to update profile.')
      return
    }

    const normalizedState = profileForm.state.trim().toUpperCase()
    if (normalizedState && normalizedState.length !== 2) {
      setProfileMessage('State must be a 2-letter abbreviation.')
      return
    }

    setProfileSaving(true)
    try {
      const updated = await apiRequest('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          ...profileForm,
          state: normalizedState || null,
          phone: profileForm.phone || null,
          about_me: profileForm.about_me || null,
          city: profileForm.city || null,
          country: profileForm.country || null,
          languages: profileForm.languages || null,
          gender: profileForm.gender || null,
          profile_photo: profileForm.profile_photo || null,
        }),
        headers: {},
      })
      setCurrentUser(updated)
      setProfileMessage('Profile updated successfully.')
    } catch (error) {
      setProfileMessage(error.message)
    } finally {
      setProfileSaving(false)
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

    setReviewSaving(true)
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
    } finally {
      setReviewSaving(false)
    }
  }

  const savePreferences = async (event) => {
    event.preventDefault()
    setPreferencesMessage('')
    if (!token) {
      setPreferencesMessage('Please login to update preferences.')
      return
    }

    if (
      preferencesForm.price_min &&
      preferencesForm.price_max &&
      Number(preferencesForm.price_min) > Number(preferencesForm.price_max)
    ) {
      setPreferencesMessage('Price min cannot be greater than price max.')
      return
    }

    setPreferencesSaving(true)
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
    } finally {
      setPreferencesSaving(false)
    }
  }

  const submitListing = async (event) => {
    event.preventDefault()
    setListingMessage('')

    if (!token) {
      setListingMessage('Please login to create a listing.')
      return
    }

    if (listingForm.price_tier) {
      const parsedTier = Number(listingForm.price_tier)
      if (!Number.isInteger(parsedTier) || parsedTier < 1 || parsedTier > 4) {
        setListingMessage('Price tier must be a whole number between 1 and 4.')
        return
      }
    }

    setListingSaving(true)
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
    } finally {
      setListingSaving(false)
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
    if (editingListingForm.price_tier) {
      const parsedTier = Number(editingListingForm.price_tier)
      if (!Number.isInteger(parsedTier) || parsedTier < 1 || parsedTier > 4) {
        setListingMessage('Edited price tier must be a whole number between 1 and 4.')
        return
      }
    }

    setListingActionId(listingId)
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
    } finally {
      setListingActionId(null)
    }
  }

  const deleteListing = async (listingId) => {
    setListingMessage('')
    setListingActionId(listingId)
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
    } finally {
      setListingActionId(null)
    }
  }

  const logout = () => {
    setToken('')
    setCurrentUser(null)
    setMyReviewHistory([])
    setAuthMessage('Logged out.')
  }

  const onOwnerAuthSubmit = async (event) => {
    event.preventDefault()
    setOwnerMessage('')
    setOwnerAuthLoading(true)
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
    } finally {
      setOwnerAuthLoading(false)
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

  const saveOwnerProfile = async (event) => {
    event.preventDefault()
    setOwnerMessage('')

    if (!ownerToken) {
      setOwnerMessage('Owner login required to update profile.')
      return
    }

    setOwnerProfileSaving(true)
    try {
      const updated = await apiRequest('/owners/me', {
        method: 'PUT',
        body: JSON.stringify({
          name: ownerProfileForm.name,
          email: ownerProfileForm.email,
          restaurant_location: ownerProfileForm.restaurant_location || null,
        }),
        headers: {},
        authToken: ownerToken,
      })
      setCurrentOwner(updated)
      setOwnerMessage('Owner profile updated successfully.')
    } catch (error) {
      setOwnerMessage(error.message)
    } finally {
      setOwnerProfileSaving(false)
    }
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
            aria-label="Backend API base URL"
          />
          <button onClick={loadRestaurants} disabled={loadingRestaurants}>
            {loadingRestaurants ? 'Loading...' : 'Reload Restaurants'}
          </button>
          <span className="status-chip">User: {currentUser ? 'Connected' : 'Guest'}</span>
          <span className="status-chip">Owner: {currentOwner ? 'Connected' : 'Guest'}</span>
        </div>
      </section>

      <section className="panel">
        <h2>User Profile</h2>
        <form onSubmit={saveProfile} className="stack">
          <div className="row wrap">
            <input
              placeholder="Name"
              value={profileForm.name}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
              disabled={!token}
            />
            <input
              placeholder="Email"
              type="email"
              value={profileForm.email}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
              disabled={!token}
            />
            <input
              placeholder="Phone"
              value={profileForm.phone}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
              disabled={!token}
            />
            <input
              placeholder="City"
              value={profileForm.city}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, city: event.target.value }))}
              disabled={!token}
            />
            <input
              placeholder="State (2-letter)"
              value={profileForm.state}
              maxLength={2}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, state: event.target.value.toUpperCase() }))}
              disabled={!token}
            />
            <select
              value={profileForm.country}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, country: event.target.value }))}
              disabled={!token}
            >
              <option value="">Country</option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            <input
              placeholder="Languages"
              value={profileForm.languages}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, languages: event.target.value }))}
              disabled={!token}
            />
            <input
              placeholder="Gender"
              value={profileForm.gender}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, gender: event.target.value }))}
              disabled={!token}
            />
            <input
              placeholder="Profile photo URL"
              value={profileForm.profile_photo}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, profile_photo: event.target.value }))}
              disabled={!token}
            />
          </div>
          <textarea
            placeholder="About me"
            value={profileForm.about_me}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, about_me: event.target.value }))}
            disabled={!token}
          />
          <button type="submit" disabled={!token || profileSaving}>
            {profileSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
        {profileMessage && <p className="info">{profileMessage}</p>}
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
            <button type="submit" disabled={preferencesSaving || !token}>
              {preferencesSaving ? 'Saving...' : 'Save Preferences'}
            </button>
            <button type="button" onClick={loadPreferences} disabled={!token}>
              Reload Preferences
            </button>
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
            <button type="submit" disabled={authLoading}>
              {authLoading
                ? 'Please wait...'
                : authMode === 'signup'
                  ? 'Create Account + Login'
                  : 'Login'}
            </button>
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
            {ownerAuthMode === 'signup' && (
              <input
                value={ownerForm.restaurant_location}
                onChange={(event) => setOwnerForm((prev) => ({ ...prev, restaurant_location: event.target.value }))}
                placeholder="Primary restaurant location"
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
            <button type="submit" disabled={ownerAuthLoading}>
              {ownerAuthLoading
                ? 'Please wait...'
                : ownerAuthMode === 'signup'
                  ? 'Create Owner + Login'
                  : 'Owner Login'}
            </button>
          </form>

          <div className="row wrap">
            <input
              value={ownerClaimRestaurantId}
              onChange={(event) => setOwnerClaimRestaurantId(event.target.value)}
              placeholder="Restaurant ID to claim"
            />
            <button onClick={() => claimRestaurantForOwner(Number(ownerClaimRestaurantId))} disabled={!ownerToken}>
              Claim by ID
            </button>
          </div>

          {currentOwner && <p className="success">Owner logged in as: {currentOwner.name}</p>}
          {ownerMessage && <p className="info">{ownerMessage}</p>}

          {ownerToken && (
            <form onSubmit={saveOwnerProfile} className="stack">
              <div className="row wrap">
                <input
                  value={ownerProfileForm.name}
                  onChange={(event) => setOwnerProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Owner name"
                />
                <input
                  value={ownerProfileForm.email}
                  onChange={(event) => setOwnerProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Owner email"
                  type="email"
                />
                <input
                  value={ownerProfileForm.restaurant_location}
                  onChange={(event) => setOwnerProfileForm((prev) => ({ ...prev, restaurant_location: event.target.value }))}
                  placeholder="Restaurant location"
                />
                <button type="submit" disabled={ownerProfileSaving}>
                  {ownerProfileSaving ? 'Saving...' : 'Save Owner Profile'}
                </button>
              </div>
            </form>
          )}

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

          {ownerToken && ownerRestaurants.length === 0 && (
            <p className="info">No claimed restaurants yet. Claim one from the Restaurants section.</p>
          )}

          {ownerDashboard?.recent_reviews?.length > 0 && (
            <div className="list">
              {ownerDashboard.recent_reviews.map((item) => (
                <article key={`owner-review-${item.review_id}`} className="card">
                  <p><strong>{item.restaurant_name}</strong> • {item.rating}/5</p>
                  <p>{item.comment || 'No comment'}</p>
                </article>
              ))}
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
          <button type="submit" disabled={listingSaving}>
            {listingSaving ? 'Creating...' : 'Create Listing'}
          </button>
        </form>
        {listingMessage && <p className="info">{listingMessage}</p>}

        {token && myListings.length === 0 && (
          <p className="info">You have no listings yet. Create your first restaurant above.</p>
        )}

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

      <section className="panel">
        <h2>My Review History</h2>
        {token && myReviewHistory.length === 0 && <p className="info">No past reviews yet.</p>}
        {!token && <p className="info">Login to view your review history.</p>}
        <div className="list">
          {myReviewHistory.map((item) => (
            <article key={`history-${item.id}`} className="card">
              <p><strong>{item.restaurant_name}</strong> ({item.restaurant_city || 'N/A'})</p>
              <p>Rating: {item.rating}/5</p>
              <p>{item.comment || 'No comment'}</p>
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
          <button onClick={loadRestaurants} disabled={loadingRestaurants}>Search</button>
        </div>

        {loadingRestaurants && <p className="info">Loading restaurants...</p>}
        {restaurantsMessage && <p className="info">{restaurantsMessage}</p>}
        {favoritesMessage && <p className="info">{favoritesMessage}</p>}
        {!loadingRestaurants && restaurants.length === 0 && <p className="info">No restaurants to display yet.</p>}

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
                <button onClick={() => toggleFavorite(restaurant.id)} disabled={favoriteActionId === restaurant.id}>
                  {favoriteRestaurantIds.has(restaurant.id) ? 'Unfavorite' : 'Favorite'}
                </button>
                <button onClick={() => claimRestaurantForOwner(restaurant.id)} disabled={!ownerToken}>Claim (Owner)</button>
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
            <button type="submit" disabled={reviewSaving || !token || !activeRestaurantId}>
              {reviewSaving ? 'Posting...' : 'Post Review'}
            </button>
          </form>
          {reviewMessage && <p className="info">{reviewMessage}</p>}

          {activeRestaurant && reviews.length === 0 && (
            <p className="info">No reviews yet. Be the first to review this place.</p>
          )}

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

          {aiConversation.length === 0 && (
            <p className="info">Start by asking for a cuisine, city, budget, or dietary preference.</p>
          )}

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

          {aiConversation.length > 0 && aiRecommendations.length === 0 && !aiLoading && (
            <p className="info">No recommendation cards yet. Try adding more specific filters.</p>
          )}
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
