<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_unique(array_filter(array_map(
        static fn (?string $origin): ?string => $origin ?: null,
        array_merge(
            explode(',', (string) env('FRONTEND_URL', 'http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5175,http://localhost:5175,https://reda-aya.netlify.app')),
            [env('APP_URL'), 'https://reda-aya.netlify.app']
        )
    )))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
