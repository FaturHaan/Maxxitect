import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import * as WebBrowser from 'expo-web-browser';
import HomeScreen from './src/screens/HomeScreen';
import ResultScreen from './src/screens/ResultScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import RelatedPackagesScreen from './src/screens/RelatedPackagesScreen';
import ProductListScreen from './src/screens/ProductListScreen';
import PackageListScreen from './src/screens/PackageListScreen';
import LoginScreen from './src/screens/LoginScreen';
import { supabase } from './src/services/supabase';

WebBrowser.maybeCompleteAuthSession();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CustomHeaderTitle = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Image 
      source={require('./assets/icon.jpg')} 
      style={{ width: 26, height: 26, marginRight: 8, resizeMode: 'cover', borderRadius: 6, backgroundColor: '#fff' }} 
    />
    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>Maxxitect</Text>
  </View>
);

function DiagnosisTabWrapper({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[App] Current active session user:', session?.user?.email || 'None');
      setUser(session?.user || null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[App] Auth state event:', _event, 'User:', session?.user?.email || 'None');
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007A33" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <HomeScreen user={user} navigation={navigation} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: '#007A33',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'DiagnosisTab') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === 'ProductListTab') {
            iconName = focused ? 'bag' : 'bag-outline';
          } else if (route.name === 'PackageListTab') {
            iconName = focused ? 'cube' : 'cube-outline';
          }
          return (
            <View style={{
              width: 60,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? '#E8F5E9' : 'transparent',
              borderRadius: 16,
            }}>
              <Ionicons name={iconName} size={22} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: '#007A33',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E8E8E8',
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="DiagnosisTab"
        component={DiagnosisTabWrapper}
        options={{ 
          title: 'Diagnosis',
          headerTitle: (props) => <CustomHeaderTitle {...props} />,
        }}
      />
      <Tab.Screen
        name="ProductListTab"
        component={ProductListScreen}
        options={{ 
          title: 'Produk',
          headerTitle: (props) => <CustomHeaderTitle {...props} />,
        }}
      />
      <Tab.Screen
        name="PackageListTab"
        component={PackageListScreen}
        options={{ 
          title: 'Paket',
          headerTitle: (props) => <CustomHeaderTitle {...props} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const hasOnboarded = await AsyncStorage.getItem('@has_onboarded');
        if (hasOnboarded === 'true') {
          setIsFirstLaunch(false);
        } else {
          setIsFirstLaunch(true);
        }
      } catch (error) {
        console.error('Error reading onboarding status', error);
        setIsFirstLaunch(false); // Fallback jika gagal baca
      }
    }
    
    checkOnboardingStatus();
  }, []);

  if (isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007A33" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={isFirstLaunch ? "Onboarding" : "Main"}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007A33', // Warna hijau Maxxi Agri
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Main" 
          component={MainTabs} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Result" 
          component={ResultScreen} 
          options={{ title: 'Hasil Diagnosis' }}
        />
        <Stack.Screen 
          name="ProductDetail" 
          component={ProductDetailScreen} 
          options={{ title: 'Detail Produk' }}
        />
        <Stack.Screen 
          name="RelatedPackages" 
          component={RelatedPackagesScreen} 
          options={{ title: 'Paket Terkait' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
