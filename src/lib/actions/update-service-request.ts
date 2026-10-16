"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidPlate, normalizePlate } from "@/lib/validation/plate";

export type ActionResult = { success: true } | { success: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.active || profile.role !== "admin") return null;
  return profile;
}

export async function updateServiceRequest(
  serviceRequestId: string,
  input: { plate: string; serviceTypeId: string; unitId: string; notes: string }
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return {
      success: false,
      error: "Apenas administradores podem editar serviços.",
    };
  }

  const supabase = await createClient();

  const { data: serviceRequest } = await supabase
    .from("service_requests")
    .select(
      "id, plate, protocol, status, notes, service_type_id, unit_id, service_types ( name ), units ( name )"
    )
    .eq("id", serviceRequestId)
    .single();

  if (!serviceRequest) {
    return { success: false, error: "Serviço não encontrado." };
  }

  // Serviço finalizado pode ter gerado movimentação de estoque e valor
  // cobrado — mexer na placa ou no tipo depois disso deixaria tudo
  // inconsistente.
  if (serviceRequest.status === "FINALIZADO") {
    return {
      success: false,
      error: "Não é possível editar um serviço já finalizado.",
    };
  }

  const plate = normalizePlate(input.plate);
  if (!isValidPlate(plate)) {
    return {
      success: false,
      error: "Placa inválida. Use o formato ABC1234 ou ABC1D23.",
    };
  }

  const notes = input.notes.trim().slice(0, 2000);
  const currentNotes = (serviceRequest.notes ?? "").trim();

  const changes: string[] = [];
  const update: Record<string, unknown> = {};

  if (plate !== serviceRequest.plate) {
    update.plate = plate;
    changes.push(`Placa: ${serviceRequest.plate} → ${plate}`);
  }

  if (input.serviceTypeId !== serviceRequest.service_type_id) {
    const { data: newType } = await supabase
      .from("service_types")
      .select("id, name")
      .eq("id", input.serviceTypeId)
      .eq("active", true)
      .single();

    if (!newType) {
      return { success: false, error: "Tipo de serviço inválido." };
    }

    const oldTypeName: string =
      (serviceRequest as any).service_types?.name ?? "—";
    update.service_type_id = newType.id;
    changes.push(`Tipo: ${oldTypeName} → ${newType.name}`);
  }

  // Trocar de unidade gera um protocolo novo, com o código e o próximo
  // número da unidade de destino (igual à criação do serviço).
  if (input.unitId && input.unitId !== serviceRequest.unit_id) {
    const { data: newUnit } = await supabase
      .from("units")
      .select("id, name, code")
      .eq("id", input.unitId)
      .eq("active", true)
      .single();

    if (!newUnit) {
      return { success: false, error: "Unidade inválida." };
    }

    if (!newUnit.code) {
      return {
        success: false,
        error:
          "A unidade escolhida ainda não tem um código de protocolo configurado. Configure em Unidades.",
      };
    }

    const { data: nextNumber, error: protocolError } = await supabase.rpc(
      "increment_unit_protocol",
      { p_unit_id: newUnit.id }
    );

    if (protocolError || nextNumber == null) {
      console.error("increment_unit_protocol error:", protocolError?.message);
      return {
        success: false,
        error: "Não foi possível gerar o número de protocolo. Tente novamente.",
      };
    }

    const protocol = `${newUnit.code}-${String(nextNumber).padStart(4, "0")}`;
    const oldUnitName: string = (serviceRequest as any).units?.name ?? "—";
    update.unit_id = newUnit.id;
    update.protocol = protocol;
    changes.push(`Unidade: ${oldUnitName} → ${newUnit.name}`);
    changes.push(`Protocolo: ${serviceRequest.protocol ?? "—"} → ${protocol}`);
  }

  if (notes !== currentNotes) {
    update.notes = notes || null;
    changes.push("Observações alteradas");
  }

  if (changes.length === 0) {
    return { success: false, error: "Nenhuma alteração para salvar." };
  }

  update.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("service_requests")
    .update(update)
    .eq("id", serviceRequestId);

  if (error) {
    console.error("updateServiceRequest error:", error.message);
    return { success: false, error: "Não foi possível salvar as alterações." };
  }

  await supabase.from("service_history").insert({
    service_request_id: serviceRequestId,
    user_id: admin.id,
    action: "EDITADO",
    description: changes.join("; "),
  });

  revalidatePath(`/flow/servicos/${serviceRequestId}`);
  revalidatePath("/flow/servicos");
  revalidatePath("/flow");
  revalidatePath("/flow/estoque");
  return { success: true };
}
