import React, { useState, useRef } from 'react';
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

interface OTPVerificationScreenProps {
  phoneNumber: string;
  userType: UserType;
  onVerify: (otp: string) => void;
  onBack: () => void;
}

const { width } = Dimensions.get('window');

export const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({ 
  phoneNumber,
  userType,
  onVerify,
  onBack 
}) => {
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const inputRefs = useRef<TextInput[]>([]);

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

  const handleOTPChange = (value: string, index: number) => {
    const newOTP = [...otp];
    newOTP[index] = value;
    setOTP(newOTP);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      onVerify(otpCode);
    } catch (error) {
      Alert.alert('Verification Failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setOTP(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    Alert.alert('OTP Sent', 'A new OTP has been sent to your phone number.');
  };

  const isOTPComplete = otp.every(digit => digit !== '');

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
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={Colors.primary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            
            <Image
              source={require('../../assets/images/EPI-CIRCLE-FINAL-LOGO-PNG-1-2-1.png')}
              style={styles.logo}
            />
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to{'\n'}
              <Text style={styles.phoneNumberText}>{phoneNumber}</Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            <Text style={styles.otpLabel}>Enter Verification Code</Text>
            <View style={styles.otpInputContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    if (ref) {
                      inputRefs.current[index] = ref;
                    }
                  }}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOTPChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                  autoFocus={index === 0}
                />
              ))}
            </View>
          </View>

          {/* Demo Info */}
          <View style={styles.demoInfo}>
            <View style={styles.demoHeader}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.demoTitle}>Demo Mode</Text>
            </View>
            <Text style={styles.demoText}>
              Use OTP: <Text style={styles.demoOTP}>123456</Text> for verification
            </Text>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              isOTPComplete && styles.verifyButtonActive,
              loading && styles.verifyButtonLoading,
            ]}
            onPress={handleVerifyOTP}
            disabled={!isOTPComplete || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <Ionicons name="hourglass-outline" size={20} color={Colors.white} />
            ) : (
              <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            )}
            <Text style={styles.verifyButtonText}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Text>
          </TouchableOpacity>

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <TouchableOpacity onPress={handleResendOTP} activeOpacity={0.8}>
              <Text style={styles.resendButton}>Resend OTP</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By verifying, you agree to our Terms of Service and Privacy Policy
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 24,
    padding: 8,
    gap: 4,
  },
  backButtonText: {
    ...Typography.styles.body,
    color: Colors.primary,
  },
  logo: {
    width: 280,
    height: 70,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    ...Typography.styles.title2,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    ...Typography.styles.subheadline,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneNumberText: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.primary,
  },
  otpContainer: {
    marginBottom: 32,
  },
  otpLabel: {
    ...Typography.styles.headline,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  otpInput: {
    flex: 1,
    height: 56,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    ...Typography.styles.title2,
    color: Colors.textPrimary,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  demoInfo: {
    backgroundColor: Colors.info + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  demoTitle: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.info,
  },
  demoText: {
    ...Typography.styles.footnote,
    color: Colors.textSecondary,
  },
  demoOTP: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.info,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  verifyButton: {
    backgroundColor: Colors.buttonDisabled,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  verifyButtonActive: {
    backgroundColor: Colors.primary,
  },
  verifyButtonLoading: {
    backgroundColor: Colors.gray[400],
  },
  verifyButtonText: {
    ...Typography.styles.headline,
    color: Colors.white,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    ...Typography.styles.footnote,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  resendButton: {
    ...Typography.styles.bodyEmphasized,
    color: Colors.primary,
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