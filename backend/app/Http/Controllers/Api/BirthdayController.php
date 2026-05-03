<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Relationship;
use App\Support\UpcomingBirthdays;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BirthdayController extends Controller
{
    public function __invoke(Request $request, UpcomingBirthdays $upcomingBirthdays): JsonResponse
    {
        $relationship = Relationship::query()
            ->with(['partnerOneUser', 'partnerTwoUser'])
            ->oldest('id')
            ->first();

        return response()->json([
            'data' => $relationship
                ? $upcomingBirthdays->forRelationship(
                    $relationship,
                    (int) config('couple.birthday_lookahead_days', 30)
                )
                : [],
        ]);
    }
}
