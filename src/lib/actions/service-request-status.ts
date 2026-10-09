"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  STATUS_WITH_REASON,
  type ServiceStatus as Status,
} from "@/lib/constants/service-status";

export type ChangeStatusResult =
  | { success: true; duplicateConfirmNeeded?: boolean; plate?: string }
  | { success: false; error: string };

const ALLOWED_TRANSITIONS: Record<Status, Status[]> = {
  A_FAZER: ["PARADO", "PENDENTE_DOCUMENTO", "FINALIZADO"],
  PARADO: ["A_FAZER"],
  PENDENTE_DOCUMENTO: ["A_FAZER", "FINALIZADO"],
  FINALIZADO: [],
};

async function getAuthedProfile(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
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
  newStatus: Status,
  options?: { reason?: string }
): Promise<ChangeStatusResult> {
  const supabase = await createClient();
  const profile = await getAuthedProfile(supabase);
  if (!profile) return { success: false, error: "Sessão inválida." };

  const { data: serviceRequest } = await supabase
    .from("service_requests")
    .select("id, plate, status, created_by, service_types ( name )")
    .eq("id", serviceRequestId)
    .single();

  if (!serviceRequest) {
    return { success: false, error: "Serviço não encontrado." };
  }

  // Checagem explícita de permissão — antes disso dependíamos só do
  // banco recusar silenciosamente, o que podia mostrar "sucesso" sem
  // nada ter realmente mudado.
  const isAdmin = profile.role === "admin";
  if (!isAdmin && serviceRequest.created_by !== profile.id) {
    return {
      success: false,
      error: "Você não tem permissão para alterar este serviço.",
    };
  }

  // Só administrador finaliza serviço (o banco também confere isso, ver
  // supabase/finalizar-somente-admin.sql).
  if (newStatus === "FINALIZADO" && !isAdmin) {
    return {
      success: false,
      error: "Somente administradores podem finalizar um serviço.",
    };
  }

  const currentStatus = serviceRequest.status as Status;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error: `Não é possível mudar de ${currentStatus} para ${newStatus}.`,
    };
  }

  let reason: string | null = null;
  if (STATUS_WITH_REASON.includes(newStatus)) {
    reason = options?.reason?.trim() ?? "";
    if (reason.length < 3) {
      return {
        success: false,
        error:
          newStatus === "PARADO"
            ? "Informe o motivo da parada (mínimo 3 caracteres)."
            : "Informe qual documento está pendente (mínimo 3 caracteres).",
      };
    }
  }

  let duplicateConfirmNeeded = false;

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
        return {
          success: false,
          error: "Este veículo não está ativo no estoque no momento.",
        };
      }

      if (isEntry && isActive) {
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

  const { error: updateError } = await supabase
    .from("service_requests")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
      finished_at: finishedAt,
      stopped_reason: reason,
    })
    .eq("id", serviceRequestId);

  // Antes o resultado não era conferido e a tela mostrava "Status
  // atualizado" mesmo quando o banco recusava a mudança.
  if (updateError) {
    console.error("changeServiceStatus update error:", updateError.message);
    return {
      success: false,
      error: "Não foi possível alterar o status. Tente novamente.",
    };
  }

  await supabase.from("service_history").insert({
    service_request_id: serviceRequestId,
    user_id: profile.id,
    action: "STATUS_ALTERADO",
    old_value: currentStatus,
    new_value: newStatus,
    description:
      newStatus === "PARADO"
        ? `Motivo: ${reason}`
        : newStatus === "PENDENTE_DOCUMENTO"
          ? `Documento pendente: ${reason}`
          : null,
  });

  revalidatePath(`/flow/servicos/${serviceRequestId}`);
  revalidatePath("/flow/servicos");
  revalidatePath("/flow");

  return {
    success: true,
    duplicateConfirmNeeded,
    plate: serviceRequest.plate,
  };
}

export async function confirmDuplicateVehicleEntry(
  serviceRequestId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const profile = await getAuthedProfile(supabase);
  if (!profile) return { success: false, error: "Sessão inválida." };

  const { data: serviceRequest } = await supabase
    .from("service_requests")
    .select("id, plate, created_by")
    .eq("id", serviceRequestId)
    .single();

  if (!serviceRequest) {
    return { success: false, error: "Serviço não encontrado." };
  }

  const isAdmin = profile.role === "admin";
  if (!isAdmin && serviceRequest.created_by !== profile.id) {
    return {
      success: false,
      error: "Você não tem permissão para alterar este serviço.",
    };
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

  revalidatePath(`/flow/servicos/${serviceRequestId}`);
  revalidatePath("/flow");

  return { success: true };
}
