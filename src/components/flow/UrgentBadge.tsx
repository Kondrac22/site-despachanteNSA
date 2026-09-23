// Selo de urgência usado nas listas e no detalhe. Só aparece em serviços
// ainda em aberto — depois de finalizado, a urgência deixa de importar.
export default function UrgentBadge() {
  return (
    <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
      URGENTE
    </span>
  );
}
