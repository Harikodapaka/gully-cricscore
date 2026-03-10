export const MATCH_STATUS = {
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
} as const;

export const INNINGS = {
  FIRST: 1,
  SECOND: 2,
} as const;

export const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
