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
import { SoftappBlockBridgeModal } from './components/blockEditor/SoftappBlockBridgeModal';
import { LibrarySash, type LibraryLens } from './components/conceptLibrary/BimLibraryTab';
import { offerLibraryToHost } from './shell/hostBridge/hostBridge';
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
  /* 📚 Library or 📖 Catalog — one library per sheet: a host that owns one is asked to show it (ROAD-3603) */
  const [libraryLens, setLibraryLens] = useState<LibraryLens>('part');
  const openLibrary = (lens: LibraryLens) => {
    if (offerLibraryToHost(lens)) return;
    setLibraryLens(lens);
    setShowConceptLibrary((was) => !(was && lens === libraryLens));
  };
  const [showSoftappBridge, setShowSoftappBridge] = useState(false);
  const [softappTargetBlock, setSoftappTargetBlock] = useState<string | undefined>();
  const [softappTargetAppId, setSoftappTargetAppId] = useState<string | undefined>();
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
    store.openLibrarySash = () => {
      if (offerLibraryToHost('part')) return;
      setLibraryLens('part');
      setShowConceptLibrary((was) => !was);
    };
    store.openStartupModal = () => {
      setShowStartupModal(true);
    };
    store.openSoftappBridgeModal = (blockName?: string, defaultAppId?: string) => {
      setSoftappTargetBlock(blockName);
      setSoftappTargetAppId(defaultAppId);
      setShowSoftappBridge(true);
    };
    /* 📚 Library from anywhere: Ctrl/⌘+Shift+L, the shortcut every editor gives it (ROAD-3572) */
    const onLibraryKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        if (offerLibraryToHost('part')) return;
        setLibraryLens('part');
        setShowConceptLibrary((was) => !was);
      }
    };
    window.addEventListener('keydown', onLibraryKey);
    return () => {
      window.removeEventListener('keydown', onLibraryKey);
      store.openBlockEditorModal = null;
      store.openLibrarySash = null;
      store.openStartupModal = null;
      store.openSoftappBridgeModal = null;
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
            onOpenConceptLibrary={() => openLibrary('part')}
            onOpenCatalog={() => openLibrary('catalog')}
          />

          {/* Main Work Area: Left Toolbar + docked panels either side of the Canvas */}
          <DockProvider>
            <div className="flex flex-1 overflow-hidden relative">
              <VerticalToolbar />
              <DockRail side="left" />
              <div className="flex flex-1 flex-col overflow-hidden relative">
                <DrawingCanvas />
                <ImagePanel />
                {/* 📚 the BIM library: a sash over the drawing, not over the toolbar or menus (ROAD-3587) */}
                <LibrarySash open={showConceptLibrary} lens={libraryLens} onClose={() => setShowConceptLibrary(false)} />
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

          {/* Standalone Softapp Block Bridge Modal */}
          {showSoftappBridge && (
            <SoftappBlockBridgeModal
              initialBlockName={softappTargetBlock}
              defaultAppId={softappTargetAppId}
              onClose={() => setShowSoftappBridge(false)}
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
