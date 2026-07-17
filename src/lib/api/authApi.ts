import { UserProfile } from "@/types";
import { STORAGE_KEYS } from "@/data/constants";

const mapBackendUserToFrontend = (user: any) => {
  if (!user) return null;
  const mappedRole =
    user.role === "PETANI" ? "farmer" :
    user.role === "BUYER" ? "buyer" :
    user.role === "ADMIN" ? "admin" :
    user.role;
  return {
    ...user,
    role: mappedRole,
  };
};

export const getCurrentUser = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  const auth = sessionStorage.getItem(STORAGE_KEYS.AUTH);
  const userStr = sessionStorage.getItem(STORAGE_KEYS.USER);
  if (auth === "true" && userStr) {
    return mapBackendUserToFrontend(JSON.parse(userStr));
  }
  return null;
};

export const saveCurrentUser = (user: UserProfile) => {
  if (typeof window === "undefined") return;
  const mappedUser = mapBackendUserToFrontend(user);
  sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mappedUser));
  sessionStorage.setItem(STORAGE_KEYS.AUTH, "true");
};

export const clearCurrentUser = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEYS.USER);
  sessionStorage.removeItem(STORAGE_KEYS.AUTH);
};

export const register = async (data: { fullName: string; phoneNumber: string; role: "farmer" | "buyer" }) => {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const login = async (data: { phoneNumber: string }) => {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const verifyOtp = async (data: { phoneNumber: string; otp: string }) => {
  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (json.success && json.user) {
    json.user = mapBackendUserToFrontend(json.user);
  }
  return json;
};

export const resendOtp = async (data: { phoneNumber: string; purpose: "REGISTER" | "LOGIN" }) => {
  const res = await fetch("/api/auth/resend-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getMe = async () => {
  const res = await fetch("/api/auth/me");
  if (!res.ok) throw new Error("Unauthorized");
  const json = await res.json();
  if (json.success && json.user) {
    json.user = mapBackendUserToFrontend(json.user);
  }
  return json;
};

export const logout = async () => {
  const res = await fetch("/api/auth/logout", { method: "POST" });
  clearCurrentUser();
  return res.json();
};

export const authApi = {
  getCurrentUser,
  saveCurrentUser,
  clearCurrentUser,
  register,
  login,
  verifyOtp,
  resendOtp,
  getMe,
  logout,
};