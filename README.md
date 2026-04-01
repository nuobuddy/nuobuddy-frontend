# NuoBuddy Frontend

A modern AI chatbot web application built with Vue 3, featuring a real-time streaming chat interface, admin dashboard, and multi-language support. Connects to [nuobuddy-backend](../nuobuddy-backend) for AI-powered conversations via Dify.ai.

## Features

- **AI Chat Interface** — Real-time streaming chat powered by SSE, with conversation history
- **Authentication** — User registration, login, and email-based password reset
- **Admin Dashboard** — Paginated user management with role-based access control
- **Multi-language** — English and Simplified Chinese (i18n via vue-i18n), switchable at runtime
- **Light / Dark Mode** — System-aware theming
- **Accessible Components** — Built on shadcn-vue + Radix Vue primitives
- **Data Visualization** — Charts powered by Unovis

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Build Tool | Vite |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn-vue, Radix Vue |
| State Management | Pinia |
| Routing | Vue Router v5 |
| i18n | vue-i18n v11 |
| Charts | Unovis |
| Utilities | VueUse |
| Package Manager | pnpm |

## Prerequisites

- Node.js `>=20.19.0` or `>=22.12.0`
- pnpm `>=9`
- [nuobuddy-backend](../nuobuddy-backend) running on `http://localhost:3000`

## Installation

```bash
git clone <repo-url>
cd nuobuddy-frontend
pnpm install
```

## Usage

### Quick Start

```bash
# Start the development server
pnpm dev
```

The app is available at `http://localhost:5173`.
API requests to `/user`, `/admin`, `/settings`, `/health` and `/api` are automatically proxied to `http://localhost:3000` — no CORS configuration required during development.

### Default Routes

| Path | Description |
|---|---|
| `/` | Redirects to `/chat` |
| `/login` | Login page |
| `/register` | Registration page |
| `/chat` | Main chat interface |
| `/admin` | Admin dashboard (admin role required) |
| `/user/profile` | User profile settings |

### Production Build

```bash
pnpm build      # Type-check + Vite production build → dist/
pnpm preview    # Preview the production build locally
```

## Configuration

The dev server proxy is configured in [vite.config.ts](vite.config.ts). To point to a different backend, create a `.env.local` file:

```env
VITE_API_BASE_URL=https://api.example.com
```

## Project Structure

```
src/
├── assets/           # Global CSS (Tailwind CSS entry point)
├── components/
│   ├── ui/           # shadcn-vue base components (Button, Input, Dialog, …)
│   ├── chat/         # Chat bubble, message list, input bar
│   ├── admin/        # User table, pagination, modals
│   └── common/       # Shared components (Navbar, Sidebar, …)
├── views/
│   ├── auth/         # Login, Register, ForgotPassword pages
│   ├── chat/         # ChatView page
│   ├── admin/        # AdminDashboard page
│   └── user/         # UserProfile page
├── router/           # Vue Router — one file per module (auth, chat, admin, user)
├── stores/           # Pinia stores (locale, auth state, …)
├── lib/
│   ├── api.ts        # Fetch-based API client
│   └── utils.ts      # cn() helper and other utilities
├── locales/          # en.ts, zh-CN.ts translation files
├── i18n/             # vue-i18n setup and export
├── layout/           # AdminLayout.vue and other layout wrappers
└── main.ts           # Application entry point
```

## Architecture

```
Browser
  └── Vue Router → Views → Pinia Stores
                              └── lib/api.ts (fetch + JWT header)
                                    └── Vite Dev Proxy → nuobuddy-backend :3000
                                                              └── Dify.ai (SSE)
```

Authentication tokens are stored in Pinia and persisted to `localStorage`. Every API request attaches `Authorization: Bearer <token>` via the API client.

## Development Guide

### Code Quality

```bash
pnpm lint          # Run oxlint + eslint
pnpm lint:fix      # Auto-fix lint issues (eslint only)
pnpm format        # Prettier formatting
pnpm type-check    # TypeScript type checking (vue-tsc)
```

### Git Hooks

Husky runs **lint-staged** on pre-commit (lint + format staged files) and **commitlint** on commit messages.

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user avatar upload
fix: correct token refresh logic
chore: bump dependencies
docs: update README
```

### Adding shadcn-vue Components

```bash
pnpm dlx shadcn-vue@latest add <component-name>
# e.g. pnpm dlx shadcn-vue@latest add table
```

### Adding a New Language

1. Create `src/locales/<locale>.ts` mirroring the keys in `src/locales/en.ts`
2. Register it in `src/i18n/index.ts`
3. Add a toggle option in the locale store

## CI/CD

GitHub Actions runs on every push and PR to `main` / `develop`:

| Job | Command |
|---|---|
| Lint | `pnpm lint` |
| Type Check | `pnpm type-check` |
| Build | `pnpm build` |

See [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Contributing

1. Fork the repository and create a feature branch from `develop`
2. Follow the Conventional Commits specification for commit messages
3. Ensure `pnpm lint`, `pnpm type-check`, and `pnpm build` all pass
4. Open a pull request targeting `develop`

## FAQ

**Q: The app shows proxy/network errors in development.**
A: Make sure the backend is running on port 3000. See the [backend README](../nuobuddy-backend/README.md).

**Q: Chat messages appear but the AI response never streams in.**
A: Check the backend's Dify API credentials (see `DIFY_API_KEY` in the backend `.env`).

**Q: shadcn-vue components appear unstyled.**
A: Verify that `src/assets/index.css` (Tailwind CSS entry) is imported in `src/main.ts`.

**Q: How do I switch the UI language?**
A: The locale switcher is accessible from the settings panel. The selection is persisted via the Pinia locale store.

## License

[MIT](LICENSE)
