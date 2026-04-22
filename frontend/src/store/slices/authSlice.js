import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { getState, rejectWithValue }) => {
    try {
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)

      const loginResponse = await api.post('/auth/users/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const token = loginResponse.data.access_token

      const userResponse = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      return { token, user: userResponse.data }
    } catch (error) {
      const detail = error.response?.data?.detail ?? error.message ?? 'Login failed'
      return rejectWithValue(typeof detail === 'string' ? detail : 'Login failed')
    }
  }
)

export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/users/signup', {
        name,
        email,
        password,
      })
      return response.data
    } catch (error) {
      const detail = error.response?.data?.detail ?? error.message ?? 'Signup failed'
      return rejectWithValue(typeof detail === 'string' ? detail : 'Signup failed')
    }
  }
)

export const loginOwner = createAsyncThunk(
  'auth/loginOwner',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const loginResponse = await api.post('/auth/owners/login', {
        email,
        password,
      })

      const token = loginResponse.data.access_token

      const ownerResponse = await api.get('/owners/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      return { token, owner: ownerResponse.data }
    } catch (error) {
      const detail = error.response?.data?.detail ?? error.message ?? 'Owner login failed'
      return rejectWithValue(typeof detail === 'string' ? detail : 'Owner login failed')
    }
  }
)

export const signupOwner = createAsyncThunk(
  'auth/signupOwner',
  async ({ name, email, password, restaurant_location }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/owners/signup', {
        name,
        email,
        password,
        restaurant_location,
      })
      return response.data
    } catch (error) {
      const detail = error.response?.data?.detail ?? error.message ?? 'Owner signup failed'
      return rejectWithValue(typeof detail === 'string' ? detail : 'Owner signup failed')
    }
  }
)

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token
      if (!token) return rejectWithValue('No token')

      const response = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      return rejectWithValue('Failed to fetch user')
    }
  }
)

export const fetchCurrentOwner = createAsyncThunk(
  'auth/fetchCurrentOwner',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.ownerToken
      if (!token) return rejectWithValue('No owner token')

      const response = await api.get('/owners/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      return rejectWithValue('Failed to fetch owner')
    }
  }
)

const initialState = {
  // User session
  token: localStorage.getItem('authToken') ?? '',
  currentUser: null,
  authMessage: '',
  authLoading: false,

  // Owner session
  ownerToken: localStorage.getItem('ownerAuthToken') ?? '',
  currentOwner: null,
  ownerMessage: '',
  ownerAuthLoading: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthMessage: (state, action) => {
      state.authMessage = action.payload
    },
    setOwnerMessage: (state, action) => {
      state.ownerMessage = action.payload
    },
    clearUserSession: (state) => {
      state.token = ''
      state.currentUser = null
      state.authMessage = ''
      state.authLoading = false
    },
    clearOwnerSession: (state) => {
      state.ownerToken = ''
      state.currentOwner = null
      state.ownerMessage = ''
      state.ownerAuthLoading = false
    },
  },
  extraReducers: (builder) => {
    // Login User
    builder
      .addCase(loginUser.pending, (state) => {
        state.authLoading = true
        state.authMessage = ''
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.authLoading = false
        state.token = action.payload.token
        state.currentUser = action.payload.user
        state.authMessage = ''
        // Clear owner session on user login
        state.ownerToken = ''
        state.currentOwner = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.authLoading = false
        state.authMessage = action.payload
      })

    // Signup User
    builder
      .addCase(signupUser.pending, (state) => {
        state.authLoading = true
        state.authMessage = ''
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.authLoading = false
        state.authMessage = 'Signup successful! Please log in.'
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.authLoading = false
        state.authMessage = action.payload
      })

    // Login Owner
    builder
      .addCase(loginOwner.pending, (state) => {
        state.ownerAuthLoading = true
        state.ownerMessage = ''
      })
      .addCase(loginOwner.fulfilled, (state, action) => {
        state.ownerAuthLoading = false
        state.ownerToken = action.payload.token
        state.currentOwner = action.payload.owner
        state.ownerMessage = ''
        // Clear user session on owner login
        state.token = ''
        state.currentUser = null
      })
      .addCase(loginOwner.rejected, (state, action) => {
        state.ownerAuthLoading = false
        state.ownerMessage = action.payload
      })

    // Signup Owner
    builder
      .addCase(signupOwner.pending, (state) => {
        state.ownerAuthLoading = true
        state.ownerMessage = ''
      })
      .addCase(signupOwner.fulfilled, (state, action) => {
        state.ownerAuthLoading = false
        state.ownerMessage = 'Owner signup successful! Please log in.'
      })
      .addCase(signupOwner.rejected, (state, action) => {
        state.ownerAuthLoading = false
        state.ownerMessage = action.payload
      })

    // Fetch Current User
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.currentUser = action.payload
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.token = ''
        state.currentUser = null
      })

    // Fetch Current Owner
    builder
      .addCase(fetchCurrentOwner.fulfilled, (state, action) => {
        state.currentOwner = action.payload
      })
      .addCase(fetchCurrentOwner.rejected, (state) => {
        state.ownerToken = ''
        state.currentOwner = null
      })
  },
})

export const { setAuthMessage, setOwnerMessage, clearUserSession, clearOwnerSession } =
  authSlice.actions
export default authSlice.reducer
