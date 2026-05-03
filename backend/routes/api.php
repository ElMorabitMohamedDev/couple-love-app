<?php

use App\Http\Controllers\Api\AnonymousMessageController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BirthdayController;
use App\Http\Controllers\Api\DailyMoodController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FamilyTreeController;
use App\Http\Controllers\Api\JournalEntryController;
use App\Http\Controllers\Api\MessageCapsuleController;
use App\Http\Controllers\Api\MemoryController;
use App\Http\Controllers\Api\PromiseController;
use App\Http\Controllers\Api\ReconciliationNudgeController;
use App\Http\Controllers\Api\RelationshipController;
use App\Http\Controllers\Api\SettingsController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::get('/options', [AuthController::class, 'options']);
    Route::post('/setup', [AuthController::class, 'setup'])->middleware('throttle:pin-login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:pin-login');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    Route::get('/dashboard', DashboardController::class);
    Route::get('/birthdays/upcoming', BirthdayController::class);

    Route::get('/moods/today', [DailyMoodController::class, 'show']);
    Route::put('/moods/today', [DailyMoodController::class, 'upsert']);

    Route::get('/journal-entries', [JournalEntryController::class, 'index']);
    Route::post('/journal-entries', [JournalEntryController::class, 'store']);
    Route::get('/journal-entries/{journalEntry}', [JournalEntryController::class, 'show']);
    Route::put('/journal-entries/{journalEntry}', [JournalEntryController::class, 'update']);
    Route::delete('/journal-entries/{journalEntry}', [JournalEntryController::class, 'destroy']);

    Route::get('/memories', [MemoryController::class, 'index']);
    Route::post('/memories', [MemoryController::class, 'store']);
    Route::put('/memories/{memory}', [MemoryController::class, 'update']);
    Route::delete('/memories/{memory}', [MemoryController::class, 'destroy']);

    Route::get('/anonymous-messages', [AnonymousMessageController::class, 'index']);
    Route::post('/anonymous-messages', [AnonymousMessageController::class, 'store']);

    Route::get('/promises', [PromiseController::class, 'index']);
    Route::post('/promises', [PromiseController::class, 'store']);

    Route::get('/message-capsules', [MessageCapsuleController::class, 'index']);
    Route::post('/message-capsules', [MessageCapsuleController::class, 'store']);
    Route::get('/message-capsules/{messageCapsule}', [MessageCapsuleController::class, 'show']);

    Route::get('/relationship', [RelationshipController::class, 'show']);
    Route::put('/relationship', [RelationshipController::class, 'update']);
    Route::put('/family-tree/partners/{user}', [FamilyTreeController::class, 'updatePartner']);

    Route::put('/settings/password', [SettingsController::class, 'updatePassword']);
    Route::put('/settings/preferences', [SettingsController::class, 'updatePreferences']);

    Route::post('/reconciliation-nudges', [ReconciliationNudgeController::class, 'store']);
});
