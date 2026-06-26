import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ExportButtons from "./components/ExportButtons";

vi.mock("html2canvas", () => ({
  default: vi.fn(async () => ({ toDataURL: () => "data:image/png;base64,MOCK" })),
}));

describe("ExportButtons", () => {
  it("dispara exportação PNG usando html2canvas e clica no anchor", async () => {
    const ref = { current: document.createElement("div") } as React.RefObject<HTMLElement>;
    document.body.appendChild(ref.current!);

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<ExportButtons targetRef={ref} csvName="overview_2025-01-01_2025-01-07.csv" csvData={[]} />);

    await screen.findByText("Exportar PNG");
    await screen.findByText("Exportar CSV");

    await (await screen.findByText("Exportar PNG")).click();

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("gera CSV quando há dados e clica no anchor", async () => {
    const data = [
      { date: "2025-01-01", views: 100, impressions: 1000 },
      { date: "2025-01-02", views: 120, impressions: 1100 },
    ];

    const createSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<ExportButtons csvName="compare_2025-01-01_2025-01-07.csv" csvData={data} />);

    await (await screen.findByText("Exportar CSV")).click();

    expect(createSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalled();

    createSpy.mockRestore();
    revokeSpy.mockRestore();
    clickSpy.mockRestore();
  });
});