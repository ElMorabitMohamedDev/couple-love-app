<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthSetupTest extends TestCase
{
    use RefreshDatabase;

    public function test_setup_requires_partner_emails(): void
    {
        $response = $this->postJson('/api/auth/setup', [
            'partner_one_name' => 'Aya',
            'partner_two_name' => 'Partner',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['partner_one_email', 'partner_two_email']);
    }
}
