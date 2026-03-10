import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import LoadingButton from "../../components/LoadingButton";

const API_URL        = import.meta.env.VITE_API_URL || "";
const CLD_CLOUD      = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLD_PRESET     = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/* ─── R2 upload helper (via backend) ───────────────────────────────────── */

function uploadToR2(file, token, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(`Upload error ${xhr.status}: ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.open("POST", `${API_URL}/api/upload/model`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(fd);
  });
}

/* ─── Cloudinary upload helper ─────────────────────────────────────────── */

function uploadToCloudinary(file, resourceType = "image", onProgress) {
  return new Promise((resolve, reject) => {
    if (!CLD_CLOUD || !CLD_PRESET) {
      reject(new Error("Cloudinary env vars missing"));
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLD_PRESET);

    const endpoint = `https://api.cloudinary.com/v1_1/${CLD_CLOUD}/${resourceType}/upload`;

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(`Cloudinary error ${xhr.status}: ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.open("POST", endpoint);
    xhr.send(fd);
  });
}

/* ─── ModelUploadButton (R2 via backend) ────────────────────────────────── */

function ModelUploadButton({ onUploaded, currentUrl, token, disabled }) {
  const ref = useRef(null);
  const [progress, setProgress] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileErr = validateFile(file, "model");
    if (fileErr) { toast.error(fileErr); e.target.value = ""; return; }
    setProgress(0);
    try {
      const data = await uploadToR2(file, token, setProgress);
      onUploaded(data.url);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProgress(null);
      e.target.value = "";
    }
  }

  const uploading = progress !== null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2 items-center">
        <input ref={ref} type="file" accept=".glb,.gltf" className="hidden" onChange={handleFile} />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={disabled || uploading}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10 transition disabled:opacity-50 whitespace-nowrap"
        >
          {uploading ? `${progress}%` : "Upload .glb file"}
        </button>
        {currentUrl && !uploading && (
          <span className="text-xs text-green-400 truncate max-w-[180px]">
            ✓ {currentUrl.split("/").pop()}
          </span>
        )}
      </div>
      {uploading && (
        <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-[#6b5cff] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

/* ─── FileUploadButton ──────────────────────────────────────────────────── */

function FileUploadButton({ accept, resourceType, onUploaded, label = "Choose file", currentUrl, disabled }) {
  const ref = useRef(null);
  const [progress, setProgress] = useState(null); // null=idle, 0-100=uploading

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileErr = validateFile(file, resourceType);
    if (fileErr) { toast.error(fileErr); e.target.value = ""; return; }
    setProgress(0);
    try {
      const data = await uploadToCloudinary(file, resourceType, setProgress);
      onUploaded(data.secure_url);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProgress(null);
      e.target.value = "";
    }
  }

  const uploading = progress !== null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2 items-center">
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={handleFile} />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={disabled || uploading}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10 transition disabled:opacity-50 whitespace-nowrap"
        >
          {uploading ? `${progress}%` : label}
        </button>

        {currentUrl && !uploading && (
          <span className="text-xs text-green-400 truncate max-w-[180px]">
            ✓ {currentUrl.split("/").pop().split("?")[0]}
          </span>
        )}
      </div>

      {uploading && (
        <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-[#6b5cff] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

/* ─── Tag picker ────────────────────────────────────────────────────────── */

function TagPicker({ selected, onChange, availableTags }) {
  const [input, setInput] = useState("");

  function toggle(tag) {
    onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]);
  }

  function addCustom() {
    const val = input.trim().toLowerCase().replace(/\s+/g, "-");
    if (!val || selected.includes(val)) { setInput(""); return; }
    onChange([...selected, val]);
    setInput("");
  }

  const suggestions = availableTags.filter(
    (t) => !selected.includes(t) && t.includes(input.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-[#6b5cff]/20 border border-[#6b5cff]/30 px-3 py-0.5 text-xs font-medium text-[#a89fff]">
              {t}
              <button type="button" onClick={() => toggle(t)} className="text-[#a89fff]/50 hover:text-red-400 transition leading-none">✕</button>
            </span>
          ))}
        </div>
      )}
      {/* Input + suggestions */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          placeholder="Search or add a tag…"
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[#6b5cff]/60 transition"
        />
        {input && <button type="button" onClick={addCustom} className="rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-white/12 transition">Add</button>}
      </div>
      {/* Existing tags as pills */}
      {(input ? suggestions : availableTags.filter((t) => !selected.includes(t))).length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {(input ? suggestions : availableTags.filter((t) => !selected.includes(t))).slice(0, 20).map((t) => (
            <button key={t} type="button" onClick={() => toggle(t)}
              className="rounded-full bg-white/5 border border-white/10 px-3 py-0.5 text-xs text-white/50 hover:bg-[#6b5cff]/15 hover:border-[#6b5cff]/30 hover:text-[#a89fff] transition">
              + {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Validation ────────────────────────────────────────────────────────── */

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const ALLOWED_VIDEO_EXT = [".mp4"];
const ALLOWED_MODEL_EXT = [".glb", ".gltf"];

function getExt(file) {
  return "." + file.name.split(".").pop().toLowerCase();
}

function validateFile(file, type) {
  if (file.size > MAX_FILE_SIZE) return "File exceeds 100 MB limit.";
  const ext = getExt(file);
  if (type === "model"  && !ALLOWED_MODEL_EXT.includes(ext)) return `Only ${ALLOWED_MODEL_EXT.join(", ")} allowed.`;
  if (type === "image"  && !ALLOWED_IMAGE_EXT.includes(ext)) return `Only ${ALLOWED_IMAGE_EXT.join(", ")} allowed.`;
  if (type === "video"  && !ALLOWED_VIDEO_EXT.includes(ext)) return `Only ${ALLOWED_VIDEO_EXT.join(", ")} allowed.`;
  return null;
}

function validateForm(form) {
  const errs = {};
  if (!form.title.trim())              errs.title = "Title is required.";
  else if (form.title.length > 100)    errs.title = "Title must be 100 characters or less.";
  if (form.shortDesc.length > 300)     errs.shortDesc = "Short description must be 300 characters or less.";
  if (form.description.length > 2000)  errs.description = "Description must be 2000 characters or less.";
  const price = form["pricing.cents"];
  if (price && (!/^\d+$/.test(price) || price.length > 6)) errs.price = "Price must be a number of 6 digits max.";
  return errs;
}

/* ─── Form constants ────────────────────────────────────────────────────── */

const EMPTY = {
  title: "", shortDesc: "", description: "",
  image: "", mappingType: "", style: "", size: "", performance: "",
  status: "published", "pricing.cents": "", modelUrl: "",
};

const EMPTY_ROW = { url: "", mediaType: "image", role: "gallery" };

/* Predefined defaults for new projects */
const DEFAULT_OVERVIEW = [
  "Interior & Exterior",
  "MLO",
  "FPS Impact: Low",
  "Number of props: —",
];

const DEFAULT_FEATURES = [
  "Optimized collisions",
  "Clean LODs",
  "Vanilla friendly",
  "RP ready",
];

const DEFAULT_FRAMEWORKS = ["ESX", "QBCore", "Standalone"];

const DEFAULT_CATEGORIES = ["— (e.g. EMS, Police, Medical, Gang…)"];

const DEFAULT_FAQ = [
  {
    question: "Is installation included?",
    answer: "Installation instructions are provided. Assistance available on request.",
  },
  {
    question: "Can I request custom modifications?",
    answer: "Yes, custom adjustments can be discussed depending on the project scope.",
  },
];

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-white/35 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls  = "w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#6b5cff]/60 transition";
const selectCls = "w-full rounded-lg bg-[#0f1420] border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#6b5cff]/60 transition";
const selectSmCls = "rounded-lg bg-[#0f1420] border border-white/10 px-2 py-2 text-sm text-white outline-none";

/* ─── ListEditor: reusable "add / remove string items" editor ─────────── */

function ListEditor({ label, items, onChange, placeholder = "Item…", maxItems }) {
  function add() { if (maxItems && items.length >= maxItems) return; onChange([...items, ""]); }
  function update(i, val) { onChange(items.map((x, j) => j === i ? val : x)); }
  function remove(i) { onChange(items.filter((_, j) => j !== i)); }
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-white/35 mb-1.5">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item}
              onChange={(e) => update(i, e.target.value)}
              className={inputCls + " flex-1"}
              placeholder={placeholder}
            />
            <button type="button" onClick={() => remove(i)} className="rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-2 text-xs text-red-400 hover:bg-red-500/20 transition">✕</button>
          </div>
        ))}
        {(!maxItems || items.length < maxItems) && (
          <button type="button" onClick={add} className="text-xs text-[#6b5cff] hover:text-[#8b7dff] transition">+ Add item</button>
        )}
        {maxItems && items.length >= maxItems && (
          <span className="text-xs text-white/25">Maximum {maxItems} items reached</span>
        )}
      </div>
    </div>
  );
}

/* ─── FAQEditor ─────────────────────────────────────────────────────────── */

function FAQEditor({ items, onChange }) {
  function add() { onChange([...items, { question: "", answer: "" }]); }
  function update(i, key, val) { onChange(items.map((x, j) => j === i ? { ...x, [key]: val } : x)); }
  function remove(i) { onChange(items.filter((_, j) => j !== i)); }
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-white/35 mb-1.5">FAQ</label>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
            <div className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <input
                  value={item.question}
                  onChange={(e) => update(i, "question", e.target.value)}
                  className={inputCls}
                  placeholder="Question…"
                />
                <textarea
                  rows={2}
                  value={item.answer}
                  onChange={(e) => update(i, "answer", e.target.value)}
                  className={inputCls + " resize-y"}
                  placeholder="Answer…"
                />
              </div>
              <button type="button" onClick={() => remove(i)} className="rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-2 text-xs text-red-400 hover:bg-red-500/20 transition mt-0.5">✕</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={add} className="text-xs text-[#6b5cff] hover:text-[#8b7dff] transition">+ Add FAQ</button>
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */

export default function AdminProjectForm() {
  const { id }     = useParams();
  const isEdit     = Boolean(id);
  const { token }  = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]         = useState(EMPTY);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [mediaRows, setMediaRows]         = useState([]);
  const [removedMediaIds, setRemovedMediaIds] = useState([]);

  const [overview,    setOverview]    = useState(isEdit ? [] : DEFAULT_OVERVIEW);
  const [features,    setFeatures]    = useState(isEdit ? [] : DEFAULT_FEATURES);
  const [frameworks,  setFrameworks]  = useState(isEdit ? [] : DEFAULT_FRAMEWORKS);
  const [categories,  setCategories]  = useState(isEdit ? [] : DEFAULT_CATEGORIES);
  const [faq,         setFaq]         = useState(isEdit ? [] : DEFAULT_FAQ);
  const [selectedTags, setSelectedTags] = useState([]);

  // Dynamic filters + existing tags
  const [filterOptions, setFilterOptions] = useState({ mappingTypes: [], styles: [], sizes: [], performances: [] });
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [rf, rt] = await Promise.all([
          fetch(`${API_URL}/api/filters`),
          fetch(`${API_URL}/api/filters/tags`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (rf.ok) setFilterOptions(await rf.json());
        if (rt.ok) setAvailableTags((await rt.json()).map((t) => t.tag));
      } catch { /* non-blocking */ }

      if (!isEdit) { setLoading(false); return; }

      try {
        const [rp, rm] = await Promise.all([
          fetch(`${API_URL}/api/projects/id/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/media?projectId=${id}`,  { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!rp.ok) throw new Error("Not found");
        const d = await rp.json();
        setForm({
          title: d.title || "", shortDesc: d.shortDesc || "", description: d.description || "",
          image: d.image || "", mappingType: d.mappingType || "", style: d.style || "",
          size: d.size || "", performance: d.performance || "", status: d.status || "published",
          "pricing.cents": d.pricing?.cents ? String(d.pricing.cents) : "",
          modelUrl: d.modelUrl || "",
        });
        setSelectedTags(d.tags || []);
        setOverview(d.overview || []);
        setFeatures(d.features || []);
        setFrameworks(d.technical?.frameworks || []);
        setCategories(d.technical?.categories || []);
        setFaq(d.technical?.faq || []);
        if (rm.ok) {
          const md = await rm.json();
          setMediaRows(md.map((m) => ({ _id: m._id, url: m.url, mediaType: m.mediaType || "image", role: m.role || "gallery" })));
        }
      } catch { setError("Failed to load project."); }
      finally { setLoading(false); }
    })();
  }, [id, isEdit, token]);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  function addMediaRow()             { setMediaRows((r) => [...r, { ...EMPTY_ROW }]); }
  function updateRow(idx, key, val)  { setMediaRows((r) => r.map((x, i) => i === idx ? { ...x, [key]: val } : x)); }
  function removeRow(idx) {
    const row = mediaRows[idx];
    if (row._id) setRemovedMediaIds((ids) => [...ids, row._id]);
    setMediaRows((r) => r.filter((_, i) => i !== idx));
  }

  async function syncMedia(projectId) {
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    await Promise.all([
      ...removedMediaIds.map((mid) => fetch(`${API_URL}/api/media/${mid}`, { method: "DELETE", headers })),
      ...mediaRows.filter((r) => r.url.trim()).map((r) =>
        r._id
          ? fetch(`${API_URL}/api/media/${r._id}`, { method: "PUT", headers, body: JSON.stringify({ url: r.url, mediaType: r.mediaType, role: r.role }) })
          : fetch(`${API_URL}/api/media`, { method: "POST", headers, body: JSON.stringify({ projectId, url: r.url, mediaType: r.mediaType, role: r.role }) })
      ),
    ]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      toast.error("Please fix the errors below.");
      return;
    }
    setFieldErrors({});
    setSaving(true);
    const payload = {
      title: form.title, shortDesc: form.shortDesc, description: form.description,
      image: form.image, mappingType: form.mappingType, style: form.style,
      size: form.size, performance: form.performance, status: form.status,
      tags: selectedTags,
      pricing: { cents: parseInt(form["pricing.cents"] || "0", 10) || 0 },
      modelUrl: form.modelUrl || "",
      overview: overview.filter(Boolean),
      features: features.filter(Boolean),
      technical: {
        frameworks: frameworks.filter(Boolean),
        categories: categories.filter(Boolean),
        faq: faq.filter((f) => f.question || f.answer),
      },
    };
    try {
      const res = await fetch(
        isEdit ? `${API_URL}/api/projects/${id}` : `${API_URL}/api/projects`,
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      await syncMedia(data._id);
      toast.success(isEdit ? "Project updated!" : "Project created!");
      navigate("/admin/projects");
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Save failed");
    }
    finally { setSaving(false); }
  }

  if (loading) return <div className="p-8 text-white/35 animate-pulse">Loading…</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white/90">
          {isEdit ? "Edit project" : "New project"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        <Field label="Title *">
          <input required maxLength={100} value={form.title} onChange={(e) => set("title", e.target.value)}
            className={inputCls + (fieldErrors.title ? " border-red-500/60" : "")} />
          <div className="flex justify-between mt-1">
            {fieldErrors.title ? <span className="text-xs text-red-400">{fieldErrors.title}</span> : <span />}
            <span className="text-xs text-white/25">{form.title.length}/100</span>
          </div>
        </Field>

        <Field label="Short description">
          <input maxLength={300} value={form.shortDesc} onChange={(e) => set("shortDesc", e.target.value)}
            className={inputCls + (fieldErrors.shortDesc ? " border-red-500/60" : "")} />
          <div className="flex justify-between mt-1">
            {fieldErrors.shortDesc ? <span className="text-xs text-red-400">{fieldErrors.shortDesc}</span> : <span />}
            <span className="text-xs text-white/25">{form.shortDesc.length}/300</span>
          </div>
        </Field>

        <Field label="Description">
          <textarea rows={5} maxLength={2000} value={form.description} onChange={(e) => set("description", e.target.value)}
            className={inputCls + " resize-y" + (fieldErrors.description ? " border-red-500/60" : "")} />
          <div className="flex justify-between mt-1">
            {fieldErrors.description ? <span className="text-xs text-red-400">{fieldErrors.description}</span> : <span />}
            <span className="text-xs text-white/25">{form.description.length}/2000</span>
          </div>
        </Field>

        {/* Cover image — Cloudinary upload */}
        <Field label="Cover image">
          <div className="flex gap-3 items-start">
            {form.image && (
              <img src={form.image} alt="cover" className="h-16 w-28 rounded-lg object-cover border border-white/10 shrink-0" />
            )}
            <div className="flex-1 space-y-2">
              <FileUploadButton
                accept="image/*"
                resourceType="image"
                label="Upload image"
                currentUrl={form.image}
                onUploaded={(url) => set("image", url)}
              />
              {form.image && (
                <button type="button" onClick={() => set("image", "")} className="text-xs text-red-400 hover:text-red-300 transition">
                  Remove
                </button>
              )}
            </div>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Mapping type">
            <select value={form.mappingType} onChange={(e) => set("mappingType", e.target.value)} className={selectCls}>
              <option value="">—</option>
              {filterOptions.mappingTypes?.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Style">
            <select value={form.style} onChange={(e) => set("style", e.target.value)} className={selectCls}>
              <option value="">—</option>
              {filterOptions.styles?.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Size">
            <select value={form.size} onChange={(e) => set("size", e.target.value)} className={selectCls}>
              <option value="">—</option>
              {filterOptions.sizes?.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Performance">
            <select value={form.performance} onChange={(e) => set("performance", e.target.value)} className={selectCls}>
              <option value="">—</option>
              {filterOptions.performances?.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Status">
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className={selectCls}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </Field>

        {filterOptions.mappingTypes?.length === 0 && filterOptions.styles?.length === 0 && filterOptions.sizes?.length === 0 && filterOptions.performances?.length === 0 && (
          <p className="text-xs text-amber-400/60">⚠ No filter values defined yet. Go to the <strong>Filters</strong> page to add Mapping Types, Styles, Sizes and Performances.</p>
        )}

        <Field label="Tags">
          <TagPicker selected={selectedTags} onChange={setSelectedTags} availableTags={availableTags} />
        </Field>

        {/* 3D Model — R2 upload via backend */}
        <Field label="3D Model (.glb)">
          <ModelUploadButton
            currentUrl={form.modelUrl}
            onUploaded={(url) => set("modelUrl", url)}
            token={token}
          />
          {form.modelUrl && (
            <button type="button" onClick={() => set("modelUrl", "")} className="mt-1 text-xs text-red-400 hover:text-red-300 transition">
              Remove model
            </button>
          )}
        </Field>

        <Field label="Price (cents, 0 = free)">
          <input type="number" min="0" max="999999" value={form["pricing.cents"]} onChange={(e) => set("pricing.cents", e.target.value)}
            className={inputCls + (fieldErrors.price ? " border-red-500/60" : "")} placeholder="0" />
          {fieldErrors.price && <p className="mt-1 text-xs text-red-400">{fieldErrors.price}</p>}
        </Field>

        {/* ── Overview / Features / Technical tabs ── */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-5">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/35">Tab content</span>

          <ListEditor label="Overview (bullet points)" items={overview} onChange={setOverview} placeholder="e.g. Interior & Exterior" />
          <ListEditor label="Features (bullet points)" items={features} onChange={setFeatures} placeholder="e.g. Optimized collisions" />

          <div className="h-px bg-white/10" />
          <span className="text-xs font-semibold uppercase tracking-widest text-white/35">Technical</span>
          <ListEditor label="Supported Frameworks" items={frameworks} onChange={setFrameworks} placeholder="e.g. ESX, QBCore, Standalone" />
          <ListEditor label="RP Categories (max 4 — 2×2 grid)" items={categories} onChange={setCategories} placeholder="e.g. EMS, Police, Medical…" maxItems={4} />
          <FAQEditor items={faq} onChange={setFaq} />
        </div>

        {/* Media gallery */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/35">Media gallery</span>
            <button type="button" onClick={addMediaRow} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition">
              + Add media
            </button>
          </div>

          {mediaRows.length === 0 && (
            <p className="text-sm text-white/30 py-2">No media — click "+ Add media".</p>
          )}

          <div className="space-y-3">
            {mediaRows.map((row, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex gap-2 items-center">
                  {/* Preview thumbnail if uploaded */}
                  {row.url && row.mediaType === "image" && (
                    <img src={row.url} alt="" className="h-9 w-14 rounded object-cover border border-white/10 shrink-0" />
                  )}

                  {/* Upload button */}
                  <FileUploadButton
                    accept={row.mediaType === "image" ? "image/*" : "video/*"}
                    resourceType={row.mediaType === "image" ? "image" : "video"}
                    label={row.url ? "Replace" : "Upload"}
                    currentUrl={row.url}
                    onUploaded={(url) => updateRow(idx, "url", url)}
                  />

                  <select
                    value={row.mediaType}
                    onChange={(e) => updateRow(idx, "mediaType", e.target.value)}
                    className={selectSmCls}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>

                  <select
                    value={row.role}
                    onChange={(e) => updateRow(idx, "role", e.target.value)}
                    className={selectSmCls}
                  >
                    <option value="gallery">Gallery</option>
                    <option value="cover">Cover</option>
                    <option value="before">Before</option>
                    <option value="after">After</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-2 text-xs text-red-400 hover:bg-red-500/20 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <LoadingButton
            loading={saving}
            loadingText="Saving…"
            className="rounded-lg bg-[#6b5cff] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            {isEdit ? "Save changes" : "Create project"}
          </LoadingButton>
          <button type="button" onClick={() => navigate("/admin/projects")} className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/60 hover:bg-white/10 transition">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
