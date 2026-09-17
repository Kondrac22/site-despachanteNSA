// Fica num arquivo à parte (sem importar nada do servidor) porque tanto
// a consulta (server) quanto o filtro (client) precisam dessa lista.
export const ACTION_OPTIONS = [
  { id: "CRIADO", name: "Serviço criado" },
  { id: "STATUS_ALTERADO", name: "Status alterado" },
  { id: "DOCUMENTO_ANEXADO", name: "Documento anexado" },
  { id: "ENTRADA_ESTOQUE", name: "Entrada no estoque" },
  { id: "ENTRADA_DUPLICADA", name: "Entrada duplicada" },
  { id: "SAIDA_ESTOQUE", name: "Saída do estoque" },
];
