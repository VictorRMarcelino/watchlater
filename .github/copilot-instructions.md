# Copilot instructions for Watchlater

## Project overview
This repository is a Vue 3 + Vite + TypeScript application for a watchlist app. The codebase uses the `@/` alias for imports, Firebase for authentication and data persistence, and Pinia for state management.

## Architecture and conventions
- Prefer Vue 3 Composition API with `<script setup lang="ts">` for new components.
- Keep project structure aligned with the current layout:
  - `src/components/` for reusable UI components
  - `src/views/` for route-level pages
  - `src/services/` for Firebase and domain logic
  - `src/stores/` for Pinia stores
  - `src/interfaces/` for TypeScript interfaces
  - `src/router/` for Vue Router configuration
- Use the existing `@/` alias for imports instead of relative paths when the target is inside `src/`.
- Favor explicit, type-safe code. Prefer interfaces and typed values over `any`.
- Follow the project naming style:
  - `PascalCase` for Vue components and service objects
  - `camelCase` for functions, variables, and methods
  - filenames in `PascalCase` for Vue components and `camelCase` for helper/service modules
- Reuse the patterns already established in the project, especially the Firebase access layer from `src/database/Database.ts` and the service modules under `src/services/`.

## Coding patterns to follow
- For Firebase operations, prefer async/await and keep service methods centralized in the corresponding service file.
- When handling auth state, use the Pinia auth store (`src/stores/auth.ts`) rather than duplicating state logic.
- For Vue Router navigation, prefer `useRouter()` and `RouterLink` following the current component patterns.
- Keep component logic simple and declarative; avoid unnecessary abstraction when a direct solution is clearer.
- Preserve existing formatting, indentation, and naming consistency even when making small updates.

## Validation
Before considering a change complete, validate it with the smallest relevant command:
- `npm run type-check` for TypeScript and Vue type validation
- `npm run test:unit -- --run` for the unit test suite when relevant
- `npm run build` for a production build check when the change affects application flow or compile output

## General guidance
- Do not add debug logs, temporary code, or test-only hooks to production code.
- Prefer minimal, root-cause fixes over broad refactors.
- Keep changes aligned with the existing app design and the established Firebase/Vue patterns already present in the codebase.
