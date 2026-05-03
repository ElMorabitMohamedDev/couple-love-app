<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Memory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MemoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $memories = Memory::query()
            ->with('user')
            ->latest('captured_at')
            ->latest()
            ->get()
            ->map(fn (Memory $memory): array => $this->transformMemory($memory, $request))
            ->all();

        return response()->json([
            'data' => [
                'count' => count($memories),
                'items' => $memories,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules(true));

        /** @var UploadedFile $file */
        $file = $request->file('file');
        $memory = Memory::query()->create([
            'user_id' => $request->user()->id,
            'caption' => $validated['caption'] ?? null,
            'description' => $validated['description'] ?? null,
            ...$this->storeFile($file, 'memories'),
            'likes_count' => $validated['likes_count'] ?? 0,
            'captured_at' => $validated['captured_at'] ?? now(),
        ])->load('user');

        return response()->json([
            'message' => 'Memory uploaded successfully.',
            'data' => $this->transformMemory($memory, $request),
        ], 201);
    }

    public function update(Request $request, Memory $memory): JsonResponse
    {
        $this->authorizeMemoryMutation($request, $memory);

        $validated = $request->validate($this->rules(false));
        $memory->fill([
            'caption' => $validated['caption'] ?? $memory->caption,
            'description' => $validated['description'] ?? $memory->description,
            'likes_count' => $validated['likes_count'] ?? $memory->likes_count,
            'captured_at' => $validated['captured_at'] ?? $memory->captured_at,
        ]);

        if ($request->hasFile('file')) {
            /** @var UploadedFile $file */
            $file = $request->file('file');
            $this->deleteStoredFile($memory);
            $memory->fill($this->storeFile($file, 'memories'));
        }

        $memory->save();
        $memory->load('user');

        return response()->json([
            'message' => 'Memory updated successfully.',
            'data' => $this->transformMemory($memory, $request),
        ]);
    }

    public function destroy(Request $request, Memory $memory): JsonResponse
    {
        $this->authorizeMemoryMutation($request, $memory);

        $this->deleteStoredFile($memory);
        $memory->delete();

        return response()->json([
            'message' => 'Memory deleted successfully.',
        ]);
    }

    private function rules(bool $isCreate): array
    {
        $fileRule = $isCreate ? ['required'] : ['nullable'];

        return [
            'file' => [
                ...$fileRule,
                'file',
                'mimes:jpg,jpeg,png,webp,gif,heic,heif,mp4,mov,avi,webm',
                'mimetypes:image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/heic-sequence,image/heif-sequence,video/mp4,video/quicktime,video/x-msvideo,video/webm',
                'max:102400',
            ],
            'caption' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'likes_count' => ['nullable', 'integer', 'min:0', 'max:2'],
            'captured_at' => ['nullable', 'date'],
        ];
    }

    private function storeFile(UploadedFile $file, string $directory): array
    {
        $disk = config('filesystems.default', 'public');
        $path = $file->store($directory, $disk);
        $mimeType = $file->getMimeType() ?: $file->getClientMimeType();
        $mediaType = str_starts_with((string) $mimeType, 'video/') ? 'video' : 'image';

        return [
            'disk' => $disk,
            'path' => $path,
            'media_type' => $mediaType,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $mimeType,
            'size' => $file->getSize() ?: 0,
        ];
    }

    private function deleteStoredFile(Memory $memory): void
    {
        if ($memory->disk === 'public' && str_starts_with($memory->path, 'seed/')) {
            return;
        }

        if ($memory->path && Storage::disk($memory->disk)->exists($memory->path)) {
            Storage::disk($memory->disk)->delete($memory->path);
        }
    }

    private function authorizeMemoryMutation(Request $request, Memory $memory): void
    {
        if ((int) $memory->user_id !== (int) $request->user()->id) {
            throw ValidationException::withMessages([
                'memory' => ['You can only edit or delete memories that you added yourself.'],
            ]);
        }
    }

    private function transformMemory(Memory $memory, Request $request): array
    {
        return [
            'id' => $memory->id,
            'author' => $memory->user?->name,
            'author_id' => $memory->user_id,
            'type' => $memory->media_type,
            'caption' => $memory->caption,
            'description' => $memory->description,
            'date' => optional($memory->captured_at ?? $memory->created_at)->toDateString(),
            'likes' => $memory->likes_count,
            'url' => $memory->url,
            'mime_type' => $memory->mime_type,
            'size' => $memory->size,
            'can_manage' => (int) $memory->user_id === (int) $request->user()->id,
            'created_at' => $memory->created_at->toISOString(),
            'updated_at' => $memory->updated_at->toISOString(),
        ];
    }
}
