import React, { useState } from 'react';
import { Alert } from 'react-native';
import { PhoneLoginScreen } from './PhoneLoginScreen';
import { OTPVerificationScreen } from './OTPVerificationScreen';
import { useAuth } from '../../context/AuthContext';
import { UserType } from '../../types';

export const AuthFlow: React.FC = () => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userType, setUserType] = useState<UserType>('customer');
  const { login } = useAuth();

  const handlePhoneSubmit = (phone: string, type: UserType) => {
    setPhoneNumber(phone);
    setUserType(type);
    setStep('otp');
  };

  const handleOTPVerify = async (otp: string) => {
    try {
      const success = await login(phoneNumber, otp, userType);
      if (!success) {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    }
  };

  const handleBack = () => {
    setStep('phone');
  };

  if (step === 'phone') {
    return <PhoneLoginScreen onSubmit={handlePhoneSubmit} />;
  }

  return (
    <OTPVerificationScreen
      phoneNumber={phoneNumber}
      userType={userType}
      onVerify={handleOTPVerify}
      onBack={handleBack}
    />
  );
}; 