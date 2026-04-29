<?php

namespace App\Http\Controllers;

use App\Services\TransferenciaEstoqueService;
use Inertia\Inertia;
use Inertia\Response;

class TransferenciaEstoqueController extends Controller
{
    public function __construct(
        private readonly TransferenciaEstoqueService $transferenciaEstoqueService,
    ) {}

    public function index(): Response
    {
        return Inertia::render(
            'operacoes-estoque/transferencias/index',
            $this->transferenciaEstoqueService->montarPagina(),
        );
    }
}

