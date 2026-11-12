// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { BlockEditorHeader } from './BlockEditorHeader';
import { BlockElementSidebar } from './BlockElementSidebar';
import { BlockPreviewCanvas } from './BlockPreviewCanvas';
import { BlockMetadataPanel } from './BlockMetadataPanel';
import { BlockInspectorTabs } from './BlockInspectorTabs';
import { BlockQuickAddTab } from './BlockQuickAddTab';
import { BlockLinesTab } from './BlockLinesTab';
import { BlockCirclesTab } from './BlockCirclesTab';
import { BlockArcsTab } from './BlockArcsTab';
import { BlockTextsTab } from './BlockTextsTab';
import { BlockAttributesTab } from './BlockAttributesTab';
import { useBlockEditor } from './useBlockEditor';

interface BlockEditorModalProps {
  initialBlockName?: string;
  onClose: () => void;
}

/* The modal is the shell: useBlockEditor holds the state and handlers, the panels beside this file draw them. */
export function BlockEditorModal({ initialBlockName, onClose }: BlockEditorModalProps) {
  const ed = useBlockEditor(initialBlockName);
  const { handleSaveBlock, handleInsertOnSheet } = ed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs select-none p-3 animate-in fade-in duration-200">
      <div className="flex h-[94vh] w-[96vw] max-w-[1450px] flex-col overflow-hidden rounded-xl border border-[#3c3c3c] bg-[#1e1e1e] text-[#cccccc] shadow-2xl">
        <BlockEditorHeader ed={ed} onClose={onClose} />

        {/* Main Work Area: Left Sidebar (All Drawing Elements & Blocks) + Center (Interactive Preview) + Right (Inspector & Tools) */}
        <div className="flex flex-1 overflow-hidden">
          <BlockElementSidebar ed={ed} />

          <BlockPreviewCanvas ed={ed} />

          {/* 3. Right Inspector & Tools Column */}
          <div className="w-96 border-l border-[#333] bg-[#1e1e1e] flex flex-col overflow-hidden">
            <BlockMetadataPanel ed={ed} />

            <BlockInspectorTabs ed={ed} />

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <BlockQuickAddTab ed={ed} />

              <BlockLinesTab ed={ed} />

              <BlockCirclesTab ed={ed} />

              <BlockArcsTab ed={ed} />

              <BlockTextsTab ed={ed} />

              <BlockAttributesTab ed={ed} />
            </div>

            {/* Bottom Actions Bar */}
            <div className="border-t border-[#333] bg-[#252526] p-3 flex items-center justify-between">
              <button
                onClick={handleInsertOnSheet}
                className="rounded border border-[#444] bg-[#2d2d2d] px-3 py-1.5 text-xs text-white hover:bg-[#383838] transition-colors"
                title="Place an instance of this block onto the main canvas"
              >
                + Insert on Sheet
              </button>
              <button
                onClick={handleSaveBlock}
                className="rounded bg-go px-4 py-1.5 text-xs font-bold text-white hover:bg-go-hover transition-colors shadow-sm"
              >
                💾 Save Block Definition
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
