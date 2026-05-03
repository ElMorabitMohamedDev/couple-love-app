<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Relationship extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'tagline',
        'partner_one_name',
        'partner_two_name',
        'partner_one_user_id',
        'partner_two_user_id',
        'started_at',
        'future_children_slots',
        'children',
        'home_quote',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'date',
            'future_children_slots' => 'integer',
            'children' => 'array',
        ];
    }

    public function partnerOneUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'partner_one_user_id');
    }

    public function partnerTwoUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'partner_two_user_id');
    }

    public function partnerForUser(User $user): ?User
    {
        if ((int) $this->partner_one_user_id === (int) $user->id) {
            return $this->partnerTwoUser;
        }

        if ((int) $this->partner_two_user_id === (int) $user->id) {
            return $this->partnerOneUser;
        }

        return null;
    }
}
