import { Data } from "effect";

export class FetchError extends Data.TaggedError("FetchError")<{
  message: string;
  cause?: unknown;
}> {}

export class ReadBodyError extends Data.TaggedError("ReadBodyError")<{
  message: string;
  cause?: unknown;
}> {}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  message: string;
  cause?: unknown;
}> {}
