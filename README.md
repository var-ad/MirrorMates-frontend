# MirrorMates Frontend

[![Version](https://img.shields.io/badge/version-1.0.0-orange)](./package.json)
[![Next.js](https://img.shields.io/badge/next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/react-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

MirrorMates Frontend is the web app for running and participating in Johari Window reflection sessions. It gives owners a polished dashboard to create sessions, manage invite settings, review results, and generate reports, while also providing a lightweight public experience for invitees submitting feedback.

This repository is frontend-only. The separate backend repository lives at <https://github.com/var-ad/mirrormates-backend>.

## What the project does

MirrorMates helps someone compare how they see themselves with how other people see them.

This frontend covers the complete client-side flow:

1. Sign up, verify email, sign in, or continue with Google.
2. Create a Johari session and choose initial self-descriptive adjectives.
3. Share an invite link, QR code, or WhatsApp message.
4. Let invitees submit named or anonymous adjective feedback.
5. View the Open, Blind, Hidden, and Unknown windows in a visual grid.
6. Generate and read reflection reports based on the current session data.
7. Open secure emailed report links through a public report-generation page.

## Why the project is useful

- Gives Johari Window exercises a modern, shareable web experience instead of a manual worksheet flow.
- Supports both account owners and one-time invite participants in the same product.
- Offers password auth, OTP verification, password reset, and Google sign-in from the UI.
- Keeps owners productive with a dashboard for session creation, session browsing, and account management.
- Makes invites easy to send through direct links, QR codes, and WhatsApp sharing.
- Visualizes results in a dedicated four-window grid rather than leaving users with raw adjective lists.
- Renders AI-generated report text in a cleaner rich-text format for reflection and follow-up.
- Includes a responsive visual design with custom typography, gradients, glass/paper surfaces, and toast feedback.

## Tech stack

- Framework: Next.js 16 App Router
- UI: React 19, TypeScript, Tailwind CSS 4, custom CSS variables
- Auth state: client-side session storage with token refresh support
- Integration: MirrorMates backend API over REST
- Third-party auth: Google Identity Services

## Project structure

```text
.
|-- app/
|   |-- api/health/route.ts
|   |-- dashboard/
|   |-- forgot-password/
|   |-- invite/[token]/
|   |-- report/generate/
|   |-- reset-password/
|   |-- session/[id]/
|   `-- verify/
|-- components/
|   |-- auth/
|   |-- johari/
|   |-- providers/
|   `-- ui/
|-- lib/
|   |-- api.ts
|   |-- config.ts
|   |-- types.ts
|   `-- utils.ts
|-- public/
|-- next.config.ts
`-- package.json
```

Helpful entry points:

- [`app/page.tsx`](app/page.tsx): landing page with sign in, sign up, and Google sign-in
- [`app/dashboard/page.tsx`](app/dashboard/page.tsx): owner dashboard and session creation flow
- [`app/session/[id]/page.tsx`](app/session/[id]/page.tsx): session management, sharing, self-selections, and live results
- [`app/session/[id]/report/page.tsx`](app/session/[id]/report/page.tsx): report workspace for authenticated owners
- [`app/invite/[token]/page.tsx`](app/invite/[token]/page.tsx): public invite response page
- [`app/report/generate/page.tsx`](app/report/generate/page.tsx): public one-time report link page
- [`components/providers/auth-provider.tsx`](components/providers/auth-provider.tsx): client-side auth/session lifecycle
- [`lib/api.ts`](lib/api.ts): typed API calls to the backend

## Getting started

### Prerequisites

Before running the frontend locally, make sure you have:

- Node.js 20 or newer
- npm
- A running MirrorMates backend API

Optional but supported:

- A Google OAuth client ID for Google sign-in

### Installation

```bash
npm install
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Then fill in your local `.env` using [`.env.example`](.env.example) as the template.

### Environment variables

| Variable                       | Required                | Purpose                                                    |
| ------------------------------ | ----------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`     | Yes                     | Base URL for the MirrorMates backend API                   |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Only for Google sign-in | Enables the Google Identity Services button and token flow |

Local example:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

Important integration notes:

- `NEXT_PUBLIC_API_BASE_URL` should point to the backend service, not this frontend app.
- If you host the frontend, the backend must allow the deployed frontend origin in its CORS configuration.
- Google sign-in gracefully degrades in the UI when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is empty.

### Run the app

For development:

```bash
npm run dev
```

For a production build:

```bash
npm run build
npm start
```

By default, the app runs on `http://localhost:3000`.

The frontend also exposes a simple local health endpoint:

```text
GET /api/health
```

### Available scripts

| Script          | What it does                          |
| --------------- | ------------------------------------- |
| `npm run dev`   | Starts the Next.js development server |
| `npm run build` | Creates the production build          |
| `npm start`     | Starts the production server          |
| `npm run lint`  | Runs ESLint                           |

## Usage

### Main user flows

#### 1. Landing and authentication

The home page combines product introduction and authentication entry points:

- create account with email and password
- verify signup using a 6-digit OTP
- sign in with password
- sign in with Google
- request and complete a password reset

Auth state is stored client-side and refreshed automatically when possible through the backend refresh-token flow.

#### 2. Owner dashboard

After sign-in, owners can:

- create a new Johari session
- choose starting adjectives
- set invite expiry
- choose named or anonymous response mode
- review previously created sessions

#### 3. Session management

Inside an owner session page, the UI lets users:

- copy the invite link
- share through WhatsApp
- display a QR code returned by the backend
- update invite expiry
- edit self-selections
- view live Johari results
- jump into report generation

#### 4. Public invite participation

The public invite page:

- loads invite metadata from the backend
- supports named or anonymous participation
- lets invitees choose adjectives
- stores a local invite-specific peer ID to help keep submissions consistent on repeat visits

#### 5. Report reading

There are two report experiences:

- authenticated owner report workspace at [`app/session/[id]/report/page.tsx`](app/session/[id]/report/page.tsx)
- public one-time report link page at [`app/report/generate/page.tsx`](app/report/generate/page.tsx)

The frontend also formats generated report text into headings, paragraphs, and lists for easier reading.

### Example setup flow

Start the app locally against a local backend:

```bash
npm install
cp .env.example .env
npm run dev
```

With this `.env`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

Then open:

```text
http://localhost:3000
```

### Frontend routes at a glance

| Route                        | Purpose                                             |
| ---------------------------- | --------------------------------------------------- |
| `/`                          | Landing page with login, signup, and Google sign-in |
| `/verify`                    | OTP verification after signup                       |
| `/forgot-password`           | Request password reset code                         |
| `/reset-password`            | Reset password with OTP                             |
| `/dashboard`                 | Session dashboard for authenticated owners          |
| `/dashboard/account`         | Change password for password-based accounts         |
| `/session/[id]`              | Owner session workspace                             |
| `/session/[id]/report`       | Authenticated report workspace                      |
| `/invite/[token]`            | Public invite submission page                       |
| `/report/generate?token=...` | Public one-time report-generation page              |
| `/api/health`                | Frontend health check                               |

## UI and architecture notes

- The app uses the Next.js App Router with client-heavy interactive pages where session state, toasts, and user actions matter most.
- Shared auth logic lives in [`components/providers/auth-provider.tsx`](components/providers/auth-provider.tsx), including session hydration, token refresh, and logout handling.
- Typed backend access lives in [`lib/api.ts`](lib/api.ts), which keeps frontend pages from duplicating request logic.
- The Johari visualization is built in [`components/johari/results-grid.tsx`](components/johari/results-grid.tsx).
- Generated report text is normalized and rendered through [`components/johari/report-rich-text.tsx`](components/johari/report-rich-text.tsx).
- Security-focused response headers are configured in [`next.config.ts`](next.config.ts).

## Where users can get help

- Open an issue in this repository: <https://github.com/var-ad/MirrorMates-frontend/issues>
- Review [`.env.example`](.env.example), [`lib/config.ts`](lib/config.ts), and [`lib/api.ts`](lib/api.ts) for setup and integration details
- Start with [`app/page.tsx`](app/page.tsx) and [`app/dashboard/page.tsx`](app/dashboard/page.tsx) if you are tracing the primary UX
- Reach out through <https://varad.fyi> for maintainer context and project links

## Who maintains and contributes

MirrorMates Frontend is maintained by [var-ad](https://github.com/var-ad).

- GitHub: <https://github.com/var-ad>
- Website: <https://varad.fyi>

Contributions are welcome through issues and pull requests. If you contribute, keep frontend behavior, routes, and environment variable changes reflected in this README and keep backend-specific implementation details in the backend repository.
