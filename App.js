import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import FloatingTabBar, { TabBarProvider } from "./components/FloatingTabBar";
import ToEatScreen from "./screens/ToEatScreen";
import { AuthProvider, useAuth } from "./AuthContext";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import CategoryScreen from "./screens/CategoryScreen";
import AddDishScreen from "./screens/AddDishScreen";
import MatchupScreen from "./screens/MatchupScreen";
import DetailScreen from "./screens/DetailScreen";
import AccountScreen from "./screens/AccountScreen";
import SearchScreen from "./screens/SearchScreen";
import { ToastProvider } from "./ToastContext";
import ToEatFormScreen from "./screens/ToEatFormScreen";
import ChooseCategoryScreen from "./screens/ChooseCategoryScreen";
import SavedScreen from "./screens/SavedScreen";
import WakeScreen from "./components/WakeScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <TabBarProvider>
      <Tab.Navigator
        initialRouteName="Rankings"
        backBehavior="initialRoute"
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="ToEat" component={ToEatScreen} />
        <Tab.Screen name="Rankings" component={HomeScreen} />
        <Tab.Screen name="Account" component={AccountScreen} />
      </Tab.Navigator>
    </TabBarProvider>
  );
}

function WakeOverlay() {
  const { waking } = useAuth();
  return <WakeScreen visible={waking} />;
}

function Root() {
  const { user, ready } = useAuth();

  if (!ready) return <View style={{ flex: 1, backgroundColor: "#F6F0E4" }} />;

  return (
    <View style={{ flex: 1}}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F6F0E4" } }}
        >
          {user ? (
            <>
              <Stack.Screen name="Home" component={Tabs} />
              <Stack.Screen name="Category" component={CategoryScreen} />
              <Stack.Screen name="AddDish" component={AddDishScreen} />
              <Stack.Screen name="ToEatForm" component={ToEatFormScreen} />
              <Stack.Screen name="Saved" component={SavedScreen} />
              <Stack.Screen
                name="Matchup"
                component={MatchupScreen}
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen name="Detail" component={DetailScreen} />
              <Stack.Screen name="Search" component={SearchScreen} />
              <Stack.Screen name="ChooseCategory" component={ChooseCategoryScreen} />
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <WakeOverlay />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <AuthProvider>
        <ToastProvider>
          <Root />
        </ToastProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}