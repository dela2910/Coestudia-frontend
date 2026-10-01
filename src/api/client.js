export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getHello() {
  const res = await fetch(`${API_URL}/api/hello`);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}
