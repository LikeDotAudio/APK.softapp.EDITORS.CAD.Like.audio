// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useRef, useState } from 'react';
import type { RecentFileEntry } from '../../../io/recentFiles/RecentFileEntry';
import { useEntrance } from '../../../shell/EntranceContext';
import { useStore } from '../../../state/useStore';
import { useUi } from '../../../state/useUi';
import { ImportUnitModal } from '../../ImportUnitModal';
import { MenuBarButton } from '../MenuBarButton';
import { MenuDivider } from '../MenuDivider';
import { MenuDropdown } from '../MenuDropdown';
import { MenuItem } from '../MenuItem';
import type { MenuProps } from '../MenuProps';
import { DxfFileInput } from './file/DxfFileInput';
import { dxfImportFromText } from './file/dxfImportFromText';
import { ImageFileInput } from './file/ImageFileInput';
import type { PendingDxfImport } from './file/PendingDxfImport';
import { RecentFilesSubmenu } from './file/RecentFilesSubmenu';
import { useRecentFiles } from './file/useRecentFiles';

/**
 * File ▾ — open, import, recent files, DXF export, and 06a's filed sheet.
 *
 * The two Big Picture verbs are shown at that entrance only. 07b · Drawing is a
 * sketch board: handing it "save to the bench model" would file a sketch as the
 * bench, which is the two-tiles-one-page problem the entrances exist to end.
 */
export function FileMenu({ open, onToggle, onClose }: MenuProps) {
  const store = useStore();
  const { canExport, bigPicture } = useUi();
  const { showsFlowPanel } = useEntrance();
  const dxfInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const recent = useRecentFiles(open);
  const [pendingImport, setPendingImport] = useState<PendingDxfImport | null>(null);

  const openRecent = (entry: RecentFileEntry) => {
    onClose();
    if (entry.type === 'dxf') {
      setPendingImport(dxfImportFromText(entry.data, entry.name));
    } else {
      void store.loadRecentFile(entry);
    }
  };

  return (
    <div className="relative">
      <MenuBarButton label="File" open={open} onToggle={onToggle} />
      {open && (
        <MenuDropdown width="w-48">
          <MenuItem
            icon="📂"
            label="Open DXF..."
            onSelect={() => {
              onClose();
              dxfInput.current?.click();
            }}
          />
          <MenuItem
            icon="🖼️"
            label="Import Image..."
            onSelect={() => {
              onClose();
              imageInput.current?.click();
            }}
          />
          {showsFlowPanel && (
            <>
              <MenuDivider />
              <MenuItem
                icon="📥"
                label="Open Big Picture"
                onSelect={() => {
                  onClose();
                  void store.openBigPicture();
                }}
              />
              <MenuItem
                icon="💾"
                label={bigPicture.dirty ? 'Save to Big Picture •' : 'Save to Big Picture'}
                disabled={!bigPicture.reachable}
                onSelect={() => {
                  onClose();
                  void store.fileBigPicture();
                }}
              />
            </>
          )}
          <MenuDivider />
          <RecentFilesSubmenu entries={recent.entries} onOpen={openRecent} onClearAll={recent.clear} />
          <MenuDivider />
          <MenuItem
            icon="⬇️"
            label="Download DXF"
            disabled={!canExport}
            onSelect={() => {
              onClose();
              void store.exportDxf();
            }}
          />
        </MenuDropdown>
      )}

      <DxfFileInput inputRef={dxfInput} onPicked={setPendingImport} />
      <ImageFileInput inputRef={imageInput} onPicked={(file) => void store.importImage(file)} />

      {pendingImport && (
        <ImportUnitModal
          filename={pendingImport.filename}
          detectedUnit={pendingImport.detectedUnit}
          onConfirm={(sourceUnit, targetUnit) => {
            void store.loadDxfText(pendingImport.text, pendingImport.filename, sourceUnit, targetUnit);
            setPendingImport(null);
          }}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </div>
  );
}
