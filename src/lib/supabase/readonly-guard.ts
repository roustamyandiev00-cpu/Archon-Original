import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const BLOCKED_WRITE_METHODS = new Set(["insert", "update", "upsert", "delete"]);

function blocked(): never {
  throw new Error(
    "Alleen-lezen weergave: wijzigingen zijn uitgeschakeld tijdens 'Bekijk als bedrijf'.",
  );
}

/**
 * Wraps a (service-role) Supabase client so every write entry point throws,
 * regardless of which code path reached it. Defense-in-depth for impersonated
 * read-only sessions: even a write action that forgets to call
 * requireWriteAccess() cannot mutate data through this client.
 */
export function withReadOnlyGuard(
  client: SupabaseClient<Database>,
): SupabaseClient<Database> {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "from") {
        return (...args: Parameters<SupabaseClient<Database>["from"]>) => {
          const builder = Reflect.apply(target.from, target, args);
          return new Proxy(builder, {
            get(builderTarget, builderProp, builderReceiver) {
              if (
                typeof builderProp === "string" &&
                BLOCKED_WRITE_METHODS.has(builderProp)
              ) {
                return blocked;
              }
              const value = Reflect.get(builderTarget, builderProp, builderReceiver);
              return typeof value === "function" ? value.bind(builderTarget) : value;
            },
          });
        };
      }
      if (prop === "rpc") {
        return blocked;
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
