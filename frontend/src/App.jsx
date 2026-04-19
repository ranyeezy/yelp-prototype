import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import ExploreSearchPage from './pages/public/ExploreSearchPage'
import RestaurantDetailsPage from './pages/public/RestaurantDetailsPage'
import UserLoginPage from './pages/user/UserLoginPage'
import UserSignupPage from './pages/user/UserSignupPage'
import ProfilePreferencesPage from './pages/user/ProfilePreferencesPage'
import AddRestaurantPage from './pages/user/AddRestaurantPage'
import WriteReviewPage from './pages/user/WriteReviewPage'
import AIAssistantPage from './pages/user/AIAssistantPage'
import FavouritesPage from './pages/user/FavouritesPage'
import UserHistoryPage from './pages/user/UserHistoryPage'
import OwnerLoginPage from './pages/owner/OwnerLoginPage'
import OwnerSignupPage from './pages/owner/OwnerSignupPage'
import OwnerProfilePage from './pages/owner/OwnerProfilePage'
import OwnerManageRestaurantPage from './pages/owner/OwnerManageRestaurantPage'
import OwnerClaimPage from './pages/owner/OwnerClaimPage'
import OwnerReviewsDashboardPage from './pages/owner/OwnerReviewsDashboardPage'
import OwnerAnalyticsPage from './pages/owner/OwnerAnalyticsPage'
import OwnerLayout from './components/OwnerLayout'

const emptyProfileEditorForm = {
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
}

const emptyPreferencesEditorForm = {
  cuisines: '',
  price_min: '',
  price_max: '',
  preferred_locations: '',
  search_radius: '',
  dietary_needs: '',
  ambiance: '',
  sort_preference: '',
}

function App() {
  const [apiBaseUrl] = useState('http://127.0.0.1:8000')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [token, setToken] = useState(() => localStorage.getItem('authToken') ?? '')
  const [currentUser, setCurrentUser] = useState(null)
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [profileForm, setProfileForm] = useState(emptyProfileEditorForm)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profilePhotoFile, setProfilePhotoFile] = useState(null)
  const [profilePhotoUploading, setProfilePhotoUploading] = useState(false)

  const [ownerAuthMode, setOwnerAuthMode] = useState('login')
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', password: '', restaurant_location: '' })
  const [ownerToken, setOwnerToken] = useState(() => localStorage.getItem('ownerAuthToken') ?? '')
  const [currentOwner, setCurrentOwner] = useState(null)
  const [ownerMessage, setOwnerMessage] = useState('')
  const [ownerAuthLoading, setOwnerAuthLoading] = useState(false)
  const [ownerProfileForm, setOwnerProfileForm] = useState({ name: '', email: '', restaurant_location: '' })
  const [ownerProfileSaving, setOwnerProfileSaving] = useState(false)
  const [ownerClaimRestaurantId, setOwnerClaimRestaurantId] = useState('')
  const [ownerRestaurants, setOwnerRestaurants] = useState([])
  const [ownerDashboard, setOwnerDashboard] = useState(null)
  const [selectedOwnerRestaurantId, setSelectedOwnerRestaurantId] = useState('')
  const [ownerRestaurantForm, setOwnerRestaurantForm] = useState({
    name: '',
    cuisine_type: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    description: '',
    phone: '',
    price_tier: '',
    hours: '',
    amenities: '',
    photo_url: '',
  })
  const [ownerNewRestaurantForm, setOwnerNewRestaurantForm] = useState({
    name: '',
    cuisine_type: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    description: '',
    phone: '',
    price_tier: '',
    hours: '',
    amenities: '',
    photo_url: '',
  })
  const [ownerRestaurantSaving, setOwnerRestaurantSaving] = useState(false)
  const [ownerNewRestaurantSaving, setOwnerNewRestaurantSaving] = useState(false)
  const [ownerRestaurantPhotoUploading, setOwnerRestaurantPhotoUploading] = useState(false)
  const [ownerNewRestaurantPhotoFile, setOwnerNewRestaurantPhotoFile] = useState(null)
  const [ownerEditRestaurantPhotoFile, setOwnerEditRestaurantPhotoFile] = useState(null)
  const [ownerRestaurantReviews, setOwnerRestaurantReviews] = useState([])
  const [globallyClaimedRestaurantIds, setGloballyClaimedRestaurantIds] = useState(new Set())

  const [restaurantQuery, setRestaurantQuery] = useState({ keyword: '', city: '', cuisine_type: '' })
  const [restaurants, setRestaurants] = useState([])
  const [restaurantsMessage, setRestaurantsMessage] = useState('')
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)
  const [myListings, setMyListings] = useState([])
  const [listingMessage, setListingMessage] = useState('')
  const [listingSaving, setListingSaving] = useState(false)
  const [listingPhotoFile, setListingPhotoFile] = useState(null)
  const [listingPhotoUploading, setListingPhotoUploading] = useState(false)
  const [listingActionId, setListingActionId] = useState(null)
  const [listingForm, setListingForm] = useState({
    name: '',
    cuisine_type: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    hours: '',
    description: '',
    price_tier: '',
    photo_url: '',
  })
  const [editingListingId, setEditingListingId] = useState(null)
  const [editingListingForm, setEditingListingForm] = useState({ description: '', price_tier: '' })

  const [favoriteRestaurantIds, setFavoriteRestaurantIds] = useState(new Set())
  const [favoriteRestaurants, setFavoriteRestaurants] = useState([])
  const [favoritesMessage, setFavoritesMessage] = useState('')
  const [favoriteActionId, setFavoriteActionId] = useState(null)

  const [preferencesForm, setPreferencesForm] = useState({
    ...emptyPreferencesEditorForm,
  })
  const [currentPreferences, setCurrentPreferences] = useState(null)
  const [preferencesMessage, setPreferencesMessage] = useState('')
  const [preferencesSaving, setPreferencesSaving] = useState(false)

  const [activeRestaurantId, setActiveRestaurantId] = useState(null)
  const [reviews, setReviews] = useState([])
  const [myReviewHistory, setMyReviewHistory] = useState([])
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editingReviewForm, setEditingReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewMessage, setReviewMessage] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewPhotoFile, setReviewPhotoFile] = useState(null)
  const [reviewPhotoUploading, setReviewPhotoUploading] = useState(false)

  const [aiInput, setAiInput] = useState('')
  const [aiConversation, setAiConversation] = useState([])
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [aiFilters, setAiFilters] = useState(null)
  const [aiWebContext, setAiWebContext] = useState([])
  const [aiMessage, setAiMessage] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [isAiWidgetOpen, setIsAiWidgetOpen] = useState(false)

  const countryOptions = ['United States', 'Canada', 'Mexico', 'India', 'United Kingdom', 'Other']
  const location = useLocation()
  const navigate = useNavigate()

  const activeRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === activeRestaurantId) ?? null,
    [restaurants, activeRestaurantId],
  )

  const ownerClaimedRestaurantIds = useMemo(
    () => new Set(ownerRestaurants.map((restaurant) => restaurant.id)),
    [ownerRestaurants],
  )

  const apiRequest = useCallback(async (path, options = {}) => {
    const { authToken, ...fetchOptions } = options
    const isFormData = fetchOptions.body instanceof FormData
    const headers = {
      ...(fetchOptions.headers ?? {}),
    }
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
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
      setSelectedOwnerRestaurantId('')
      return
    }

    try {
      const [restaurantsData, dashboardData] = await Promise.all([
        apiRequest('/owners/restaurants', { authToken: ownerToken }),
        apiRequest('/owners/dashboard', { authToken: ownerToken }),
      ])
      setOwnerRestaurants(restaurantsData)
      setOwnerDashboard(dashboardData)
      if (restaurantsData.length > 0 && !selectedOwnerRestaurantId) {
        setSelectedOwnerRestaurantId(String(restaurantsData[0].id))
      }
    } catch {
      setOwnerRestaurants([])
      setOwnerDashboard(null)
      setSelectedOwnerRestaurantId('')
    }
  }, [ownerToken, apiRequest, selectedOwnerRestaurantId])

  const loadOwnerRestaurantDetails = useCallback(async () => {
    if (!ownerToken || !selectedOwnerRestaurantId) {
      setOwnerRestaurantForm({
        name: '',
        cuisine_type: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        description: '',
        phone: '',
        price_tier: '',
        hours: '',
        amenities: '',
        photo_url: '',
      })
      setOwnerRestaurantReviews([])
      return
    }

    try {
      const [restaurantData, reviewsData] = await Promise.all([
        apiRequest(`/owners/restaurants/${selectedOwnerRestaurantId}`, { authToken: ownerToken }),
        apiRequest(`/owners/restaurants/${selectedOwnerRestaurantId}/reviews`, { authToken: ownerToken }),
      ])
      setOwnerRestaurantForm({
        name: restaurantData.name ?? '',
        cuisine_type: restaurantData.cuisine_type ?? '',
        address: restaurantData.address ?? '',
        city: restaurantData.city ?? '',
        state: restaurantData.state ?? '',
        zip: restaurantData.zip ?? '',
        country: restaurantData.country ?? '',
        description: restaurantData.description ?? '',
        phone: restaurantData.phone ?? '',
        price_tier: restaurantData.price_tier ?? '',
        hours: restaurantData.hours ?? '',
        amenities: restaurantData.amenities ?? '',
        photo_url: restaurantData.photo_url ?? '',
      })
      setOwnerRestaurantReviews(reviewsData)
    } catch {
      setOwnerRestaurantReviews([])
    }
  }, [ownerToken, selectedOwnerRestaurantId, apiRequest])

  const loadGloballyClaimedIds = useCallback(async () => {
    try {
      const data = await apiRequest('/owners/claimed-restaurant-ids', { method: 'GET', authToken: '' })
      setGloballyClaimedRestaurantIds(new Set(data))
    } catch {
      setGloballyClaimedRestaurantIds(new Set())
    }
  }, [apiRequest])

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
      setFavoriteRestaurants([])
      return
    }
    try {
      const data = await apiRequest('/favorites/me')
      setFavoriteRestaurantIds(new Set(data.map((item) => item.restaurant.id)))
      setFavoriteRestaurants(data.map((item) => item.restaurant))
    } catch {
      setFavoriteRestaurantIds(new Set())
      setFavoriteRestaurants([])
    }
  }, [token, apiRequest])

  const loadPreferences = useCallback(async () => {
    if (!token) {
      setCurrentPreferences(null)
      setPreferencesForm(emptyPreferencesEditorForm)
      return
    }

    try {
      const data = await apiRequest('/preferences/me', { method: 'GET' })
      setCurrentPreferences(data)
      setPreferencesForm(emptyPreferencesEditorForm)
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
    if (token) {
      localStorage.setItem('authToken', token)
    } else {
      localStorage.removeItem('authToken')
    }
  }, [token])

  useEffect(() => {
    if (ownerToken) {
      localStorage.setItem('ownerAuthToken', ownerToken)
    } else {
      localStorage.removeItem('ownerAuthToken')
    }
  }, [ownerToken])

  useEffect(() => {
    loadRestaurants()
    loadGloballyClaimedIds()
  }, [loadRestaurants, loadGloballyClaimedIds])

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
    if (!token) return
    if (location.pathname !== '/profile') return
    loadCurrentUser()
    loadPreferences()
  }, [token, location.pathname, loadCurrentUser, loadPreferences])

  useEffect(() => {
    loadCurrentOwner()
    loadOwnerData()
  }, [loadCurrentOwner, loadOwnerData])

  useEffect(() => {
    loadOwnerRestaurantDetails()
  }, [loadOwnerRestaurantDetails])

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
    setProfileForm(emptyProfileEditorForm)
  }, [currentUser])

  const onUserSignupSubmit = async (event) => {
    event.preventDefault()
    setAuthMessage('')
    setAuthLoading(true)
    try {
      await apiRequest('/auth/users/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
        }),
        headers: {},
      })
      setAuthMessage('Account created successfully. Please use User Login to sign in.')
      setAuthForm((prev) => ({ ...prev, password: '' }))
      navigate('/login')
    } catch (error) {
      setAuthMessage(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const onUserLoginSubmit = async (event) => {
    event.preventDefault()
    setAuthMessage('')
    setAuthLoading(true)
    try {
      const loginFormData = new URLSearchParams()
      loginFormData.append('username', authForm.email)
      loginFormData.append('password', authForm.password)
      const loginData = await apiRequest('/auth/users/login', {
        method: 'POST',
        body: loginFormData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      const userData = await apiRequest('/users/me', {
        method: 'GET',
        authToken: loginData.access_token,
      })
      setToken(loginData.access_token)
      setCurrentUser(userData)
      // Clear owner session — only one role can be active at a time
      setOwnerToken('')
      setCurrentOwner(null)
      setOwnerRestaurants([])
      setOwnerDashboard(null)
      setSelectedOwnerRestaurantId('')
      setOwnerRestaurantReviews([])
      setAuthMessage('Logged in successfully.')
      navigate('/restaurants')
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

    const payload = {}
    const setIfProvided = (key, value) => {
      const trimmed = String(value ?? '').trim()
      if (trimmed) payload[key] = trimmed
    }

    setIfProvided('name', profileForm.name)
    setIfProvided('email', profileForm.email)
    setIfProvided('phone', profileForm.phone)
    setIfProvided('about_me', profileForm.about_me)
    setIfProvided('city', profileForm.city)
    if (normalizedState) payload.state = normalizedState
    setIfProvided('country', profileForm.country)
    setIfProvided('languages', profileForm.languages)
    setIfProvided('gender', profileForm.gender)
    setIfProvided('profile_photo', profileForm.profile_photo)

    if (Object.keys(payload).length === 0) {
      setProfileMessage('Enter at least one field in Profile Editor to update.')
      return
    }

    setProfileSaving(true)
    try {
      const updated = await apiRequest('/users/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: {},
      })
      setCurrentUser(updated)
      setProfileForm(emptyProfileEditorForm)
      setProfileMessage('Profile updated successfully.')
    } catch (error) {
      setProfileMessage(error.message)
    } finally {
      setProfileSaving(false)
    }
  }

  const uploadProfilePhoto = async () => {
    setProfileMessage('')
    if (!token) {
      setProfileMessage('Please login to upload a profile photo.')
      return
    }
    if (!profilePhotoFile) {
      setProfileMessage('Please choose an image file first.')
      return
    }

    setProfilePhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', profilePhotoFile)

      const updated = await apiRequest('/users/me/profile-photo', {
        method: 'POST',
        body: formData,
        headers: {},
      })
      setCurrentUser(updated)
      setProfilePhotoFile(null)
      setProfileMessage('Profile photo uploaded successfully.')
    } catch (error) {
      setProfileMessage(error.message)
    } finally {
      setProfilePhotoUploading(false)
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
          photo_url: reviewForm.photo_url || null,
        }),
        headers: {},
      })
      setReviewForm({ rating: 5, comment: '' })
      setReviewPhotoFile(null)
      setReviewMessage('Review added successfully.')
      await loadReviews(activeRestaurantId)
      await loadMyReviewHistory()
    } catch (error) {
      setReviewMessage(error.message)
    } finally {
      setReviewSaving(false)
    }
  }

  const uploadReviewPhoto = async () => {
    setReviewMessage('')
    if (!token) { setReviewMessage('Please login to upload a photo.'); return }
    if (!reviewPhotoFile) { setReviewMessage('Please choose an image file first.'); return }
    setReviewPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', reviewPhotoFile)
      const uploaded = await apiRequest('/reviews/uploads/photo', {
        method: 'POST',
        body: formData,
        headers: {},
      })
      setReviewForm((prev) => ({ ...prev, photo_url: uploaded.photo_url ?? '' }))
      setReviewMessage('Photo uploaded. Now click Post Review.')
    } catch (error) {
      setReviewMessage(error.message)
    } finally {
      setReviewPhotoUploading(false)
    }
  }

  const startEditReview = (review) => {
    setEditingReviewId(review.id)
    setEditingReviewForm({
      rating: review.rating,
      comment: review.comment || '',
    })
  }

  const saveReviewEdit = async (reviewId) => {
    setReviewMessage('')
    setReviewSaving(true)
    try {
      await apiRequest(`/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify({
          rating: Number(editingReviewForm.rating),
          comment: editingReviewForm.comment,
        }),
        headers: {},
      })
      setEditingReviewId(null)
      setReviewMessage('Review updated successfully.')
      await loadReviews(activeRestaurantId)
      await loadMyReviewHistory()
    } catch (error) {
      setReviewMessage(error.message)
    } finally {
      setReviewSaving(false)
    }
  }

  const deleteReview = async (reviewId) => {
    setReviewMessage('')
    setReviewSaving(true)
    try {
      await apiRequest(`/reviews/${reviewId}`, { method: 'DELETE' })
      setEditingReviewId(null)
      setReviewMessage('Review deleted successfully.')
      await loadReviews(activeRestaurantId)
      await loadMyReviewHistory()
    } catch (error) {
      setReviewMessage(error.message)
    } finally {
      setReviewSaving(false)
    }
  }

  const updateMyReviewHistoryItem = async (reviewId, payload) => {
    setReviewMessage('')
    setReviewSaving(true)
    try {
      await apiRequest(`/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify({
          rating: Number(payload.rating),
          comment: payload.comment,
        }),
        headers: {},
      })
      setReviewMessage('Review updated successfully.')
      await loadMyReviewHistory()
      if (activeRestaurantId) {
        await loadReviews(activeRestaurantId)
      }
    } catch (error) {
      setReviewMessage(error.message)
    } finally {
      setReviewSaving(false)
    }
  }

  const deleteMyReviewHistoryItem = async (reviewId) => {
    setReviewMessage('')
    setReviewSaving(true)
    try {
      await apiRequest(`/reviews/${reviewId}`, { method: 'DELETE' })
      setReviewMessage('Review deleted successfully.')
      await loadMyReviewHistory()
      if (activeRestaurantId) {
        await loadReviews(activeRestaurantId)
      }
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

    const payload = {}
    const setIfProvided = (key, value) => {
      const trimmed = String(value ?? '').trim()
      if (trimmed) payload[key] = trimmed
    }

    setIfProvided('cuisines', preferencesForm.cuisines)
    if (preferencesForm.price_min) payload.price_min = Number(preferencesForm.price_min)
    if (preferencesForm.price_max) payload.price_max = Number(preferencesForm.price_max)
    setIfProvided('preferred_locations', preferencesForm.preferred_locations)
    if (preferencesForm.search_radius) payload.search_radius = Number(preferencesForm.search_radius)
    setIfProvided('dietary_needs', preferencesForm.dietary_needs)
    setIfProvided('ambiance', preferencesForm.ambiance)
    setIfProvided('sort_preference', preferencesForm.sort_preference)

    if (Object.keys(payload).length === 0) {
      setPreferencesMessage('Enter at least one preference field to update.')
      return
    }

    setPreferencesSaving(true)
    try {
      const updated = await apiRequest('/preferences/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: {},
      })
      setCurrentPreferences(updated)
      setPreferencesForm(emptyPreferencesEditorForm)
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
        phone: listingForm.phone || null,
        hours: listingForm.hours || null,
        description: listingForm.description || null,
        price_tier: listingForm.price_tier ? Number(listingForm.price_tier) : null,
        photo_url: listingForm.photo_url || null,
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
        phone: '',
        hours: '',
        description: '',
        price_tier: '',
        photo_url: '',
      })
      setListingPhotoFile(null)
      setListingMessage('Restaurant listed successfully.')
      await loadRestaurants()
      await loadMyListings()
    } catch (error) {
      setListingMessage(error.message)
    } finally {
      setListingSaving(false)
    }
  }

  const uploadListingPhoto = async () => {
    setListingMessage('')
    if (!token) {
      setListingMessage('Please login to upload a listing photo.')
      return
    }
    if (!listingPhotoFile) {
      setListingMessage('Please choose an image file first.')
      return
    }

    setListingPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', listingPhotoFile)

      const uploaded = await apiRequest('/restaurants/uploads/photo', {
        method: 'POST',
        body: formData,
        headers: {},
      })

      setListingForm((prev) => ({ ...prev, photo_url: uploaded.photo_url ?? '' }))
      setListingMessage('Restaurant photo uploaded. Now click Create Listing.')
    } catch (error) {
      setListingMessage(error.message)
    } finally {
      setListingPhotoUploading(false)
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
    navigate('/login')
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

        setOwnerMessage('Owner account created successfully. Please login now.')
        setOwnerForm((prev) => ({
          ...prev,
          name: '',
          restaurant_location: '',
          password: '',
        }))
        navigate('/owner/login')
        return
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
      // Clear user session — only one role can be active at a time
      setToken('')
      setCurrentUser(null)
      setMyReviewHistory([])
      setOwnerMessage('Owner logged in successfully.')
      navigate('/owner/profile')
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
    if (ownerClaimedRestaurantIds.has(restaurantId)) {
      setOwnerMessage('You already claimed this restaurant.')
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
      await Promise.all([loadOwnerData(), loadRestaurants(), loadGloballyClaimedIds()])
    } catch (error) {
      setOwnerMessage(error.message)
    }
  }

  const ownerLogout = () => {
    setOwnerToken('')
    setCurrentOwner(null)
    setOwnerRestaurants([])
    setOwnerDashboard(null)
    setSelectedOwnerRestaurantId('')
    setOwnerRestaurantReviews([])
    setOwnerNewRestaurantPhotoFile(null)
    setOwnerEditRestaurantPhotoFile(null)
    setOwnerMessage('Owner logged out.')
    navigate('/owner/login')
  }

  const uploadOwnerRestaurantPhoto = async (targetForm) => {
    setOwnerMessage('')
    if (!ownerToken) {
      setOwnerMessage('Owner login required to upload photos.')
      return
    }

    const file = targetForm === 'new' ? ownerNewRestaurantPhotoFile : ownerEditRestaurantPhotoFile
    if (!file) {
      setOwnerMessage('Please select an image file first.')
      return
    }

    setOwnerRestaurantPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const result = await apiRequest('/owners/uploads/photo', {
        method: 'POST',
        body: formData,
        authToken: ownerToken,
        headers: {},
      })

      if (targetForm === 'new') {
        setOwnerNewRestaurantForm((prev) => ({ ...prev, photo_url: result.photo_url }))
        setOwnerNewRestaurantPhotoFile(null)
      } else {
        setOwnerRestaurantForm((prev) => ({ ...prev, photo_url: result.photo_url }))
        setOwnerEditRestaurantPhotoFile(null)
      }
      setOwnerMessage('Owner restaurant photo uploaded successfully.')
    } catch (error) {
      setOwnerMessage(error.message)
    } finally {
      setOwnerRestaurantPhotoUploading(false)
    }
  }

  const submitOwnerRestaurant = async (event) => {
    event.preventDefault()
    setOwnerMessage('')

    if (!ownerToken) {
      setOwnerMessage('Owner login required to post restaurants.')
      return
    }

    if (!ownerNewRestaurantForm.name || !ownerNewRestaurantForm.cuisine_type || !ownerNewRestaurantForm.address || !ownerNewRestaurantForm.city) {
      setOwnerMessage('Name, cuisine, address, and city are required for posting.')
      return
    }

    setOwnerNewRestaurantSaving(true)
    try {
      const payload = {
        name: ownerNewRestaurantForm.name,
        cuisine_type: ownerNewRestaurantForm.cuisine_type,
        address: ownerNewRestaurantForm.address,
        city: ownerNewRestaurantForm.city,
        state: ownerNewRestaurantForm.state || null,
        zip: ownerNewRestaurantForm.zip || null,
        country: ownerNewRestaurantForm.country || null,
        description: ownerNewRestaurantForm.description || null,
        phone: ownerNewRestaurantForm.phone || null,
        price_tier: ownerNewRestaurantForm.price_tier ? Number(ownerNewRestaurantForm.price_tier) : null,
        hours: ownerNewRestaurantForm.hours || null,
        amenities: ownerNewRestaurantForm.amenities || null,
        photo_url: ownerNewRestaurantForm.photo_url || null,
      }

      const created = await apiRequest('/owners/restaurants', {
        method: 'POST',
        authToken: ownerToken,
        headers: {},
        body: JSON.stringify(payload),
      })

      setOwnerNewRestaurantForm({
        name: '',
        cuisine_type: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        description: '',
        phone: '',
        price_tier: '',
        hours: '',
        amenities: '',
        photo_url: '',
      })
      setOwnerNewRestaurantPhotoFile(null)
      setSelectedOwnerRestaurantId(String(created.id))
      setOwnerMessage('Restaurant posted and claimed successfully.')

      await Promise.all([loadOwnerData(), loadRestaurants(), loadGloballyClaimedIds()])
    } catch (error) {
      setOwnerMessage(error.message)
    } finally {
      setOwnerNewRestaurantSaving(false)
    }
  }

  const saveOwnerRestaurantDetails = async (event) => {
    event.preventDefault()
    setOwnerMessage('')

    if (!ownerToken || !selectedOwnerRestaurantId) {
      setOwnerMessage('Select a claimed restaurant first.')
      return
    }

    if (!ownerRestaurantForm.name || !ownerRestaurantForm.cuisine_type || !ownerRestaurantForm.address || !ownerRestaurantForm.city) {
      setOwnerMessage('Name, cuisine, address, and city are required.')
      return
    }

    setOwnerRestaurantSaving(true)
    try {
      const payload = {
        name: ownerRestaurantForm.name,
        cuisine_type: ownerRestaurantForm.cuisine_type,
        address: ownerRestaurantForm.address,
        city: ownerRestaurantForm.city,
        state: ownerRestaurantForm.state || null,
        zip: ownerRestaurantForm.zip || null,
        country: ownerRestaurantForm.country || null,
        description: ownerRestaurantForm.description || null,
        phone: ownerRestaurantForm.phone || null,
        price_tier: ownerRestaurantForm.price_tier ? Number(ownerRestaurantForm.price_tier) : null,
        hours: ownerRestaurantForm.hours || null,
        amenities: ownerRestaurantForm.amenities || null,
        photo_url: ownerRestaurantForm.photo_url || null,
      }
      await apiRequest(`/owners/restaurants/${selectedOwnerRestaurantId}`, {
        method: 'PUT',
        authToken: ownerToken,
        headers: {},
        body: JSON.stringify(payload),
      })
      await Promise.all([
        loadOwnerData(),
        loadOwnerRestaurantDetails(),
        loadRestaurants(),
      ])
      setOwnerMessage('Claimed restaurant updated successfully.')
    } catch (error) {
      setOwnerMessage(error.message)
    } finally {
      setOwnerRestaurantSaving(false)
    }
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

  const sendAiPrompt = async (promptText) => {
    setAiMessage('')

    if (!token) {
      setAiMessage('Please login as user to use AI assistant.')
      return
    }

    const trimmed = String(promptText ?? '').trim()
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
      setAiWebContext(response.web_context ?? [])
      setAiInput('')
    } catch (error) {
      setAiMessage(error.message)
    } finally {
      setAiLoading(false)
    }
  }

  const submitAiMessage = async (event) => {
    event.preventDefault()
    await sendAiPrompt(aiInput)
  }

  const askAiQuickPrompt = async (prompt) => {
    setAiInput(prompt)
    await sendAiPrompt(prompt)
  }

  const clearAiConversation = () => {
    setAiConversation([])
    setAiRecommendations([])
    setAiFilters(null)
    setAiWebContext([])
    setAiMessage('Conversation cleared.')
  }

  const formattedFilters = aiFilters ? JSON.stringify(aiFilters, null, 2) : ''

  const cuisineCovers = {
    italian: 'https://images.unsplash.com/photo-1521389508051-d7ffb5dc8dfb?auto=format&fit=crop&w=1400&q=80',
    chinese: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=1400&q=80',
    mexican: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=1400&q=80',
    indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1400&q=80',
    japanese: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=1400&q=80',
    american: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1400&q=80',
    thai: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=1400&q=80',
    default: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80',
  }

  const customLogoFile = 'Screenshot 2026-03-20 at 6.24.20 PM.png'
  const customLogoPath = `/custom-images/${encodeURIComponent(customLogoFile)}`

  const customHeroImageFiles = [
    'Screenshot 2026-03-20 at 6.30.18 PM.png',
    'Screenshot 2026-03-20 at 6.30.32 PM.png',
    'Screenshot 2026-03-20 at 6.28.53 PM.png',
    'Screenshot 2026-03-20 at 6.29.12 PM.png',
    'Screenshot 2026-03-20 at 6.29.02 PM.png',
  ]

  const customCardImageFiles = [
    'Screenshot 2026-03-20 at 6.28.53 PM.png',
    'Screenshot 2026-03-20 at 6.29.02 PM.png',
    'Screenshot 2026-03-20 at 6.29.12 PM.png',
    'Screenshot 2026-03-20 at 6.30.18 PM.png',
    'Screenshot 2026-03-20 at 6.30.32 PM.png',
  ]

  const customHeroImages = customHeroImageFiles
    .map((fileName) => `/custom-images/${encodeURIComponent(fileName)}`)

  const customCardImages = customCardImageFiles
    .map((fileName) => `/custom-images/${encodeURIComponent(fileName)}`)

  const stableImageIndex = (restaurant, imagesLength) => {
    if (imagesLength === 0) return 0
    const idComponent = Number(restaurant?.id ?? 0) * 31
    const nameComponent = String(restaurant?.name ?? '')
      .split('')
      .reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0)
    return Math.abs(idComponent + nameComponent) % imagesLength
  }

  const getRestaurantImage = (restaurant) => {
    const restaurantPhoto = String(restaurant?.photo_url ?? '').trim()
    if (restaurantPhoto) {
      if (restaurantPhoto.startsWith('http://') || restaurantPhoto.startsWith('https://')) {
        return restaurantPhoto
      }
      if (restaurantPhoto.startsWith('/')) {
        return `${apiBaseUrl}${restaurantPhoto}`
      }
      return `${apiBaseUrl}/${restaurantPhoto}`
    }

    if (customCardImages.length > 0) {
      return customCardImages[stableImageIndex(restaurant, customCardImages.length)]
    }
    const key = String(restaurant?.cuisine_type ?? '').trim().toLowerCase()
    return cuisineCovers[key] ?? cuisineCovers.default
  }

  const quickCategories = [
    { label: 'Explore', path: '/' },
    { label: 'Profile + Preferences', path: '/profile' },
    { label: 'Add Restaurant', path: '/add-restaurant' },
    { label: 'Write Review', path: '/write-review' },
    { label: '❤️ Favourites', path: '/favourites' },
    { label: '📋 History', path: '/history' },
  ]
  const heroRestaurants = restaurants.slice(0, 5)
  const featuredRestaurant = activeRestaurant ?? restaurants[0] ?? favoriteRestaurants[0] ?? myListings[0] ?? null
  const heroTiles = customHeroImages.length > 0
    ? customHeroImages.map((imageSource, index) => ({
      imageSource,
      linkedRestaurantId: heroRestaurants[index]?.id ?? null,
    }))
    : (heroRestaurants.length > 0 ? heroRestaurants : [featuredRestaurant])
      .filter(Boolean)
      .map((restaurant) => ({
        imageSource: getRestaurantImage(restaurant),
        linkedRestaurantId: restaurant.id ?? null,
      }))

  // ── Hero slideshow ────────────────────────────────────────────────────────
  const [heroSlideIndex, setHeroSlideIndex] = useState(0)
  useEffect(() => {
    if (heroTiles.length < 2) return
    const timer = setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % heroTiles.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [heroTiles.length])

  const currentPath = location.pathname
  const restaurantDetailMatch = currentPath.match(/^\/restaurants\/(\d+)$/)
  const routeRestaurantId = restaurantDetailMatch ? Number(restaurantDetailMatch[1]) : null
  const isRestaurantsRoute = currentPath === '/' || currentPath === '/restaurants' || Boolean(restaurantDetailMatch)
  const knownPaths = useMemo(() => new Set([
    '/',
    '/restaurants',
    '/login',
    '/signup',
    '/profile',
    '/add-restaurant',
    '/write-review',
    '/favourites',
    '/history',
    '/owner/login',
    '/owner/signup',
    '/owner/profile',
    '/owner/manage-restaurant',
    '/owner/claim',
    '/owner/reviews',
    '/owner/analytics',
  ]), [])
  const userProtectedPaths = useMemo(() => new Set([
    '/profile',
    '/add-restaurant',
    '/write-review',
    '/favourites',
    '/history',
  ]), [])
  const ownerProtectedPaths = useMemo(() => new Set([
    '/owner/profile',
    '/owner/manage-restaurant',
    '/owner/claim',
    '/owner/reviews',
    '/owner/analytics',
  ]), [])

  const openRestaurantDetails = useCallback((restaurantId) => {
    if (!restaurantId) return
    setActiveRestaurantId(restaurantId)
    navigate(`/restaurants/${restaurantId}`)
  }, [navigate])

  useEffect(() => {
    if (currentPath === '/owner/login' && ownerAuthMode !== 'login') setOwnerAuthMode('login')
    if (currentPath === '/owner/signup' && ownerAuthMode !== 'signup') setOwnerAuthMode('signup')
  }, [currentPath, ownerAuthMode])

  useEffect(() => {
    if (currentPath === '/owner') {
      navigate('/owner/analytics', { replace: true })
    }
  }, [currentPath, navigate])

  useEffect(() => {
    if (currentPath === '/account') {
      navigate('/login', { replace: true })
    }
    if (currentPath === '/preferences') {
      navigate('/profile', { replace: true })
    }
    if (currentPath === '/listings') {
      navigate('/add-restaurant', { replace: true })
    }
    if (currentPath === '/reviews') {
      navigate('/write-review', { replace: true })
    }
  }, [currentPath, navigate])

  useEffect(() => {
    if (routeRestaurantId && routeRestaurantId !== activeRestaurantId) {
      setActiveRestaurantId(routeRestaurantId)
    }
  }, [routeRestaurantId, activeRestaurantId])

  useEffect(() => {
    if (userProtectedPaths.has(currentPath) && !token) {
      setAuthMessage('Please login to access this page.')
      navigate('/login', { replace: true })
      return
    }

    if (ownerProtectedPaths.has(currentPath) && !ownerToken) {
      setOwnerMessage('Owner login required to access this page.')
      navigate('/owner/login', { replace: true })
    }
  }, [currentPath, token, ownerToken, navigate, userProtectedPaths, ownerProtectedPaths])

  useEffect(() => {
    if (routeRestaurantId || knownPaths.has(currentPath)) {
      return
    }
    navigate('/', { replace: true })
  }, [currentPath, routeRestaurantId, navigate, knownPaths])

  const renderCurrentPage = () => {
    const renderOwnerPage = (content) => (
      <OwnerLayout ownerToken={ownerToken} currentOwner={currentOwner} currentPath={currentPath} navigate={navigate} ownerLogout={ownerLogout}>
        {content}
      </OwnerLayout>
    )

    if (routeRestaurantId) {
      return (
        <RestaurantDetailsPage
          activeRestaurant={activeRestaurant}
          reviews={reviews}
          getRestaurantImage={getRestaurantImage}
          apiBaseUrl={apiBaseUrl}
          navigate={navigate}
        />
      )
    }

    switch (currentPath) {
      case '/':
      case '/restaurants':
        return (
          <ExploreSearchPage
            loadingRestaurants={loadingRestaurants}
            loadRestaurants={loadRestaurants}
            restaurantQuery={restaurantQuery}
            setRestaurantQuery={setRestaurantQuery}
            restaurants={restaurants}
            restaurantsMessage={restaurantsMessage}
            favoritesMessage={favoritesMessage}
            favoriteRestaurantIds={favoriteRestaurantIds}
            favoriteActionId={favoriteActionId}
            toggleFavorite={toggleFavorite}
            claimRestaurantForOwner={claimRestaurantForOwner}
            ownerClaimedRestaurantIds={ownerClaimedRestaurantIds}
            globallyClaimedRestaurantIds={globallyClaimedRestaurantIds}
            ownerToken={ownerToken}
            getRestaurantImage={getRestaurantImage}
            openRestaurantDetails={openRestaurantDetails}
          />
        )
      case '/login':
        return (
          <UserLoginPage
            authForm={authForm}
            setAuthForm={setAuthForm}
            onAuthSubmit={onUserLoginSubmit}
            authLoading={authLoading}
            authMessage={authMessage}
            token={token}
            logout={logout}
            currentUser={currentUser}
            currentOwner={currentOwner}
            ownerLogout={ownerLogout}
          />
        )
      case '/signup':
        return (
          <UserSignupPage
            authForm={authForm}
            setAuthForm={setAuthForm}
            onAuthSubmit={onUserSignupSubmit}
            authLoading={authLoading}
            authMessage={authMessage}
            currentUser={currentUser}
          />
        )
      case '/profile':
        return (
          <ProfilePreferencesPage
            token={token}
            currentUser={currentUser}
            currentPreferences={currentPreferences}
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            countryOptions={countryOptions}
            profilePhotoUploading={profilePhotoUploading}
            setProfilePhotoFile={setProfilePhotoFile}
            uploadProfilePhoto={uploadProfilePhoto}
            profilePhotoFile={profilePhotoFile}
            apiBaseUrl={apiBaseUrl}
            saveProfile={saveProfile}
            profileSaving={profileSaving}
            profileMessage={profileMessage}
            preferencesForm={preferencesForm}
            setPreferencesForm={setPreferencesForm}
            savePreferences={savePreferences}
            preferencesSaving={preferencesSaving}
            loadPreferences={loadPreferences}
            preferencesMessage={preferencesMessage}
          />
        )
      case '/add-restaurant':
        return (
          <AddRestaurantPage
            submitListing={submitListing}
            listingForm={listingForm}
            setListingForm={setListingForm}
            listingSaving={listingSaving}
            listingMessage={listingMessage}
            token={token}
            myListings={myListings}
            editingListingId={editingListingId}
            editingListingForm={editingListingForm}
            setEditingListingForm={setEditingListingForm}
            saveListingEdit={saveListingEdit}
            listingActionId={listingActionId}
            setEditingListingId={setEditingListingId}
            startEditListing={startEditListing}
            deleteListing={deleteListing}
            getRestaurantImage={getRestaurantImage}
            listingPhotoFile={listingPhotoFile}
            setListingPhotoFile={setListingPhotoFile}
            listingPhotoUploading={listingPhotoUploading}
            uploadListingPhoto={uploadListingPhoto}
          />
        )
      case '/write-review':
        return (
          <WriteReviewPage
            restaurants={restaurants}
            activeRestaurantId={activeRestaurantId}
            setActiveRestaurantId={setActiveRestaurantId}
            submitReview={submitReview}
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            reviewSaving={reviewSaving}
            token={token}
            reviewMessage={reviewMessage}
            myReviewHistory={myReviewHistory}
            updateMyReviewHistoryItem={updateMyReviewHistoryItem}
            deleteMyReviewHistoryItem={deleteMyReviewHistoryItem}
            reviewPhotoFile={reviewPhotoFile}
            setReviewPhotoFile={setReviewPhotoFile}
            reviewPhotoUploading={reviewPhotoUploading}
            uploadReviewPhoto={uploadReviewPhoto}
            apiBaseUrl={apiBaseUrl}
          />
        )
      case '/favourites':
        return (
          <FavouritesPage
            token={token}
            favoriteRestaurants={favoriteRestaurants}
            favoriteRestaurantIds={favoriteRestaurantIds}
            favoriteActionId={favoriteActionId}
            toggleFavorite={toggleFavorite}
            favoritesMessage={favoritesMessage}
            getRestaurantImage={getRestaurantImage}
            openRestaurantDetails={openRestaurantDetails}
            navigate={navigate}
          />
        )
      case '/history':
        return (
          <UserHistoryPage
            token={token}
            myReviewHistory={myReviewHistory}
            myListings={myListings}
            reviewMessage={reviewMessage}
            reviewSaving={reviewSaving}
            updateMyReviewHistoryItem={updateMyReviewHistoryItem}
            deleteMyReviewHistoryItem={deleteMyReviewHistoryItem}
            openRestaurantDetails={openRestaurantDetails}
            navigate={navigate}
          />
        )
      case '/owner/login':
        return renderOwnerPage(
          <OwnerLoginPage
            ownerForm={ownerForm}
            setOwnerForm={setOwnerForm}
            onOwnerAuthSubmit={onOwnerAuthSubmit}
            ownerAuthLoading={ownerAuthLoading}
            ownerMessage={ownerMessage}
            currentOwner={currentOwner}
            currentUser={currentUser}
            logout={logout}
          />
        )
      case '/owner/signup':
        return renderOwnerPage(
          <OwnerSignupPage
            ownerForm={ownerForm}
            setOwnerForm={setOwnerForm}
            onOwnerAuthSubmit={onOwnerAuthSubmit}
            ownerAuthLoading={ownerAuthLoading}
            ownerMessage={ownerMessage}
            currentOwner={currentOwner}
            currentUser={currentUser}
            logout={logout}
          />
        )
      case '/owner/profile':
        return renderOwnerPage(
          <OwnerProfilePage
            ownerToken={ownerToken}
            ownerRestaurants={ownerRestaurants}
            selectedOwnerRestaurantId={selectedOwnerRestaurantId}
            setSelectedOwnerRestaurantId={setSelectedOwnerRestaurantId}
            ownerRestaurantForm={ownerRestaurantForm}
            setOwnerRestaurantForm={setOwnerRestaurantForm}
            saveOwnerRestaurantDetails={saveOwnerRestaurantDetails}
            ownerRestaurantSaving={ownerRestaurantSaving}
            ownerEditRestaurantPhotoFile={ownerEditRestaurantPhotoFile}
            setOwnerEditRestaurantPhotoFile={setOwnerEditRestaurantPhotoFile}
            uploadOwnerRestaurantPhoto={uploadOwnerRestaurantPhoto}
            ownerRestaurantPhotoUploading={ownerRestaurantPhotoUploading}
            ownerMessage={ownerMessage}
            currentOwner={currentOwner}
          />
        )
      case '/owner/manage-restaurant':
        return renderOwnerPage(
          <OwnerManageRestaurantPage
            ownerToken={ownerToken}
            ownerNewRestaurantForm={ownerNewRestaurantForm}
            setOwnerNewRestaurantForm={setOwnerNewRestaurantForm}
            postOwnerNewRestaurant={submitOwnerRestaurant}
            ownerNewRestaurantSaving={ownerNewRestaurantSaving}
            ownerNewRestaurantPhotoFile={ownerNewRestaurantPhotoFile}
            setOwnerNewRestaurantPhotoFile={setOwnerNewRestaurantPhotoFile}
            uploadOwnerRestaurantPhoto={uploadOwnerRestaurantPhoto}
            ownerRestaurantPhotoUploading={ownerRestaurantPhotoUploading}
            ownerMessage={ownerMessage}
          />
        )
      case '/owner/claim':
        return renderOwnerPage(
          <OwnerClaimPage
            ownerToken={ownerToken}
            ownerClaimRestaurantId={ownerClaimRestaurantId}
            setOwnerClaimRestaurantId={setOwnerClaimRestaurantId}
            claimRestaurantForOwner={claimRestaurantForOwner}
            ownerMessage={ownerMessage}
            restaurants={restaurants}
            ownerClaimedRestaurantIds={ownerClaimedRestaurantIds}
            globallyClaimedRestaurantIds={globallyClaimedRestaurantIds}
          />
        )
      case '/owner/reviews':
        return renderOwnerPage(
          <OwnerReviewsDashboardPage
            ownerToken={ownerToken}
            ownerRestaurants={ownerRestaurants}
            selectedOwnerRestaurantId={selectedOwnerRestaurantId}
            setSelectedOwnerRestaurantId={setSelectedOwnerRestaurantId}
            ownerRestaurantReviews={ownerRestaurantReviews}
            apiBaseUrl={apiBaseUrl}
          />
        )
      case '/owner/analytics':
        return renderOwnerPage(
          <OwnerAnalyticsPage
            ownerToken={ownerToken}
            ownerDashboard={ownerDashboard}
            ownerRestaurants={ownerRestaurants}
            getRestaurantImage={getRestaurantImage}
            selectedOwnerRestaurantId={selectedOwnerRestaurantId}
            setSelectedOwnerRestaurantId={setSelectedOwnerRestaurantId}
            ownerRestaurantReviews={ownerRestaurantReviews}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="app-shell">
      <header className="yelp-topbar">
        <div className="yelp-logo">
          <img src={customLogoPath} alt="Yelp style logo" />
        </div>
        <div className="yelp-search-wrap">
          <input
            className="yelp-search-input"
            value={restaurantQuery.keyword}
            onChange={(event) => setRestaurantQuery((prev) => ({ ...prev, keyword: event.target.value }))}
            placeholder="New American"
            aria-label="Search restaurants by keyword"
          />
          <input
            className="yelp-search-input"
            value={restaurantQuery.city}
            onChange={(event) => setRestaurantQuery((prev) => ({ ...prev, city: event.target.value }))}
            placeholder="Alameda, CA"
            aria-label="Search restaurants by city"
          />
          <button
            className="yelp-search-btn"
            onClick={() => {
              navigate('/restaurants')
              loadRestaurants()
            }}
            disabled={loadingRestaurants}
          >
            {loadingRestaurants ? '...' : '⌕'}
          </button>
        </div>
        <div className="topbar-links">
          {currentOwner ? (
            <>
              <span className="topbar-user-indicator">Owner: {currentOwner.name}</span>
              <button className="ghost-small" onClick={() => navigate('/owner/analytics')}>Owner Portal</button>
              <button className="solid-small" onClick={ownerLogout}>Owner Logout</button>
            </>
          ) : currentUser ? (
            <>
              <span className="topbar-user-indicator">Logged in as {currentUser.name}</span>
              <button className="ghost-small" onClick={() => navigate('/profile')}>My Profile</button>
              <button className="ghost-small" onClick={() => navigate('/owner/login')}>Owner Portal</button>
              <button className="solid-small" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <button className="ghost-small" onClick={() => navigate('/login')}>Log In</button>
              <button className="solid-small" onClick={() => navigate('/signup')}>Sign Up</button>
              <button className="ghost-small" onClick={() => navigate('/owner/login')}>Owner Portal</button>
            </>
          )}
        </div>
      </header>

      <nav className="category-nav">
        {quickCategories.map((category) => (
          <button
            key={category.path}
            className={`category-link ${currentPath === category.path || (category.path === '/restaurants' && isRestaurantsRoute) ? 'active' : ''}`}
            type="button"
            onClick={() => navigate(category.path)}
          >
            {category.label}
          </button>
        ))}
      </nav>

      <section className="hero-showcase">
        {/* Crossfade slideshow — one layer per slide, only active one is visible */}
        {heroTiles.map((tile, index) => (
          <div
            key={`slide-${index}`}
            className={`hero-slide ${index === heroSlideIndex ? 'hero-slide--active' : ''}`}
            style={{ backgroundImage: `url(${tile.imageSource})` }}
          />
        ))}

        {/* Dark gradient overlay */}
        <div className="hero-slide-overlay" />

        <div className="hero-overlay-content">
          {routeRestaurantId && activeRestaurant ? (
            <>
              <span className="brand-pill">
                {activeRestaurant.cuisine_type || 'Restaurant'}
                {activeRestaurant.city ? ` · ${activeRestaurant.city}` : ''}
              </span>
              <h1 className="hero-restaurant-name">{activeRestaurant.name}</h1>
              <div className="hero-restaurant-meta">
                {activeRestaurant.price_tier && (
                  <span className="hero-meta-chip">{'$'.repeat(activeRestaurant.price_tier)}</span>
                )}
                {reviews.length > 0 && (
                  <span className="hero-meta-chip">
                    ★ {(reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1)}
                    <span className="hero-meta-sub"> ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                  </span>
                )}
                {activeRestaurant.address && (
                  <span className="hero-meta-chip">{activeRestaurant.address}</span>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="brand-pill">Yelp Lab Experience</span>
              <h1>Eat Well. Review Boldly. Discover More.</h1>
              <p className="pair-credit">Lab Pair 20: Viraat Chaudhary and Raniel Quesada.</p>
            </>
          )}
        </div>

        {/* Dot indicators */}
        {heroTiles.length > 1 && (
          <div className="hero-dots">
            {heroTiles.map((_, index) => (
              <button
                key={`dot-${index}`}
                type="button"
                className={`hero-dot ${index === heroSlideIndex ? 'hero-dot--active' : ''}`}
                onClick={() => setHeroSlideIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {renderCurrentPage()}

      {/* AI widget: only on user/public pages, never on owner workspace */}
      {!currentPath.startsWith('/owner') && (
        <div className="ai-widget-container">
          {isAiWidgetOpen && (
            <div className="ai-widget-shell">
              <div className="ai-widget-header">
                <div className="ai-widget-header-left">
                  <span className="ai-widget-dot" />
                  <strong>Dining Assistant</strong>
                </div>
                <button type="button" className="ai-widget-close" onClick={() => setIsAiWidgetOpen(false)}>×</button>
              </div>
              <AIAssistantPage
                submitAiMessage={submitAiMessage}
                aiInput={aiInput}
                setAiInput={setAiInput}
                quickPrompts={[
                  'Find dinner tonight',
                  'Best rated near me',
                  'Vegan options',
                ]}
                onQuickPrompt={askAiQuickPrompt}
                aiLoading={aiLoading}
                clearAiConversation={clearAiConversation}
                aiConversation={aiConversation}
                aiMessage={aiMessage}
                aiRecommendations={aiRecommendations}
                getRestaurantImage={getRestaurantImage}
                openRestaurantDetails={openRestaurantDetails}
                token={token}
                compact
              />
            </div>
          )}
          {!isAiWidgetOpen && (
            <button type="button" className="ai-widget-toggle" onClick={() => setIsAiWidgetOpen(true)}>
              🍽️ Ask Assistant
            </button>
          )}
        </div>
      )}

      <footer className="site-footer">
        <p>Lab Pair 20: Viraat Chaudhary and Raniel Quesada.</p>
      </footer>
    </div>
  )
}

export default App
