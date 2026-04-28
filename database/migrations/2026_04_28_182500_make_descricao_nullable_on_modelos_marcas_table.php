<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modelos_marcas', function (Blueprint $table) {
            $table->string('descricao')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('modelos_marcas', function (Blueprint $table) {
            $table->string('descricao')->nullable(false)->change();
        });
    }
};
