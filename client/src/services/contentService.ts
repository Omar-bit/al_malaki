import {
  EMPTY_SITE_CONTENT,
  type ContentMedia,
  type ContentSlot,
  type SiteContent,
} from '../types/content';
import { api } from './apiClient';
import { resolveAssetUrl } from '../utils/url';

function resolveMedia(media: ContentMedia): ContentMedia {
  return { ...media, url: resolveAssetUrl(media.url) };
}

function resolveContent(content: Partial<SiteContent>): SiteContent {
  const resolved = { ...EMPTY_SITE_CONTENT };

  for (const slot of Object.keys(resolved) as ContentSlot[]) {
    resolved[slot] = (content[slot] ?? []).map(resolveMedia);
  }

  return resolved;
}

export async function getSiteContent(): Promise<SiteContent> {
  const data = await api.get<Partial<SiteContent>>('/public/content');
  return resolveContent(data);
}

export async function getAdminContent(): Promise<SiteContent> {
  const data = await api.get<Partial<SiteContent>>('/admin/content');
  return resolveContent(data);
}

export async function uploadContentMedia(
  slot: ContentSlot,
  files: File[],
): Promise<ContentMedia[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('media', file));

  const created = await api.post<ContentMedia[]>(
    `/admin/content/${slot}/media`,
    formData,
  );

  return created.map(resolveMedia);
}

export async function updateContentMedia(
  id: string,
  payload: { focalX?: number; focalY?: number; zoom?: number },
): Promise<ContentMedia> {
  const updated = await api.patch<ContentMedia>(
    `/admin/content/media/${id}`,
    payload,
  );
  return resolveMedia(updated);
}

export async function reorderContentSlot(
  slot: ContentSlot,
  ids: string[],
): Promise<ContentMedia[]> {
  const reordered = await api.patch<ContentMedia[]>(
    `/admin/content/${slot}/reorder`,
    { ids },
  );
  return reordered.map(resolveMedia);
}

export function deleteContentMedia(id: string): Promise<void> {
  return api.delete(`/admin/content/media/${id}`);
}
