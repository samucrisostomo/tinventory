<?php

use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\FornecedorController;
use App\Http\Controllers\LocalController;
use App\Http\Controllers\PerfilController;
use App\Http\Controllers\TipoMaterialController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'geral/dashboard/dashboard')->name('dashboard');
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::patch('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::patch('users/{user}/status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');
    Route::get('empresas', [EmpresaController::class, 'index'])->name('empresas.index');
    Route::post('empresas', [EmpresaController::class, 'store'])->name('empresas.store');
    Route::patch('empresas/{empresa}', [EmpresaController::class, 'update'])->name('empresas.update');
    Route::patch('empresas/{empresa}/status', [EmpresaController::class, 'toggleStatus'])->name('empresas.toggle-status');
    Route::delete('empresas/{empresa}', [EmpresaController::class, 'destroy'])->name('empresas.destroy');
    Route::get('fornecedores', [FornecedorController::class, 'index'])->name('fornecedores.index');
    Route::post('fornecedores', [FornecedorController::class, 'store'])->name('fornecedores.store');
    Route::patch('fornecedores/{fornecedor}', [FornecedorController::class, 'update'])->name('fornecedores.update');
    Route::patch('fornecedores/{fornecedor}/status', [FornecedorController::class, 'toggleStatus'])->name('fornecedores.toggle-status');
    Route::delete('fornecedores/{fornecedor}', [FornecedorController::class, 'destroy'])->name('fornecedores.destroy');
    Route::get('perfis', [PerfilController::class, 'index'])->name('perfis.index');
    Route::post('perfis', [PerfilController::class, 'store'])->name('perfis.store');
    Route::patch('perfis/{perfil}', [PerfilController::class, 'update'])->name('perfis.update');
    Route::patch('perfis/{perfil}/status', [PerfilController::class, 'toggleStatus'])->name('perfis.toggle-status');
    Route::delete('perfis/{perfil}', [PerfilController::class, 'destroy'])->name('perfis.destroy');
    Route::get('locais', [LocalController::class, 'index'])->name('locais.index');
    Route::post('locais', [LocalController::class, 'store'])->name('locais.store');
    Route::patch('locais/{local}', [LocalController::class, 'update'])->name('locais.update');
    Route::patch('locais/{local}/status', [LocalController::class, 'toggleStatus'])->name('locais.toggle-status');
    Route::delete('locais/{local}', [LocalController::class, 'destroy'])->name('locais.destroy');
    Route::get('config-estoque/tipos-materiais', [TipoMaterialController::class, 'index'])->name('tipos-materiais.index');
    Route::post('config-estoque/tipos-materiais', [TipoMaterialController::class, 'store'])->name('tipos-materiais.store');
    Route::patch('config-estoque/tipos-materiais/{tipoMaterial}', [TipoMaterialController::class, 'update'])->name('tipos-materiais.update');
    Route::patch('config-estoque/tipos-materiais/{tipoMaterial}/status', [TipoMaterialController::class, 'toggleStatus'])->name('tipos-materiais.toggle-status');
    Route::delete('config-estoque/tipos-materiais/{tipoMaterial}', [TipoMaterialController::class, 'destroy'])->name('tipos-materiais.destroy');
});

require __DIR__ . '/settings.php';
