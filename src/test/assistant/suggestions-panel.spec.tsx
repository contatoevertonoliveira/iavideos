import { render, screen, fireEvent } from "@testing-library/react";
import SuggestionsPanel from "@/features/assistant/components/SuggestionsPanel";

describe("SuggestionsPanel", () => {
  it("renderiza card geral e variações e aciona ações", () => {
    const lastSuggest = { title: "Título Sugerido", description: "Desc Sugerida", tags: ["a","b"] };
    const draft = { platformVariants: { youtube: { title: "YT Title", description: "YT Desc", tags: ["yt"] } } } as any;
    const adoptVariant = vi.fn();
    const onCopy = vi.fn();
    const onRefine = vi.fn();
    render(<SuggestionsPanel lastSuggest={lastSuggest} draft={draft} adoptVariant={adoptVariant} onCopy={onCopy} onRefine={onRefine} />);
    expect(screen.getByText("Sugerido (Geral)")).toBeInTheDocument();
    expect(screen.getByText("YT Title")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Usar"));
    expect(adoptVariant).toHaveBeenCalled();
    fireEvent.click(screen.getAllByText("Copiar")[0]);
    expect(onCopy).toHaveBeenCalled();
    fireEvent.click(screen.getAllByText("Refinar com…")[0]);
    expect(onRefine).toHaveBeenCalled();
  });
});