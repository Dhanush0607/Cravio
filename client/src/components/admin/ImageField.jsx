import { useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, X } from 'lucide-react';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ImageWithFallback } from '../common/ImageWithFallback.jsx';
import { getApiError } from '../../utils/format.js';

export function ImageField({ label, value, onChange, hint, required = false }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const result = await adminService.uploadImage(file);
      onChange(result.url);
      toast.success('Image uploaded.');
    } catch (error) {
      toast.error(getApiError(error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="label">
        {label}
        {required ? <span className="ml-0.5 text-brand-500">*</span> : null}
      </label>
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-canvas">
          {value ? (
            <>
              <ImageWithFallback src={value} alt="" className="h-full w-full" />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-ink/70 text-white"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <span className="grid h-full w-full place-items-center text-ink-muted">
              <ImagePlus className="h-5 w-5" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            value={value || ''}
            onChange={(event) => onChange(event.target.value)}
            placeholder="/images/foods/pizza.jpg or upload"
            className="input-base h-10 py-2 text-xs"
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            {hint ? <p className="text-[11px] text-ink-muted">{hint}</p> : <span />}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1 text-[11px] font-semibold transition hover:bg-black/[0.03] disabled:opacity-60"
            >
              {uploading ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
