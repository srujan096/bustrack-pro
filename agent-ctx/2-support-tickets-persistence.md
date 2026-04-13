# Task 2 - Support Tickets Database Persistence

## Summary
Successfully implemented database persistence for Customer Support tickets so they survive page refresh.

## Files Modified

### 1. `/home/z/my-project/prisma/schema.prisma`
- **Line 28**: Added `supportTickets SupportTicket[]` relation to the `Profile` model
- **Lines 184-199**: Added new `SupportTicket` model with fields: `id`, `userId`, `title`, `description`, `category`, `status`, `priority`, `createdAt`, `updatedAt`, plus relation to `Profile` and indexes on `userId` and `status`

### 2. `/home/z/my-project/src/app/api/support-tickets/route.ts` (NEW)
- **GET**: Fetches tickets for a user via `userId` query param, with optional `status` filter
- **POST**: Creates a new ticket (requires `userId`, `title`, `description`; optional `category`, `priority`)
- **PATCH**: Updates ticket status (requires `ticketId`, `status`)
- All routes include proper error handling with JSON responses

### 3. `/home/z/my-project/prisma/seed.ts`
- **Lines 764-817**: Added 5 sample support tickets for the first customer user with:
  - Mix of statuses: `open` (3), `in_progress` (1), `resolved` (1)
  - Mix of categories: `complaint` (2), `refund` (1), `general` (1), `suggestion` (1)
  - Mix of priorities: `high` (2), `normal` (2), `low` (1)
  - Realistic Indian transit ticket content

### 4. `/home/z/my-project/src/components/customer/customer-content.tsx`
- **Line 5640**: Changed `SupportPage()` to `SupportPage({ userId }: { userId: string })` to accept userId prop
- **Lines 5642-5651**: Updated `SupportTicket` interface to match DB model (title instead of subject, lowercase status/priority values)
- **Lines 5654**: Updated ticket filter to `'All' | 'Open' | 'In Progress' | 'Resolved'`
- **Lines 5658-5663**: Renamed `subject` to `title` in newTicket state
- **Lines 5665-5666**: Added `loadingTickets` state for loading indicator
- **Lines 5668-5669**: Updated categories to `['general', 'refund', 'complaint', 'suggestion', 'safety']` and priorities to `['low', 'normal', 'high', 'urgent']`
- **Lines 5671-5690**: Added `useEffect` to fetch tickets from API on mount
- **Lines 5703-5761**: Added status/category mapping helpers, filter logic, and color maps for DB values
- **Lines 5763-5804**: Rewrote `handleSubmitTicket` as async function that POSTs to API
- **Lines 5870-5877**: Added loading skeleton while fetching tickets
- **Lines 5881**: Updated filter tabs to `['All', 'Open', 'In Progress', 'Resolved']`
- **Lines 5927-5942**: Updated ticket card to show truncated ID, formatted status/priority/category from DB values, and `title` instead of `subject`
- **Lines 5956-5959**: Removed `response` field (not in DB model)
- **Lines 6073-6078**: Updated dialog form to use `title` field
- **Lines 6093-6094**: Category select shows formatted labels
- **Lines 6109-6110**: Priority select shows formatted labels
- **Line 6714**: Updated `SupportPage` call to pass `userId` prop

## Key Changes
- Tickets now persist in SQLite database via Prisma ORM
- API follows existing project patterns (notifications route style)
- Seeded 5 realistic tickets for the first customer
- Loading states with skeleton UI during data fetch
- Ticket creation shows real DB-generated IDs
- Status badges use lowercase DB values with proper formatting
- Category badges use color-coded display
- All existing UI styling preserved (tabs, cards, status badges)
- Lint passes with 0 errors in modified files (1 pre-existing error in crew-content.tsx unrelated to this change)
