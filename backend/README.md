# Couple App Backend

Laravel REST API for the mobile-first couple web app in this repository.

## Stack

- Laravel `12.58.0`
- PHP `8.2+`
- MySQL for production
- Sanctum token auth
- Laravel storage for image/video uploads

Laravel 13 is the latest major series as of May 2, 2026, but it now requires PHP 8.3. This backend was built on Laravel 12 because the current environment is PHP 8.2.12. The code is structured so upgrading to Laravel 13 later should be straightforward after a PHP upgrade.

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
2. Configure MySQL credentials in `.env`.
3. Run `composer install`.
4. Run `php artisan key:generate`.
5. Run `php artisan migrate --seed`.
6. Run `php artisan storage:link`.
7. Start the API with `php artisan serve`.

Default seeded users:

- `AyaTii`
- `Partner`
- Shared password: `together123`

Change these in `.env` before running `php artisan migrate --seed` in any real environment.

## Deployment Notes

Render or Railway:

1. Provision a MySQL database.
2. Set `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL`, `FRONTEND_URL`, and the MySQL env vars.
3. Set `FILESYSTEM_DISK=public` unless you are switching to S3-compatible storage.
4. Run `php artisan migrate --force --seed`.
5. Run `php artisan storage:link`.
6. Run `php artisan config:cache`, `php artisan route:cache`, and `php artisan optimize`.

Suggested PHP build/runtime requirements:

- PHP `8.2+` for this Laravel 12 backend
- `pdo_mysql`
- `mbstring`
- `openssl`
- `fileinfo`

## Verification

- `php artisan migrate:fresh --seed`
- `php artisan route:list --path=api`
- `php artisan test`
