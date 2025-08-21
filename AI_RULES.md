# AI Development Rules for DataViz AI

This document outlines the technical stack and coding conventions to be followed by the AI assistant when developing this application. The goal is to maintain code quality, consistency, and maintainability.

## Tech Stack Overview

This project is a modern web application built with the following technologies:

-   **Framework**: React with Vite for a fast development experience.
-   **Language**: TypeScript for type safety and improved developer experience.
-   **UI Components**: Built with `shadcn/ui`, a collection of beautifully designed, accessible, and customizable components.
-   **Styling**: Tailwind CSS is used for all styling, following a utility-first approach.
-   **Routing**: `react-router-dom` for all client-side routing.
-   **Data Fetching & State**: TanStack Query (`@tanstack/react-query`) for managing server state, caching, and data fetching.
-   **Charts & Visualization**: `recharts` for creating interactive and responsive charts.
-   **Forms**: `react-hook-form` for performant form state management, paired with `zod` for schema validation.
-   **Icons**: `lucide-react` for a consistent and clean set of icons.
-   **Notifications**: `sonner` for simple and elegant toast notifications.

## Library Usage and Coding Conventions

### 1. UI and Components

-   **Primary Library**: Always use components from `shadcn/ui` located in `src/components/ui`.
-   **Custom Components**: New reusable components should be created in the `src/components` directory. They should be small, focused, and follow the existing project's styling and structure.
-   **Styling**: All styling MUST be done using Tailwind CSS utility classes. Do not write custom CSS files unless absolutely necessary for a specific library override. Use the `cn` utility from `src/lib/utils.ts` to merge classes conditionally.

### 2. State Management

-   **Server State**: Use `@tanstack/react-query` for all interactions with APIs (fetching, caching, updating data).
-   **Local State**: For component-level state, use React's built-in hooks like `useState` and `useReducer`.
-   **Global State**: Avoid adding global state libraries (like Redux or Zustand) unless the application's complexity grows to a point where prop drilling becomes unmanageable.

### 3. Routing

-   **Library**: All routing is handled by `react-router-dom`.
-   **Route Definitions**: All routes should be defined within the `<Routes>` component in `src/App.tsx`.
-   **Pages**: Each route should correspond to a component in the `src/pages` directory.

### 4. Forms

-   **Form Logic**: Use `react-hook-form` for handling form state, validation, and submissions.
-   **Validation**: Use `zod` to define validation schemas for forms.

### 5. Icons and Visuals

-   **Icons**: Exclusively use icons from the `lucide-react` library to ensure visual consistency.
-   **Charts**: All data visualizations and charts must be implemented using the `recharts` library.

### 6. Code Structure

-   **Pages**: `src/pages/`
-   **Reusable Components**: `src/components/`
-   **UI Primitives (shadcn)**: `src/components/ui/`
-   **Custom Hooks**: `src/hooks/`
-   **Utility Functions**: `src/lib/`
-   **TypeScript**: All new code must be written in TypeScript.