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
VITE_DEBUG_API=false
```

Backend:

```env
APP_NAME="Our Love Space API"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-backend.example.com
FRONTEND_URL=https://your-frontend.example.com
DB_CONNECTION=pgsql
DB_URL=postgresql://...
APP_KEY=base64:...
FILESYSTEM_DISK=public
CACHE_STORE=database
SESSION_DRIVER=database
```

## Deploy Steps

Render:

1. Create a free PostgreSQL database.
2. Deploy the backend using `render.yaml`.
3. Set `APP_KEY`, `APP_URL`, `FRONTEND_URL`, `DB_CONNECTION`, and `DB_URL` in Render.
4. Keep `FILESYSTEM_DISK=public`, `CACHE_STORE=database`, and `SESSION_DRIVER=database`.
5. Render runs the Docker container, which now creates `storage:link` at startup.
6. Use `php artisan migrate --force` for production deploys.

Netlify:

1. Deploy the frontend with `netlify.toml`.
2. Set `VITE_API_URL` to the Render backend URL, ending in `/api`.
3. Keep `VITE_DEBUG_API=false` for production.

Migration commands:

```bash
cd backend
php artisan migrate
php artisan migrate --force
```

Deployment commands:

```bash
cd backend
php artisan migrate --force

cd frontend
npm run build
```

7. Open the backend URL and confirm the health JSON response.

## Notes

- The backend exposes a cacheable health route at `/`.
- SPA navigation is handled by the Netlify redirect rule in `netlify.toml`.
- Upload storage still depends on the backend host's filesystem. On Render Free, media is not durable across instance rebuilds or restarts unless you add persistent storage or external object storage.
