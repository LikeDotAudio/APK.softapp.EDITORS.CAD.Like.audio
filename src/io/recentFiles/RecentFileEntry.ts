// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** One browser-cached file offered under File ▸ Recent Files. */
export interface RecentFileEntry {
  id: string;
  name: string;
  type: 'dxf' | 'image';
  data: string;
  timestamp: number;
}

export const RECENT_KEY = 'cad_like_audio_recent_files';
export const MAX_RECENT = 8;
