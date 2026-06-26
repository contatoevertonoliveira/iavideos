import { render, screen, fireEvent } from "@testing-library/react";
import ActionBar from "@/features/assistant/components/ActionBar";

describe("ActionBar", () => {
  it("aciona aplicar, salvar rascunho e descartar", () => {
    const onApply = vi.fn();
    const onSaveDraft = vi.fn();
    const onDiscard = vi.fn();
    render(<ActionBar loading={false} onApply={onApply} onSaveDraft={onSaveDraft} onDiscard={onDiscard} />);
    fireEvent.click(screen.getByText("Aplicar ao Post"));
    fireEvent.click(screen.getByText("Salvar rascunho"));
    fireEvent.click(screen.getByText("Descartar"));
    expect(onApply).toHaveBeenCalled();
    expect(onSaveDraft).toHaveBeenCalled();
    expect(onDiscard).toHaveBeenCalled();
  });
});