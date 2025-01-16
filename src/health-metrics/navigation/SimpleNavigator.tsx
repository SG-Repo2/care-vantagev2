import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../components/HomeScreen';

const Stack = createNativeStackNavigator();

export const SimpleNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          contentStyle: {
            backgroundColor: '#000',
          },
        }}
      />
    </Stack.Navigator>
  );
}; 