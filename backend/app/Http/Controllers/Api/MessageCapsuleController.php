<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MessageCapsule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class MessageCapsuleController extends Controller
{
    public function index(): JsonResponse
    {
        $capsules = MessageCapsule::query()
            ->latest('unlock_date')
            ->latest()
            ->get()
            ->map(fn (MessageCapsule $capsule): array => $this->transformCapsule($capsule))
            ->all();

        return response()->json(['data' => $capsules]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
            'unlock_date' => ['required', 'date', 'after_or_equal:today'],
        ]);

        $capsule = MessageCapsule::query()->create([
            'user_id' => $request->user()->id,
            'author_name' => $request->user()->name,
            'preview_text' => Str::limit(trim($validated['message']), 28, '...'),
            'message' => $validated['message'],
            'unlock_date' => $validated['unlock_date'],
        ]);

        return response()->json([
            'message' => 'Capsule locked successfully.',
            'data' => $this->transformCapsule($capsule),
        ], 201);
    }

    public function show(MessageCapsule $messageCapsule): JsonResponse
    {
        if (! $messageCapsule->isUnlocked()) {
            return response()->json([
                'message' => 'This capsule is still locked.',
                'data' => $this->transformCapsule($messageCapsule),
            ], 423);
        }

        if (! $messageCapsule->opened_at) {
            $messageCapsule->forceFill(['opened_at' => now()])->save();
        }

        return response()->json([
            'data' => $this->transformCapsule($messageCapsule->fresh()),
        ]);
    }

    private function transformCapsule(MessageCapsule $capsule): array
    {
        $isLocked = ! $capsule->isUnlocked();
        $daysUntilUnlock = Carbon::today()->diffInDays($capsule->unlock_date, false);

        return [
            'id' => $capsule->id,
            'unlock_date' => $capsule->unlock_date->toDateString(),
            'is_locked' => $isLocked,
            'days_until_unlock' => $isLocked ? $daysUntilUnlock : 0,
            'preview' => $capsule->preview_text,
            'message' => $isLocked ? null : $capsule->message,
            'author' => $capsule->author_name,
            'opened_at' => optional($capsule->opened_at)?->toISOString(),
            'created_at' => $capsule->created_at->toISOString(),
        ];
    }
}
