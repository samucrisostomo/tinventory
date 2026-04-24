<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('users/index', [
            'users' => User::query()
                ->select(['id', 'name', 'email', 'is_active', 'created_at'])
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        User::create($data);

        return back()->with('success', 'Usuário criado com sucesso.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return back()->with('success', 'Usuário atualizado com sucesso.');
    }

    public function toggleStatus(User $user): RedirectResponse
    {
        if (Auth::id() === $user->id && $user->is_active) {
            return back()->with('error', 'Você não pode inativar seu próprio usuário.');
        }

        $user->update([
            'is_active' => ! $user->is_active,
        ]);

        $message = $user->is_active
            ? 'Usuário ativado com sucesso.'
            : 'Usuário inativado com sucesso.';

        return back()->with('success', $message);
    }
}
