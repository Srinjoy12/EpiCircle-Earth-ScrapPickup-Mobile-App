import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { AuthFlow } from '../screens/auth/AuthFlow';
import { CustomerDashboard } from '../screens/customer/CustomerDashboard';
import { SchedulePickupScreen } from '../screens/customer/SchedulePickupScreen';
import { OrderHistoryScreen } from '../screens/customer/OrderHistoryScreen';
import { PartnerDashboard } from '../screens/partner/PartnerDashboard';
import { Text, View } from 'react-native';

const Stack = createStackNavigator();

export const AppNavigator: React.FC = () => {
  const { authState, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!authState.isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthFlow} />
        ) : authState.user?.type === 'customer' ? (
          <>
            <Stack.Screen name="CustomerDashboard" component={CustomerDashboard} />
            <Stack.Screen name="SchedulePickup" component={SchedulePickupScreen} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="PartnerDashboard" component={PartnerDashboard} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 