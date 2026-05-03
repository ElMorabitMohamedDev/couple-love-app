<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyMood;
use App\Models\Relationship;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Validation\Rule;

class DailyMoodController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->payload($request->user()),
        ]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mood' => ['required', Rule::in(DailyMood::MOODS)],
        ]);

        $today = Carbon::today()->toDateString();
        $savedMood = $validated['mood'];

        try {
            DB::transaction(function () use ($request, $today, $validated): void {
                $dailyMood = DailyMood::query()
                    ->where('user_id', $request->user()->id)
                    ->whereDate('noted_on', $today)
                    ->first();

                if ($dailyMood) {
                    $dailyMood->update([
                        'mood' => $validated['mood'],
                    ]);

                    return;
                }

                DailyMood::query()->create([
                    'user_id' => $request->user()->id,
                    'noted_on' => $today,
                    'mood' => $validated['mood'],
                ]);
            });
        } catch (QueryException) {
            DailyMood::query()
                ->where('user_id', $request->user()->id)
                ->whereDate('noted_on', $today)
                ->update([
                    'mood' => $validated['mood'],
                ]);
        }

        return response()->json([
            'message' => 'Mood saved successfully.',
            'data' => $this->payload($request->user(), $savedMood),
        ]);
    }

    private function payload(User $user, ?string $currentMoodOverride = null): array
    {
        $relationship = Relationship::query()
            ->with(['partnerOneUser', 'partnerTwoUser'])
            ->oldest('id')
            ->first();
        $partner = $relationship?->partnerForUser($user)
            ?? User::query()->whereKeyNot($user->id)->first();
        $today = Carbon::today()->toDateString();

        return [
            'date' => $today,
            'my_mood' => $currentMoodOverride ?? DailyMood::query()
                ->where('user_id', $user->id)
                ->whereDate('noted_on', $today)
                ->value('mood'),
            'partner_mood' => $partner
                ? DailyMood::query()
                    ->where('user_id', $partner->id)
                    ->whereDate('noted_on', $today)
                    ->value('mood')
                : null,
            'partner_name' => $partner?->name,
        ];
    }
}
