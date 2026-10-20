import { ref } from "vue";
import { defineStore } from "pinia";

export const useSessionStore = defineStore("session", () => {
  const username = ref("");

  const request = async (path: string, body?: object, method = "GET") => {
    const response = await fetch(`/api/${path}`, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      ...(body ? {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      } : {}),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error ?? "Authentication failed");
    }
    return response.status == 204 ? null : response.json();
  };

  const restore = async () => {
    const data = await request("session");
    username.value = data.username ?? "";
  };

  const login = async (name: string, password: string) => {
    const data = await request("login", { username: name, password }, "POST");
    username.value = data.username;
  };

  const logout = async () => {
    await request("logout", undefined, "POST");
    username.value = "";
  };

  return { username, restore, login, logout };
});
