import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'

export const fetchReviewsForRestaurant = createAsyncThunk(
  'reviews/fetchReviewsForRestaurant',
  async (restaurantId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/restaurant/${restaurantId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail ?? 'Failed to fetch reviews')
    }
  }
)

export const fetchMyReviewHistory = createAsyncThunk(
  'reviews/fetchMyReviewHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/reviews/my-reviews')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail ?? 'Failed to fetch review history')
    }
  }
)

export const submitReview = createAsyncThunk(
  'reviews/submitReview',
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await api.post('/reviews', reviewData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail ?? 'Failed to submit review')
    }
  }
)

export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  async ({ id, ...reviewData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/reviews/${id}`, reviewData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail ?? 'Failed to update review')
    }
  }
)

export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/reviews/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail ?? 'Failed to delete review')
    }
  }
)

const initialState = {
  reviews: [],
  myReviewHistory: [],
  reviewForm: {
    restaurant_id: '',
    rating: 5,
    title: '',
    text: '',
    cuisine_experience: 'okay',
  },
  editingReviewId: null,
  reviewSaving: false,
  reviewMessage: '',
}

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    setReviewForm: (state, action) => {
      state.reviewForm = action.payload
    },
    setEditingReviewId: (state, action) => {
      state.editingReviewId = action.payload
    },
    clearReviewHistory: (state) => {
      state.myReviewHistory = []
      state.reviews = []
      state.reviewForm = initialState.reviewForm
      state.editingReviewId = null
      state.reviewMessage = ''
    },
  },
  extraReducers: (builder) => {
    // Fetch Reviews for Restaurant
    builder
      .addCase(fetchReviewsForRestaurant.pending, (state) => {
        state.reviewMessage = ''
      })
      .addCase(fetchReviewsForRestaurant.fulfilled, (state, action) => {
        state.reviews = action.payload
      })
      .addCase(fetchReviewsForRestaurant.rejected, (state, action) => {
        state.reviewMessage = action.payload
      })

    // Fetch My Review History
    builder
      .addCase(fetchMyReviewHistory.pending, (state) => {
        state.reviewMessage = ''
      })
      .addCase(fetchMyReviewHistory.fulfilled, (state, action) => {
        state.myReviewHistory = action.payload
      })
      .addCase(fetchMyReviewHistory.rejected, (state, action) => {
        state.reviewMessage = action.payload
      })

    // Submit Review
    builder
      .addCase(submitReview.pending, (state) => {
        state.reviewSaving = true
        state.reviewMessage = ''
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.reviewSaving = false
        state.reviews.push(action.payload)
        state.myReviewHistory.push(action.payload)
        state.reviewForm = initialState.reviewForm
        state.reviewMessage = 'Review submitted successfully'
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.reviewSaving = false
        state.reviewMessage = action.payload
      })

    // Update Review
    builder
      .addCase(updateReview.pending, (state) => {
        state.reviewSaving = true
        state.reviewMessage = ''
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.reviewSaving = false
        const idx = state.reviews.findIndex((r) => r.id === action.payload.id)
        if (idx !== -1) {
          state.reviews[idx] = action.payload
        }
        const histIdx = state.myReviewHistory.findIndex((r) => r.id === action.payload.id)
        if (histIdx !== -1) {
          state.myReviewHistory[histIdx] = action.payload
        }
        state.editingReviewId = null
        state.reviewForm = initialState.reviewForm
        state.reviewMessage = 'Review updated successfully'
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.reviewSaving = false
        state.reviewMessage = action.payload
      })

    // Delete Review
    builder
      .addCase(deleteReview.pending, (state) => {
        state.reviewSaving = true
        state.reviewMessage = ''
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.reviewSaving = false
        state.reviews = state.reviews.filter((r) => r.id !== action.payload)
        state.myReviewHistory = state.myReviewHistory.filter((r) => r.id !== action.payload)
        state.reviewMessage = 'Review deleted successfully'
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.reviewSaving = false
        state.reviewMessage = action.payload
      })

    // Clear on logout
    builder
      .addCase('auth/clearUserSession', (state) => {
        state.myReviewHistory = []
        state.reviews = []
        state.reviewForm = initialState.reviewForm
        state.editingReviewId = null
        state.reviewMessage = ''
      })
  },
})

export const { setReviewForm, setEditingReviewId, clearReviewHistory } = reviewsSlice.actions
export default reviewsSlice.reducer
