<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promise;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromiseController extends Controller
{
    public function index(): JsonResponse
    {
        $promises = Promise::query()
            ->latest()
            ->get()
            ->map(fn (Promise $promise): array => $this->transformPromise($promise))
            ->all();

        return response()->json(['data' => $promises]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:3000'],
            'author_name' => ['nullable', 'string', 'max:120'],
        ]);

        $promise = Promise::query()->create([
            'user_id' => $request->user()->id,
            'author_name' => $validated['author_name'] ?? $request->user()->name,
            'body' => $validated['body'],
        ]);

        return response()->json([
            'message' => 'Promise saved successfully.',
            'data' => $this->transformPromise($promise),
        ], 201);
    }

    private function transformPromise(Promise $promise): array
    {
        return [
            'id' => $promise->id,
            'text' => $promise->body,
            'author' => $promise->author_name,
            'date' => $promise->created_at->toDateString(),
            'created_at' => $promise->created_at->toISOString(),
        ];
    }
}
