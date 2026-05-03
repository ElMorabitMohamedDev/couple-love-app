<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'birth_date',
        'avatar_disk',
        'avatar_path',
        'password',
        'pin',
        'notifications_enabled',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'pin',
        'remember_token',
    ];

    protected $appends = ['avatar_url'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'birth_date' => 'date',
            'notifications_enabled' => 'boolean',
            'password' => 'hashed',
            'pin' => 'hashed',
        ];
    }

    public function dailyMoods(): HasMany
    {
        return $this->hasMany(DailyMood::class);
    }

    public function journalEntries(): HasMany
    {
        return $this->hasMany(JournalEntry::class);
    }

    public function memories(): HasMany
    {
        return $this->hasMany(Memory::class);
    }

    public function anonymousMessages(): HasMany
    {
        return $this->hasMany(AnonymousMessage::class);
    }

    public function promises(): HasMany
    {
        return $this->hasMany(Promise::class);
    }

    public function messageCapsules(): HasMany
    {
        return $this->hasMany(MessageCapsule::class);
    }

    public function sentReconciliationNudges(): HasMany
    {
        return $this->hasMany(ReconciliationNudge::class, 'sender_id');
    }

    public function receivedReconciliationNudges(): HasMany
    {
        return $this->hasMany(ReconciliationNudge::class, 'recipient_id');
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if (! $this->avatar_disk || ! $this->avatar_path) {
            return null;
        }

        return Storage::disk($this->avatar_disk)->url($this->avatar_path);
    }
}
