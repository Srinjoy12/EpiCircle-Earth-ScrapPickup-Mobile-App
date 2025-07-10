import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Colors } from '../../styles/colors';
import { Typography } from '../../styles/typography';

interface SchedulePickupScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

const TIME_SLOTS = [
  { time: '09:00 AM - 10:00 AM', available: true },
  { time: '10:00 AM - 11:00 AM', available: true },
  { time: '11:00 AM - 12:00 PM', available: true },
  { time: '12:00 PM - 01:00 PM', available: false }, // Lunch break
  { time: '01:00 PM - 02:00 PM', available: true },
  { time: '02:00 PM - 03:00 PM', available: true },
  { time: '03:00 PM - 04:00 PM', available: true },
  { time: '04:00 PM - 05:00 PM', available: true },
];

export const SchedulePickupScreen: React.FC<SchedulePickupScreenProps> = ({ navigation }) => {
  const { authState } = useAuth();
  const { createPickupRequest } = useData();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [address, setAddress] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleConfirmPickup = async () => {
    if (!selectedTimeSlot) {
      Alert.alert('Time Slot Required', 'Please select a time slot for your pickup');
      return;
    }
    
    if (!address.trim()) {
      Alert.alert('Address Required', 'Please enter your pickup address');
      return;
    }

    if (!authState.user) {
      Alert.alert('Authentication Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      await createPickupRequest({
        customerId: authState.user.id,
        customerName: authState.user.name,
        customerPhone: authState.user.phoneNumber,
        pickupDate: formatDate(selectedDate),
        timeSlot: selectedTimeSlot,
        address: address.trim(),
        mapLink: mapLink.trim() || undefined,
      });

      Alert.alert(
        'Pickup Confirmed!', 
        'Your scrap pickup has been scheduled. An eco-warrior will be assigned soon!', 
        [
          { text: 'Great!', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      Alert.alert('Booking Failed', 'Failed to schedule pickup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMinimumDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const isFormComplete = selectedTimeSlot && address.trim();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Schedule Pickup</Text>
            <Text style={styles.subtitle}>Turn your scrap into treasure</Text>
          </View>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Date Selection */}
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Pickup Date</Text>
            </View>
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <View style={styles.dateContent}>
                <Text style={styles.dateDay}>{formatDateShort(selectedDate)}</Text>
                <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={getMinimumDate()}
              />
            )}
          </View>

          {/* Time Slot Selection */}
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Available Time Slots</Text>
            </View>
            <View style={styles.timeSlotsContainer}>
              {TIME_SLOTS.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlotCard,
                    selectedTimeSlot === slot.time && styles.timeSlotCardSelected,
                    !slot.available && styles.timeSlotCardDisabled,
                  ]}
                  onPress={() => slot.available && setSelectedTimeSlot(slot.time)}
                  disabled={!slot.available}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      selectedTimeSlot === slot.time && styles.timeSlotTextSelected,
                      !slot.available && styles.timeSlotTextDisabled,
                    ]}
                  >
                    {slot.time}
                  </Text>
                  {!slot.available && (
                    <Text style={styles.unavailableText}>Unavailable</Text>
                  )}
                  {selectedTimeSlot === slot.time && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark" size={16} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Address Input */}
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Pickup Address</Text>
            </View>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.addressInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your complete pickup address..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Optional Map Link */}
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="map-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Location Link (Optional)</Text>
            </View>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.mapInput}
                value={mapLink}
                onChangeText={setMapLink}
                placeholder="Paste Google Maps link (helps eco-warrior find you faster)"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
              <Text style={styles.infoTitle}>What happens next?</Text>
            </View>
            <Text style={styles.infoText}>
              • An eco-warrior will be assigned to your pickup{'\n'}
              • You'll receive a pickup code for verification{'\n'}
              • They'll collect, weigh & price your scrap{'\n'}
              • Approve the items and earn your treasure!
            </Text>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[
              styles.confirmButton,
              isFormComplete && styles.confirmButtonActive,
              loading && styles.confirmButtonLoading,
            ]}
            onPress={handleConfirmPickup}
            disabled={!isFormComplete || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <Ionicons name="hourglass-outline" size={20} color={Colors.white} />
            ) : (
              <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            )}
            <Text style={styles.confirmButtonText}>
              {loading ? 'Confirming...' : 'Confirm Pickup'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.backgroundSecondary,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  backButtonText: {
    ...Typography.styles.body,
    color: Colors.primary,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    ...Typography.styles.title1,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.styles.subheadline,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    ...Typography.styles.headline,
    color: Colors.textPrimary,
  },
  dateCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dateContent: {
    flex: 1,
  },
  dateDay: {
    ...Typography.styles.caption1,
    color: Colors.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dateText: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.textPrimary,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlotCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    minWidth: (width - 60) / 2, // 2 columns with gap
    position: 'relative',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeSlotCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
  },
  timeSlotCardDisabled: {
    backgroundColor: Colors.gray[100],
    borderColor: Colors.gray[200],
  },
  timeSlotText: {
    ...Typography.styles.footnote,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  timeSlotTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  timeSlotTextDisabled: {
    color: Colors.textTertiary,
  },
  unavailableText: {
    ...Typography.styles.caption2,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addressInput: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    padding: 20,
    minHeight: 80,
  },
  mapInput: {
    ...Typography.styles.body,
    color: Colors.textPrimary,
    padding: 20,
  },
  infoCard: {
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoTitle: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.primary,
  },
  infoText: {
    ...Typography.styles.footnote,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: Colors.buttonDisabled,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  confirmButtonActive: {
    backgroundColor: Colors.primary,
  },
  confirmButtonLoading: {
    backgroundColor: Colors.gray[400],
  },
  confirmButtonText: {
    ...Typography.styles.headline,
    color: Colors.white,
  },
}); 