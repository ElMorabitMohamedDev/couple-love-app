<?php

namespace Tests\Feature;

use App\Models\DailyMood;
use App\Models\Memory;
use App\Models\MessageCapsule;
use App\Models\Relationship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupportApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_upload_memory(): void
    {
        Storage::fake('public');
        $this->seed();

        Sanctum::actingAs(User::query()->firstOrFail());

        $this->post('/api/memories', [
            'caption' => 'Beach day',
            'description' => 'One of our favorite afternoons.',
            'file' => UploadedFile::fake()->create('beach.heic', 256, 'image/heic'),
        ])->assertCreated()->assertJsonPath('data.caption', 'Beach day');
    }

    public function test_authenticated_user_can_update_and_delete_their_memory(): void
    {
        Storage::fake('public');
        $this->seed();

        $user = User::query()->firstOrFail();
        Sanctum::actingAs($user);

        $memory = Memory::query()->create([
            'user_id' => $user->id,
            'caption' => 'Before',
            'description' => 'Old note',
            'disk' => 'public',
            'path' => UploadedFile::fake()->create('memory.jpg', 128, 'image/jpeg')->store('memories', 'public'),
            'media_type' => 'image',
            'original_name' => 'memory.jpg',
            'mime_type' => 'image/jpeg',
            'size' => 128,
            'likes_count' => 0,
            'captured_at' => now(),
        ]);

        $this->putJson('/api/memories/'.$memory->id, [
            'caption' => 'After',
            'description' => 'Updated note',
        ])->assertOk()->assertJsonPath('data.caption', 'After');

        $this->deleteJson('/api/memories/'.$memory->id)
            ->assertOk();

        $this->assertDatabaseMissing('memories', [
            'id' => $memory->id,
        ]);
    }

    public function test_daily_mood_is_updated_instead_of_creating_duplicate_record(): void
    {
        $this->seed();

        $user = User::query()->firstOrFail();
        Sanctum::actingAs($user);

        DailyMood::query()->updateOrCreate([
            'user_id' => $user->id,
            'noted_on' => now()->toDateString(),
        ], [
            'mood' => 'happy',
        ]);

        $this->putJson('/api/moods/today', [
            'mood' => 'neutral',
        ])->assertOk()->assertJsonPath('data.my_mood', 'neutral');

        $this->assertDatabaseCount('daily_moods', 2);
        $this->assertSame('neutral', DailyMood::query()
            ->where('user_id', $user->id)
            ->whereDate('noted_on', now()->toDateString())
            ->value('mood'));
    }

    public function test_locked_capsule_returns_423_until_unlock_date(): void
    {
        $this->seed();

        Sanctum::actingAs(User::query()->firstOrFail());

        $lockedCapsule = MessageCapsule::query()
            ->whereDate('unlock_date', '>', now()->toDateString())
            ->firstOrFail();

        $this->getJson('/api/message-capsules/'.$lockedCapsule->id)
            ->assertStatus(423)
            ->assertJsonPath('data.is_locked', true);
    }

    public function test_relationship_returns_partner_birth_dates_for_family_tree(): void
    {
        $this->seed();
        Sanctum::actingAs(User::query()->firstOrFail());

        $this->getJson('/api/relationship')
            ->assertOk()
            ->assertJsonPath('data.family_tree.partner_one.birth_date', '2000-05-12')
            ->assertJsonPath('data.family_tree.partner_two.birth_date', '1999-05-28');
    }

    public function test_upcoming_birthdays_returns_birthdays_within_lookahead_window(): void
    {
        Carbon::setTestNow('2026-05-03');
        $this->seed();
        Sanctum::actingAs(User::query()->firstOrFail());

        $this->getJson('/api/birthdays/upcoming')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'AyaTii')
            ->assertJsonPath('data.0.days_left', 9);

        Carbon::setTestNow();
    }

    public function test_partner_birth_date_can_be_updated_from_family_tree(): void
    {
        Storage::fake('public');
        $this->seed();
        $user = User::query()->firstOrFail();
        Sanctum::actingAs($user);

        $response = $this->post('/api/family-tree/partners/'.$user->id, [
            '_method' => 'PUT',
            'birth_date' => '2001-06-15',
            'avatar' => UploadedFile::fake()->create('avatar.jpg', 64, 'image/jpeg'),
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.family_tree.partner_one.birth_date', '2001-06-15');

        $user->refresh();

        $this->assertSame('2001-06-15', optional($user->birth_date)->toDateString());
        $this->assertNotNull($user->avatar_path);
    }
}
