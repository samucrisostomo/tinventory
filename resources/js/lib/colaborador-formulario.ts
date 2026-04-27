/** Chaves alinhadas ao backend (`TipoColaborador::formularioCamposChaves`). */
export const COLABORADOR_FORMULARIO_CAMPOS = [
    'nome',
    'matricula',
    'cpf',
    'empresa_id',
    'local_id',
    'data_admissao',
    'data_afastamento',
    'situacao_id',
] as const;

export type ColaboradorFormularioCampo = (typeof COLABORADOR_FORMULARIO_CAMPOS)[number];

export type ColaboradorFormularioCampoConfig = {
    visible: boolean;
    required: boolean;
};

export type ColaboradorFormularioSchema = Record<
    ColaboradorFormularioCampo,
    ColaboradorFormularioCampoConfig
>;

export const COLABORADOR_FORMULARIO_LABELS: Record<ColaboradorFormularioCampo, string> = {
    nome: 'Nome',
    matricula: 'Matrícula',
    cpf: 'CPF',
    empresa_id: 'Empresa',
    local_id: 'Local',
    data_admissao: 'Data de admissão',
    data_afastamento: 'Data de afastamento',
    situacao_id: 'Situação',
};

export function defaultColaboradorFormularioSchema(): ColaboradorFormularioSchema {
    const schema = {} as ColaboradorFormularioSchema;
    for (const campo of COLABORADOR_FORMULARIO_CAMPOS) {
        schema[campo] = {
            visible: true,
            required: campo !== 'data_afastamento',
        };
    }
    return schema;
}

/** Mescla config salva no tipo com padrão e garante regras básicas (nome sempre visível/obrigatório). */
export function mergeColaboradorFormularioSchema(stored: unknown): ColaboradorFormularioSchema {
    const base = defaultColaboradorFormularioSchema();
    if (
        stored === null ||
        stored === undefined ||
        typeof stored !== 'object' ||
        Array.isArray(stored) ||
        Object.keys(stored).length === 0
    ) {
        return base;
    }

    const record = stored as Partial<
        Record<ColaboradorFormularioCampo, Partial<ColaboradorFormularioCampoConfig>>
    >;

    for (const campo of COLABORADOR_FORMULARIO_CAMPOS) {
        const raw = record[campo];
        let visible = Boolean(raw?.visible ?? base[campo].visible);
        let required = Boolean(raw?.required ?? base[campo].required);
        if (required) {
            visible = true;
        }
        base[campo] = { visible, required };
    }

    base.nome.visible = true;
    base.nome.required = true;

    return base;
}
