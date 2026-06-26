<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('pin-login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        if (! $this->app->runningInConsole()) {
            return;
        }

        $command = $_SERVER['argv'][1] ?? '';

        if (! is_string($command) || ! str_starts_with($command, 'migrate')) {
            return;
        }

        DB::listen(function (QueryExecuted $query): void {
            file_put_contents('php://stderr', sprintf(
                "[sql] %s | bindings=%s | time=%sms\n",
                $query->sql,
                json_encode($query->bindings, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                $query->time
            ));
        });
    }
}
