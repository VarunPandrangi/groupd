import { create } from 'zustand';
import submissionService from '../services/submissionService';

export const useSubmissionStore = create((set) => ({
  mySubmissions: [],
  groupProgress: [],
  isLoading: false,

  fetchMySubmissions: async () => {
    set({ isLoading: true });
    try {
      const submissions = await submissionService.getMySubmissions();
      set({ mySubmissions: Array.isArray(submissions) ? submissions : [], isLoading: false });
      return submissions;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchGroupProgress: async () => {
    set({ isLoading: true });
    try {
      const progress = await submissionService.getGroupProgress();
      set({
        groupProgress: Array.isArray(progress) ? progress : [],
        isLoading: false,
      });
      return progress;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  confirmSubmission: async (assignmentId) => {
    set({ isLoading: true });
    try {
      const submission = await submissionService.confirmSubmission(assignmentId);
      set((state) => ({
        mySubmissions: state.mySubmissions.some(
          (entry) => entry.assignment_id === submission.assignment_id
        )
          ? state.mySubmissions
          : [...state.mySubmissions, submission],
        groupProgress: Array.isArray(state.groupProgress)
          ? state.groupProgress.map((assignment) =>
              assignment.assignment_id === submission.assignment_id
                ? {
                    ...assignment,
                    is_submitted: true,
                    submitted_by_name:
                      submission.submitted_by_name ??
                      assignment.submitted_by_name ??
                      null,
                    confirmed_at:
                      submission.confirmed_at ?? assignment.confirmed_at ?? null,
                  }
                : assignment
            )
          : state.groupProgress,
        isLoading: false,
      }));
      return submission;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
