# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language, and Claude AI generates React code that's displayed in real-time using a virtual file system and browser-based execution.

**Tech Stack:**
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Prisma (SQLite) for project persistence
- Vercel AI SDK with Anthropic Claude
- Vitest for testing

## Development Commands

### Setup
```bash
npm run setup              # Install deps, generate Prisma client, run migrations
```

### Development
```bash
npm run dev               # Start dev server with turbopack
npm run dev:daemon        # Start in background, logs to logs.txt
```

### Testing
```bash
npm test                  # Run all tests with Vitest
npm test <file>           # Run specific test file
npm test -- --watch       # Run in watch mode
```

### Database
```bash
npx prisma migrate dev    # Create and apply migration
npm run db:reset          # Reset database (deletes all data)
npx prisma studio         # Open database GUI
```

### Other
```bash
npm run build             # Production build
npm run lint              # Run ESLint
```

## Core Architecture

### Virtual File System (VirtualFileSystem)

The app uses an in-memory virtual file system (`src/lib/file-system.ts`) that mimics a real filesystem without touching disk. This is the foundation of the entire component generation system.

**Key characteristics:**
- Root-based paths (all paths start with `/`)
- Stores files as `Map<string, FileNode>` where FileNode can be file or directory
- Auto-creates parent directories when needed
- Serializes to JSON for database persistence

**Important methods:**
- `createFile(path, content)` - Creates file with auto-parent-directory creation
- `serialize()` - Converts to JSON for DB storage
- `deserializeFromNodes(data)` - Reconstructs from DB data
- `viewFile(path)` - Returns file content with line numbers (used by AI)
- `replaceInFile(path, oldStr, newStr)` - String replacement (used by AI)

### AI Integration Pattern

The AI uses **tool calling** to manipulate the virtual filesystem. Two tools are exposed:

1. **str_replace_editor** (`src/lib/tools/str-replace.ts`)
   - Commands: `view`, `create`, `str_replace`, `insert`
   - Used for viewing and editing file contents
   - Maps directly to VirtualFileSystem methods

2. **file_manager** (`src/lib/tools/file-manager.ts`)
   - Commands: `rename`, `delete`
   - Used for file/folder operations

**API Route** (`src/app/api/chat/route.ts`):
- Receives messages + serialized file system state
- Reconstructs VirtualFileSystem from JSON
- Streams AI responses using `streamText()` with tools
- On completion, serializes updated file system back to DB

### Mock Provider

If `ANTHROPIC_API_KEY` is not set, the system uses a `MockLanguageModel` (`src/lib/provider.ts`) that generates pre-coded React components. This allows the app to work without an API key for demos.

### JSX Transform Pipeline

Generated JSX/TSX code must be transformed to run in the browser (`src/lib/transform/jsx-transformer.ts`):

1. **Transform**: Babel transforms JSX → regular JS
2. **Import Map**: Creates import map mapping local paths to blob URLs
3. **Preview HTML**: Generates standalone HTML with:
   - Import map for module resolution
   - Blob URLs for all transformed code
   - Tailwind CDN for styling
   - React/ReactDOM from esm.sh
   - Error boundary for runtime errors

**Key functions:**
- `transformJSX(code, filename, existingFiles)` - Transforms single file
- `createImportMap(files)` - Creates import map for all files
- `createPreviewHTML(entryPoint, importMap, styles)` - Generates preview HTML

**Import alias**: All local imports use `@/` prefix (e.g., `@/components/Button`), which maps to root `/` in the virtual FS.

### Context Architecture

Two main React contexts manage state:

1. **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`)
   - Wraps VirtualFileSystem with React state
   - Provides CRUD operations that trigger UI updates
   - Handles tool calls from AI responses
   - Auto-selects `App.jsx` or first file when available

2. **ChatContext** (`src/lib/contexts/chat-context.tsx`)
   - Manages chat messages and AI streaming
   - Calls `/api/chat` with messages + file system state
   - Processes tool calls to update file system
   - Handles project persistence

### Database Schema

**Reference `prisma/schema.prisma` for the authoritative database structure.** Always check this file when working with database operations or understanding data models.

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   # bcrypt hashed
  projects  Project[]
}

model Project {
  id        String   @id @default(cuid())
  name      String
  userId    String?  # null for anonymous users
  messages  String   @default("[]")  # JSON array of chat messages
  data      String   @default("{}")  # JSON serialized VirtualFileSystem
  user      User?
}
```

**Anonymous users**: Projects can be created without authentication (`userId` nullable). Anonymous work is tracked client-side via `anon-work-tracker.ts`.

### Authentication

Simple JWT-based auth (`src/lib/auth.ts`):
- Uses `jose` for JWT signing/verification
- Session stored in HTTP-only cookie
- Middleware (`src/middleware.ts`) protects routes
- bcrypt for password hashing

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts          # AI streaming endpoint
│   ├── [projectId]/page.tsx       # Project editor page
│   └── page.tsx                   # Landing page
├── components/
│   ├── chat/                      # Chat UI components
│   ├── editor/                    # Code editor + file tree
│   ├── preview/                   # Preview iframe
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── contexts/                  # React contexts
│   ├── tools/                     # AI tool definitions
│   ├── transform/                 # JSX → JS transformation
│   ├── prompts/                   # AI system prompts
│   ├── file-system.ts             # VirtualFileSystem class
│   ├── auth.ts                    # JWT auth utilities
│   └── prisma.ts                  # Prisma client singleton
└── actions/                       # Server actions for projects
```

## Important Patterns

### File System State Flow
1. User sends chat message
2. ChatContext POSTs to `/api/chat` with current file system state
3. API reconstructs VirtualFileSystem, streams AI response
4. AI uses tools to manipulate file system
5. ChatContext processes tool calls, updates FileSystemContext
6. FileSystemContext triggers re-render of editor/preview
7. On completion, API saves updated state to DB

### Preview Refresh
Preview updates when file system changes:
- PreviewFrame watches file system state
- Re-generates import map and preview HTML
- Updates iframe srcdoc

### Path Resolution
All paths in the virtual FS start with `/`:
- `/App.jsx` (entry point)
- `/components/Button.jsx`
- Imports use `@/` alias: `import Button from '@/components/Button'`
- Import map handles both `/` and `@/` prefixed paths

## Code Style

- **Use comments sparingly**. Only comment complex code. Code should be self-documenting through clear naming and structure.

## Testing

Tests use Vitest + React Testing Library:
- Component tests: `src/components/**/__tests__/*.test.tsx`
- Unit tests: `src/lib/**/__tests__/*.test.ts`
- Tests run in jsdom environment
- Use `@/` path alias (configured via vite-tsconfig-paths)

## Configuration Notes

- **node-compat.cjs**: Required for Node.js compatibility, loaded via NODE_OPTIONS
- **components.json**: shadcn/ui configuration
- **Tailwind v4**: Uses new PostCSS plugin architecture
- **Prisma client**: Generated to `src/generated/prisma` (custom output path)

## Common Gotchas

1. **All paths must start with `/`** in the virtual file system
2. **App.jsx is required** as the entry point for every project
3. **Imports use `@/` prefix** for local files, not relative paths like `./` or `../`
4. **File system is in-memory** - no actual files are created during development
5. **Mock provider exists** - app works without ANTHROPIC_API_KEY
6. **Prisma client path** - Import from `@/lib/prisma`, not `@prisma/client` directly
