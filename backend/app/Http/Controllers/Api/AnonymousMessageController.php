<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnonymousMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnonymousMessageController extends Controller
{
    public function index(): JsonResponse
    {
        $messages = AnonymousMessage::query()
            ->latest()
            ->get()
            ->map(fn (AnonymousMessage $message): array => $this->transformMessage($message))
            ->all();

        return response()->json(['data' => $messages]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:3000'],
        ]);

        $message = AnonymousMessage::query()->create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        return response()->json([
            'message' => 'Anonymous message shared successfully.',
            'data' => $this->transformMessage($message),
        ], 201);
    }

    private function transformMessage(AnonymousMessage $message): array
    {
        return [
            'id' => $message->id,
            'text' => $message->body,
            'date' => $message->created_at->toDateString(),
            'created_at' => $message->created_at->toISOString(),
            'author' => 'Anonymous',
        ];
    }
}
