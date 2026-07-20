import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const BLOCKED_WRITE_METHODS = new Set(["insert", "update", "upsert", "delete"]);
const BLOCKED_STORAGE_METHODS = new Set([
  "copy",
  "createSignedUploadUrl",
  "move",
  "remove",
  "update",
  "upload",
]);

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
      if (prop === "functions") {
        return new Proxy(target.functions, {
          get(functionsTarget, functionsProp, functionsReceiver) {
            if (functionsProp === "invoke") return blocked;
            const value = Reflect.get(
              functionsTarget,
              functionsProp,
              functionsReceiver,
            );
            return typeof value === "function" ? value.bind(functionsTarget) : value;
          },
        });
      }
      if (prop === "storage") {
        return new Proxy(target.storage, {
          get(storageTarget, storageProp, storageReceiver) {
            if (storageProp === "from") {
              return (...args: Parameters<typeof storageTarget.from>) => {
                const bucket = Reflect.apply(storageTarget.from, storageTarget, args);
                return new Proxy(bucket, {
                  get(bucketTarget, bucketProp, bucketReceiver) {
                    if (
                      typeof bucketProp === "string" &&
                      BLOCKED_STORAGE_METHODS.has(bucketProp)
                    ) {
                      return blocked;
                    }
                    const value = Reflect.get(
                      bucketTarget,
                      bucketProp,
                      bucketReceiver,
                    );
                    return typeof value === "function"
                      ? value.bind(bucketTarget)
                      : value;
                  },
                });
              };
            }
            const value = Reflect.get(storageTarget, storageProp, storageReceiver);
            return typeof value === "function" ? value.bind(storageTarget) : value;
          },
        });
      }
      if (prop === "auth") {
        return new Proxy(target.auth, {
          get(authTarget, authProp, authReceiver) {
            if (authProp === "admin") {
              return new Proxy({}, { get: () => blocked });
            }
            const value = Reflect.get(authTarget, authProp, authReceiver);
            return typeof value === "function" ? value.bind(authTarget) : value;
          },
        });
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
