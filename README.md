# Mobile Romantic Couple App

This repository now contains:

- `src/`: the mobile-first React frontend
- `backend/`: the Laravel API backend

## What Was Cleaned Up

- Removed unused Figma export scaffolding
- Removed unused generated `ui/` components
- Removed unused frontend styles and config leftovers
- Reorganized the frontend into `pages`, `components`, `context`, and `lib`
- Connected the main frontend screens to the Laravel API

## Frontend

The frontend is mobile-first and expects the Laravel API to run locally at:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Create a `.env` from `.env.example` if you want to override the default.

Install and run:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Backend

Backend setup and deployment instructions are in [backend/README.md](backend/README.md).

Typical local flow:

```bash
cd backend
composer install
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

## Local App Flow

1. Start Laravel on `http://127.0.0.1:8000`
2. Start Vite on `http://127.0.0.1:5173`
3. Log in by selecting one of the two seeded names and using the shared password from `backend/.env`

Default local seeded users:

- `AyaTii`
- `Partner`
- Shared password: `together123`
