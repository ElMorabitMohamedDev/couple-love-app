<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Relationship;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function options(): JsonResponse
    {
        return response()->json([
            'data' => $this->authOptions(),
        ]);
    }

    public function setup(Request $request): JsonResponse
    {
        dd($request->all());
        $validated = $request->validate([
            'partner_one_name' => ['required', 'string', 'max:120', 'different:partner_two_name'],
            'partner_two_name' => ['required', 'string', 'max:120'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $existingUsers = User::query()->orderBy('id')->get();

        if ($existingUsers->count() > 2) {
            throw ValidationException::withMessages([
                'users' => ['This private space only supports two profiles.'],
            ]);
        }

        DB::transaction(function () use ($existingUsers, $validated): void {
            $userOne = $existingUsers->get(0) ?? new User([
                'email' => env('USER_ONE_EMAIL', 'partner.one@example.com'),
            ]);
            $userTwo = $existingUsers->get(1) ?? new User([
                'email' => env('USER_TWO_EMAIL', 'partner.two@example.com'),
            ]);

            $this->fillSharedUser($userOne, $validated['partner_one_name'], $validated['password'], true);
            $this->fillSharedUser($userTwo, $validated['partner_two_name'], $validated['password'], true);

            $relationship = $this->relationship() ?? new Relationship([
                'title' => env('RELATIONSHIP_TITLE', 'Our Love Space'),
                'tagline' => env('RELATIONSHIP_TAGLINE', 'A private place for us'),
                'started_at' => env('RELATIONSHIP_STARTED_AT', now()->toDateString()),
                'future_children_slots' => 3,
                'home_quote' => 'Every moment with you is a blessing. Our love grows stronger each day.',
            ]);

            $relationship->fill([
                'partner_one_name' => $userOne->name,
                'partner_two_name' => $userTwo->name,
                'partner_one_user_id' => $userOne->id,
                'partner_two_user_id' => $userTwo->id,
            ])->save();
        });

        return response()->json([
            'message' => 'Your private space is ready.',
            'data' => $this->authOptions(),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $allowedUsers = $this->allowedUsers();

        if ($allowedUsers->count() !== 2) {
            throw ValidationException::withMessages([
                'setup' => ['Complete the private space setup before logging in.'],
            ]);
        }

        $validated = $request->validate([
            'user_id' => ['required', 'integer', Rule::in($allowedUsers->pluck('id')->all())],
            'password' => ['required', 'string', 'min:6'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);

        $user = $allowedUsers->firstWhere('id', (int) $validated['user_id']);

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The shared password is incorrect.'],
            ]);
        }

        $deviceName = $validated['device_name'] ?? 'mobile-web';
        $user->tokens()->where('name', $deviceName)->delete();

        return response()->json([
            'message' => 'Login successful.',
            'data' => [
                'token' => $user->createToken($deviceName)->plainTextToken,
                'user' => $this->transformUser($user),
                'relationship' => $this->transformRelationship($this->relationship()),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'user' => $this->transformUser($request->user()),
                'relationship' => $this->transformRelationship($this->relationship()),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    private function authOptions(): array
    {
        $users = $this->allowedUsers();

        return [
            'requires_setup' => $users->count() !== 2 || ! $this->relationship(),
            'users' => $users->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
            ])->values()->all(),
        ];
    }

    private function allowedUsers(): Collection
    {
        return User::query()->orderBy('id')->limit(2)->get();
    }

    private function relationship(): ?Relationship
    {
        return Relationship::query()->with(['partnerOneUser', 'partnerTwoUser'])->oldest('id')->first();
    }

    private function fillSharedUser(User $user, string $name, string $password, bool $notificationsEnabled): void
    {
        $user->forceFill([
            'name' => $name,
            'email' => $user->email ?: Str::slug($name).'.'.Str::random(6).'@example.com',
            'password' => $password,
            'pin' => str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT),
            'notifications_enabled' => $notificationsEnabled,
        ])->save();
    }

    private function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'birth_date' => optional($user->birth_date)->toDateString(),
            'avatar_url' => $user->avatar_url,
            'notifications_enabled' => $user->notifications_enabled,
        ];
    }

    private function transformRelationship(?Relationship $relationship): ?array
    {
        if (! $relationship) {
            return null;
        }

        return [
            'id' => $relationship->id,
            'title' => $relationship->title,
            'tagline' => $relationship->tagline,
            'partner_one_name' => $relationship->partner_one_name,
            'partner_two_name' => $relationship->partner_two_name,
            'started_at' => optional($relationship->started_at)->toDateString(),
            'future_children_slots' => $relationship->future_children_slots,
            'home_quote' => $relationship->home_quote,
        ];
    }
}
