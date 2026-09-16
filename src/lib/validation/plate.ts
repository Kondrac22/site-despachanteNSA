// Remove espaços, hífens e deixa maiúsculo, para aceitar tanto
// "ABC1234" quanto "abc-1234" ou "ABC 1234" digitados pelo usuário.
export function normalizePlate(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Formato antigo: 3 letras + 4 números (ABC1234)
const OLD_FORMAT = /^[A-Z]{3}[0-9]{4}$/;

// Formato Mercosul: 3 letras + 1 número + 1 letra + 2 números (ABC1D23)
const MERCOSUL_FORMAT = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

export function isValidPlate(plate: string): boolean {
  return OLD_FORMAT.test(plate) || MERCOSUL_FORMAT.test(plate);
}
