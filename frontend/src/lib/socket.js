// src/lib/socket.js
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const socket = io(API_BASE, {
  withCredentials: false,
  autoConnect: false,
});

export function initSocket(userId) {
  if (!userId) return;

  const userIdStr = userId.toString();

  if (!socket.connected) {
    // set some metadata if you like
    socket.auth = { userId: userIdStr };
    socket.connect();

    socket.once("connect", () => {
      // 🔴 THIS is what the backend is waiting for
      socket.emit("join", userIdStr);
      console.log("🔌 socket connected & joined room:", userIdStr);
    });
  } else {
    // already connected, just (re)join the room
    socket.emit("join", userIdStr);
    console.log("🔁 re-joined room:", userIdStr);
  }
}
