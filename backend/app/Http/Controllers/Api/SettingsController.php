<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        User::query()
            ->whereIn('id', User::query()->orderBy('id')->limit(2)->pluck('id'))
            ->each(function (User $user) use ($validated): void {
                $user->forceFill([
                    'password' => $validated['password'],
                ])->save();
            });

        return response()->json([
            'message' => 'Shared password updated successfully.',
        ]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notifications_enabled' => ['required', 'boolean'],
        ]);

        $request->user()->forceFill($validated)->save();

        return response()->json([
            'message' => 'Preferences updated successfully.',
            'data' => [
                'notifications_enabled' => $request->user()->notifications_enabled,
            ],
        ]);
    }
}
