<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use App\Models\Local;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class LocalController extends Controller
{
    public function index(): Response
    {
        $this->inactivateExpiredLocais();

        return Inertia::render('cadastros/locais/index', [
            'locais' => Local::query()
                ->select([
                    'id',
                    'empresa_id',
                    'codigo',
                    'nome',
                    'data_limite',
                    'ativo',
                    'created_at',
                ])
                ->with(['empresa:id,nome'])
                ->latest()
                ->get(),
            'empresas' => Empresa::query()
                ->select(['id', 'nome'])
                ->where('ativa', true)
                ->orderBy('nome')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(
            $this->rules(),
            $this->messages(),
            $this->attributes(),
        );

        $data['ativo'] = ! $this->isExpired($data['data_limite']);

        Local::create($data);

        return back()->with('success', 'Local criado com sucesso.');
    }

    public function update(Request $request, Local $local): RedirectResponse
    {
        $data = $request->validate(
            $this->rules(),
            $this->messages(),
            $this->attributes(),
        );

        $newDateIsExpired = $this->isExpired($data['data_limite']);

        if ($newDateIsExpired) {
            $data['ativo'] = false;
        } elseif ($this->isExpired($local->data_limite)) {
            // Reativação automática apenas quando corrige a data expirada.
            $data['ativo'] = true;
        }

        $local->update($data);

        return back()->with('success', 'Local atualizado com sucesso.');
    }

    public function toggleStatus(Local $local): RedirectResponse
    {
        if (! $local->ativo && $this->isExpired($local->data_limite)) {
            return back()->with(
                'error',
                'A data limite foi ultrapassada. Edite a data limite para reativar o local.',
            );
        }

        $local->update([
            'ativo' => ! $local->ativo,
        ]);

        $message = $local->ativo
            ? 'Local ativado com sucesso.'
            : 'Local inativado com sucesso.';

        return back()->with('success', $message);
    }

    public function destroy(Local $local): RedirectResponse
    {
        $local->delete();

        return back()->with('success', 'Local excluído com sucesso.');
    }

    private function rules(): array
    {
        return [
            'empresa_id' => ['required', 'integer', 'exists:empresas,id'],
            'codigo' => ['required', 'string', 'max:255'],
            'nome' => ['required', 'string', 'max:255'],
            'data_limite' => ['required', 'date'],
        ];
    }

    private function messages(): array
    {
        return [
            'empresa_id.required' => 'Selecione a empresa.',
            'empresa_id.exists' => 'A empresa selecionada é inválida.',
            'codigo.required' => 'Informe o código do local.',
            'codigo.max' => 'O código deve ter no máximo :max caracteres.',
            'nome.required' => 'Informe o nome do local.',
            'nome.max' => 'O nome deve ter no máximo :max caracteres.',
            'data_limite.required' => 'Informe a data limite.',
            'data_limite.date' => 'Informe uma data limite válida.',
        ];
    }

    private function attributes(): array
    {
        return [
            'empresa_id' => 'empresa',
            'codigo' => 'código',
            'nome' => 'nome',
            'data_limite' => 'data limite',
        ];
    }

    private function inactivateExpiredLocais(): void
    {
        Local::query()
            ->where('ativo', true)
            ->whereDate('data_limite', '<', Carbon::today())
            ->update(['ativo' => false]);
    }

    private function isExpired(string|Carbon|null $date): bool
    {
        if (! $date) {
            return false;
        }

        $limitDate = $date instanceof Carbon ? $date : Carbon::parse($date);

        return $limitDate->startOfDay()->lt(Carbon::today());
    }
}
