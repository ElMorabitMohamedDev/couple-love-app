<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->date('birth_date')->nullable()->after('email_verified_at');
            $table->string('avatar_disk')->nullable()->after('birth_date');
            $table->string('avatar_path')->nullable()->after('avatar_disk');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['birth_date', 'avatar_disk', 'avatar_path']);
        });
    }
};
