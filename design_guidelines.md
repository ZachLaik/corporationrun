# Design Guidelines: incorporate.run Legal OS

## Design Approach

**Reference-Based Approach** drawing from productivity and legal-tech leaders:
- **Linear**: Clean, efficient task/document workflows with status indicators
- **Notion**: Flexible content organization and navigation patterns
- **Stripe**: Trust-building, minimal design for financial/legal contexts
- **Gusto/Carta**: Legal document and equity management aesthetics

**Core Principle**: Build trust through clarity, consistency, and professional simplicity. Every interaction should reduce anxiety and increase confidence in legal processes.

---

## Typography System

**Font Stack**: Inter (primary), SF Mono (code/legal text)

**Hierarchy**:
- Page Titles: 32px, 600 weight
- Section Headers: 24px, 600 weight  
- Card Titles: 18px, 600 weight
- Body Text: 15px, 400 weight
- Labels/Meta: 13px, 500 weight
- Legal Fine Print: 12px, 400 weight, increased line-height (1.6)

**Special Treatment**: Legal document content uses monospace font for authenticity and scannability.

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Micro spacing (gaps within components): 2, 4
- Component padding: 6, 8
- Section spacing: 12, 16, 20
- Page margins: 16, 20

**Grid Structure**:
- Sidebar Navigation: 280px fixed width
- Main Content: Flexible with max-w-6xl container
- Dashboard Cards: 3-column grid (lg:grid-cols-3, md:grid-cols-2, grid-cols-1)
- Document List: Single column with full-width cards

---

## Component Library

### Navigation & Layout

**Sidebar Navigation**:
- Fixed left sidebar (280px) with company logo at top
- Navigation items with icons (Heroicons) + labels
- Active state: subtle background treatment
- Compact footer with user avatar + dropdown

**Top Bar**:
- Company name + health indicator (circular progress ring)
- Voice input button (prominent, always accessible)
- Search/filter controls
- User avatar + quick actions

### Document Components

**Document Card** (Primary Pattern):
- Full-width card with 8px border-radius
- Header: Icon + Title + Status Badge
- Body: Key metadata (signers, dates, progress)
- Footer: Action buttons (right-aligned)
- Status badge variants: Draft (neutral), Pending (warning), Active (success), Expired (muted)

**Status Indicators**:
- Color-coded dots for quick scanning
- Progress bars for multi-step workflows (Draft → Validate → Sign → Activate)
- Signature status: Empty circle → Half-filled → Checkmark

**Founder/Investor Cards**:
- Avatar (left) + Name + Role + Status badge
- Secondary info: Email, equity percentage
- Action buttons: "Send Reminder", "View Details"

### Forms & Input

**Form Layout**:
- Single-column for simplicity (max-w-2xl)
- Generous vertical spacing between fields (12)
- Floating labels or top-aligned labels
- Inline validation with icons
- Help text below inputs (13px, muted)

**Voice Input**:
- Large, circular button with microphone icon
- Pulsing animation during listening
- Transcript display below button
- Quick suggestions as chips

### Dashboard Components

**Company Health Meter**:
- Large circular progress indicator (200px diameter)
- Percentage in center
- Breakdown list below (missing items, pending tasks)

**Task Cards**:
- Checkbox + Task description + Assignee avatar
- Due date badge (if applicable)
- Grouped by category (Documents, KYC, Jurisdiction)

**Timeline/Activity Feed**:
- Vertical timeline with connecting lines
- Event cards: Icon + Description + Timestamp
- Grouped by date

---

## Specialized Layouts

### Contract Library View
- Two-level hierarchy: Categories (tabs) → Documents (cards)
- Search bar with filters (document type, status)
- Card grid (2-column on desktop, single on mobile)
- Empty states with helpful CTAs ("Create your first NDA")

### Document Editor View
- Split view: Editor (60%) + Context sidebar (40%)
- Editor: Clean, focused textarea with formatting toolbar
- Sidebar: AI suggestions, validation checklist, signer list
- Sticky footer with action buttons

### Signing Flow
- Centered, single-column layout (max-w-xl)
- Document preview at top
- Signature pad/upload below
- Progress indicator showing steps
- Clear "Sign & Submit" button

### Chat Interface
- Anchored bottom-right (mobile: full-screen modal)
- Message bubbles with timestamps
- User messages: right-aligned
- AI responses: left-aligned with avatar
- Input area with voice toggle

---

## Responsive Strategy

**Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)

**Mobile Adaptations**:
- Sidebar collapses to hamburger menu
- Dashboard grid: 1 column
- Document cards stack vertically
- Voice input: fixed bottom button (FAB style)
- Chat: full-screen takeover

**Tablet**: 2-column grids where applicable, maintain sidebar visibility

---

## Interaction Patterns

**Minimal Animations**:
- Status badge transitions (300ms ease)
- Card hover: subtle lift (2px translate-y)
- Button states: simple scale (0.98 on press)
- Loading states: subtle pulse on skeletons

**Feedback**:
- Toasts for confirmations (top-right)
- Inline validation (real-time)
- Skeleton screens for loading states
- Empty states with illustrations + CTAs

---

## Trust & Security Signals

- Lock icons for secure documents
- Timestamp displays for all legal actions
- Audit trail visibility in document details
- "Encrypted" badges where applicable
- Professional, consistent formatting throughout

---

## Critical Patterns

**Document State Visualization**: Use consistent 4-step progress bar across all document types
**Signature Tracking**: Real-time updates with email status (Sent → Opened → Signed)
**Jurisdiction Selector**: Clear comparison table with pros/cons, visual flags
**Validation Checklist**: Icon-based list with checkmarks/warnings, expandable details
**Company Memory**: Search results showing document excerpts with highlighting

This design system prioritizes clarity, trust, and efficiency—making complex legal processes feel manageable and transparent.