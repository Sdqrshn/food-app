import Constants from "expo-constants";

const live = process.env.EXPO_PUBLIC_API_URL;
const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "127.0.0.1";

export const API = live || `http://${host}:8000/api`;
export const COLORS = ["#D9774F", "#7FA886", "#E0A93B", "#8A5A83", "#4F8F8B", "#C4604A"];
export const PLACEHOLDER = "rgba(107, 96, 84, 0.4)";