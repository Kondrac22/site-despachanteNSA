// Regras dos documentos do checklist, usadas pelo formulário (client) e
// pela criação do serviço (server). O checklist é texto livre cadastrado
// em Tipos de Serviço, então os documentos são reconhecidos pelo nome.

// Opcionais: se não forem anexados, o serviço NÃO fica com pendência.
const OPTIONAL_DOCUMENTS = [
  /contrato\s+social/i,
  /procura[cç][aã]o/i,
  /\bcnh\b/i,
  /\brg\b/i,
];

export function isOptionalDocument(item: string) {
  return OPTIONAL_DOCUMENTS.some((pattern) => pattern.test(item));
}

// Ordem dos obrigatórios na tela; os que não estão aqui vêm depois,
// na ordem do cadastro.
const REQUIRED_ORDER = [/atpv|\bdut\b/i, /laudo/i, /\bnf\b|nota\s+fiscal/i];

function requiredRank(item: string) {
  const index = REQUIRED_ORDER.findIndex((pattern) => pattern.test(item));
  return index === -1 ? REQUIRED_ORDER.length : index;
}

// Separa o checklist em obrigatórios (já ordenados) e opcionais.
export function splitChecklist(checklist: string[]) {
  const required = checklist
    .filter((item) => !isOptionalDocument(item))
    .map((item, position) => ({ item, position }))
    .sort(
      (a, b) =>
        requiredRank(a.item) - requiredRank(b.item) || a.position - b.position
    )
    .map(({ item }) => item);
  const optional = checklist.filter((item) => isOptionalDocument(item));
  return { required, optional };
}
