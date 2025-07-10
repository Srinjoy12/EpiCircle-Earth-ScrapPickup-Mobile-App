import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserType } from '../../types';
import { Colors } from '../../styles/colors';
import { Typography } from '../../styles/typography';

interface PhoneLoginScreenProps {
  onSubmit: (phoneNumber: string, userType: UserType) => void;
}

const { width } = Dimensions.get('window');

export const PhoneLoginScreen: React.FC<PhoneLoginScreenProps> = ({ onSubmit }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedUserType, setSelectedUserType] = useState<UserType>('customer');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubmit = () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return;
    }
    onSubmit(phoneNumber, selectedUserType);
  };

  const UserTypeButton = ({ type, label, description }: { type: UserType; label: string; description: string }) => {
    const isActive = selectedUserType === type;
    const activeColor = type === 'partner' ? '#E08E5B' : Colors.primary;

    return (
      <TouchableOpacity
        style={[
          styles.userTypeButton,
          isActive && {
            borderColor: activeColor,
            backgroundColor: `${activeColor}1A`, // e.g., #RRGGBB1A for 10% opacity
          },
        ]}
        onPress={() => setSelectedUserType(type)}
        activeOpacity={0.8}
      >
        <View style={styles.userTypeButtonContent}>
          <Text
            style={[
              styles.userTypeButtonText,
              isActive && { color: activeColor },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.userTypeButtonDescription,
              isActive && { color: activeColor },
            ]}
          >
            {description}
          </Text>
        </View>
        {isActive && (
          <View style={[styles.checkmark, { backgroundColor: activeColor }]}>
            <Ionicons name="checkmark" size={16} color={Colors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/EPI-CIRCLE-FINAL-LOGO-PNG-1-2-1.png')}
              style={styles.logo}
            />
            <Text style={styles.tagline}>Turning Scrap into Treasure</Text>
            <Text style={styles.subtitle}>Join the circular economy movement</Text>
          </View>

          {/* User Type Selection */}
          <View style={styles.userTypeContainer}>
            <Text style={styles.sectionTitle}>I am a:</Text>
            <View style={styles.userTypeButtons}>
              <UserTypeButton
                type="customer"
                label="Customer"
                description="Schedule pickup for your scrap"
              />
              <UserTypeButton
                type="partner"
                label="Eco-Warrior"
                description="Collect and process scrap"
              />
            </View>
          </View>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter your phone number"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[
              styles.submitButton,
              phoneNumber.length >= 10 && styles.submitButtonActive
            ]} 
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={phoneNumber.length < 10}
          >
            <Text style={styles.submitButtonText}>Continue</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 280,
    height: 70,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  tagline: {
    ...Typography.styles.headline,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.styles.subheadline,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  userTypeContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...Typography.styles.headline,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  userTypeButtons: {
    gap: 12,
  },
  userTypeButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userTypeButtonActive: {
    // This style is now handled dynamically inside the component
  },
  userTypeButtonContent: {
    flex: 1,
  },
  userTypeButtonText: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userTypeButtonTextActive: {
    // This style is now handled dynamically inside the component
  },
  userTypeButtonDescription: {
    ...Typography.styles.footnote,
    color: Colors.textSecondary,
  },
  userTypeButtonDescriptionActive: {
    // This style is now handled dynamically inside the component
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    ...Typography.styles.headline,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  countryCode: {
    ...Typography.styles.body,
    color: Colors.textSecondary,
    paddingLeft: 16,
    paddingRight: 8,
  },
  input: {
    ...Typography.styles.body,
    flex: 1,
    padding: 16,
    color: Colors.textPrimary,
  },
  submitButton: {
    backgroundColor: Colors.buttonDisabled,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  submitButtonActive: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    ...Typography.styles.headline,
    color: Colors.white,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...Typography.styles.caption1,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
}); 