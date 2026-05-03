<?php

namespace Tests\Feature;

use App\Models\JournalEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class JournalApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_journal_entry_with_media(): void
    {
        Storage::fake('public');
        $this->seed();

        $user = User::query()->firstOrFail();
        Sanctum::actingAs($user);

        $response = $this->post('/api/journal-entries', [
            'mood' => 'love',
            'body' => 'A new note from today.',
            'media' => [
                UploadedFile::fake()->create('memory.jpg', 128, 'image/jpeg'),
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.author', $user->name)
            ->assertJsonPath('data.mood', 'love');

        $this->assertDatabaseHas('journal_entries', [
            'body' => 'A new note from today.',
            'mood' => 'love',
            'user_id' => $user->id,
        ]);

        $this->assertDatabaseCount('journal_entry_media', 1);
    }

    public function test_author_can_update_journal_entry_within_thirty_minutes(): void
    {
        $this->seed();
        $entry = JournalEntry::query()->firstOrFail();

        $entry->forceFill([
            'user_id' => User::query()->firstOrFail()->id,
            'created_at' => Carbon::now()->subMinutes(10),
            'updated_at' => Carbon::now()->subMinutes(10),
        ])->save();

        Sanctum::actingAs($entry->user);

        $this->putJson('/api/journal-entries/'.$entry->id, [
            'mood' => 'happy',
            'body' => 'Updated within the allowed window.',
        ])->assertOk()->assertJsonPath('data.text', 'Updated within the allowed window.');
    }

    public function test_author_cannot_update_journal_entry_after_thirty_minutes(): void
    {
        $this->seed();
        $entry = JournalEntry::query()->firstOrFail();

        $entry->forceFill([
            'user_id' => User::query()->firstOrFail()->id,
            'created_at' => Carbon::now()->subMinutes(31),
            'updated_at' => Carbon::now()->subMinutes(31),
        ])->save();

        Sanctum::actingAs($entry->user);

        $this->putJson('/api/journal-entries/'.$entry->id, [
            'mood' => 'happy',
            'body' => 'This should be rejected.',
        ])->assertStatus(422);
    }
}
