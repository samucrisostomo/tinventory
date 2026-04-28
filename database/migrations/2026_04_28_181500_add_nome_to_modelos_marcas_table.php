<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modelos_marcas', function (Blueprint $table) {
            $table->string('nome')->after('marcas_id');
        });
    }

    public function down(): void
    {
        Schema::table('modelos_marcas', function (Blueprint $table) {
            $table->dropColumn('nome');
        });
    }
};
