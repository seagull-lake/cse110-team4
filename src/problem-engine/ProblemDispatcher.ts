import type { ProblemRequest, ProblemResult } from "../domain/problem.ts";

/** Contract for routing a game request to the matching arithmetic generator. */
export interface ProblemDispatcher {
  generate(request: ProblemRequest): ProblemResult;
}
