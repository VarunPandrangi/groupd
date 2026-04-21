import { create } from 'zustand';
import groupService from '../services/groupService';
import { useAuthStore } from './authStore';

const buildGroupState = (group) => ({
  group,
  members: group?.members ?? [],
});

function syncCurrentUserGroup(groupId) {
  const user = useAuthStore.getState().user;

  if (!user || user.group_id === groupId) {
    return;
  }

  useAuthStore.setState({
    user: {
      ...user,
      group_id: groupId,
    },
  });
}

export const useGroupStore = create((set) => ({
  group: null,
  members: [],
  isLoading: false,

  fetchMyGroup: async () => {
    set({ isLoading: true });
    try {
      const group = await groupService.getMyGroup();
      syncCurrentUserGroup(group?.id ?? null);
      set({
        ...buildGroupState(group),
        isLoading: false,
      });
      return group;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createGroup: async (payload) => {
    set({ isLoading: true });
    try {
      const group = await groupService.createGroup(payload);
      syncCurrentUserGroup(group?.id ?? null);
      set({
        ...buildGroupState(group),
        isLoading: false,
      });
      return group;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addMember: async (payload) => {
    set({ isLoading: true });
    try {
      const group = await groupService.addMember(payload);
      set({
        ...buildGroupState(group),
        isLoading: false,
      });
      return group;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  removeMember: async (memberId) => {
    set({ isLoading: true });
    try {
      const group = await groupService.removeMember(memberId);
      set({
        ...buildGroupState(group),
        isLoading: false,
      });
      return group;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  leaveGroup: async () => {
    set({ isLoading: true });
    try {
      await groupService.leaveGroup();
      syncCurrentUserGroup(null);
      set({
        group: null,
        members: [],
        isLoading: false,
      });
      return null;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteGroup: async () => {
    set({ isLoading: true });
    try {
      await groupService.deleteGroup();
      syncCurrentUserGroup(null);
      set({
        group: null,
        members: [],
        isLoading: false,
      });
      return null;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
