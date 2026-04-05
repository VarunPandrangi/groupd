import { create } from 'zustand';
import groupService from '../services/groupService';

const buildGroupState = (group) => ({
  group,
  members: group?.members ?? [],
});

export const useGroupStore = create((set) => ({
  group: null,
  members: [],
  isLoading: false,

  fetchMyGroup: async () => {
    set({ isLoading: true });
    try {
      const group = await groupService.getMyGroup();
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
