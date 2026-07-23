/**
 * HawkMaps · src/components/reviews/ReviewCreateForm.tsx
 *
 * Modal form for submitting a new review.
 */

import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export type ReviewSubmission = {
  rating: number;
  subject: string;
  comment: string;
  date: string;
};

type Props = {
  visible: boolean;
  locationId: number;
  locationName: string;
  onClose: () => void;
  onSubmit: (review: ReviewSubmission) => void;
};

export default function ReviewCreateForm({
  visible,
  locationName,
  onClose,
  onSubmit,
}: Props) {
  const [rating, setRating] = useState(5);
  const [subject, setSubject] = useState('');
  const [comment, setComment] = useState('');

  const submit = () => {
    onSubmit({
      rating,
      subject,
      comment,
      date: new Date().toISOString().split('T')[0],
    });

    setRating(5);
    setSubject('');
    setComment('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>

        <View style={styles.card}>

          <Text style={styles.title}>
            Write a Review for {locationName}
          </Text>

          <Text style={styles.label}>
            Rating
          </Text>

          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
              >
                <Text style={styles.star}>
                  {star <= rating ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>


          <Text style={styles.label}>
            Subject
          </Text>

          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Good, Okay, Poor..."
          />


          <Text style={styles.label}>
            Comment
          </Text>

          <TextInput
            style={[styles.input, styles.commentInput]}
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience..."
            multiline
          />


          <TouchableOpacity
            style={styles.submitBtn}
            onPress={submit}
          >
            <Text style={styles.submitText}>
              Submit Review
            </Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>
              Cancel
            </Text>
          </TouchableOpacity>

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
    padding: 16,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 5,
  },

  ratingRow: {
    flexDirection: 'row',
  },

  star: {
    fontSize: 28,
    color: '#C8991A',
    marginRight: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
  },

  commentInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  submitBtn: {
    marginTop: 16,
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  submitText: {
    color: '#fff',
    fontWeight: '700',
  },

  cancelBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },

  cancelText: {
    color: '#666',
  },

});