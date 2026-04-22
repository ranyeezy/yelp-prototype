import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import restaurantsReducer from './slices/restaurantsSlice'
import reviewsReducer from './slices/reviewsSlice'
import favoritesReducer from './slices/favoritesSlice'

// Middleware to sync auth tokens to localStorage on every state change
const localStorageSyncMiddleware = (storeAPI) => (next) => (action) => {
  const result = next(action)
  const { auth } = storeAPI.getState()

  if (auth.token) {
    localStorage.setItem('authToken', auth.token)
  } else {
    localStorage.removeItem('authToken')
  }

  if (auth.ownerToken) {
    localStorage.setItem('ownerAuthToken', auth.ownerToken)
  } else {
    localStorage.removeItem('ownerAuthToken')
  }

  return result
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    restaurants: restaurantsReducer,
    reviews: reviewsReducer,
    favorites: favoritesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['favorites/fetchFavorites/fulfilled'],
      },
    }).concat(localStorageSyncMiddleware),
})

