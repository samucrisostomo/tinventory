<?php

use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\FornecedorController;
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
});

require __DIR__.'/settings.php';
