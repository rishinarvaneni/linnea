# Agent Platform (Phase 1 & 2)

This is the foundational setup for the Razorpay Test Mode AI Agent Platform. It implements a clean Next.js architecture with role-based authentication using custom secure JWT session cookies and Prisma with SQLite.

## Tech Stack
- Next.js (App Router, Server Actions)
- TypeScript
- Tailwind CSS
- Prisma (SQLite for local dev)
- `jose` (JWT signing/verification)
- `bcryptjs` (Password hashing)

## Project Structure
- `src/app/page.tsx`: Role selection landing page
- `src/app/login/page.tsx`: Shared login page adapting to role
- `src/app/register/page.tsx`: Shared registration page adapting to role
- `src/app/dashboard/page.tsx`: Protected Merchant Workspace
- `src/app/shop/page.tsx`: Protected Customer Store
- `src/app/actions/auth.ts`: Server Actions for register/login/logout
- `src/lib/session.ts`: JWT session utilities using `jose`
- `src/lib/db.ts`: Prisma client initialization
- `src/middleware.ts`: JWT verification and role-based redirect protection
- `prisma/schema.prisma`: Database schema definition
- `prisma/seed.ts`: Seed data

## Environment Variables
Copy `.env.example` to `.env` if not already present.
```
DATABASE_URL="file:./dev.db"
GOOGLE_API_KEY="your-google-ai-studio-api-key"
GEMINI_MODEL="gemini-3.5-flash"
```

> **Note:** The `GOOGLE_API_KEY` must remain a server-side secret and is used by the LangChain + Google Gemini AI implementation.
> The `GEMINI_MODEL` can be configured here to control which model is utilized (e.g. `gemini-3.5-flash` or `gemini-1.5-pro`).

## AI Agent Architecture (LangChain + Gemini)
The platform uses an intelligent agent architecture utilizing LangChain's Tool-Calling Agent and Google Gemini.
- **Merchant Agent (`src/lib/ai/agent.ts`)**: Acts as a revenue analyst, examining failed payments, identifying opportunities, and creating payment links. 
- **Customer Agent (`src/lib/ai/customer-agent.ts`)**: Acts as a smart shopping assistant, searching the merchant catalog, adding items to the cart, and guiding the customer to Razorpay checkout.
- **AgentRun & AgentAction**: Every time a user messages an AI agent, an `AgentRun` is recorded in the database. When the LLM invokes tools (such as searching products or analyzing revenue), each tool invocation is recorded as an `AgentAction` tied to that run. This enables deep observability.
- **Memory**: The conversational memory is driven by the persistent `Message` database model rather than an external memory store.

## Database Setup & Commands

Run database migrations:
```bash
npx prisma db push
```

Run seed script:
```bash
npx tsx prisma/seed.ts
```

Start the development server:
```bash
npm run dev
```

## Demo Login Credentials

**Merchant:**
- Email: `merchant@example.com`
- Password: `DemoMerchant123!`

**Customer:**
- Email: `customer@example.com`
- Password: `DemoCustomer123!`

## Current Implementation (Phase 1 & 2)
- Initializing the Next.js project.
- Setting up the database schema and seed data.
- Implementing robust custom JWT-based authentication using server actions.
- Role-based route protection with Next.js Middleware.

## Planned Phases
- **Phase 3:** Agent Studio UI, AI Agents, AI Chat, Razorpay integrations, products, carts, and revenue recovery features.
# linnea
