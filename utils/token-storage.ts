import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_KEY = "postiz.auth";
const ORG_KEY = "postiz.showorg";

const webStorage = {
  async getItem(key: string) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

const nativeStorage = {
  async getItem(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};

const storage = Platform.OS === "web" ? webStorage : nativeStorage;

export const tokenStorage = {
  async getAuth() {
    return storage.getItem(AUTH_KEY);
  },
  async setAuth(token: string) {
    await storage.setItem(AUTH_KEY, token);
  },
  async clearAuth() {
    await storage.removeItem(AUTH_KEY);
  },
  async getShowOrg() {
    return storage.getItem(ORG_KEY);
  },
  async setShowOrg(org: string) {
    await storage.setItem(ORG_KEY, org);
  },
  async clearShowOrg() {
    await storage.removeItem(ORG_KEY);
  },
  async clearAll() {
    await Promise.all([
      storage.removeItem(AUTH_KEY),
      storage.removeItem(ORG_KEY),
    ]);
  },
};
