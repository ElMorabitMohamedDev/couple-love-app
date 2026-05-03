<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Relationship;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RelationshipController extends Controller
{
    public function show(): JsonResponse
    {
        $relationship = $this->relationship();

        return response()->json([
            'data' => $this->transformRelationship($relationship),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:120'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'partner_one_name' => ['required', 'string', 'max:120'],
            'partner_two_name' => ['required', 'string', 'max:120'],
            'started_at' => ['required', 'date'],
            'future_children_slots' => ['nullable', 'integer', 'min:0', 'max:10'],
            'home_quote' => ['nullable', 'string', 'max:500'],
        ]);

        $relationship = $this->relationship();
        $relationship->fill($validated);
        $relationship->save();

        $this->syncUserNames($relationship);

        return response()->json([
            'message' => 'Relationship details updated successfully.',
            'data' => $this->transformRelationship($relationship->fresh(['partnerOneUser', 'partnerTwoUser'])),
        ]);
    }

    private function relationship(): Relationship
    {
        $users = User::query()->orderBy('id')->get();
        $relationship = Relationship::query()
            ->with(['partnerOneUser', 'partnerTwoUser'])
            ->oldest('id')
            ->first();

        if ($relationship) {
            return $relationship;
        }

        return Relationship::query()->create([
                'title' => 'Our Love Space',
                'tagline' => 'A private place for us',
                'partner_one_name' => $users->get(0)?->name ?? 'Partner 1',
                'partner_two_name' => $users->get(1)?->name ?? 'Partner 2',
                'partner_one_user_id' => $users->get(0)?->id,
                'partner_two_user_id' => $users->get(1)?->id,
                'started_at' => now()->toDateString(),
                'future_children_slots' => 3,
                'children' => [],
                'home_quote' => 'Every moment with you is a blessing. Our love grows stronger each day.',
            ],
        )->load(['partnerOneUser', 'partnerTwoUser']);
    }

    private function syncUserNames(Relationship $relationship): void
    {
        if ($relationship->partner_one_user_id) {
            User::query()->whereKey($relationship->partner_one_user_id)->update([
                'name' => $relationship->partner_one_name,
            ]);
        }

        if ($relationship->partner_two_user_id) {
            User::query()->whereKey($relationship->partner_two_user_id)->update([
                'name' => $relationship->partner_two_name,
            ]);
        }
    }

    public function transformRelationship(Relationship $relationship): array
    {
        return [
            'id' => $relationship->id,
            'title' => $relationship->title,
            'tagline' => $relationship->tagline,
            'partner_one_name' => $relationship->partner_one_name,
            'partner_two_name' => $relationship->partner_two_name,
            'started_at' => optional($relationship->started_at)->toDateString(),
            'future_children_slots' => $relationship->future_children_slots,
            'children' => collect($relationship->children ?? [])->map(fn (array $child): array => [
                'id' => $child['id'] ?? null,
                'name' => $child['name'] ?? 'Child',
                'birth_date' => $child['birth_date'] ?? null,
                'photo_url' => $child['photo_url'] ?? ($child['avatar_url'] ?? null),
            ])->values()->all(),
            'home_quote' => $relationship->home_quote,
            'family_tree' => [
                'partner_one' => [
                    'id' => $relationship->partnerOneUser?->id,
                    'name' => $relationship->partner_one_name,
                    'role' => 'Partner 1',
                    'birth_date' => optional($relationship->partnerOneUser?->birth_date)->toDateString(),
                    'avatar_url' => $relationship->partnerOneUser?->avatar_url,
                ],
                'partner_two' => [
                    'id' => $relationship->partnerTwoUser?->id,
                    'name' => $relationship->partner_two_name,
                    'role' => 'Partner 2',
                    'birth_date' => optional($relationship->partnerTwoUser?->birth_date)->toDateString(),
                    'avatar_url' => $relationship->partnerTwoUser?->avatar_url,
                ],
                'future_children_slots' => $relationship->future_children_slots,
                'children' => collect($relationship->children ?? [])->map(fn (array $child): array => [
                    'id' => $child['id'] ?? null,
                    'name' => $child['name'] ?? 'Child',
                    'birth_date' => $child['birth_date'] ?? null,
                    'photo_url' => $child['photo_url'] ?? ($child['avatar_url'] ?? null),
                ])->values()->all(),
            ],
        ];
    }
}
