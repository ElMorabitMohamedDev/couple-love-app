# Use PHP 8.2 CLI for the Laravel app
FROM php:8.2-cli-alpine

RUN apk add --no-cache bash git unzip curl libzip-dev libxml2-dev oniguruma-dev postgresql-dev zlib-dev
RUN docker-php-ext-install pdo pdo_pgsql mbstring xml zip

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www/html

# Install PHP dependencies before copying application to leverage cache
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --prefer-dist --no-interaction --no-scripts

# Copy the Laravel application
COPY backend/ ./

RUN mkdir -p storage bootstrap/cache \
    && chmod -R ug+rwX storage bootstrap/cache

RUN composer dump-autoload --optimize --no-interaction --no-scripts \
    && php artisan package:discover --ansi

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 10000

CMD ["sh", "-lc", "php artisan storage:link --force && php artisan config:cache && php artisan route:cache && php artisan serve --host=0.0.0.0 --port=${PORT:-10000}"]
