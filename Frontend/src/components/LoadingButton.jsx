export default function LoadingButton({
  loading = false,
  disabled = false,
  children,
  loadingText = "Loading…",
  className = "",
  type = "submit",
  onClick,
}) {
  return (
    <button
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 disabled:opacity-50 transition ${className}`}
    >
      {loading && (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
      )}
      {loading ? loadingText : children}
    </button>
  );
}
