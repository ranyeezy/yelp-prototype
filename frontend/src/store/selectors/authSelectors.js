import { createSelector } from '@reduxjs/toolkit'

// Base selectors
const selectAuthState = (state) => state.auth

// User session selectors
export const selectToken = createSelector([selectAuthState], (auth) => auth.token)

export const selectCurrentUser = createSelector([selectAuthState], (auth) => auth.currentUser)

export const selectAuthLoading = createSelector([selectAuthState], (auth) => auth.authLoading)

export const selectAuthMessage = createSelector([selectAuthState], (auth) => auth.authMessage)

export const selectIsUserAuthenticated = createSelector(
  [selectToken],
  (token) => !!token,
)

// Owner session selectors
export const selectOwnerToken = createSelector([selectAuthState], (auth) => auth.ownerToken)

export const selectCurrentOwner = createSelector([selectAuthState], (auth) => auth.currentOwner)

export const selectOwnerAuthLoading = createSelector([selectAuthState], (auth) => auth.ownerAuthLoading)

export const selectOwnerMessage = createSelector([selectAuthState], (auth) => auth.ownerMessage)

export const selectIsOwnerAuthenticated = createSelector(
  [selectOwnerToken],
  (ownerToken) => !!ownerToken,
)

// Combined selectors
export const selectActiveAuth = createSelector(
  [selectIsUserAuthenticated, selectIsOwnerAuthenticated],
  (isUser, isOwner) => {
    if (isUser) return 'user'
    if (isOwner) return 'owner'
    return null
  },
)

export const selectCurrentAuthUser = createSelector(
  [selectCurrentUser, selectCurrentOwner, selectActiveAuth],
  (user, owner, activeAuth) => {
    return activeAuth === 'owner' ? owner : user
  },
)
