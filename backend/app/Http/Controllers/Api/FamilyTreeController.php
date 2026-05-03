<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Relationship;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class FamilyTreeController extends Controller
{
    public function updatePartner(Request $request, User $user): JsonResponse
    {
        $relationship = Relationship::query()
            ->with(['partnerOneUser', 'partnerTwoUser'])
            ->oldest('id')
            ->firstOrFail();

        $allowedUserIds = collect([
            $relationship->partner_one_user_id,
            $relationship->partner_two_user_id,
        ])->filter()->map(fn ($id) => (int) $id)->all();

        if (! in_array((int) $user->id, $allowedUserIds, true)) {
            throw ValidationException::withMessages([
                'user' => ['Only the two partner profiles can be updated in this family tree.'],
            ]);
        }

        $validated = $request->validate([
            'birth_date' => ['nullable', 'date', 'before_or_equal:today'],
            'avatar' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,webp,gif,heic,heif',
                'mimetypes:image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/heic-sequence,image/heif-sequence',
                'max:10240',
            ],
        ]);

        $user->birth_date = $validated['birth_date'] ?? null;

        if ($request->hasFile('avatar')) {
            /** @var UploadedFile $file */
            $file = $request->file('avatar');
            $this->deleteAvatar($user);
            $disk = config('filesystems.default', 'public');
            $path = $file->store('avatars', $disk);
            $user->avatar_disk = $disk;
            $user->avatar_path = $path;
        }

        $user->save();
        $updatedRelationship = Relationship::query()
            ->with(['partnerOneUser', 'partnerTwoUser'])
            ->oldest('id')
            ->firstOrFail();
        $relationshipController = app(RelationshipController::class);

        return response()->json([
            'message' => 'Family tree profile updated successfully.',
            'data' => $relationshipController->transformRelationship($updatedRelationship),
        ]);
    }

    private function deleteAvatar(User $user): void
    {
        if (! $user->avatar_disk || ! $user->avatar_path) {
            return;
        }

        if (Storage::disk($user->avatar_disk)->exists($user->avatar_path)) {
            Storage::disk($user->avatar_disk)->delete($user->avatar_path);
        }
    }
}
