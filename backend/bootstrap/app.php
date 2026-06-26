<?php

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->reportable(function (QueryException $exception): void {
            if (! app()->runningInConsole()) {
                return;
            }

            $command = $_SERVER['argv'][1] ?? '';

            if (! is_string($command) || ! str_starts_with($command, 'migrate')) {
                return;
            }

            static $reported = false;

            if ($reported) {
                return;
            }

            $reported = true;

            $previous = $exception->getPrevious();
            $sqlState = $previous instanceof \PDOException
                ? ($previous->errorInfo[0] ?? $previous->getCode())
                : $exception->getCode();
            $message = $previous instanceof \PDOException
                ? ($previous->errorInfo[2] ?? $previous->getMessage())
                : $exception->getMessage();

            file_put_contents('php://stderr', sprintf(
                "[query-exception] sqlstate=%s | message=%s | sql=%s | bindings=%s\n",
                $sqlState,
                $message,
                $exception->getSql(),
                json_encode($exception->getBindings(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            ));
        });
    })->create();
