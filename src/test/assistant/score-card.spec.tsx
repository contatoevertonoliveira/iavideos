import { render, screen, fireEvent } from "@testing-library/react";
import ScoreCard from "@/features/assistant/components/ScoreCard";

describe("ScoreCard", () => {
  it("renderiza e aplica quick fix", () => {
    const score = { score: 80, gauges: { readability: 70, keywordDensity: 60, length: 90 }, issues: [{ id: "title-length", severity: "medium", message: "Título excede", fix: "Encurtar" }] } as any;
    const onFix = vi.fn();
    render(<ScoreCard score={score} onFix={onFix} />);
    fireEvent.click(screen.getByText("Aplicar"));
    expect(onFix).toHaveBeenCalledWith("title-length");
  });
});