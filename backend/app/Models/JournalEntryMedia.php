<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class JournalEntryMedia extends Model
{
    use HasFactory;

    protected $fillable = [
        'journal_entry_id',
        'disk',
        'path',
        'media_type',
        'original_name',
        'mime_type',
        'size',
    ];

    protected $appends = ['url'];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }
}
