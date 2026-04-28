<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('movimentacao_itens', function (Blueprint $table) {
            $table->string('numero_serie')->nullable()->after('local_id');
        });
    }

    public function down(): void
    {
        Schema::table('movimentacao_itens', function (Blueprint $table) {
            $table->dropColumn('numero_serie');
        });
    }
};
