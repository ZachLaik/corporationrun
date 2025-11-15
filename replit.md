# corporation.run - Voice-First Legal OS for Startups

## Overview

corporation.run is a conversational AI-powered legal operating system designed to make forming and organizing a startup intuitive and delightful. The platform guides founders through the legal formation process with a voice-first interface, handling documents from drafting through validation, signing, and activation. It supports multi-jurisdiction incorporation (Delaware C-Corp and France SAS) and provides comprehensive tools for founder management, investor relations, and legal document workflows.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI primitives with shadcn/ui component system
- **Styling**: Tailwind CSS with custom design tokens following the "new-york" style
- **Form Handling**: React Hook Form with Zod validation

**Design System:**
- Typography: Inter font family for UI, SF Mono/JetBrains Mono for legal/code content
- Color system: Custom HSL-based palette with support for light/dark themes
- Component library: Comprehensive shadcn/ui components with custom variants
- Design inspiration: Linear (workflows), Notion (organization), Stripe (trust), Gusto/Carta (legal aesthetics)

**Key Features:**
- Voice-first interface with Web Speech API integration for dictation and text-to-speech
- Multi-step company creation wizard with voice mode option
- Real-time document status tracking with visual badges and progress indicators
- Responsive sidebar navigation with collapsible sections
- Company health meter showing incorporation progress

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for HTTP server
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Serverless PostgreSQL with WebSocket support
- **Session Management**: express-session with PostgreSQL session store
- **Authentication**: Replit Auth integration (OpenID Connect) with demo mode fallback

**API Design:**
- RESTful endpoints organized by resource (companies, founders, investors, documents, tasks, chat)
- Middleware-based authentication using `requireAuth` guard
- Centralized error handling with HTTP status codes
- Request/response logging with timestamp formatting

**Data Model:**
The system uses a relational database schema with the following core entities:
- **Users**: Authentication entities from Replit Auth
- **Companies**: Startup entities with name, description, and jurisdiction
- **Founders**: Linked to companies with roles, equity percentages, and signature status
- **Investors**: Track investment amounts and signature status
- **Documents**: Legal documents with type enums, status workflow, and content storage
- **Document Signatures**: Track signing status per document and signer
- **Tasks**: Categorized action items with assignees and completion status
- **Cap Table Entries**: Equity allocation tracking
- **Chat Messages**: Conversational AI message history

**Status Workflows:**
- Documents: drafting → validating → signing → active
- Signatures: pending → sent → signed
- Founders: invited → pending_signature → active
- Tasks: pending → in_progress → completed

### External Dependencies

**AI Services:**
- **Google Gemini AI**: Primary AI service for document generation, chat responses, and content analysis via Replit AI Integrations
- **OpenAI**: Secondary AI service for embeddings and alternative chat completions via Replit AI Integrations
- Both services use lazy initialization with graceful degradation when unavailable

**Vector Database:**
- **Qdrant**: Vector search for legal document storage and retrieval
- Collection: "legal_documents" with 1536-dimensional OpenAI embeddings
- Multitenancy via payload-based partitioning using company_id
- Supports semantic search for AI-powered document recall

**Email Service:**
- **Resend**: Transactional email for magic-link document signatures
- Sends signature requests with unique tokens for e-signature workflow
- Graceful degradation when API key not configured

**Database:**
- **Neon Serverless PostgreSQL**: Cloud-native database with WebSocket support
- Connection pooling via @neondatabase/serverless
- Session persistence via connect-pg-simple

**Authentication:**
- **Replit Auth**: OAuth/OIDC-based authentication
- Demo mode fallback for development (creates demo@corporation.run user)
- Session-based authentication with secure HTTP-only cookies

**Development Tools:**
- **Drizzle Kit**: Database schema migrations and management
- **Replit Vite Plugins**: Development tooling (runtime error overlay, cartographer, dev banner)

**Key Architectural Decisions:**

1. **Voice-First Interface**: Web Speech API provides native browser support for speech recognition and synthesis, enabling conversational legal document creation without external speech service dependencies.

2. **Lazy Service Initialization**: All external services (Gemini, OpenAI, Qdrant, Resend) initialize lazily and include availability checks, preventing application crashes when API keys are missing during development.

3. **Dual AI Provider Support**: Both Gemini and OpenAI are integrated to provide redundancy and leverage different AI capabilities (Gemini for generation, OpenAI for embeddings).

4. **Session-Based Auth**: Express sessions with PostgreSQL backing provide server-side authentication state, essential for the Replit Auth flow and secure multi-page application state.

5. **Type-Safe Schema**: Shared TypeScript schema between client and server ensures type safety across the full stack, with Drizzle providing database type inference and Zod providing runtime validation.

6. **Monorepo Structure**: Client, server, and shared code in a single repository with path aliases (@/, @shared/, @assets/) for clean imports.

7. **Serverless-Ready**: Neon's WebSocket-based PostgreSQL client enables deployment to serverless environments while maintaining connection pooling.