import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'

export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchRestaurants',
  async (query = {}, { rejectWithValue }) => {
    try {
      const params = {}
      if (query.keyword) params.keyword = query.keyword
      if (query.city) params.city = query.city
      if (query.cuisine_type) params.cuisine_type = query.cuisine_type
      const response = await api.get('/restaurants', { params })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail ?? 'Failed to fetch restaurants')
    }
  }
)

export const createListing = createAsyncThunk(
  'restaurants/createListing',
  async (restaurantData, { rejectWithValue }) => {
    try {
      const response = await api.post('/restaurants', restaurantData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail ?? 'Failed to create restaurant')
    }
  }
)

export const updateListing = createAsyncThunk(
  'restaurants/updateListing',
  async ({ id, ...restaurantData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/restaurants/${id}`, restaurantData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail ?? 'Failed to update restaurant')
    }
  }
)

export const deleteListing = createAsyncThunk(
  'restaurants/deleteListing',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/restaurants/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail ?? 'Failed to delete restaurant')
    }
  }
)

export const fetchGloballyClaimedIds = createAsyncThunk(
  'restaurants/fetchGloballyClaimedIds',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/restaurants/claimed')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail ?? 'Failed to fetch claimed restaurants')
    }
  }
)

const initialState = {
  list: [],
  query: '',
  loading: false,
  message: '',
  activeRestaurantId: null,
  editingListingId: null,
  listingSaving: false,
  globallyClaimedRestaurantIds: [],
}

const restaurantsSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload
    },
    setActiveRestaurantId: (state, action) => {
      state.activeRestaurantId = action.payload
    },
    setEditingListingId: (state, action) => {
      state.editingListingId = action.payload
    },
  },
  extraReducers: (builder) => {
    // Fetch Restaurants
    builder
      .addCase(fetchRestaurants.pending, (state) => {
        state.loading = true
        state.message = ''
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false
        state.message = action.payload
      })

    // Create Listing
    builder
      .addCase(createListing.pending, (state) => {
        state.listingSaving = true
        state.message = ''
      })
      .addCase(createListing.fulfilled, (state, action) => {
        state.listingSaving = false
        state.list.push(action.payload)
        state.message = 'Restaurant created successfully'
      })
      .addCase(createListing.rejected, (state, action) => {
        state.listingSaving = false
        state.message = action.payload
      })

    // Update Listing
    builder
      .addCase(updateListing.pending, (state) => {
        state.listingSaving = true
        state.message = ''
      })
      .addCase(updateListing.fulfilled, (state, action) => {
        state.listingSaving = false
        const index = state.list.findIndex((r) => r.id === action.payload.id)
        if (index !== -1) {
          state.list[index] = action.payload
        }
        state.message = 'Restaurant updated successfully'
      })
      .addCase(updateListing.rejected, (state, action) => {
        state.listingSaving = false
        state.message = action.payload
      })

    // Delete Listing
    builder
      .addCase(deleteListing.pending, (state) => {
        state.listingSaving = true
        state.message = ''
      })
      .addCase(deleteListing.fulfilled, (state, action) => {
        state.listingSaving = false
        state.list = state.list.filter((r) => r.id !== action.payload)
        state.message = 'Restaurant deleted successfully'
      })
      .addCase(deleteListing.rejected, (state, action) => {
        state.listingSaving = false
        state.message = action.payload
      })

    // Fetch Globally Claimed IDs
    builder
      .addCase(fetchGloballyClaimedIds.fulfilled, (state, action) => {
        state.globallyClaimedRestaurantIds = action.payload
      })
  },
})

export const { setQuery, setActiveRestaurantId, setEditingListingId } = restaurantsSlice.actions
export default restaurantsSlice.reducer
