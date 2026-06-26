import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;

const socket = io(socketUrl, {
  autoConnect: false,
});

export default socket;