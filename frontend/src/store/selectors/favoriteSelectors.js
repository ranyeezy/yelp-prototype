import { createSelector } from '@reduxjs/toolkit'

// Base selector
const selectFavoritesState = (state) => state.favorites

// Basic selectors
export const selectFavoriteRestaurantIds = createSelector(
  [selectFavoritesState],
  (favorites) => favorites.favoriteRestaurantIds,
)

export const selectFavoriteRestaurants = createSelector(
  [selectFavoritesState],
  (favorites) => favorites.favoriteRestaurants,
)

export const selectFavoriteActionId = createSelector(
  [selectFavoritesState],
  (favorites) => favorites.favoriteActionId,
)

export const selectFavoritesMessage = createSelector(
  [selectFavoritesState],
  (favorites) => favorites.favoritesMessage,
)

// Derived selectors
export const selectFavoriteRestaurantIdsSet = createSelector(
  [selectFavoriteRestaurantIds],
  (ids) => new Set(ids),
)

export const selectIsFavoritedById = createSelector(
  [selectFavoriteRestaurantIdsSet, (_, restaurantId) => restaurantId],
  (idSet, restaurantId) => {
    if (!restaurantId) return false
    return idSet.has(restaurantId)
  },
)

export const selectFavoritesCount = createSelector(
  [selectFavoriteRestaurantIds],
  (ids) => ids.length,
)

export const selectFavoriteRestaurantById = createSelector(
  [selectFavoriteRestaurants, (_, restaurantId) => restaurantId],
  (restaurants, restaurantId) => {
    if (!restaurantId) return null
    return restaurants.find((r) => r.id === restaurantId) || null
  },
)

export const selectIsFavoritingRestaurant = createSelector(
  [selectFavoriteActionId, (_, restaurantId) => restaurantId],
  (actionId, restaurantId) => {
    return actionId === restaurantId
  },
)
