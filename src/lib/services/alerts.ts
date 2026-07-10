import { supabase } from "../supabase";

export type AvailabilityGender = "Male" | "Female";
export type AvailabilityStatus =
  | "active" |"expired" |"grouped" |"cancelled";

export type AvailabilityResponse = "accepted" | "declined";

export type AvailabilityActor = {
  id: string;
  area_id: string;
  gender: AvailabilityGender;
  role?: string;
  status?: string;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
};

export type CreateAvailabilityResult =
  | {
      created: true;
      message: "Visit availability created.";
      alert: any;
    }
  | {
      created: false;
      message: "Another member is already available.";
      alert: any;
    };

const ACTIVE_AVAILABILITY_MINUTES = 4;
const ACTIVE_AVAILABILITY_MS =
  ACTIVE_AVAILABILITY_MINUTES * 60 * 1000;

function assertCanUseAvailabilityWorkflow(
  actor: AvailabilityActor
) {
  if (actor.role === "main") {
    throw new Error(
      "Main admin is not part of availability workflow."
    );
  }

  if (actor.status && actor.status !== "approved") {
    throw new Error(
      "Only approved members can use availability."
    );
  }
}

export function getAvailabilityExpiresAt(
  createdAt: string
) {
  return new Date(
    new Date(createdAt).getTime() + ACTIVE_AVAILABILITY_MS
  ).toISOString();
}

export async function expireOldActiveAlerts() {
  const expiresBefore = new Date(
    Date.now() - ACTIVE_AVAILABILITY_MS
  ).toISOString();

  const { data, error } = await supabase
    .from("alerts")
    .update({
      status: "expired",
    })
    .eq("status", "active")
    .lt("created_at", expiresBefore)
    .select();

  if (error) throw error;

  return data ?? [];
}

export async function createAlert(
  currentUser: AvailabilityActor
): Promise<CreateAvailabilityResult> {
  assertCanUseAvailabilityWorkflow(currentUser);

  await expireOldActiveAlerts();

  const { data: existingAlert, error: existingError } =
    await supabase
      .from("alerts")
      .select("*")
      .eq("area_id", currentUser.area_id)
      .eq("gender", currentUser.gender)
      .eq("status", "active")
      .maybeSingle();

  if (existingError) throw existingError;

  if (existingAlert) {
    return {
      created: false,
      message:
        "Another member is already available.",
      alert: existingAlert,
    };
  }

  const { data, error } = await supabase
    .from("alerts")
    .insert({
      sender_id: currentUser.id,
      area_id: currentUser.area_id,
      gender: currentUser.gender,
      latitude:
        currentUser.latitude ??
        currentUser.lat ??
        null,
      longitude:
        currentUser.longitude ??
        currentUser.lng ??
        null,
      status: "active",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return {
    created: true,
    message: "Visit availability created.",
    alert: data,
  };
}

export async function getActiveAlertsForUser(
  currentUser: AvailabilityActor
) {
  await expireOldActiveAlerts();

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("area_id", currentUser.area_id)
    .eq("gender", currentUser.gender)
    .eq("status", "active")
    .neq("sender_id", currentUser.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data ?? [];
}

export async function getActiveAlertsByGender(
  areaId: string,
  gender: AvailabilityGender
) {
  await expireOldActiveAlerts();

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("area_id", areaId)
    .eq("gender", gender)
    .eq("status", "active")
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data ?? [];
}

export async function getAlertHistory(
  areaId?: string,
  gender?: AvailabilityGender
) {
  await expireOldActiveAlerts();

  let query = supabase
    .from("alerts")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (areaId) {
    query = query.eq("area_id", areaId);
  }

  if (gender) {
    query = query.eq("gender", gender);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data ?? [];
}
export async function updateAlertStatus(
  id: string,
  status: AvailabilityStatus
) {
  const { data, error } = await supabase
    .from("alerts")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function acknowledgeAlert(
  alertId: string,
  memberId: string,
  response: AvailabilityResponse
) {
  const { data, error } = await supabase
    .from("alert_responses")
    .upsert(
      {
        alert_id: alertId,
        member_id: memberId,
        response,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "alert_id,member_id",
      }
    )
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getAcceptedMembers(alertId: string) {
  const { data, error } = await supabase
    .from("alert_responses")
    .select(`
      member_id,
      profiles!alert_responses_member_id_fkey(
        id,
        name
      )
    `)
    .eq("alert_id", alertId)
    .eq("response", "accepted");

  if (error) throw error;

  return data ?? [];
}

export function subscribeToNewAvailabilityAlerts(
  currentUser: AvailabilityActor,
  callback: (alert: any) => void
) {
  const channel = supabase
    .channel(
      `availability-${currentUser.area_id}-${currentUser.gender}`
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "alerts",
      },
      (payload) => {
        const alert = payload.new as any;

        if (
          alert.area_id === currentUser.area_id &&
          alert.gender === currentUser.gender &&
          alert.status === "active" &&
          alert.sender_id !== currentUser.id
        ) {
          callback(alert);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToAlertResponses(
  alertId: string,
  callback: () => void
) {
  const channel = supabase
    .channel(`responses-${alertId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "alert_responses",
        filter: `alert_id=eq.${alertId}`,
      },
      () => callback()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}