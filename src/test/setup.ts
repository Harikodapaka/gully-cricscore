import "@testing-library/jest-dom";
import { vi } from "vitest";

// Suppress console noise from intentional error-path tests.
// Routes log via console.error/warn when they hit 4xx/5xx branches.
// These are expected in tests; silence them to keep output clean.
vi.spyOn(console, "error").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
