/**
 * HawkMaps · src/components/reviews/ReviewSummary.tsx
 *
 * Small preview section shown inside LocationInfoCard.
 * Full review browsing will be added later through ReviewSheet.
 */

import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import { reviews } from '@/data/reviews';

type Props = {
  locationId: number;
  onPress?: ()=> void;
};

export default function ReviewSummary({ locationId, onPress }: Props) {
  // Find reviews belonging to this restaurant.
  // This matches the current reviews.ts generated structure.
  const locationReviews = reviews.filter(
    (review) => review.locationId === locationId
  );

  // Don't display anything for locations without reviews.
  if (locationReviews.length === 0) {
    return null;
  }

  const average =
    locationReviews.reduce(
      (sum, review) => sum + Number(review.rating),
      0
    ) / locationReviews.length;

  const latest = locationReviews[locationReviews.length - 1];

  return (
    <TouchableOpacity 
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.7}
        >
      <Text style={styles.rating}>
        {'★'.repeat(Math.round(average))}
        {'☆'.repeat(5 - Math.round(average))}
      </Text>

      <Text style={styles.count}>
        {average.toFixed(1)} ({locationReviews.length} reviews)
      </Text>
    <Text style={styles.viewReviews}>
    View all reviews →
    </Text>
      {latest && (
        <Text style={styles.preview}>
          "{latest.comment}"
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  rating: {
    fontSize: 14,
    color: '#C8991A',
    fontWeight: '700',
  },
  count: {
    fontSize: 11,
    color: '#6b7280',
  },
  preview: {
    marginTop: 4,
    fontSize: 11,
    color: '#555',
    fontStyle: 'italic',
  },
  viewReviews: {
  marginTop: 3,
  fontSize: 11,
  color: '#3B6D11',
  fontWeight: '600',
},
});