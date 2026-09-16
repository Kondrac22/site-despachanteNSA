"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Status = "PARADO" | "A_FAZER" | "FINALIZADO";

export type ChangeStatusResult =
  | { success: true; duplicateConfirmNeeded?: boolean; plate?: string }
  | { success: false; error: string };

// Fluxo permitido: A_FAZER <-> PARADO, e A_FAZER -> FINALIZADO.
// Uma vez FINALIZADO, não é permitido mudar de status novamente.
const ALLOWED_TRANSITIONS: Record<Status, Status[]> = {
  A_FAZER: ["PARADO", "FINALIZADO"],
  PARADO: ["A_FAZER"],
  FINALIZADO: [],
};

async function getAuthedProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.active) return null;
  return profile;
}

export async function changeServiceStatus(
  serviceRequestId: string,
  newStatus: Status
): Promise<ChangeStatusResult> {
  const supabase = await createClient();
  const profile = await getAuthedProfile(supabase);
  if (!profile) return { success: false, error: "Sessão inválida." };

  const { data: serviceRequest } = await supabase
    .from("service_requests")
    .select("id, plate, status, service_types ( name )")
    .eq("id", serviceRequestId)
    .single();

  if (!serviceRequest) {
    return { success: false, error: "Serviço não encontrado." };
  }

  const currentStatus = serviceRequest.status as Status;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error: `Não é possível mudar de ${currentStatus} para ${newStatus}.`,
    };
  }

  let duplicateConfirmNeeded = false;

  // Integração com o estoque só acontece ao finalizar (FASE 26/27).
  if (newStatus === "FINALIZADO") {
    const typeName: string =
      (serviceRequest as any).service_types?.name ?? "";
    const isEntry = /entrada/i.test(typeName);
    const isExit = /sa[ií]da/i.test(typeName);

    if (isEntry || isExit) {
      let { data: vehicle } = await supabase
        .from("vehicles")
        .select("id")
        .eq("plate", serviceRequest.plate)
        .maybeSingle();

      if (!vehicle) {
        const { data: newVehicle } = await supabase
          .from("vehicles")
          .insert({ plate: serviceRequest.plate })
          .select("id")
          .single();
        vehicle = newVehicle;
      }

      const { data: lastMovement } = await supabase
        .from("vehicle_movements")
        .select("movement_type")
        .eq("vehicle_id", vehicle!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const isActive = lastMovement?.movement_type === "ENTRY";

      if (isExit && !isActive) {
        // Bloqueia a finalização: não dá pra tirar do estoque um veículo
        // que não está lá.
        return {
          success: false,
          error: "Este veículo não está ativo no estoque no momento.",
        };
      }

      if (isEntry && isActive) {
        // Não insere agora — espera a confirmação do usuário (alerta de
        // duplicidade). O serviço é finalizado normalmente de qualquer forma.
        duplicateConfirmNeeded = true;
      } else {
        await supabase.from("vehicle_movements").insert({
          vehicle_id: vehicle!.id,
          movement_type: isEntry ? "ENTRY" : "EXIT",
          service_request_id: serviceRequest.id,
          user_id: profile.id,
        });
        await supabase.from("service_history").insert({
          service_request_id: serviceRequest.id,
          user_id: profile.id,
          action: isEntry ? "ENTRADA_ESTOQUE" : "SAIDA_ESTOQUE",
          description: `Placa ${serviceRequest.plate}`,
        });
      }
    }
  }

  const finishedAt =
    newStatus === "FINALIZADO" ? new Date().toISOString() : null;

  await supabase
    .from("service_requests")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
      finished_at: finishedAt,
    })
    .eq("id", serviceRequestId);

  await supabase.from("service_history").insert({
    service_request_id: serviceRequestId,
    user_id: profile.id,
    action: "STATUS_ALTERADO",
    old_value: currentStatus,
    new_value: newStatus,
  });

  revalidatePath(`/prestacao-servicos/servicos/${serviceRequestId}`);
  revalidatePath("/prestacao-servicos/servicos");
  revalidatePath("/prestacao-servicos");

  return { success: true, duplicateConfirmNeeded, plate: serviceRequest.plate };
}

export async function confirmDuplicateVehicleEntry(
  serviceRequestId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const profile = await getAuthedProfile(supabase);
  if (!profile) return { success: false, error: "Sessão inválida." };

  const { data: serviceRequest } = await supabase
    .from("service_requests")
    .select("id, plate")
    .eq("id", serviceRequestId)
    .single();

  if (!serviceRequest) {
    return { success: false, error: "Serviço não encontrado." };
  }

  let { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("plate", serviceRequest.plate)
    .maybeSingle();

  if (!vehicle) {
    const { data: newVehicle } = await supabase
      .from("vehicles")
      .insert({ plate: serviceRequest.plate })
      .select("id")
      .single();
    vehicle = newVehicle;
  }

  await supabase.from("vehicle_movements").insert({
    vehicle_id: vehicle!.id,
    movement_type: "ENTRY",
    service_request_id: serviceRequest.id,
    user_id: profile.id,
    is_duplicate_entry: true,
    authorized_by: profile.id,
  });

  await supabase.from("service_history").insert({
    service_request_id: serviceRequest.id,
    user_id: profile.id,
    action: "ENTRADA_DUPLICADA",
    description: `Placa ${serviceRequest.plate} — entrada duplicada autorizada`,
  });

  revalidatePath(`/prestacao-servicos/servicos/${serviceRequestId}`);
  revalidatePath("/prestacao-servicos");

  return { success: true };
}
