// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { RefObject } from 'react';
import { useStore } from '../../../../state/useStore';
import { dxfImportFromText } from './dxfImportFromText';
import type { PendingDxfImport } from './PendingDxfImport';

export interface DxfFileInputProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onPicked: (pending: PendingDxfImport) => void;
}

/** Hidden file picker for .dxf, opened by the File menu. */
export function DxfFileInput({ inputRef, onPicked }: DxfFileInputProps) {
  const store = useStore();
  return (
    <input
      ref={inputRef}
      type="file"
      accept=".dxf"
      hidden
      onChange={async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        await store.showLoading('Opening drawings', `Reading ${file.name}...`);
        try {
          const text = await file.text();
          await store.showLoading('Opening drawings', 'Inspecting DXF units & geometry...');
          onPicked(dxfImportFromText(text, file.name));
        } finally {
          store.hideLoading();
        }
      }}
    />
  );
}
