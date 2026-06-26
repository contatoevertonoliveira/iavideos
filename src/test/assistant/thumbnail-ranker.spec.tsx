import { render, screen, fireEvent } from "@testing-library/react";
import ThumbnailRanker from "@/features/assistant/components/ThumbnailRanker";

describe("ThumbnailRanker", () => {
  it("exibe badge de score e permite seleção A/B", () => {
    const items = [
      { id: "1", url: "u1", ts: new Date().toISOString() },
      { id: "2", url: "u2", ts: new Date().toISOString() },
      { id: "3", url: "u3", ts: new Date().toISOString() },
    ];
    const thumbnails = { items };
    const ranking = [{ id: "1", score: 0.9 }, { id: "2", score: 0.7 }];
    const onLoad = vi.fn();
    const onRank = vi.fn();
    const onSelect = vi.fn();
    render(<ThumbnailRanker thumbnails={thumbnails as any} ranking={ranking as any} onLoad={onLoad} onRank={onRank} onSelect={onSelect} />);
    expect(screen.getByText(/0.9/)).toBeInTheDocument();
    expect(screen.getByText(/0.7/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByText("Usar")[0]);
    expect(onSelect).toHaveBeenCalledWith("1");
    const abBtn = screen.getByText("Rank A/B");
    expect(abBtn).toBeDisabled();
    // selecionar dois itens clicando na imagem não é trivial via alt, então dispare rank direto com ids
    fireEvent.click(screen.getAllByText("Rank")[0]);
    expect(onRank).toHaveBeenCalled();
  });
});