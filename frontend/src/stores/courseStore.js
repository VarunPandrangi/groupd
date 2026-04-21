import { create } from 'zustand';
import courseService from '../services/courseService';
import { useAuthStore } from './authStore';

const INITIAL_STATE = {
  courses: [],
  currentCourse: null,
  currentCourseStudents: [],
  isLoading: false,
  error: null,
};

export const useCourseStore = create((set) => ({
  ...INITIAL_STATE,

  /** Fetch list of courses for the current user (admin → owned; student → enrolled). */
  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await courseService.listCourses();
      const courses = data.courses ?? data;
      set({ courses: Array.isArray(courses) ? courses : [], isLoading: false });
      return courses;
    } catch (error) {
      set({ isLoading: false, error: error?.response?.data?.message ?? error.message });
      throw error;
    }
  },

  /** Fetch a single course by _id. */
  fetchCourse: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const data = await courseService.getCourse(id);
      set({
        currentCourse: data.course ?? data,
        currentCourseStudents: data.enrolledStudents ?? [],
        isLoading: false,
      });
      return data;
    } catch (error) {
      set({ isLoading: false, error: error?.response?.data?.message ?? error.message });
      throw error;
    }
  },

  /** Create a new course. */
  createCourse: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await courseService.createCourse(payload);
      const course = data.course ?? data;
      set((state) => ({
        courses: [course, ...(Array.isArray(state.courses) ? state.courses : [])],
        currentCourse: course,
        isLoading: false,
      }));
      return course;
    } catch (error) {
      set({ isLoading: false, error: error?.response?.data?.message ?? error.message });
      throw error;
    }
  },

  /** Update a course by _id. */
  updateCourse: async (id, fields) => {
    set({ isLoading: true, error: null });
    try {
      const data = await courseService.updateCourse(id, fields);
      const updated = data.course ?? data;
      set((state) => ({
        courses: Array.isArray(state.courses) 
          ? state.courses.map((c) => (c._id === id ? updated : c))
          : [],
        currentCourse: state.currentCourse?._id === id ? updated : state.currentCourse,
        isLoading: false,
      }));
      return updated;
    } catch (error) {
      set({ isLoading: false, error: error?.response?.data?.message ?? error.message });
      throw error;
    }
  },

  /** Soft-delete a course by _id. */
  deleteCourse: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await courseService.deleteCourse(id);
      set((state) => ({
        courses: Array.isArray(state.courses) ? state.courses.filter((c) => c._id !== id) : [],
        currentCourse: state.currentCourse?._id === id ? null : state.currentCourse,
        isLoading: false,
      }));
      return null;
    } catch (error) {
      set({ isLoading: false, error: error?.response?.data?.message ?? error.message });
      throw error;
    }
  },

  /** Enroll a student in a course by email or studentId. */
  enrollStudent: async (id, identifier) => {
    set({ isLoading: true, error: null });
    try {
      const result = await courseService.enrollStudent(id, identifier);
      set({ isLoading: false });
      return result;
    } catch (error) {
      set({ isLoading: false, error: error?.response?.data?.message ?? error.message });
      throw error;
    }
  },

  /** Unenroll a student from a course by student _id. */
  unenrollStudent: async (id, studentId) => {
    set({ isLoading: true, error: null });
    try {
      await courseService.unenrollStudent(id, studentId);
      set((state) => ({
        currentCourseStudents: state.currentCourseStudents.filter(
          (s) => s._id !== studentId
        ),
        isLoading: false,
      }));
      return null;
    } catch (error) {
      set({ isLoading: false, error: error?.response?.data?.message ?? error.message });
      throw error;
    }
  },

  /** Fetch enrolled students for a course. */
  fetchEnrolledStudents: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const data = await courseService.listEnrolledStudents(id);
      const students = data.students ?? data;
      set({ currentCourseStudents: Array.isArray(students) ? students : [], isLoading: false });
      return students;
    } catch (error) {
      set({ isLoading: false, error: error?.response?.data?.message ?? error.message });
      throw error;
    }
  },

  /** Reset all course state to initial values (called on logout). */
  reset: () => set({ ...INITIAL_STATE }),
}));

// Wire reset() to authStore logout so course state is cleared when user logs out.
// Mirrors the pattern used in groupStore's syncCurrentUserGroup / auth subscription.
useAuthStore.subscribe((state, prevState) => {
  if (prevState.isAuthenticated && !state.isAuthenticated) {
    useCourseStore.getState().reset();
  }
});
