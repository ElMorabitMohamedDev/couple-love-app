<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReconciliationNudge;
use App\Models\Relationship;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReconciliationNudgeController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $relationship = Relationship::query()
            ->with(['partnerOneUser', 'partnerTwoUser'])
            ->first();
        $partner = $relationship?->partnerForUser($user)
            ?? User::query()->whereKeyNot($user->id)->first();

        $nudge = ReconciliationNudge::query()->create([
            'sender_id' => $user->id,
            'recipient_id' => $partner?->id,
            'message' => $validated['message'] ?? "I care about us. Let's talk when you're ready.",
            'sent_at' => now(),
        ]);

        return response()->json([
            'message' => 'Reconciliation nudge sent successfully.',
            'data' => [
                'id' => $nudge->id,
                'message' => $nudge->message,
                'recipient_name' => $partner?->name,
                'sent_at' => $nudge->sent_at->toISOString(),
            ],
        ], 201);
    }
}
