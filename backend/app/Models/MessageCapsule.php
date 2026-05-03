<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class MessageCapsule extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'author_name',
        'preview_text',
        'message',
        'unlock_date',
        'opened_at',
    ];

    protected function casts(): array
    {
        return [
            'unlock_date' => 'date',
            'opened_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isUnlocked(): bool
    {
        return $this->unlock_date->startOfDay()->lte(Carbon::today());
    }
}
