// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@state/useStore';
import { blockEditorMessage, postToEditor, toEditor } from '../../shell/hostBridge/blockHost';

export interface SoftappDef {
  id: string;
  name: string;
  path: string;
  category: string;
  icon: string;
}

export const STANDALONE_SOFTAPPS: SoftappDef[] = [
  { id: 'device', name: 'Device Library & Expansion', path: '/APK:Softapps/EDITORS/EDITORS.Device/index.html', category: 'Hardware', icon: '📦' },
  { id: 'switch', name: 'Network Switch Matrix & QoS', path: '/APK:Softapps/EDITORS/EDITORS.Switch/index.html', category: 'Network', icon: '🖧' },
  { id: 'patchbay', name: 'Audio Patchbay & Normalling', path: '/APK:Softapps/EDITORS/EDITORS.PatchPanel/index.html', category: 'Audio', icon: '🎛️' },
  { id: 'panelbuddy', name: 'Panel Buddy Designation Strips', path: '/APK:Softapps/EDITORS/EDITORS.PanelBuddy/index.html', category: 'Hardware', icon: '🏷️' },
  { id: 'elevation', name: 'Rack Elevation Builder (19")', path: '/APK:Softapps/EDITORS/EDITORS.ElevationBuilder/index.html', category: 'Hardware', icon: '🗄️' },
  { id: 'floorplan', name: 'Architectural Floor Plan & Drops', path: '/APK:Softapps/EDITORS/EDITORS.FloorPlan/index.html', category: 'Spatial', icon: '🗺️' },
  { id: 'powerchain', name: 'Technical Power Distribution & 3-Phase', path: '/APK:Softapps/EDITORS/EDITORS.PowerChain/index.html', category: 'Electrical', icon: '⚡' },
  { id: 'dspmockup', name: 'Audio DSP Processing Chain', path: '/APK:Softapps/EDITORS/EDITORS.DSPmockUp/index.html', category: 'Audio', icon: '🎛️' },
  { id: 'surfacedesigner', name: 'Surface Designer & Wall Plates', path: '/APK:Softapps/EDITORS/EDITORS.SurfaceDesigner/index.html', category: 'Hardware', icon: '🎚️' },
  { id: 'cablelabels', name: 'Cable Label Wizard (Avery MR610)', path: '/APK:Softapps/DATATYPE/DATATYPE.CableLabels/index.html', category: 'Cable', icon: '🏷️' },
  { id: 'touchpanel', name: 'Touch Panel GUI Builder', path: '/APK:Softapps/EDITORS/EDITORS.TouchPanelBuilder/index.html', category: 'Display', icon: '📱' },
  { id: 'blockbuddy', name: 'Block Buddy Schematic Symbol', path: '/APK:Softapps/EDITORS/EDITORS.BlockBuddy/index.html', category: 'Schematic', icon: '🧱' },
  { id: 'kicad', name: 'KiCad EDA Netlist & Symbols', path: '/APK:Softapps/EDITORS/EDITORS.KiCad/index.html', category: 'EDA', icon: '🔌' },
  { id: 'wirelist', name: 'Wirelist Cable Pull Schedule', path: '/APK:Softapps/EDITORS/EDITORS.Wirelist/index.html', category: 'Cable', icon: '📋' },
  { id: 'crosspoint', name: 'Crosspoint Routing Matrix', path: '/APK:Softapps/EDITORS/EDITORS.Crosspoint/index.html', category: 'Routing', icon: '🔀' },
  { id: 'bom', name: 'Bill of Materials & Cost Rollup', path: '/APK:Softapps/EDITORS/EDITORS.BOM/index.html', category: 'Business', icon: '💰' },
  { id: 'adapter', name: 'Adapter & Media Balun Buddy', path: '/APK:Softapps/EDITORS/EDITORS.AdapterBuddy/index.html', category: 'Hardware', icon: '🔌' },
  { id: 'computer', name: 'Compute Node & NIC Interface Buddy', path: '/APK:Softapps/EDITORS/EDITORS.ComputerBuddy/index.html', category: 'Compute', icon: '🖥️' },
  { id: 'group', name: 'Spatial Hierarchy Group Buddy', path: '/APK:Softapps/EDITORS/EDITORS.GroupBuddy/index.html', category: 'Spatial', icon: '📁' },
  { id: 'port', name: 'Port Buddy Electrical Parameters', path: '/APK:Softapps/EDITORS/EDITORS.PortBuddy/index.html', category: 'Hardware', icon: '🔵' },
  { id: 'portal', name: 'Cross-Sheet Portal Reference Buddy', path: '/APK:Softapps/EDITORS/EDITORS.PortalBuddy/index.html', category: 'Schematic', icon: '🌀' },
  { id: 'wireless', name: 'Wireless RF Spectrum & IMD3 Buddy', path: '/APK:Softapps/EDITORS/EDITORS.WirelessBuddy/index.html', category: 'RF', icon: '📻' },
  { id: 'ipam', name: 'IPAM Subnet & VLAN Manager', path: '/APK:Softapps/EDITORS/EDITORS.IPAM/index.html', category: 'Network', icon: '🌐' },
  { id: 'raci', name: 'RACI Responsibility Matrix', path: '/APK:Softapps/EDITORS/EDITORS.RACI/index.html', category: 'Project', icon: '👥' },
  { id: 'readiness', name: 'Commissioning Readiness Pipeline', path: '/APK:Softapps/EDITORS/EDITORS.Readiness/index.html', category: 'Project', icon: '🚀' },
  { id: 'moip', name: 'SMPTE ST 2022-7 MoIP Redundancy', path: '/APK:Softapps/EDITORS/EDITORS.MoipBuddy/index.html', category: 'Broadcast', icon: '📡' },
  { id: 'drawingsheet', name: 'Drawing Sheet Borders & Title Block', path: '/APK:Softapps/EDITORS/EDITORS.DrawingSheet/index.html', category: 'Schematic', icon: '📐' },
  { id: 'snpwrangler', name: 'Selenio ST 2110 / ST 2022-7 Wrangler', path: '/APK:Softapps/EDITORS/EDITORS.SnpWrangler/index.html', category: 'Broadcast', icon: '📡' },
  { id: 'topologymanifest', name: 'Project Topology & Manifest', path: '/APK:Softapps/DATATYPE/DATATYPE.TopologyManifest/index.html', category: 'Project', icon: '🌐' },
];

interface SoftappBlockBridgeModalProps {
  initialBlockName?: string;
  defaultAppId?: string;
  onClose: () => void;
}

export function SoftappBlockBridgeModal({
  initialBlockName,
  defaultAppId = 'device',
  onClose,
}: SoftappBlockBridgeModalProps) {
  const store = useStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedAppId, setSelectedAppId] = useState<string>(defaultAppId);
  const [syncStatus, setSyncStatus] = useState<string>('Ready');

  const selectedApp = STANDALONE_SOFTAPPS.find((a) => a.id === selectedAppId) || STANDALONE_SOFTAPPS[0];

  // The block to edit, as toEditor.load carries it (host@1, blockHost.ts).
  const loadMessage = () => {
    const name = initialBlockName || 'CUSTOM_BLOCK';
    const block: Record<string, unknown> = initialBlockName && store.doc.blocks.has(initialBlockName)
      ? JSON.parse(JSON.stringify(store.doc.blocks.get(initialBlockName)))
      : { name, type: selectedApp.id, timestamp: Date.now() };
    return toEditor('load', {
      block,
      meta: { source: 'CAD.Like.audio', blockName: name, title: `${selectedApp.name}: ${initialBlockName || 'Block'}` },
    });
  };

  const sendLoad = () => {
    postToEditor(iframeRef.current?.contentWindow, loadMessage(), window.location.origin);
    setSyncStatus('Connected & Synced');
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = blockEditorMessage(event, iframeRef.current?.contentWindow, window.location.origin);
      if (!msg) return;

      if (msg.type === 'editorReady') {
        sendLoad();
      } else if (msg.type === 'blockChanged') {
        setSyncStatus('Edited — not saved into CAD');
      } else if (msg.type === 'blockSave') {
        const returnedBlock = msg.block as Record<string, any> | undefined;
        const blockName = msg.meta?.blockName || initialBlockName || 'CUSTOM_BLOCK';

        store.edit(() => {
          if (returnedBlock) {
            // Update or register block in CAD document
            store.doc.blocks.set(blockName, {
              name: blockName,
              description: returnedBlock.description || returnedBlock.name,
              basePoint: returnedBlock.basePoint || { x: 0, y: 0 },
              lines: returnedBlock.lines || [],
              arcs: returnedBlock.arcs || [],
              circles: returnedBlock.circles || [],
              texts: returnedBlock.texts || [],
              fills: returnedBlock.fills || [],
            });
            return true;
          }
          return false;
        });

        setSyncStatus('Block Saved into CAD ✓');
        store.showHint(`Block "${blockName}" updated from ${selectedApp.name}.`, 3000);
      } else if (msg.type === 'editorClose') {
        onClose();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [store, initialBlockName, selectedApp, onClose]);

  const handlePopOut = () => {
    window.open(selectedApp.path, '_blank', 'width=1200,height=800');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex h-[92vh] w-[96vw] max-w-7xl flex-col rounded-lg border border-[#1E2A45] bg-[#080C16] shadow-2xl overflow-hidden">
        {/* Modal Window Header */}
        <div className="flex h-11 items-center justify-between border-b border-[#1E2A45] bg-[#121A2F] px-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">{selectedApp.icon}</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#F0F4F8]">{selectedApp.name}</span>
              <span className="text-xs text-[#8B9BB4]">• Standalone Editor Bridge</span>
            </div>
            <div className="h-4 w-px bg-[#1E2A45] mx-1" />
            <select
              value={selectedAppId}
              onChange={(e) => {
                setSelectedAppId(e.target.value);
                setSyncStatus('Switching App...');
              }}
              className="rounded border border-[#1E2A45] bg-[#0E1424] px-2 py-1 text-xs text-[#F0F4F8] focus:border-accent focus:outline-none"
            >
              {STANDALONE_SOFTAPPS.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.icon} {app.name} ({app.category})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-accent">{syncStatus}</span>
            <button
              onClick={handlePopOut}
              className="rounded border border-[#1E2A45] bg-[#1E2A45] px-2.5 py-1 text-xs font-medium text-[#F0F4F8] hover:bg-[#283756]"
              title="Pop out into separate window"
            >
              ↗ Pop Out
            </button>
            <button
              onClick={() => {
                postToEditor(iframeRef.current?.contentWindow, toEditor('request'), window.location.origin);
              }}
              className="rounded bg-accent px-3 py-1 text-xs font-semibold text-black hover:opacity-90"
            >
              💾 Save into CAD
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 text-base text-[#8B9BB4] hover:bg-[#1E2A45] hover:text-white"
              title="Close Modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Embedded Standalone Application Iframe */}
        <div className="relative flex-1 bg-[#080C16]">
          <iframe
            ref={iframeRef}
            src={selectedApp.path}
            onLoad={sendLoad}
            className="h-full w-full border-0"
            title={selectedApp.name}
          />
        </div>
      </div>
    </div>
  );
}
