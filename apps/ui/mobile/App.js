import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import QuizScreen from './src/screens/QuizScreen';
import GameSetupScreen from './src/screens/GameSetupScreen';
import SimulationScreen from './src/screens/SimulationScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import TheoryDetailScreen from './src/screens/TheoryDetailScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import MultiSetupScreen from './src/screens/MultiSetupScreen';
import MultiSimulationScreen from './src/screens/MultiSimulationScreen';
import MultiResultsScreen from './src/screens/MultiResultsScreen';
import ShopScreen from './src/screens/ShopScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Shop" component={ShopScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="GameSetup" component={GameSetupScreen} />
        <Stack.Screen name="Simulation" component={SimulationScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="TheoryDetail" component={TheoryDetailScreen} />
        <Stack.Screen name="Lobby" component={LobbyScreen} />
        <Stack.Screen name="MultiSetup" component={MultiSetupScreen} />
        <Stack.Screen name="MultiSimulation" component={MultiSimulationScreen} />
        <Stack.Screen name="MultiResults" component={MultiResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
