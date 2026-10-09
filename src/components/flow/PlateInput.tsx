"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { isValidPlate, sanitizePlateInput } from "@/lib/validation/plate";
import { cn } from "@/lib/utils";

const INVALID_MESSAGE =
  "Placa inválida. Use 3 letras e 4 caracteres: ABC1234 ou ABC1D23.";

// Campo de placa: só deixa digitar o que forma uma placa (antiga ou
// Mercosul) e impede o envio do formulário enquanto ela estiver incompleta.
export default function PlateInput({
  id,
  name,
  defaultValue = "",
  className,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  className?: string;
}) {
  const [value, setValue] = useState(sanitizePlateInput(defaultValue));
  const [touched, setTouched] = useState(false);
  const invalid = touched && value.length > 0 && !isValidPlate(value);

  return (
    <div className="space-y-1">
      <Input
        id={id}
        name={name}
        required
        value={value}
        placeholder="ABC1D23"
        maxLength={7}
        autoComplete="off"
        aria-invalid={invalid}
        onChange={(e) => {
          const next = sanitizePlateInput(e.target.value);
          setValue(next);
          // Mensagem que o navegador mostra ao tentar enviar.
          e.target.setCustomValidity(
            next.length === 0 || isValidPlate(next) ? "" : INVALID_MESSAGE
          );
        }}
        onBlur={() => setTouched(true)}
        onInvalid={(e) => {
          setTouched(true);
          if (!value) e.currentTarget.setCustomValidity("Informe a placa.");
        }}
        className={cn("font-mono uppercase", className)}
      />
      {invalid && (
        <p className="text-xs text-destructive">Placa incompleta.</p>
      )}
    </div>
  );
}
