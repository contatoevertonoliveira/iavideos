import { render, screen } from "@testing-library/react";
import ComplianceChecklist from "@/features/assistant/components/ComplianceChecklist";

describe("ComplianceChecklist", () => {
  it("marca ✅ e ⚠️ conforme limites em shorts", () => {
    const draft = { title: "Ok", description: "a".repeat(200), tags: ["seguro"] } as any;
    render(<ComplianceChecklist platform={"shorts" as any} draft={draft} />);
    expect(screen.getByText(/Checklist de Conformidade/)).toBeInTheDocument();
    // presença de ícones indicativos em algum item
    expect(screen.getAllByText(/✅/).length).toBeGreaterThan(0);
    // hashtags insuficientes devem gerar aviso
    expect(screen.getAllByText(/⚠️/).length).toBeGreaterThan(0);
  });
});