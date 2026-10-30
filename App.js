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

function WakeBanner() {
  const { waking } = useAuth();
  if (!waking) return null;
  return (
    <View pointerEvents="none" style={styles.banner}>
      <ActivityIndicator size="small" color="#A6492F" />
      <Text style={styles.bannerText}>Waking up the server, this can take a minute</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute", bottom: 110, alignSelf: "center", flexDirection: "row", alignItems: "center",
    gap: 8, backgroundColor: "#FFFBF3", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: "#D6C9B0", zIndex: 10, elevation: 6,
  },
  bannerText: { fontSize: 13, color: "#2B2622" },
});

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
              <Stack.Screen
                name="Matchup"
                component={MatchupScreen}
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen name="Detail" component={DetailScreen} />
              <Stack.Screen name="Search" component={SearchScreen} />
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <WakeBanner />
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