# WealthWise

A personal finance web app built with React, TypeScript, and Vite.

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install and run

```sh
npm install
npm run dev
```

The app runs locally with hot reloading. By default, Vite serves it at `http://localhost:8080`.

## Backend integration (optional, for multi-device sync)

By default, WealthWise stores data in browser local storage.

To sync data across devices, set:

```sh
VITE_API_BASE_URL=https://your-api.example.com
```

When this variable is set, the app will attempt to sync auth/profile/expense data with your API while still maintaining local storage as a fallback cache.

### Expected API endpoints

- `POST /auth/signup` → `{ success, user, token? }`
- `POST /auth/login` → `{ success, user, token? }`
- `POST /auth/reset-password` → `{ success, error? }`
- `GET /auth/me` (with `Authorization: Bearer <token>`) → `{ success, user }`
- `PATCH /users/:id` (with optional bearer token) → `{ success }`
- `GET /expenses?userId=<id>` → `{ expenses: Expense[] }`
- `POST /expenses` body `{ userId, expense }`
- `DELETE /expenses/:id?userId=<id>`
- `DELETE /expenses?userId=<id>`

## Available scripts

- `npm run dev` – start the development server
- `npm run build` – create a production build
- `npm run preview` – preview the production build locally
- `npm run lint` – run ESLint
- `npm run test` – run tests once with Vitest
- `npm run test:watch` – run Vitest in watch mode

## Tech stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment

You can deploy the production build to any static hosting provider.

```sh
npm run build
```

Then publish the generated `dist/` directory (for example on Netlify, Vercel, Cloudflare Pages, GitHub Pages, or an S3-backed static host).
