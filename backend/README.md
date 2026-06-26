# Couple App Backend

Laravel REST API for the mobile-first couple web app in this repository.

## Stack

- Laravel `12.58.0`
- PHP `8.2+`
- PostgreSQL, MySQL, MariaDB, or SQLite
- Sanctum token auth
- Laravel storage for image/video uploads

This backend stays on Laravel 12 because the current environment runs PHP 8.2.12. It is ready for a free Render deployment with a PostgreSQL database URL and can still be upgraded later once the runtime moves to PHP 8.3+.

## Frontend Features Covered

- Shared-password login for exactly 2 private users
- Home dashboard with relationship summary, partner mood, and positive memory reminders
- Daily mood check-in
- Shared love journal with optional image/video attachments
- Memories gallery with uploaded media
- Anonymous safe-space messages
- Shared promises
- Message capsules with unlock dates
- Relationship details and notification preferences
- Reconciliation nudge action
- Family tree data derived from relationship settings

## Database Schema

- `users`: the only two allowed accounts, plus shared-login password hash and notification preference
- `relationships`: shared app identity, partner names, start date, quote, future family placeholders
- `daily_moods`: one mood per user per day
- `journal_entries`: shared written entries with author and mood
- `journal_entry_media`: media attached to journal entries
- `memories`: gallery items with image/video storage metadata
- `anonymous_messages`: shared anonymous notes
- `promises`: shared commitment list
- `message_capsules`: future-dated messages that unlock later
- `reconciliation_nudges`: sent "let's fix things" requests
- `personal_access_tokens`: Sanctum auth tokens

## API Routes

Public:

- `GET /api/auth/options`
- `POST /api/auth/setup`
- `POST /api/auth/login`

Protected with `auth:sanctum`:

- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/dashboard`
- `GET /api/moods/today`
- `PUT /api/moods/today`
- `GET /api/journal-entries`
- `POST /api/journal-entries`
- `GET /api/journal-entries/{id}`
- `PUT /api/journal-entries/{id}`
- `DELETE /api/journal-entries/{id}`
- `GET /api/memories`
- `POST /api/memories`
- `PUT /api/memories/{id}`
- `DELETE /api/memories/{id}`
- `GET /api/anonymous-messages`
- `POST /api/anonymous-messages`
- `GET /api/promises`
- `POST /api/promises`
- `GET /api/message-capsules`
- `POST /api/message-capsules`
- `GET /api/message-capsules/{id}`
- `GET /api/relationship`
- `PUT /api/relationship`
- `PUT /api/settings/password`
- `PUT /api/settings/preferences`
- `POST /api/reconciliation-nudges`

## Example Requests

Login:

```http
POST /api/auth/login
Content-Type: application/json

{
  "user_id": 1,
  "password": "together123",
  "device_name": "iphone-aya"
}
```

Create a mood check-in:

```http
PUT /api/moods/today
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "mood": "happy"
}
```

Create a journal entry with media:

```http
POST /api/journal-entries
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

mood=love
body=I am grateful for you.
media[]=@photo.jpg
media[]=@clip.mp4
```

Upload a memory:

```http
POST /api/memories
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

caption=Beach sunset
description=One of our favorite evenings.
file=@sunset.jpg
```

Create a capsule:

```http
POST /api/message-capsules
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "message": "Read this on our anniversary.",
  "unlock_date": "2027-01-01"
}
```

Update relationship settings:

```http
PUT /api/relationship
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Our Love Space",
  "tagline": "A private place for us",
  "partner_one_name": "AyaTii",
  "partner_two_name": "Partner",
  "started_at": "2024-01-01",
  "future_children_slots": 3,
  "home_quote": "Every moment with you is a blessing."
}
```

## Local Run

1. Copy `.env.example` to `.env`.
2. Configure your database credentials in `.env`.
3. Run `composer install`.
4. Run `php artisan key:generate`.
5. Run `php artisan migrate --seed`.
6. Run `php artisan storage:link`.
7. Start the API with `php artisan serve`.

## Render Deploy

Use the root `render.yaml` file to deploy the API as a Docker web service.

Required values during setup:

- `APP_KEY`
- `APP_URL`
- `FRONTEND_URL`
- `DB_URL`

The container entrypoint now listens on Render's `PORT` variable and the root health route no longer uses a closure, so route caching is safe in production.

Default seeded users:

- `AyaTii`
- `Partner`
- Shared password: `together123`

Change these in `.env` before running `php artisan migrate --seed` in any real environment.

## Deployment Notes

- The root `render.yaml` is the supported production blueprint.
- Use a PostgreSQL `DB_URL` for the free deployment path.
- Run `php artisan migrate --force` for production data, and keep `--seed` for local demo data only.
- Upload storage still uses the backend filesystem, so add persistent storage or an external bucket if you need media to survive restarts.
