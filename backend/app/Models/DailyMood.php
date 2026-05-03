<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyMood extends Model
{
    use HasFactory;

    public const MOODS = ['happy', 'sad', 'miss', 'neutral'];

    protected $fillable = [
        'user_id',
        'mood',
        'noted_on',
    ];

    protected function casts(): array
    {
        return [
            'noted_on' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
