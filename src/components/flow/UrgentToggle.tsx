"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setServiceUrgency } from "@/lib/actions/toggle-urgent";

export default function UrgentToggle({
  serviceRequestId,
  isUrgent,
}: {
  serviceRequestId: string;
  isUrgent: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await setServiceUrgency(serviceRequestId, !isUrgent);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isUrgent ? "Urgência removida." : "Marcado como urgente.");
    router.refresh();
  }

  return (
    <Button
      variant={isUrgent ? "outline" : "destructive"}
      disabled={loading}
      onClick={handleClick}
    >
      {isUrgent ? "Remover urgência" : "Marcar como urgente"}
    </Button>
  );
}
