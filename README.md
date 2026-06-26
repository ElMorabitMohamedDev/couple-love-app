# Mobile Romantic Couple App

Project split into:

- `frontend/`: React + Vite frontend
- `backend/`: Laravel API

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Motion, Lucide
- Backend: Laravel 12, PHP 8.2, Sanctum, database-backed API
- Supported databases: PostgreSQL, MySQL, MariaDB, SQLite

## Local Run

Frontend:

```bash
cd frontend
npm install
npm run dev
```

For local development, start the backend too:

```bash
cd backend
php artisan serve
```

The frontend will call `/api`, and Vite will proxy that to `http://127.0.0.1:8000`.

Backend:

```bash
cd backend
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

## Free Deployment Recommendation

- Frontend: Netlify
- Backend: Render Docker web service
- Database: a free PostgreSQL provider such as Neon or Supabase

This split keeps the frontend static and cheap to host, while the Laravel API runs in a normal PHP container.

## Required Environment Variables

Frontend:

```env
VITE_API_URL=https://your-backend.example.com/api
```

Backend:

```env
APP_URL=https://your-backend.example.com
FRONTEND_URL=https://your-frontend.example.com
DB_URL=postgresql://...
APP_KEY=base64:...
```

## Deploy Steps

1. Create a free PostgreSQL database.
2. Deploy the backend using `render.yaml`.
3. Set `APP_KEY`, `APP_URL`, `FRONTEND_URL`, and `DB_URL` in Render.
4. Deploy the frontend on Netlify with `netlify.toml`.
5. Set `VITE_API_URL` in Netlify to the Render backend URL.
6. Open the backend URL and confirm the health JSON response.

## Notes

- The backend exposes a cacheable health route at `/`.
- SPA navigation is handled by the Netlify redirect rule in `netlify.toml`.
- Upload storage still depends on the backend host's filesystem. For long-term media persistence on a free tier, use a persistent disk or external object storage.
