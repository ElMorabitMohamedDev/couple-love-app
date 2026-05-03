<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_requires_selected_user_and_shared_password(): void
    {
        $this->seed();
        $user = User::query()->orderBy('id')->firstOrFail();

        $response = $this->postJson('/api/auth/login', [
            'user_id' => $user->id,
            'password' => 'together123',
            'device_name' => 'iphone',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.user.name', $user->name)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'token',
                    'user' => ['id', 'name', 'email'],
                    'relationship',
                ],
            ]);
    }

    public function test_login_fails_with_invalid_shared_password(): void
    {
        $this->seed();
        $user = User::query()->orderBy('id')->firstOrFail();

        $this->postJson('/api/auth/login', [
            'user_id' => $user->id,
            'password' => 'wrong-pass',
        ])->assertStatus(422);
    }

    public function test_auth_options_return_two_private_profiles(): void
    {
        $this->seed();

        $this->getJson('/api/auth/options')
            ->assertOk()
            ->assertJsonPath('data.requires_setup', false)
            ->assertJsonCount(2, 'data.users');
    }
}
