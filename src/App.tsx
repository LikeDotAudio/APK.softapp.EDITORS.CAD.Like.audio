// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { useEffect, useState } from 'react';
import { DrawingCanvas } from './components/DrawingCanvas';
import { ImagePanel } from './components/ImagePanel';
import { DockProvider } from './components/dock/DockProvider';
import { DockRail } from './components/dock/DockRail';
import { StatusBar } from './components/statusbar/StatusBar';
import { MenuBar } from './components/menubar/MenuBar';
import { VerticalToolbar } from './components/toolbar/VerticalToolbar';
import { EditorStore } from './state/EditorStore';
import { EditorContext } from './state/EditorContext';
import { currentEntrance, currentHost } from './shell/entrance';
import { EntranceContext } from './shell/EntranceContext';
import { SpreadsheetModal } from './components/spreadsheet/SpreadsheetModal';
import { ElementsEditorModal } from './components/elementsEditor/ElementsEditorModal';
import { BlockEditorModal } from './components/blockEditor/BlockEditorModal';
import { ConceptLibraryModal } from './components/conceptLibrary/ConceptLibraryModal';
import { ConnectorsDock } from './connectors/ui/ConnectorsDock';
import { StartupModal } from './components/startup/StartupModal';
import { LoadingOverlay } from './components/loading/LoadingOverlay';
import { ViewportTabs } from './components/viewport/ViewportTabs';

export default function App() {
  /* Which of the two desktop tiles opened this window. Read once: the fragment
     names the entrance, and an entrance is not a thing that changes under a
     running editor. */
  const [entrance] = useState(currentEntrance);
  const [store] = useState(() => new EditorStore(entrance));
  const [showSpreadsheet, setShowSpreadsheet] = useState(false);
  const [spreadsheetTab, setSpreadsheetTab] = useState<'placements' | 'connectors' | 'groups' | 'bom'>('placements');
  const [showElementsEditor, setShowElementsEditor] = useState(false);
  const [showBlockEditor, setShowBlockEditor] = useState(false);
  const [showConceptLibrary, setShowConceptLibrary] = useState(false);
  /* A softapp built on this editor (the acoustic overlay) wants the sheet, not the palette. */
  const [hosted] = useState(() => currentHost() !== null);
  const [showConnectorsDock, setShowConnectorsDock] = useState(!hosted);
  const [blockEditorTarget, setBlockEditorTarget] = useState<string | undefined>(undefined);
  // Prompt user on startup whether to open cached file, open another, create from clipboard, or start fresh
  const [showStartupModal, setShowStartupModal] = useState(() => entrance.entrance === 'drawing' && !hosted);

  const handleOpenSpreadsheet = (tab: 'placements' | 'connectors' | 'groups' | 'bom' = 'placements') => {
    setSpreadsheetTab(tab);
    setShowSpreadsheet(true);
  };

  useEffect(() => {
    store.openBlockEditorModal = (blockName?: string) => {
      setBlockEditorTarget(blockName);
      setShowBlockEditor(true);
    };
    store.openConceptLibraryModal = () => {
      setShowConceptLibrary(true);
    };
    store.openStartupModal = () => {
      setShowStartupModal(true);
    };
    return () => {
      store.openBlockEditorModal = null;
      store.openConceptLibraryModal = null;
      store.openStartupModal = null;
    };
  }, [store]);

  const handleOpenBlockEditor = (blockName?: string) => {
    setBlockEditorTarget(blockName);
    setShowBlockEditor(true);
  };

  return (
    <EntranceContext.Provider value={entrance}>
      <EditorContext.Provider value={store}>
        <div className="flex h-full flex-col overflow-hidden bg-[#1e1e1e]">
          {/* Top CAD Header Bar */}
          <MenuBar
            onOpenSpreadsheet={() => handleOpenSpreadsheet('placements')}
            onOpenBom={() => handleOpenSpreadsheet('bom')}
            onOpenElementsEditor={() => setShowElementsEditor(true)}
            onOpenBlockEditor={() => handleOpenBlockEditor()}
            onOpenConceptLibrary={() => setShowConceptLibrary(true)}
          />

          {/* Main Work Area: Left Toolbar + docked panels either side of the Canvas */}
          <DockProvider>
            <div className="flex flex-1 overflow-hidden relative">
              <VerticalToolbar />
              <DockRail side="left" />
              <div className="flex flex-1 flex-col overflow-hidden relative">
                <DrawingCanvas />
                <ImagePanel />
              </div>
              <DockRail side="right" />
            </div>
          </DockProvider>

          {/* Connectors Bottom Dock Bar (Exact OneScope Palette) */}
          <ConnectorsDock
            isOpen={showConnectorsDock}
            onClose={() => setShowConnectorsDock(false)}
          />

          {/* Viewport & Sheet Tabs (AutoCAD Model/Layout style) */}
          <ViewportTabs />

          {/* Bottom Status Bar */}
          <StatusBar
            isConnectorsOpen={showConnectorsDock}
            onToggleConnectors={() => setShowConnectorsDock((prev) => !prev)}
          />

          {/* Universal Part & Concept Library Modal */}
          <ConceptLibraryModal
            isOpen={showConceptLibrary}
            onClose={() => setShowConceptLibrary(false)}
          />

          {/* Spreadsheet Modal */}
          {showSpreadsheet && (
            <SpreadsheetModal
              initialTab={spreadsheetTab}
              onClose={() => setShowSpreadsheet(false)}
            />
          )}

          {/* CAD Elements Editor Modal (Text, Blocks, Fills) */}
          {showElementsEditor && (
            <ElementsEditorModal
              onClose={() => setShowElementsEditor(false)}
              onOpenBlockEditor={(name) => handleOpenBlockEditor(name)}
            />
          )}

          {/* CAD Block Editor Modal (BEDIT) */}
          {showBlockEditor && (
            <BlockEditorModal
              initialBlockName={blockEditorTarget}
              onClose={() => setShowBlockEditor(false)}
            />
          )}

          {/* Startup / Welcome Modal */}
          {showStartupModal && (
            <StartupModal onClose={() => setShowStartupModal(false)} />
          )}

          {/* Loading Screen Overlay ("Opening drawings") */}
          <LoadingOverlay />
        </div>
      </EditorContext.Provider>
    </EntranceContext.Provider>
  );
}
