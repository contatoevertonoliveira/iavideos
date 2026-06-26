import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useAuthStore } from "@/features/auth/store";
import { UserBadge } from "./UserBadge";

function renderBadge() {
  return render(<UserBadge />);
}

describe("UserBadge", () => {
  it("não renderiza quando não há usuário", () => {
    useAuthStore.setState({ access: null, refresh: null, user: { name: null, picture: null, email: null } });
    renderBadge();
    expect(screen.queryByText("Google")).toBeNull();
  });

  it("renderiza nome, foto e badge Google", () => {
    useAuthStore.setState({
      access: "ACCESS",
      refresh: "REFRESH",
      user: { name: "Everton Oliveira", picture: " `https://example.com/p.jpg` ", email: "e@e.com" },
    });
    renderBadge();
    expect(screen.getByText("Everton Oliveira")).toBeInTheDocument();
    expect(screen.getByText("Google")).toBeInTheDocument();
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toContain(" `https://example.com/p.jpg` ");
    expect(img.alt).toBe("Everton Oliveira");
  });

  it("exibe iniciais quando não houver picture", () => {
    useAuthStore.setState({
      access: "ACCESS",
      refresh: "REFRESH",
      user: { name: "Canal Kids", picture: null, email: "c@k.com" },
    });
    renderBadge();
    // CL / iniciais
    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText(/CK|CC/)).toBeInTheDocument();
  });
});