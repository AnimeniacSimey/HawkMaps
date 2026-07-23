/**
 * HawkMaps · src/components/reviews/ReviewSheet.tsx
 *
 * Slide-up sheet showing all reviews for a selected location.
 * Uses static data from src/data/reviews.ts.
 */

import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { reviews } from '@/data/reviews';
import ReviewCreateForm, { ReviewSubmission } from '@/components/reviews/ReviewCreateForm';
import{useState} from 'react';

type Props = {
  visible: boolean;
  locationId: number;
  locationName: string;
  onClose: () => void;
};

export default function ReviewSheet({
  visible,
  locationId,
  locationName,
  onClose,
}: Props) {
  const [writeVisible, setWriteVisible] = useState(false);
  const [userReviews, setUserReviews] = useState<typeof reviews>([]);
  const locationReviews = [
  ...reviews,
  ...userReviews,
]
.filter((review) => review.locationId === locationId)
.sort(
  (a, b) =>
    new Date(b.date).getTime() -
    new Date(a.date).getTime()
);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>

        {/* Tap outside to close */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.card}>
          <View style={styles.handle} />

          <Text style={styles.title}>
            {locationName} Reviews
          </Text>

          {locationReviews.length === 0 ? (
            <Text style={styles.empty}>
              No reviews yet.
            </Text>
          ) : (
            <ScrollView>
              {locationReviews.map((review) => (
                <View key={review.id} style={styles.review}>

                  <Text style={styles.rating}>
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </Text>

                  <Text style={styles.subject}>
                    {review.subject}
                  </Text>

                  <Text style={styles.comment}>
                    "{review.comment}"
                  </Text>

                  <Text style={styles.date}>
                    {review.date}
                  </Text>

                </View>
              ))}
            </ScrollView>
          )}
        <TouchableOpacity
        style={styles.writeBtn}
        onPress={() => setWriteVisible(true)}
        >
            <Text style={styles.writeText}>
                ✍️ Write a Review
            </Text>
        </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
          >
            <Text style={styles.closeText}>
              Close
            </Text>
          </TouchableOpacity>
        <ReviewCreateForm
        visible={writeVisible}
        locationId={locationId}
        locationName={locationName}
        onClose={() => setWriteVisible(false)}
        onSubmit={(review: ReviewSubmission) => {
    setUserReviews((prev) => [
      ...prev,
      {
        id: Date.now(),
        locationId,
        rating: review.rating,
        subject: review.subject,
        comment: review.comment,
        date: new Date().toISOString().split('T')[0],
      },
    ]);

    setWriteVisible(false);
}}
        />
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({

  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
    maxHeight: '70%',
  },

  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },

  empty: {
    color: '#6b7280',
    fontSize: 13,
  },

  review: {
    marginBottom: 16,
  },

  rating: {
    fontSize: 14,
    color: '#C8991A',
    fontWeight: '700',
  },

  subject: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 2,
  },

  comment: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },

  date: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },

  closeBtn: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },

  closeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  writeBtn: {
  marginTop: 12,
  borderRadius: 12,
  paddingVertical: 12,
  alignItems: 'center',
  backgroundColor: '#333',
},

writeText: {
  fontSize: 14,
  fontWeight: '700',
  color: '#fff',
},
});