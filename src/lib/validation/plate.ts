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

// Filtra o que é digitado no campo de placa, caractere por caractere:
// 3 letras, 1 número, 1 letra ou número (Mercosul ou antiga) e 2 números.
// O que não cabe naquela posição é ignorado, então o campo nunca passa
// de 7 caracteres nem aceita, por exemplo, número no lugar de letra.
export function sanitizePlateInput(raw: string): string {
  let result = "";
  for (const char of normalizePlate(raw)) {
    const position = result.length;
    if (position >= 7) break;
    const isLetter = /[A-Z]/.test(char);
    const isDigit = /[0-9]/.test(char);
    const fits =
      position < 3
        ? isLetter
        : position === 4
          ? isLetter || isDigit
          : isDigit;
    if (fits) result += char;
  }
  return result;
}
