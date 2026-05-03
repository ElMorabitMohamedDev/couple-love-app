<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Memory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'caption',
        'description',
        'disk',
        'path',
        'media_type',
        'original_name',
        'mime_type',
        'size',
        'likes_count',
        'captured_at',
    ];

    protected $appends = ['url'];

    protected function casts(): array
    {
        return [
            'captured_at' => 'datetime',
            'likes_count' => 'integer',
            'size' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }
}
