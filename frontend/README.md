# Groupd Frontend

This is the React frontend for Groupd, a role-based student and assignment management system.

## Stack

- React + Vite
- Tailwind CSS
- Zustand (state management)
- React Router
- Axios (API integration with JWT refresh flow)
- Recharts (admin analytics)
- Framer Motion (animations)

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
echo VITE_API_URL=http://localhost:5000/api/v1 > .env
```

3. Start dev server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

5. Preview production build:

```bash
npm run preview
```

## Scripts

- npm run dev: Start Vite development server.
- npm run build: Build production bundle.
- npm run preview: Preview built bundle.
- npm run lint: Run ESLint.

## Frontend Structure

```text
src/
├── components/   # Shared and role-specific UI components
├── layouts/      # App shell layouts for public/student/admin
├── pages/        # Route pages
├── services/     # API service wrappers
├── stores/       # Zustand stores
├── styles/       # Global design tokens and CSS
└── utils/        # Utility helpers
```

## Role-Based Routes

- Public: landing, login, register
- Student: dashboard, assignments, assignment detail, group, progress
- Admin: dashboard, assignment manager, assignment form/edit, groups, submissions tracker

## Design Notes

- Theme-aware UI with CSS custom properties.
- Mobile + desktop responsive layouts.
- Reusable status badges, cards, modals, and page wrappers for consistency.
