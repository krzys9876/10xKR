import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Automatyczne czyszczenie po każdym teście
afterEach(() => {
  cleanup();
});
