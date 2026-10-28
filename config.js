import Constants from "expo-constants";

const LIVE = "https://food-rank-api.onrender.com/api";
const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "127.0.0.1";

export const API = process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? `http://${host}:8000/api` : LIVE);