import { create } from "zustand";
import { io } from "socket.io-client";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

// Axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // if using cookies/session
});

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  // ------------------ AUTH CHECK ------------------
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // ------------------ SIGNUP ------------------
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      console.log("Signup error:", error);
      toast.error(error.response?.data?.message || "Server not reachable");
    } finally {
      set({ isSigningUp: false });
    }
  },

  // ------------------ LOGIN ------------------
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      console.log("Login error:", error);
      toast.error(error.response?.data?.message || "Server not reachable");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // ------------------ LOGOUT ------------------
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      console.log("Logout error:", error);
      toast.error(error.response?.data?.message || "Server not reachable");
    }
  },

  // ------------------ UPDATE PROFILE ------------------
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Update profile error:", error);
      toast.error(error.response?.data?.message || "Server not reachable");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // ------------------ SOCKET ------------------
  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser || socket?.connected) return;

    const newSocket = io(BASE_URL, {
      auth: { userId: authUser._id },
    });

    set({ socket: newSocket });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
