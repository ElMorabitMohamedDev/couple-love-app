<?php

namespace Tests\Unit;

use Tests\TestCase;

class CorsConfigurationTest extends TestCase
{
    public function test_netlify_origin_is_allowed_for_api_routes(): void
    {
        $this->assertContains('api/*', config('cors.paths'));
        $this->assertContains('https://reda-aya.netlify.app', config('cors.allowed_origins'));
    }
}
