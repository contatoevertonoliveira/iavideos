import { render, screen } from "@testing-library/react";
import BestTimes from "@/features/assistant/components/BestTimes";

describe("BestTimes", () => {
  it("renderiza timezone e lista top 3 com confidência", () => {
    const now = new Date().toISOString();
    const data = { timezone: "America/Sao_Paulo", times: [
      { datetime: now, confidence: 90 },
      { datetime: now, confidence: 80 },
      { datetime: now, confidence: 70 },
      { datetime: now, confidence: 60 },
    ] };
    render(<BestTimes bestTimes={data as any} onLoad={() => {}} />);
    expect(screen.getByText(/Timezone: America\/Sao_Paulo/)).toBeInTheDocument();
    expect(screen.getAllByText(/conf:/).length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText(/Sem recomendações/)).toBeNull();
  });
});