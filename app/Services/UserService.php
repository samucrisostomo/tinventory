<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

class UserService
{
    public function delete(User $user): void
    {
        if (Auth::id() === $user->id) {
            throw new RuntimeException('Você não pode excluir seu próprio usuário.');
        }

        $user->delete();
    }
}
