/**
 * Extracts a plain string ID from a value that may be:
 * - A populated Mongoose document (has ._id)
 * - A raw ObjectId
 * - A string
 * - undefined / null
 *
 * Use this wherever battingTeamId, bowlingTeamId, wonBy etc. are used
 * as map keys or index lookups, since Mongoose populate() can return
 * either the raw ObjectId or the full document depending on the query.
 */
export const toId = (val: unknown): string =>
  String(
    val && typeof val === "object" && "_id" in val
      ? (val as { _id: unknown })._id
      : val,
  );
