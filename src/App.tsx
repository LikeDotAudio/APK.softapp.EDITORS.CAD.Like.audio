// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useState } from 'react';
import { DrawingCanvas } from './components/DrawingCanvas';
import { ImagePanel } from './components/ImagePanel';
import { SidebarPanel } from './components/sidebar/SidebarPanel';
import { StatusBar } from './components/statusbar/StatusBar';
import { MenuBar } from './components/menubar/MenuBar';
import { VerticalToolbar } from './components/toolbar/VerticalToolbar';
import { EditorStore } from './state/EditorStore';
import { EditorContext } from './state/EditorContext';
import { currentEntrance } from './shell/entrance';
import { EntranceContext } from './shell/EntranceContext';
import { SpreadsheetModal } from './components/spreadsheet/SpreadsheetModal';

export default function App() {
  /* Which of the two desktop tiles opened this window. Read once: the fragment
     names the entrance, and an entrance is not a thing that changes under a
     running editor. */
  const [entrance] = useState(currentEntrance);
  const [store] = useState(() => new EditorStore(entrance));
  const [showSpreadsheet, setShowSpreadsheet] = useState(false);

  return (
    <EntranceContext.Provider value={entrance}>
      <EditorContext.Provider value={store}>
        <div className="flex h-full flex-col overflow-hidden bg-[#1e1e1e]">
          {/* Top CAD Header Bar */}
          <MenuBar onOpenSpreadsheet={() => setShowSpreadsheet(true)} />

          {/* Main Work Area: Left Toolbar + Canvas + Right Sidebar */}
          <div className="flex flex-1 overflow-hidden relative">
            <VerticalToolbar />
            <div className="flex flex-1 flex-col overflow-hidden relative">
              <DrawingCanvas />
              <ImagePanel />
            </div>
            <SidebarPanel />
          </div>

          {/* Bottom Status Bar */}
          <StatusBar />

          {/* Spreadsheet Modal */}
          {showSpreadsheet && (
            <SpreadsheetModal onClose={() => setShowSpreadsheet(false)} />
          )}
        </div>
      </EditorContext.Provider>
    </EntranceContext.Provider>
  );
}
