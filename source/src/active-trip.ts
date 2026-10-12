// A single user-started return card, not location/time/completion history.
export const ACTIVE_TRIP_KEY = "pft-active-trip-v1";
export type ActiveTrip = {
  schema: 1;
  token: string;
  taskId: string;
  taskVersion: string;
};
export type TripRead =
  | { kind: "empty"; raw: null }
  | { kind: "valid"; raw: string; trip: ActiveTrip }
  | { kind: "invalid"; raw: string }
  | { kind: "unreadable" };
export function parseActiveTrip(raw: string | null): TripRead {
  if (raw === null) return { kind: "empty", raw };
  try {
    if (raw.length > 1024) return { kind: "invalid", raw };
    const value = JSON.parse(raw);
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.keys(value).sort().join() !== "schema,taskId,taskVersion,token" ||
      value.schema !== 1 ||
      typeof value.token !== "string" ||
      !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value.token) ||
      typeof value.taskId !== "string" ||
      !/^[a-z0-9-]{1,80}$/.test(value.taskId) ||
      typeof value.taskVersion !== "string" ||
      !/^[a-zA-Z0-9.+-]{1,80}$/.test(value.taskVersion)
    )
      return { kind: "invalid", raw };
    return { kind: "valid", raw, trip: value };
  } catch {
    return { kind: "invalid", raw };
  }
}
export function readActiveTrip(storage: Pick<Storage, "getItem">): TripRead {
  try {
    return parseActiveTrip(storage.getItem(ACTIVE_TRIP_KEY));
  } catch {
    return { kind: "unreadable" };
  }
}
export type TripWrite = "saved" | "changed" | "unconfirmed" | "failed";
// Optimistic synchronous byte guard, not a simultaneous-tab transaction.
export function changeActiveTrip(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  expected: string | null,
  next: ActiveTrip | null,
): TripWrite {
  try {
    if (storage.getItem(ACTIVE_TRIP_KEY) !== expected) return "changed";
    const raw = next ? JSON.stringify(next) : null;
    if (next && parseActiveTrip(raw).kind !== "valid") return "failed";
    if (raw === null) storage.removeItem(ACTIVE_TRIP_KEY);
    else storage.setItem(ACTIVE_TRIP_KEY, raw);
    return storage.getItem(ACTIVE_TRIP_KEY) === raw ? "saved" : "unconfirmed";
  } catch {
    return "failed";
  }
}
