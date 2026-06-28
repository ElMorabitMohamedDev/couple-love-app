<?php

namespace Database\Seeders;

use App\Models\AnonymousMessage;
use App\Models\DailyMood;
use App\Models\JournalEntry;
use App\Models\JournalEntryMedia;
use App\Models\Memory;
use App\Models\MessageCapsule;
use App\Models\Promise;
use App\Models\ReconciliationNudge;
use App\Models\Relationship;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ⚠️  TEMPORARY DEBUG — replaced DB::transaction() to expose the real exception
        try {
            $sharedPassword = env('SHARED_PASSWORD', 'together123');

            ReconciliationNudge::query()->delete();
            JournalEntryMedia::query()->delete();
            DailyMood::query()->delete();
            AnonymousMessage::query()->delete();
            Promise::query()->delete();
            MessageCapsule::query()->delete();
            Memory::query()->delete();
            JournalEntry::query()->delete();
            Relationship::query()->delete();
            User::query()->delete();

            $userOne = User::query()->create([
                'name' => env('USER_ONE_NAME', 'AyaTii'),
                'email' => env('USER_ONE_EMAIL', 'ayatii@example.com'),
                'birth_date' => env('USER_ONE_BIRTH_DATE', '2000-05-12'),
                'password' => $sharedPassword,
                'pin' => str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT),
                'notifications_enabled' => true,
            ]);

            $userTwo = User::query()->create([
                'name' => env('USER_TWO_NAME', 'Partner'),
                'email' => env('USER_TWO_EMAIL', 'partner@example.com'),
                'birth_date' => env('USER_TWO_BIRTH_DATE', '1999-05-28'),
                'password' => $sharedPassword,
                'pin' => str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT),
                'notifications_enabled' => true,
            ]);

            Relationship::query()->create([
                'title' => env('RELATIONSHIP_TITLE', 'Our Love Space'),
                'tagline' => env('RELATIONSHIP_TAGLINE', 'A private place for us'),
                'partner_one_name' => $userOne->name,
                'partner_two_name' => $userTwo->name,
                'partner_one_user_id' => $userOne->id,
                'partner_two_user_id' => $userTwo->id,
                'started_at' => env('RELATIONSHIP_STARTED_AT', '2024-01-01'),
                'future_children_slots' => 3,
                'children' => [],
                'home_quote' => 'Every moment with you is a blessing. Our love grows stronger each day.',
            ]);

            DailyMood::query()->create([
                'user_id' => $userTwo->id,
                'mood' => 'happy',
                'noted_on' => now()->toDateString(),
            ]);

            JournalEntry::query()->create([
                'user_id' => $userOne->id,
                'mood' => 'love',
                'body' => 'Just thinking about how lucky I am to have you in my life. Every day with you feels like a dream come true.',
                'created_at' => Carbon::parse('2026-05-01 14:30:00'),
                'updated_at' => Carbon::parse('2026-05-01 14:30:00'),
            ]);

            JournalEntry::query()->create([
                'user_id' => $userTwo->id,
                'mood' => 'happy',
                'body' => "Today was amazing! Can't wait for our next adventure together. You make everything better.",
                'created_at' => Carbon::parse('2026-04-30 20:15:00'),
                'updated_at' => Carbon::parse('2026-04-30 20:15:00'),
            ]);

            JournalEntry::query()->create([
                'user_id' => $userOne->id,
                'mood' => 'miss',
                'body' => "Missing you so much today. Can't wait to see you again soon. Distance means nothing when someone means everything.",
                'created_at' => Carbon::parse('2026-04-28 09:00:00'),
                'updated_at' => Carbon::parse('2026-04-28 09:00:00'),
            ]);

            JournalEntry::query()->create([
                'user_id' => $userTwo->id,
                'mood' => 'grateful',
                'body' => "Grateful for every moment we share. You're my best friend, my love, my everything.",
                'created_at' => Carbon::parse('2026-04-25 22:45:00'),
                'updated_at' => Carbon::parse('2026-04-25 22:45:00'),
            ]);

            for ($i = 0; $i < 6; $i++) {
                Memory::query()->create([
                    'user_id' => $i % 2 === 0 ? $userOne->id : $userTwo->id,
                    'caption' => $i === 0 ? 'Remember when we laughed until we cried? Those moments are still with us.' : 'A sweet memory from our story together.',
                    'description' => $i === 1 ? "You wrote: 'Every day with you feels like a dream come true.' That's still true." : null,
                    'disk' => 'public',
                    'path' => 'seed/memory-placeholder-'.$i.'.jpg',
                    'media_type' => 'image',
                    'original_name' => 'memory-'.$i.'.jpg',
                    'mime_type' => 'image/jpeg',
                    'size' => 0,
                    'likes_count' => 2,
                    'captured_at' => Carbon::parse('2026-04-20')->subDays($i * 5),
                    'created_at' => Carbon::parse('2026-04-20')->subDays($i * 5),
                    'updated_at' => Carbon::parse('2026-04-20')->subDays($i * 5),
                ]);
            }

            AnonymousMessage::query()->create([
                'user_id' => $userOne->id,
                'body' => "Sometimes I feel like we're not on the same page, and I don't know how to say it without starting an argument.",
                'created_at' => Carbon::parse('2026-05-01 18:00:00'),
                'updated_at' => Carbon::parse('2026-05-01 18:00:00'),
            ]);

            AnonymousMessage::query()->create([
                'user_id' => $userTwo->id,
                'body' => 'I appreciate everything you do, but sometimes I need more space to process my feelings.',
                'created_at' => Carbon::parse('2026-04-28 19:00:00'),
                'updated_at' => Carbon::parse('2026-04-28 19:00:00'),
            ]);

            Promise::query()->create([
                'author_name' => 'Both',
                'body' => "We promise to always communicate openly, even when it's hard.",
                'created_at' => Carbon::parse('2026-01-01 09:00:00'),
                'updated_at' => Carbon::parse('2026-01-01 09:00:00'),
            ]);

            Promise::query()->create([
                'user_id' => $userOne->id,
                'author_name' => $userOne->name,
                'body' => 'I promise to support your dreams and be your biggest cheerleader.',
                'created_at' => Carbon::parse('2026-02-14 09:00:00'),
                'updated_at' => Carbon::parse('2026-02-14 09:00:00'),
            ]);

            Promise::query()->create([
                'user_id' => $userTwo->id,
                'author_name' => $userTwo->name,
                'body' => 'I promise to never go to bed angry and always make time for us.',
                'created_at' => Carbon::parse('2026-03-15 09:00:00'),
                'updated_at' => Carbon::parse('2026-03-15 09:00:00'),
            ]);

            MessageCapsule::query()->create([
                'user_id' => $userOne->id,
                'author_name' => $userOne->name,
                'preview_text' => 'A message for our future...',
                'message' => 'A message for our future selves when we open this next year.',
                'unlock_date' => '2027-01-01',
            ]);

            MessageCapsule::query()->create([
                'user_id' => $userTwo->id,
                'author_name' => $userTwo->name,
                'preview_text' => 'Something special for us...',
                'message' => 'A little holiday surprise waiting for us on Christmas.',
                'unlock_date' => '2026-12-25',
            ]);

            MessageCapsule::query()->create([
                'user_id' => $userOne->id,
                'author_name' => $userOne->name,
                'preview_text' => 'Remember this day?',
                'message' => "Remember this day? Six months ago we started this journey. I'm so grateful for every moment with you. Here's to many more!",
                'unlock_date' => '2026-04-01',
                'opened_at' => Carbon::parse('2026-04-01 10:00:00'),
                'created_at' => Carbon::parse('2026-03-01 10:00:00'),
                'updated_at' => Carbon::parse('2026-04-01 10:00:00'),
            ]);

            ReconciliationNudge::query()->create([
                'sender_id' => $userOne->id,
                'recipient_id' => $userTwo->id,
                'message' => "I care about us. Let's talk when you're ready.",
                'sent_at' => now()->subDay(),
            ]);

        } catch (\Throwable $e) {
            dd([
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
                'trace'   => collect($e->getTrace())->take(10)->toArray(),
            ]);
        }
        // ⚠️  END TEMPORARY DEBUG
    }
}