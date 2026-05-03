<?php

namespace App\Support;

use App\Models\Relationship;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class UpcomingBirthdays
{
    public function forRelationship(Relationship $relationship, int $lookaheadDays = 30): array
    {
        $partners = collect([
            $relationship->partnerOneUser,
            $relationship->partnerTwoUser,
        ])
            ->filter()
            ->map(fn (User $user): ?array => $this->transformUser($user))
            ->filter()
            ->values();

        $children = collect($relationship->children ?? [])
            ->map(fn (array $child): ?array => $this->transformChild($child))
            ->filter()
            ->values();

        return $partners
            ->merge($children)
            ->filter(fn (array $person): bool => $person['days_left'] <= $lookaheadDays)
            ->sortBy([
                ['days_left', 'asc'],
                ['name', 'asc'],
            ])
            ->values()
            ->all();
    }

    private function transformUser(User $user): ?array
    {
        return $this->transformBirthdayPerson([
            'type' => 'partner',
            'id' => $user->id,
            'name' => $user->name,
            'birth_date' => optional($user->birth_date)->toDateString(),
            'photo' => $user->avatar_url,
        ]);
    }

    private function transformChild(array $child): ?array
    {
        return $this->transformBirthdayPerson([
            'type' => 'child',
            'id' => $child['id'] ?? null,
            'name' => $child['name'] ?? 'Child',
            'birth_date' => $child['birth_date'] ?? null,
            'photo' => $child['photo_url'] ?? ($child['avatar_url'] ?? null),
        ]);
    }

    private function transformBirthdayPerson(array $person): ?array
    {
        if (blank($person['birth_date'])) {
            return null;
        }

        $birthDate = Carbon::parse($person['birth_date']);
        $today = Carbon::today();
        $nextBirthday = Carbon::create(
            $today->year,
            $birthDate->month,
            min($birthDate->day, Carbon::create($today->year, $birthDate->month, 1)->endOfMonth()->day),
            0,
            0,
            0,
            $today->timezone
        )->startOfDay();

        if ($nextBirthday->lessThan($today)) {
            $nextBirthday = Carbon::create(
                $today->year + 1,
                $birthDate->month,
                min($birthDate->day, Carbon::create($today->year + 1, $birthDate->month, 1)->endOfMonth()->day),
                0,
                0,
                0,
                $today->timezone
            )->startOfDay();
        }

        return [
            'type' => $person['type'],
            'id' => $person['id'],
            'name' => $person['name'],
            'photo' => $person['photo'],
            'next_birthday_date' => $nextBirthday->toDateString(),
            'days_left' => $today->diffInDays($nextBirthday, false),
        ];
    }
}
