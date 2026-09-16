"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function CreatedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("created") === "1") {
      toast.success("Serviço solicitado com sucesso!");
      const params = new URLSearchParams(searchParams.toString());
      params.delete("created");
      const query = params.toString();
      router.replace(`/prestacao-servicos${query ? `?${query}` : ""}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
