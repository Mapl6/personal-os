import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { DurationInput } from "@/components/shared/duration-input";
import { WeekdayPicker } from "@/components/shared/field";

function Harness({ initial = 60 }: { initial?: number }) {
  const [v, setV] = React.useState(initial);
  return (
    <>
      <DurationInput value={v} onChange={setV} id="d" />
      <output data-testid="value">{v}</output>
    </>
  );
}

describe("DurationInput", () => {
  it("parses free text like 1h30", async () => {
    render(<Harness />);
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "1h30");
    expect(screen.getByTestId("value")).toHaveTextContent("90");
  });

  it("applies presets and flags invalid input", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "2h" }));
    expect(screen.getByTestId("value")).toHaveTextContent("120");
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "abc");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByTestId("value")).toHaveTextContent("120");
  });
});

describe("WeekdayPicker", () => {
  it("toggles days with accessible pressed state", async () => {
    function H() {
      const [v, setV] = React.useState([1]);
      return <WeekdayPicker value={v} onChange={setV} />;
    }
    render(<H />);
    const monday = screen.getByRole("button", { name: "Monday" });
    const thursday = screen.getByRole("button", { name: "Thursday" });
    expect(monday).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(thursday);
    expect(thursday).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(monday);
    expect(monday).toHaveAttribute("aria-pressed", "false");
  });
});
