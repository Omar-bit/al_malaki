import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Trash2, Upload, Crop, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/AdminLayout';
import { Modal } from '../../components/ui';
import { contentService } from '../../services';
import { contentMediaStyle } from '../../utils/contentMedia';
import {
  CONTENT_SLOTS,
  CONTENT_SLOT_META,
  EMPTY_SITE_CONTENT,
  type ContentMedia,
  type ContentSlot,
  type SiteContent,
} from '../../types/content';

const ACCEPTED_TYPES = 'image/*,video/mp4,video/webm,video/quicktime';

// ── Framing editor ────────────────────────────────────────────────────────────

/**
 * Visual crop editor: the admin drags inside the preview to move the focal
 * point and uses the slider to zoom. The preview uses the same markup and
 * styles as the public site, so it is an exact representation of the result.
 */
function FramingEditor({
  media,
  slot,
  onClose,
  onSaved,
}: {
  media: ContentMedia;
  slot: ContentSlot;
  onClose: () => void;
  onSaved: (updated: ContentMedia) => void;
}) {
  const [focalX, setFocalX] = useState(media.focalX);
  const [focalY, setFocalY] = useState(media.focalY);
  const [zoom, setZoom] = useState(media.zoom);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const applyPointer = useCallback((clientX: number, clientY: number) => {
    const frame = frameRef.current;
    if (!frame) return;

    const rect = frame.getBoundingClientRect();
    const nextX = ((clientX - rect.left) / rect.width) * 100;
    const nextY = ((clientY - rect.top) / rect.height) * 100;

    setFocalX(Math.min(100, Math.max(0, Number(nextX.toFixed(1)))));
    setFocalY(Math.min(100, Math.max(0, Number(nextY.toFixed(1)))));
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (event: PointerEvent) =>
      applyPointer(event.clientX, event.clientY);
    const handleUp = () => setIsDragging(false);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDragging, applyPointer]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await contentService.updateContentMedia(media.id, {
        focalX,
        focalY,
        zoom,
      });
      onSaved(updated);
      toast.success('Framing saved');
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save framing',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const previewStyle = contentMediaStyle({ focalX, focalY, zoom });

  return (
    <Modal open onClose={onClose} title='Adjust framing'>
      <div className='space-y-4'>
        <p className='font-bona text-sm text-[#6D5A46]'>
          Drag inside the preview to choose what stays in frame, and zoom in to
          crop closer. This is exactly how it will appear on the site.
        </p>

        <div
          ref={frameRef}
          onPointerDown={(event) => {
            setIsDragging(true);
            applyPointer(event.clientX, event.clientY);
          }}
          className='relative w-full cursor-move touch-none select-none overflow-hidden rounded-xl border border-[#d4bfa8] bg-[#f0e8dc]'
          style={{ aspectRatio: CONTENT_SLOT_META[slot].previewAspect }}
        >
          {media.type === 'video' ? (
            <video
              src={media.url}
              className='pointer-events-none h-full w-full object-cover'
              style={previewStyle}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={media.url}
              alt=''
              draggable={false}
              className='pointer-events-none h-full w-full object-cover'
              style={previewStyle}
            />
          )}

          <span
            className='pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(63,6,15,0.45)]'
            style={{ left: `${focalX}%`, top: `${focalY}%` }}
          />
        </div>

        <div>
          <label
            htmlFor='content-zoom'
            className='mb-1.5 block font-bona text-sm text-[#3f060f]'
          >
            Zoom — {zoom.toFixed(2)}x
          </label>
          <input
            id='content-zoom'
            type='range'
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className='w-full accent-[#3f060f]'
          />
        </div>

        <div className='flex justify-end gap-3'>
          <button
            type='button'
            onClick={() => {
              setFocalX(50);
              setFocalY(50);
              setZoom(1);
            }}
            className='rounded-xl border border-[#d4bfa8] px-4 py-2 font-bona text-sm text-[#6D5A46] transition hover:bg-[#f0e8dc]'
          >
            Reset
          </button>
          <button
            type='button'
            onClick={handleSave}
            disabled={isSaving}
            className='flex items-center gap-2 rounded-xl bg-dark-red px-5 py-2 font-bona text-sm font-semibold text-cream transition hover:opacity-90 disabled:opacity-60'
          >
            {isSaving && <Loader2 className='h-4 w-4 animate-spin' />}
            Save framing
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Slot section ──────────────────────────────────────────────────────────────

function SlotSection({
  slot,
  media,
  onChanged,
}: {
  slot: ContentSlot;
  media: ContentMedia[];
  onChanged: (slot: ContentSlot, items: ContentMedia[]) => void;
}) {
  const meta = CONTENT_SLOT_META[slot];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editing, setEditing] = useState<ContentMedia | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const created = await contentService.uploadContentMedia(
        slot,
        Array.from(files),
      );
      onChanged(slot, [...media, ...created]);
      toast.success(`Added ${created.length} item(s)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (item: ContentMedia) => {
    setBusyId(item.id);
    try {
      await contentService.deleteContentMedia(item.id);
      onChanged(
        slot,
        media.filter((entry) => entry.id !== item.id),
      );
      toast.success('Removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove');
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= media.length) return;

    const reordered = [...media];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onChanged(slot, reordered);

    try {
      const saved = await contentService.reorderContentSlot(
        slot,
        reordered.map((item) => item.id),
      );
      onChanged(slot, saved);
    } catch (error) {
      onChanged(slot, media);
      toast.error(error instanceof Error ? error.message : 'Could not reorder');
    }
  };

  return (
    <section className='rounded-2xl border border-[#EADFD0] bg-white p-5 md:p-6'>
      <h2 className='font-bona text-[12px] uppercase tracking-[0.2em] text-[#6D5A46]'>
        {meta.title}
      </h2>
      <p className='mt-1 font-bona text-sm text-[#6D5A46]/85'>
        {meta.description}
      </p>

      <input
        ref={fileInputRef}
        type='file'
        accept={ACCEPTED_TYPES}
        multiple
        className='hidden'
        onChange={(event) => void handleUpload(event.target.files)}
      />

      <button
        type='button'
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className='mt-4 inline-flex items-center gap-2 rounded-xl border border-[#d4bfa8] px-4 py-2 font-bona text-sm text-[#3f060f] transition hover:bg-[#f0e8dc] disabled:opacity-60'
      >
        {isUploading ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <Upload className='h-4 w-4' />
        )}
        Upload
      </button>

      {media.length === 0 ? (
        <p className='mt-4 font-bona text-sm text-[#6D5A46]/70'>
          Nothing uploaded — the site keeps showing its current default image.
        </p>
      ) : (
        <div className='mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
          {media.map((item, index) => (
            <div
              key={item.id}
              className='overflow-hidden rounded-xl border border-[#EADFD0]'
            >
              <div
                className='relative bg-[#f0e8dc]'
                style={{ aspectRatio: meta.previewAspect }}
              >
                {item.type === 'video' ? (
                  <video
                    src={item.url}
                    className='h-full w-full object-cover'
                    style={contentMediaStyle(item)}
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={item.url}
                    alt=''
                    className='h-full w-full object-cover'
                    style={contentMediaStyle(item)}
                  />
                )}

                {item.type === 'video' && (
                  <span className='absolute left-2 top-2 rounded-full bg-dark-red/85 px-2 py-0.5 font-bona text-[10px] uppercase tracking-wider text-cream'>
                    Video
                  </span>
                )}
              </div>

              <div className='flex items-center justify-between gap-1 px-2 py-2'>
                <div className='flex items-center gap-1'>
                  <button
                    type='button'
                    onClick={() => void handleMove(index, -1)}
                    disabled={index === 0}
                    aria-label='Move earlier'
                    className='rounded-lg p-1 text-[#6D5A46] transition hover:bg-[#f0e8dc] disabled:opacity-35'
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    onClick={() => void handleMove(index, 1)}
                    disabled={index === media.length - 1}
                    aria-label='Move later'
                    className='rounded-lg p-1 text-[#6D5A46] transition hover:bg-[#f0e8dc] disabled:opacity-35'
                  >
                    <ChevronRight className='h-4 w-4' />
                  </button>
                </div>

                <div className='flex items-center gap-1'>
                  <button
                    type='button'
                    onClick={() => setEditing(item)}
                    aria-label='Adjust framing'
                    className='rounded-lg p-1 text-[#6D5A46] transition hover:bg-[#f0e8dc]'
                  >
                    <Crop className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    onClick={() => void handleDelete(item)}
                    disabled={busyId === item.id}
                    aria-label='Remove'
                    className='rounded-lg p-1 text-[#9c2b2b] transition hover:bg-[#f7e4e4] disabled:opacity-50'
                  >
                    {busyId === item.id ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <Trash2 className='h-4 w-4' />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <FramingEditor
          media={editing}
          slot={slot}
          onClose={() => setEditing(null)}
          onSaved={(updated) =>
            onChanged(
              slot,
              media.map((item) => (item.id === updated.id ? updated : item)),
            )
          }
        />
      )}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AdminContentPage() {
  const [content, setContent] = useState<SiteContent>(EMPTY_SITE_CONTENT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function load() {
      try {
        const data = await contentService.getAdminContent();
        if (isActive) setContent(data);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Could not load content',
        );
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const handleChanged = (slot: ContentSlot, items: ContentMedia[]) => {
    setContent((current) => ({ ...current, [slot]: items }));
  };

  return (
    <AdminLayout>
      <div className='space-y-6'>
        <header>
          <p className='font-bona text-[12px] uppercase tracking-[0.2em] text-[#6D5A46]'>
            Content
          </p>
          <h1 className='mt-1 font-augent text-3xl text-dark-red md:text-4xl'>
            Content &amp; media
          </h1>
          <p className='mt-2 max-w-xl font-bona text-sm text-[#6D5A46]'>
            Upload the photos and videos shown across the site. Add more than
            one item to a section to show it as a slider. Changes appear on the
            client site instantly.
          </p>
        </header>

        {isLoading ? (
          <div className='flex h-64 items-center justify-center'>
            <Loader2 className='h-6 w-6 animate-spin text-dark-red' />
          </div>
        ) : (
          <div className='space-y-5'>
            {CONTENT_SLOTS.map((slot) => (
              <SlotSection
                key={slot}
                slot={slot}
                media={content[slot]}
                onChanged={handleChanged}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
