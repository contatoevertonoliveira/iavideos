import { render, screen } from "@testing-library/react";
import { UserBadge } from "./AppShell";
import { useAuthStore } from "@/features/auth/store";

describe("UserBadge", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().clear();
  });

  it("does not render without user name", () => {
    render(<UserBadge />);
    expect(screen.queryByText(/Google/i)).toBeNull();
  });

  it("renders avatar image and name when picture available", () => {
    useAuthStore.getState().setUser({
      name: "Maria Silva",
      picture: "https://example.com/avatar.jpg",
      email: "maria@example.com",
    });
    render(<UserBadge />);
    const img = screen.getByAltText("Maria Silva");
    expect(img).toBeInTheDocument();
    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
  });

  it("renders initials when no picture", () => {
    useAuthStore.getState().setUser({ name: "Carlos Eduardo", picture: null });
    render(<UserBadge />);
    // Initials from name (CE)
    expect(screen.getByText("CE")).toBeInTheDocument();
  });

  it("persists to localStorage when store is updated", () => {
    useAuthStore.getState().setTokens({ access: "tokenA", refresh: "tokenR" });
    useAuthStore.getState().setUser({
      name: "Joana D Arc",
      picture: "https://cdn/img.jpg",
      email: "joana@example.com",
    });
    const persisted = localStorage.getItem("av-auth");
    expect(persisted).toBeTruthy();
    const parsed = JSON.parse(persisted as string);
    expect(parsed?.state?.user?.name).toBe("Joana D Arc");
    expect(parsed?.state?.user?.picture).toContain("http");
    expect(parsed?.state?.access).toBe("tokenA");
    expect(parsed?.state?.refresh).toBe("tokenR");
  });
});