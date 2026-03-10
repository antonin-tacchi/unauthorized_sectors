const API_URL = import.meta.env.VITE_API_URL || "";
console.log("API_URL =", API_URL);

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = typeof data === "object" ? data?.message : data;
    throw new Error(msg || "Request failed");
  }

  return data;
}

export function getProjects() {
  return apiFetch("/api/projects");
}

export function getProjectBySlug(slug) {
  return apiFetch(`/api/projects/${slug}`);
}
