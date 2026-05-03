<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('relationships', function (Blueprint $table) {
            $table->id();
            $table->string('title')->default('Our Love Space');
            $table->string('tagline')->nullable();
            $table->string('partner_one_name');
            $table->string('partner_two_name');
            $table->foreignId('partner_one_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('partner_two_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('started_at');
            $table->unsignedTinyInteger('future_children_slots')->default(3);
            $table->text('home_quote')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('relationships');
    }
};
