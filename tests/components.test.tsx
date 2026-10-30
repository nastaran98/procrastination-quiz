import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AppProvider } from "@/store/provider";
import { Game } from "@/components/games";
import { STORAGE_KEY } from "@/lib/storage";
vi.mock("motion/react", () => ({ motion: { div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div> }, useReducedMotion: () => true }));
it("celebrates an entered win and recovers it without a duplicate reward", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ enabled: false }) }));
  const { unmount } = render(<AppProvider><Game id="celebrate-wins" /></AppProvider>);
  await screen.findByLabelText("My little win");
  fireEvent.change(screen.getByLabelText("My little win"), { target: { value: "I wrote one sentence" } });
  fireEvent.click(screen.getByRole("button", { name: "Celebrate My Win" }));
  await screen.findByText("That’s a real step!");
  await waitFor(() => expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).events).toHaveLength(1));
  unmount(); render(<AppProvider><Game id="celebrate-wins" /></AppProvider>);
  await screen.findByText("That’s a real step!");
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).events).toHaveLength(1);
});
