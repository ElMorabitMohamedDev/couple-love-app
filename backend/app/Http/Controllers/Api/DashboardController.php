<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyMood;
use App\Models\JournalEntry;
use App\Models\Memory;
use App\Models\Relationship;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $relationship = Relationship::query()
            ->with(['partnerOneUser', 'partnerTwoUser'])
            ->oldest('id')
            ->first();
        $partner = $this->resolvePartner($user, $relationship);
        $today = Carbon::today()->toDateString();
        $myMood = DailyMood::query()->where('user_id', $user->id)->whereDate('noted_on', $today)->first();
        $partnerMood = $partner
            ? DailyMood::query()->where('user_id', $partner->id)->whereDate('noted_on', $today)->first()
            : null;

        return response()->json([
            'data' => [
                'relationship' => [
                    'id' => $relationship?->id,
                    'title' => $relationship?->title,
                    'tagline' => $relationship?->tagline,
                    'partner_one_name' => $relationship?->partner_one_name,
                    'partner_two_name' => $relationship?->partner_two_name,
                    'started_at' => optional($relationship?->started_at)->toDateString(),
                    'days_together' => $relationship?->started_at?->startOfDay()->diffInDays(Carbon::today()),
                    'next_milestone' => $this->nextMilestone($relationship?->started_at),
                    'home_quote' => $relationship?->home_quote,
                ],
                'current_user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar_url' => $user->avatar_url,
                    'today_mood' => $myMood?->mood,
                ],
                'partner' => $partner ? [
                    'id' => $partner->id,
                    'name' => $partner->name,
                    'avatar_url' => $partner->avatar_url,
                    'today_mood' => $partnerMood?->mood,
                ] : null,
                'memory_reminders' => $this->memoryReminders(),
            ],
        ]);
    }

    private function resolvePartner(User $user, ?Relationship $relationship): ?User
    {
        return $relationship?->partnerForUser($user)
            ?? User::query()->whereKeyNot($user->id)->first();
    }

    private function nextMilestone(?Carbon $startedAt): ?array
    {
        if (! $startedAt) {
            return null;
        }

        $today = Carbon::today();
        $nextCount = 1;
        $nextDate = $startedAt->copy()->addMonthsNoOverflow($nextCount)->startOfDay();

        while ($nextDate->lessThanOrEqualTo($today)) {
            $nextCount++;
            $nextDate = $startedAt->copy()->addMonthsNoOverflow($nextCount)->startOfDay();
        }

        return [
            'label' => $nextCount.' month'.($nextCount === 1 ? '' : 's').' together',
            'date' => $nextDate->toDateString(),
            'days_remaining' => $today->diffInDays($nextDate, false),
        ];
    }

    private function memoryReminders(): array
    {
        $reminders = Memory::query()
            ->latest('captured_at')
            ->latest()
            ->get()
            ->filter(fn (Memory $memory): bool => filled($memory->caption) || filled($memory->description))
            ->take(2)
            ->map(fn (Memory $memory): array => [
                'id' => $memory->id,
                'text' => $memory->caption ?: $memory->description,
                'date' => optional($memory->captured_at ?? $memory->created_at)->toDateString(),
                'media_url' => $memory->url,
                'source' => 'memory',
            ])
            ->values()
            ->all();

        if (count($reminders) < 2) {
            $journalFallbacks = JournalEntry::query()
                ->whereIn('mood', ['love', 'happy', 'grateful'])
                ->latest()
                ->take(2 - count($reminders))
                ->get()
                ->map(fn (JournalEntry $entry): array => [
                    'id' => $entry->id,
                    'text' => Str::limit($entry->body, 120),
                    'date' => $entry->created_at->toDateString(),
                    'media_url' => null,
                    'source' => 'journal',
                ])
                ->all();

            $reminders = [...$reminders, ...$journalFallbacks];
        }

        return $reminders;
    }
}
