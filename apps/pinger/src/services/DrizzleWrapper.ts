import { db } from "@ping-status/db";
import { Data, Effect } from "effect";

// there shouldn't be errors about duplicate keys, unique violations, etc.
// so every error thrown is a _defect_
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  message: string;
  cause?: unknown;
}> {}

export class DrizzleWrapper extends Effect.Service<DrizzleWrapper>()(
  "DrizzleWrapper",
  {
    sync: () => {
      return {
        query: <T>(queryFn: (drizzle: typeof db) => Promise<T>) =>
          Effect.tryPromise({
            try: () => queryFn(db),
            catch: (error: unknown) =>
              new DatabaseError({
                message:
                  error instanceof Error ? error.message : "Unknown error",
                cause: error,
              }),
          }),
      };
    },
  }
) {}
