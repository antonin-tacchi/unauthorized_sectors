const API_URL = import.meta.env.VITE_API_URL || "";

export async function fetchProjects(params = {}) {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const vv = String(v).trim();
    if (vv) qs.set(k, vv);
  });

  const res = await fetch(`${API_URL}/api/projects?${qs.toString()}`);
  if (!res.ok) throw new Error(`API error (${res.status})`);
  return res.json();
}