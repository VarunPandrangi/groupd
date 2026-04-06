import { create } from 'zustand';
import assignmentService from '../services/assignmentService';

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

export const useAssignmentStore = create((set) => ({
  assignments: [],
  currentAssignment: null,
  isLoading: false,
  pagination: DEFAULT_PAGINATION,

  fetchAssignments: async (options = {}) => {
    set({ isLoading: true });
    try {
      const response = await assignmentService.getAssignments(options);
      set({
        assignments: response.assignments,
        pagination: response.pagination ?? DEFAULT_PAGINATION,
        isLoading: false,
      });
      return response;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchAssignment: async (id) => {
    set({ isLoading: true });
    try {
      const assignment = await assignmentService.getAssignment(id);
      set({
        currentAssignment: assignment,
        isLoading: false,
      });
      return assignment;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createAssignment: async (payload) => {
    set({ isLoading: true });
    try {
      const assignment = await assignmentService.createAssignment(payload);
      set((state) => ({
        assignments: [assignment, ...state.assignments],
        currentAssignment: assignment,
        isLoading: false,
      }));
      return assignment;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateAssignment: async (id, payload) => {
    set({ isLoading: true });
    try {
      const assignment = await assignmentService.updateAssignment(id, payload);
      set((state) => ({
        assignments: state.assignments.map((entry) =>
          entry.id === id ? assignment : entry
        ),
        currentAssignment: assignment,
        isLoading: false,
      }));
      return assignment;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteAssignment: async (id) => {
    set({ isLoading: true });
    try {
      await assignmentService.deleteAssignment(id);
      set((state) => ({
        assignments: state.assignments.filter((assignment) => assignment.id !== id),
        currentAssignment:
          state.currentAssignment?.id === id ? null : state.currentAssignment,
        isLoading: false,
      }));
      return null;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
