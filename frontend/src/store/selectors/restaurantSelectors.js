import { createSelector } from '@reduxjs/toolkit'

// Base selector
const selectRestaurantsState = (state) => state.restaurants

// Basic selectors
export const selectRestaurantsList = createSelector(
  [selectRestaurantsState],
  (restaurants) => restaurants.list,
)

export const selectRestaurantsQuery = createSelector(
  [selectRestaurantsState],
  (restaurants) => restaurants.query,
)

export const selectRestaurantsLoading = createSelector(
  [selectRestaurantsState],
  (restaurants) => restaurants.loading,
)

export const selectRestaurantsMessage = createSelector(
  [selectRestaurantsState],
  (restaurants) => restaurants.message,
)

export const selectActiveRestaurantId = createSelector(
  [selectRestaurantsState],
  (restaurants) => restaurants.activeRestaurantId,
)

export const selectEditingListingId = createSelector(
  [selectRestaurantsState],
  (restaurants) => restaurants.editingListingId,
)

export const selectListingSaving = createSelector(
  [selectRestaurantsState],
  (restaurants) => restaurants.listingSaving,
)

export const selectGloballyClaimedRestaurantIds = createSelector(
  [selectRestaurantsState],
  (restaurants) => restaurants.globallyClaimedRestaurantIds,
)

// Derived selectors
export const selectActiveRestaurant = createSelector(
  [selectRestaurantsList, selectActiveRestaurantId],
  (list, activeId) => {
    if (!activeId) return null
    return list.find((r) => r.id === activeId) || null
  },
)

export const selectMyListings = createSelector(
  [selectRestaurantsList, (_, userId) => userId],
  (list, userId) => {
    if (!userId) return []
    return list.filter((r) => r.listed_by_user_id === userId)
  },
)

export const selectClaimedRestaurantIdsSet = createSelector(
  [selectGloballyClaimedRestaurantIds],
  (ids) => new Set(ids),
)

export const selectRestaurantById = createSelector(
  [selectRestaurantsList, (_, restaurantId) => restaurantId],
  (list, restaurantId) => {
    if (!restaurantId) return null
    return list.find((r) => r.id === restaurantId) || null
  },
)

export const selectFilteredRestaurants = createSelector(
  [selectRestaurantsList, selectRestaurantsQuery],
  (list, query) => {
    if (!query) return list
    const lowerQuery = query.toLowerCase()
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(lowerQuery) ||
        r.cuisine_type?.toLowerCase().includes(lowerQuery) ||
        r.city?.toLowerCase().includes(lowerQuery),
    )
  },
)
