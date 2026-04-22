import { createSelector } from '@reduxjs/toolkit'

// Base selector
const selectReviewsState = (state) => state.reviews

// Basic selectors
export const selectReviewsList = createSelector(
  [selectReviewsState],
  (reviews) => reviews.reviews,
)

export const selectMyReviewHistory = createSelector(
  [selectReviewsState],
  (reviews) => reviews.myReviewHistory,
)

export const selectReviewForm = createSelector(
  [selectReviewsState],
  (reviews) => reviews.reviewForm,
)

export const selectEditingReviewId = createSelector(
  [selectReviewsState],
  (reviews) => reviews.editingReviewId,
)

export const selectReviewSaving = createSelector(
  [selectReviewsState],
  (reviews) => reviews.reviewSaving,
)

export const selectReviewMessage = createSelector(
  [selectReviewsState],
  (reviews) => reviews.reviewMessage,
)

// Derived selectors
export const selectReviewsForRestaurant = createSelector(
  [selectReviewsList, (_, restaurantId) => restaurantId],
  (list, restaurantId) => {
    if (!restaurantId) return []
    return list.filter((r) => r.restaurant_id === restaurantId)
  },
)

export const selectReviewById = createSelector(
  [selectReviewsList, (_, reviewId) => reviewId],
  (list, reviewId) => {
    if (!reviewId) return null
    return list.find((r) => r.id === reviewId) || null
  },
)

export const selectAverageRating = createSelector(
  [selectReviewsList, (_, restaurantId) => restaurantId],
  (list, restaurantId) => {
    if (!restaurantId) return 0
    const restaurantReviews = list.filter((r) => r.restaurant_id === restaurantId)
    if (restaurantReviews.length === 0) return 0
    const sum = restaurantReviews.reduce((acc, r) => acc + (r.rating || 0), 0)
    return (sum / restaurantReviews.length).toFixed(1)
  },
)

export const selectEditingReview = createSelector(
  [selectReviewsList, selectEditingReviewId],
  (list, editingId) => {
    if (!editingId) return null
    return list.find((r) => r.id === editingId) || null
  },
)

export const selectMyReviewIds = createSelector(
  [selectMyReviewHistory],
  (history) => new Set(history.map((r) => r.id)),
)

export const selectReviewCount = createSelector(
  [selectReviewsList, (_, restaurantId) => restaurantId],
  (list, restaurantId) => {
    if (!restaurantId) return 0
    return list.filter((r) => r.restaurant_id === restaurantId).length
  },
)
