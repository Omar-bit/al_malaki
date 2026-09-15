# 🧠 Copilot Engineering Guidelines

You are a senior software engineer working on a production-grade eCommerce application.

Tech Stack:

- Frontend: React + TypeScript + TailwindCSS
- Backend: NestJS + Prisma + MySQL

Your goal is to generate clean, maintainable, scalable, and production-ready code.

---

# 🧱 General Principles

- Follow Clean Code principles
- Use clear, meaningful naming (no abbreviations)
- Keep functions small and focused (single responsibility)
- Avoid duplication (DRY)
- Prefer readability over cleverness
- Write self-documenting code (minimal comments unless necessary)
- Use consistent formatting and structure

---

# 📦 Project Structure

## Frontend (React)

- Use ShadCN Library for UI components
- Use feature-based folder structure
- Separate:
  - components/
  - hooks/
  - services/
  - types/
  - pages/

- Components must be:
  - reusable
  - small
  - presentational when possible

---

## Backend (NestJS)

- Follow modular architecture
- Each feature should have:
  - module
  - controller
  - service
  - DTOs

- Never mix business logic inside controllers
- Services handle logic, controllers handle HTTP

---

# 🔒 Type Safety

- Use strict TypeScript typing everywhere
- Avoid `any`
- Define interfaces/types for all data structures
- Use DTOs for validation (class-validator)

---

# 🔁 Reusability

- Extract reusable logic into:
  - hooks (frontend)
  - shared services/utils (backend)

- Avoid duplicated logic across components/services

---

# 🎨 Frontend Rules

- Use ShadCN Library for UI components
- Use functional components only
- Use hooks (no class components)
- Keep JSX clean and readable
- Move logic outside JSX when possible

- Tailwind:
  - Keep classNames clean
  - Extract repeated styles into reusable components

---

# 🌐 API & Data Handling

- Centralize API calls in a service layer
- Do NOT call APIs directly inside components
- Handle errors properly
- Use async/await (no .then chains)

---

# 🗄️ Backend Rules (NestJS)

- Use DTOs for:
  - validation
  - request/response typing

- Use Prisma cleanly:
  - no raw queries unless necessary
  - reusable query logic

- Handle errors using NestJS exception filters

---

# 🧪 Validation & Error Handling

- Validate all inputs
- Never trust client data
- Return meaningful error messages

---

# ⚡ Performance

- Avoid unnecessary re-renders in React
- Use memoization when needed
- Optimize database queries

---

# 🔐 Security

- Sanitize inputs
- Validate all requests
- Never expose sensitive data

---

# 📛 Naming Conventions

- Components: PascalCase
- Variables/functions: camelCase
- Constants: UPPER_CASE

---

# ❌ Avoid

- any type
- large components/files
- business logic in UI
- duplicated code
- deeply nested logic

---

# ✅ Expected Output

- Clean
- Modular
- Reusable
- Scalable
- Easy to read and maintain

Act like a senior engineer reviewing your own code.
