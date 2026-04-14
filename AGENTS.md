# Copilot Instructions for NuoBuddy Frontend

## Project Overview

This is an AI Agent Chatbot frontend project with an admin dashboard built using Vue 3, TypeScript, Vite, and TailwindCSS v4.

## Tech Stack

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
- **UI Components**: shadcn-vue (built on reka-ui)
- **State Management**: Pinia
- **Routing**: Vue Router
- **Linting**: ESLint + Oxlint
- **Formatting**: Prettier

## Code Style Guidelines

### TypeScript & Vue

1. **Always use TypeScript** for all new files (.ts, .vue with `<script setup lang="ts">`)
2. **Use Composition API** with `<script setup>` syntax in Vue components
3. **Proper typing**: Define interfaces for props, emits, and complex data structures
4. **Reactive destructuring**: Use Vue's built-in reactivity, avoid losing reactivity

### Code Formatting Rules

1. **Line Length**: Maximum 144 characters per line
2. **Semicolons**: Always use semicolons at the end of statements
3. **Comma Dangle**: Always use trailing commas in multiline objects and arrays
4. **Quotes**: Use single quotes for strings

Example:

```typescript
const config = {
  name: 'example',
  options: ['a', 'b', 'c'],
  nested: {
    key: 'value',
  },
}
```

### Component Structure

1. **Component Organization**:

   ```vue
   <script setup lang="ts">
   // Imports
   // Props & Emits
   // Composables
   // Reactive state
   // Computed
   // Methods
   // Lifecycle hooks
   </script>

   <template>
     <!-- Template content -->
   </template>

   <style scoped>
   /* Component-specific styles */
   </style>
   ```

2. **File Naming**:
   - Components: PascalCase (e.g., `UserProfile.vue`)
   - Composables: camelCase with `use` prefix (e.g., `useAuth.ts`)
   - Utilities: camelCase (e.g., `formatDate.ts`)

### UI Components

1. **Use shadcn-vue components** for consistent UI
2. **Import from `@/components/ui`** for shadcn components
3. **Use `cn()` utility** from `@/lib/utils` for conditional classes:

   ```typescript
   import { cn } from '@/lib/utils'

   const buttonClass = cn('base-class', condition && 'conditional-class')
   ```

### State Management

1. **Use Pinia stores** for global state
2. **Keep component state local** when possible
3. **Store structure**:

   ```typescript
   import { defineStore } from 'pinia'

   export const useMyStore = defineStore('myStore', () => {
     // State
     const state = ref(initialValue)

     // Getters
     const getter = computed(() => state.value)

     // Actions
     function action() {
       // logic
     }

     return { state, getter, action }
   })
   ```

### Import Paths

Use path aliases:

- `@/` for `src/`
- `@/components` for components
- `@/lib` for utilities
- `@/stores` for Pinia stores
- `@/router` for routing

## Git Commit Guidelines

Follow Conventional Commits format:

```
<type>: <subject>

[optional body]

[optional footer]
```

**Allowed types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no code change)
- `refactor`: Code refactoring (no functional changes)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system or dependencies changes
- `ci`: CI/CD configuration changes
- `chore`: Other changes (maintenance)
- `revert`: Revert a previous commit

**Examples**:

```
feat: add user authentication flow
fix: resolve dashboard loading issue
docs: update API integration guide
```

## Pre-commit Checks

Before each commit, the following checks run automatically:

1. **TypeScript type check**: No type errors allowed
2. **Lint check**: Code must pass ESLint and Oxlint
3. **Format check**: Code must be properly formatted
4. **Commit message**: Must follow conventional commit format

## Best Practices

1. **Component Size**: Keep components focused and under 300 lines
2. **Composables**: Extract reusable logic into composables
3. **Error Handling**: Always handle errors gracefully
4. **Accessibility**: Follow ARIA guidelines for UI components
5. **Performance**: Use `v-memo`, `v-once`, and lazy loading when appropriate
6. **Testing**: Write unit tests for critical business logic
7. **Documentation**: Add JSDoc comments for complex functions
8. **No Git Operations**: Only modify code files. Do not run any git commands (e.g., `git add`, `git commit`, `git push`). All git repository operations are left to the user.
9. **Avoid Emoji**: Do not use emoji in code, comments, or responses unless explicitly requested.
10. **i18n Awareness**: Always use the i18n system (e.g., `vue-i18n`) for user-facing strings. Do not hardcode text; use translation keys instead. Ensure new UI strings are added to all locale files.

## Common Patterns

### Toast Notifications (Sonner)

Use `vue-sonner` for all user-facing feedback messages. The `<Toaster />` is mounted globally in `App.vue` — no per-component setup needed.

```typescript
import { toast } from 'vue-sonner'

// Basic
toast('Message sent')

// Typed variants
toast.success('Saved successfully')
toast.error('Something went wrong')
toast.warning('Low disk space')
toast.info('New update available')

// With description
toast.success('Profile updated', {
  description: 'Your changes have been saved.',
})

// Loading → resolve
const toastId = toast.loading('Uploading...')
toast.success('Upload complete', { id: toastId })

// Promise
toast.promise(myAsyncFn(), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Failed to save.',
})
```

**Guidelines**:

1. **Always use `toast` instead of `alert` or custom notification components** for user feedback.
2. **Match the variant to the outcome**: `success` for completed actions, `error` for failures, `warning` for recoverable issues, `info` for neutral updates.
3. **Keep messages short** — one line for the title, optional `description` for detail.
4. **Use `toast.promise`** when wrapping async operations to avoid manual loading/success/error sequencing.
5. **Use `id`** to replace a `loading` toast with a result toast so only one notification is shown at a time.
6. **Do not duplicate feedback** — if an error is already shown inline (e.g., a form field error), do not also fire a `toast.error`.

### API Calls

```typescript
import { ref } from 'vue'

const data = ref(null)
const loading = ref(false)
const error = ref(null)

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    const response = await fetch('/api/data')
    data.value = await response.json()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'An error occurred'
  } finally {
    loading.value = false
  }
}
```

### Form Handling

```typescript
import { reactive } from 'vue'

const form = reactive({
  name: '',
  email: '',
})

const errors = reactive({})

function validateForm() {
  errors.name = form.name ? '' : 'Name is required'
  errors.email = form.email ? '' : 'Email is required'
  return !errors.name && !errors.email
}

async function handleSubmit() {
  if (!validateForm()) return
  // Submit logic
}
```

## Directory Structure

```
src/
├── assets/          # Static assets (images, styles)
├── components/      # Vue components
│   └── ui/         # shadcn-vue components
├── composables/    # Reusable composition functions
├── lib/            # Utility functions
├── router/         # Vue Router configuration
├── stores/         # Pinia stores
├── views/          # Page components
└── main.ts         # Application entry point
```

## Development Workflow

1. Run `pnpm dev` to start development server
2. Write code following guidelines above
3. Test your changes locally
4. Run `pnpm lint` to check for issues
5. Run `pnpm type-check` to verify types
6. Commit with conventional commit message
7. Pre-commit hooks will run automatically

## Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [TailwindCSS v4 Documentation](https://tailwindcss.com/)
- [shadcn-vue Documentation](https://www.shadcn-vue.com/)
- [Radix Vue Documentation](https://www.radix-vue.com/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
