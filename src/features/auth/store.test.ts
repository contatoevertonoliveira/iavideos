import { describe, it, expect } from "vitest";
import { useAuthStore } from "./store";

describe("auth store", () => {
  it("salva tokens e usuário", () => {
    const { setTokens, setUser } = useAuthStore.getState();

    setTokens({ access: "A", refresh: "R" });
    setUser({ name: "User", email: "u@x.com", picture: "pic.png" });

    const s = useAuthStore.getState();
    expect(s.access).toBe("A");
    expect(s.refresh).toBe("R");
    expect(s.user.name).toBe("User");
    expect(s.user.picture).toBe("pic.png");
  });

  it("limpa tudo no clear()", () => {
    useAuthStore.setState({
      access: "A",
      refresh: "R",
      user: { name: "U", picture: "P", email: "E" },
    });
    useAuthStore.getState().clear();
    const s = useAuthStore.getState();
    expect(s.access).toBeNull();
    expect(s.refresh).toBeNull();
    expect(s.user.name).toBeNull();
  });
});