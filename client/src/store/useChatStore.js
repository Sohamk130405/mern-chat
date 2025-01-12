import { create } from "zustand";
import { api } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSendingMessage: false,
  setIsSendingMessage: (isSendingMessage) => set({ isSendingMessage }),

  setSelectedUser: (selectedUser) => set({ selectedUser }),
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await api.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      console.log("Error in get users:", error.message);
      toast.error(error.response.data.message || "Internal Server Error");
      set({ users: [] });
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await api.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      console.log("Error in get messages:", error.message);
      toast.error(error.response.data.message || "Internal Server Error");
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (data) => {
    set({ isSendingMessage: true });
    const { selectedUser, messages } = get();
    try {
      const res = await api.post(`/messages/send/${selectedUser._id}`, data);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      console.log("Error in send message:", error.message);
      toast.error(error.response.data.message || "Internal Server Error");
    } finally {
      set({ isSendingMessage: false });
      set({ isMessagesLoading: false });
    }
  },
  deleteMessage: async (messageId) => {
    try {
      const { messages } = get();
      await api.delete(`/message/${messageId}`);
      set({ messages: messages.filter((m) => m._id !== messageId) });
    } catch (error) {
      console.log("Error in delete message:", error.message);
      toast.error(error.response.data.message || "Internal Server Error");
    }
  },
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },
}));
