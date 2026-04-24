<?php

use App\Http\Controllers\EmpresaController;
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
});

require __DIR__.'/settings.php';
