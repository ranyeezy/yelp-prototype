import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'

export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/favorites/me')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail ?? 'Failed to fetch favorites')
    }
  }
)

export const toggleFavorite = createAsyncThunk(
  'favorites/toggleFavorite',
  async (restaurantId, { rejectWithValue, getState }) => {
    try {
      const { favorites, restaurants } = getState()
      const isFavorited = favorites.favoriteRestaurantIds.includes(restaurantId)

      if (isFavorited) {
        await api.delete(`/favorites/${restaurantId}`)
        return { action: 'remove', restaurantId }
      } else {
        await api.post(`/favorites/${restaurantId}`)
        const restaurant = restaurants.list.find((r) => r.id === restaurantId) ?? null
        return { action: 'add', restaurantId, data: restaurant }
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail ?? 'Failed to toggle favorite')
    }
  }
)

const initialState = {
  favoriteRestaurantIds: [],
  favoriteRestaurants: [],
  favoriteActionId: null,
  favoritesMessage: '',
}

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    setFavoriteActionId: (state, action) => {
      state.favoriteActionId = action.payload
    },
    clearFavorites: (state) => {
      state.favoriteRestaurantIds = []
      state.favoriteRestaurants = []
      state.favoriteActionId = null
      state.favoritesMessage = ''
    },
  },
  extraReducers: (builder) => {
    // Fetch Favorites
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.favoritesMessage = ''
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) {
          const restaurants = action.payload.map((r) => r.restaurant ?? r)
          state.favoriteRestaurantIds = restaurants.map((r) => r.id)
          state.favoriteRestaurants = restaurants
        }
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.favoritesMessage = action.payload
      })

    // Toggle Favorite
    builder
      .addCase(toggleFavorite.pending, (state, action) => {
        state.favoriteActionId = action.meta.arg
        state.favoritesMessage = ''
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const { action: toggleAction, restaurantId, data } = action.payload

        if (toggleAction === 'add') {
          if (!state.favoriteRestaurantIds.includes(restaurantId)) {
            state.favoriteRestaurantIds.push(restaurantId)
          }
          if (data && !state.favoriteRestaurants.find((r) => r.id === restaurantId)) {
            state.favoriteRestaurants.push(data)
          }
        } else if (toggleAction === 'remove') {
          state.favoriteRestaurantIds = state.favoriteRestaurantIds.filter((id) => id !== restaurantId)
          state.favoriteRestaurants = state.favoriteRestaurants.filter((r) => r.id !== restaurantId)
        }

        state.favoriteActionId = null
        state.favoritesMessage = toggleAction === 'add' ? 'Added to favorites' : 'Removed from favorites'
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        state.favoriteActionId = null
        state.favoritesMessage = action.payload
      })

    // Clear on logout
    builder
      .addCase('auth/clearUserSession', (state) => {
        state.favoriteRestaurantIds = []
        state.favoriteRestaurants = []
        state.favoriteActionId = null
        state.favoritesMessage = ''
      })
  },
})

export const { setFavoriteActionId, clearFavorites } = favoritesSlice.actions
export default favoritesSlice.reducer
