<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use App\Models\JournalEntryMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class JournalEntryController extends Controller
{
    private const EDIT_WINDOW_MINUTES = 30;

    public function index(Request $request): JsonResponse
    {
        $entries = JournalEntry::query()
            ->with(['user', 'media'])
            ->latest()
            ->get()
            ->map(fn (JournalEntry $entry): array => $this->transformEntry($entry, $request))
            ->all();

        return response()->json(['data' => $entries]);
    }

    public function show(Request $request, JournalEntry $journalEntry): JsonResponse
    {
        $journalEntry->load(['user', 'media']);

        return response()->json([
            'data' => $this->transformEntry($journalEntry, $request),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules(true));

        $entry = DB::transaction(function () use ($request, $validated): JournalEntry {
            $entry = JournalEntry::query()->create([
                'user_id' => $request->user()->id,
                'mood' => $validated['mood'],
                'body' => $validated['body'],
            ]);

            foreach ($request->file('media', []) as $file) {
                $this->storeMedia($entry, $file);
            }

            return $entry->load(['user', 'media']);
        });

        return response()->json([
            'message' => 'Journal entry created successfully.',
            'data' => $this->transformEntry($entry, $request),
        ], 201);
    }

    public function update(Request $request, JournalEntry $journalEntry): JsonResponse
    {
        $this->authorizeEntryMutation($request, $journalEntry);

        $validated = $request->validate($this->rules(false));

        $journalEntry->update([
            'mood' => $validated['mood'],
            'body' => $validated['body'],
        ]);

        return response()->json([
            'message' => 'Journal entry updated successfully.',
            'data' => $this->transformEntry($journalEntry->fresh(['user', 'media']), $request),
        ]);
    }

    public function destroy(Request $request, JournalEntry $journalEntry): JsonResponse
    {
        $this->authorizeEntryMutation($request, $journalEntry);

        foreach ($journalEntry->media as $media) {
            $this->deleteStoredMedia($media);
        }

        $journalEntry->delete();

        return response()->json([
            'message' => 'Journal entry deleted successfully.',
        ]);
    }

    private function rules(bool $isCreate): array
    {
        return [
            'mood' => ['required', Rule::in(JournalEntry::MOODS)],
            'body' => ['required', 'string', 'max:5000'],
            'media' => [$isCreate ? 'nullable' : 'prohibited', 'array', 'max:5'],
            'media.*' => [
                'file',
                'mimes:jpg,jpeg,png,webp,gif,heic,heif,mp4,mov,avi,webm',
                'mimetypes:image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/heic-sequence,image/heif-sequence,video/mp4,video/quicktime,video/x-msvideo,video/webm',
                'max:102400',
            ],
        ];
    }

    private function storeMedia(JournalEntry $entry, UploadedFile $file): void
    {
        $disk = config('filesystems.default', 'public');
        $path = $file->store('journal', $disk);
        $mimeType = $file->getMimeType() ?: $file->getClientMimeType();
        $mediaType = str_starts_with((string) $mimeType, 'video/') ? 'video' : 'image';

        JournalEntryMedia::query()->create([
            'journal_entry_id' => $entry->id,
            'disk' => $disk,
            'path' => $path,
            'media_type' => $mediaType,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $mimeType,
            'size' => $file->getSize() ?: 0,
        ]);
    }

    private function authorizeEntryMutation(Request $request, JournalEntry $journalEntry): void
    {
        if ((int) $journalEntry->user_id !== (int) $request->user()->id) {
            throw ValidationException::withMessages([
                'entry' => ['You can only edit or delete your own journal entries.'],
            ]);
        }

        if (! $this->isWithinEditWindow($journalEntry)) {
            throw ValidationException::withMessages([
                'entry' => ['Journal entries can only be edited or deleted within 30 minutes of creation.'],
            ]);
        }
    }

    private function isWithinEditWindow(JournalEntry $entry): bool
    {
        return $entry->created_at->copy()->addMinutes(self::EDIT_WINDOW_MINUTES)->isFuture();
    }

    private function deleteStoredMedia(JournalEntryMedia $media): void
    {
        if ($media->disk === 'public' && str_starts_with($media->path, 'seed/')) {
            return;
        }

        if ($media->path && Storage::disk($media->disk)->exists($media->path)) {
            Storage::disk($media->disk)->delete($media->path);
        }
    }

    private function transformEntry(JournalEntry $entry, Request $request): array
    {
        $editableUntil = $entry->created_at->copy()->addMinutes(self::EDIT_WINDOW_MINUTES);
        $canManage = (int) $entry->user_id === (int) $request->user()->id;
        $withinWindow = $this->isWithinEditWindow($entry);

        return [
            'id' => $entry->id,
            'author' => $entry->user?->name,
            'author_id' => $entry->user_id,
            'mood' => $entry->mood,
            'text' => $entry->body,
            'date' => $entry->created_at->toDateString(),
            'time' => $entry->created_at->format('H:i'),
            'created_at' => $entry->created_at->toISOString(),
            'editable_until' => $editableUntil->toISOString(),
            'can_edit' => $canManage && $withinWindow,
            'can_delete' => $canManage && $withinWindow,
            'media' => $entry->media->map(fn (JournalEntryMedia $media): array => [
                'id' => $media->id,
                'type' => $media->media_type,
                'url' => $media->url,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
            ])->all(),
        ];
    }
}
