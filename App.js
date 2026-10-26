import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./AuthContext";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import CategoryScreen from "./screens/CategoryScreen";
import AddDishScreen from "./screens/AddDishScreen";
import MatchupScreen from "./screens/MatchupScreen";
import DetailScreen from "./screens/DetailScreen";
import AccountScreen from "./screens/AccountScreen";

const Stack = createNativeStackNavigator();

function Root() {
  const { user, ready } = useAuth();

  if (!ready) return <View style={{ flex: 1, backgroundColor: "#F6F0E4" }} />;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F6F0E4" } }}
      >
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Category" component={CategoryScreen} />
            <Stack.Screen name="AddDish" component={AddDishScreen} />
            <Stack.Screen
              name="Matchup"
              component={MatchupScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="Detail" component={DetailScreen} />
            <Stack.Screen name="Account" component={AccountScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}