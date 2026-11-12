// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/** Everything the Block Editor holds: the block being edited (a local copy until Save), the sidebar's filter
 *  and pages, the inspector's tab and form fields, the placed instance in hand, and every handler. The modal
 *  and its panels read it as one object (`ed`); the state and handlers are the ones the modal always had. */
import { useCallback, useEffect, useState } from 'react';
import type { CadBlockDefinition, CadBlockInstance, Point } from '../../core/types';
import type { InspectorTab, ItemCategory, EditorListItem } from './blockEditorTypes';
import { generateUuid } from '../../core/generateUuid';
import { useStore } from '@state/useStore';
import { useUi } from '@state/useUi';
import { useBlockElements } from './useBlockElements';
import { useBlockGeometry } from './useBlockGeometry';

export function useBlockEditor(initialBlockName: string | undefined) {
  const store = useStore();
  const { activeLayerId } = useUi();

  const blocksList = Array.from(store.doc.blocks.values());
  const initialName =
    initialBlockName && store.doc.blocks.has(initialBlockName)
      ? initialBlockName
      : blocksList[0]?.name ?? 'RESISTOR';

  const [selectedBlockName, setSelectedBlockName] = useState<string>(initialName);
  const [originalName, setOriginalName] = useState<string>(initialName);
  const [selectedItemId, setSelectedItemId] = useState<string>(`block_${initialName}`);
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory>('all');
  const [selectedInstance, setSelectedInstance] = useState<CadBlockInstance | null>(null);
  const [copiedUuid, setCopiedUuid] = useState(false);
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrVal, setNewAttrVal] = useState('');

  // Pagination states
  const [sidebarPage, setSidebarPage] = useState(1);
  const [linesPage, setLinesPage] = useState(1);
  const [circlesPage, setCirclesPage] = useState(1);
  const [arcsPage, setArcsPage] = useState(1);
  const [textsPage, setTextsPage] = useState(1);

  // Editable local copy of the block definition
  const [currentBlock, setCurrentBlock] = useState<CadBlockDefinition>(() => {
    const found = store.doc.blocks.get(initialName);
    if (found) return JSON.parse(JSON.stringify(found)) as CadBlockDefinition;
    return {
      name: 'NEW_BLOCK',
      basePoint: { x: 0, y: 0 },
      lines: [],
      arcs: [],
      circles: [],
      texts: [],
      fills: [],
    };
  });

  const [activeTab, setActiveTab] = useState<InspectorTab>('quickAdd');
  const [pickingBasePoint, setPickingBasePoint] = useState(false);
  const [search, setSearch] = useState('');

  // Quick Add tool form states
  const [lineX1, setLineX1] = useState('0');
  const [lineY1, setLineY1] = useState('0');
  const [lineX2, setLineX2] = useState('2');
  const [lineY2, setLineY2] = useState('0');

  const [boxX, setBoxX] = useState('-1');
  const [boxY, setBoxY] = useState('-0.5');
  const [boxW, setBoxW] = useState('2');
  const [boxH, setBoxH] = useState('1');

  const [circleCx, setCircleCx] = useState('0');
  const [circleCy, setCircleCy] = useState('0');
  const [circleR, setCircleR] = useState('0.75');

  const [arcCx, setArcCx] = useState('0');
  const [arcCy, setArcCy] = useState('0');
  const [arcR, setArcR] = useState('1');
  const [arcA1, setArcA1] = useState('0');
  const [arcA2, setArcA2] = useState('180');

  const [textStr, setTextStr] = useState('LABEL');
  const [textX, setTextX] = useState('0');
  const [textY, setTextY] = useState('0');
  const [textH, setTextH] = useState('0.4');
  const [textRot, setTextRot] = useState('0');

  const [pinX, setPinX] = useState('0');
  const [pinY, setPinY] = useState('0');
  const [pinLen, setPinLen] = useState('1');
  const [pinDir, setPinDir] = useState<'left' | 'right' | 'up' | 'down'>('left');
  const [pinLabel, setPinLabel] = useState('IN');

  const [fillW, setFillW] = useState('2');
  const [fillH, setFillH] = useState('1');
  const [fillColor, setFillColor] = useState('#38bdf8');
  const [fillOpacity, setFillOpacity] = useState('0.25');

  // Load a block into the editor
  const loadBlock = useCallback((name: string) => {
    const found = store.doc.blocks.get(name);
    if (!found) return;
    const cloned = JSON.parse(JSON.stringify(found)) as CadBlockDefinition;
    setSelectedBlockName(name);
    setOriginalName(name);
    setCurrentBlock(cloned);
  }, [store]);

  const {
    buildActiveDrawingBlock, buildLayerBlock, buildTextBlock, buildFillBlock, buildFlowBlock, allElementsList, filteredElements, categoryCounts, SIDEBAR_PAGE_SIZE, totalSidebarPages, currentSidebarPage, pagedSidebarElements,
  } = useBlockElements(store, categoryFilter, search, sidebarPage);

  const handleSelectItem = useCallback((item: EditorListItem) => {
    setSelectedItemId(item.id);
    setSelectedInstance(item.instance ?? null);

    if (item.category === 'block' && item.defName) {
      loadBlock(item.defName);
    } else if (item.category === 'instance' && item.instance) {
      if (store.doc.blocks.has(item.instance.blockName)) {
        loadBlock(item.instance.blockName);
      }
      setActiveTab('attributes');
    } else if (item.category === 'master') {
      const b = buildActiveDrawingBlock();
      setSelectedBlockName('ACTIVE_DRAWING');
      setOriginalName('ACTIVE_DRAWING');
      setCurrentBlock(b);
      setPickingBasePoint(false);
    } else if (item.category === 'layer' && item.layerId) {
      const b = buildLayerBlock(item.layerId);
      setSelectedBlockName(`LAYER_${item.layerId}`);
      setOriginalName(`LAYER_${item.layerId}`);
      setCurrentBlock(b);
      setPickingBasePoint(false);
    } else if (item.category === 'text' && item.textEntity) {
      const b = buildTextBlock(item.textEntity);
      setSelectedBlockName(`TEXT_${item.textEntity.id}`);
      setOriginalName(`TEXT_${item.textEntity.id}`);
      setCurrentBlock(b);
      setPickingBasePoint(false);
    } else if (item.category === 'fill' && item.fillEntity) {
      const b = buildFillBlock(item.fillEntity);
      setSelectedBlockName(`FILL_${item.fillEntity.id}`);
      setOriginalName(`FILL_${item.fillEntity.id}`);
      setCurrentBlock(b);
      setPickingBasePoint(false);
    } else if (item.category === 'flow' && item.flowPlacement) {
      const b = buildFlowBlock(item.flowPlacement);
      setSelectedBlockName(`FLOW_${item.flowPlacement.id}`);
      setOriginalName(`FLOW_${item.flowPlacement.id}`);
      setCurrentBlock(b);
      setPickingBasePoint(false);
    }
  }, [buildActiveDrawingBlock, buildFillBlock, buildFlowBlock, buildLayerBlock, buildTextBlock, loadBlock, store.doc.blocks]);

  // When initialBlockName changes externally
  useEffect(() => {
    if (initialBlockName && store.doc.blocks.has(initialBlockName)) {
      loadBlock(initialBlockName);
    }
  }, [initialBlockName, loadBlock, store]);

  const {
    canvasRef, zoom, setZoom, pan, setPan, isPanning, setIsPanning, panStart, setPanStart, hoverWorld, setHoverWorld, worldToScreen, screenToWorld, handleZoomToFit, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel,
  } = useBlockGeometry(store, currentBlock, setCurrentBlock, pickingBasePoint, setPickingBasePoint);

  // Save current block definition to store
  const handleSaveBlock = () => {
    const name = currentBlock.name.trim();
    if (!name) {
      alert('Block name cannot be empty.');
      return;
    }

    store.history.push(store.doc.snapshot());

    if (originalName !== name) {
      store.doc.renameBlockDefinition(originalName, name);
    }

    store.doc.addBlockDefinition(currentBlock);
    setOriginalName(name);
    setSelectedBlockName(name);

    store.markDocChanged();
    store.requestDraw();
    store.emit();
    store.showHint(`Block "${name}" definition saved. Placed instances updated.`, 3000);
  };

  // Create brand new blank block
  const handleNewBlock = () => {
    const name = window.prompt('Enter new block definition name:', 'BLOCK_1');
    if (!name || !name.trim()) return;
    const cleanName = name.trim().toUpperCase().replace(/\s+/g, '_');

    if (store.doc.blocks.has(cleanName)) {
      alert(`A block named "${cleanName}" already exists.`);
      return;
    }

    const blankDef: CadBlockDefinition = {
      name: cleanName,
      description: 'Custom CAD symbol',
      basePoint: { x: 0, y: 0 },
      lines: [],
      circles: [],
      arcs: [],
      texts: [],
      fills: [],
    };

    store.doc.addBlockDefinition(blankDef);
    setSelectedBlockName(cleanName);
    setOriginalName(cleanName);
    setCurrentBlock(blankDef);
    store.markDocChanged();
    store.emit();
    store.showHint(`Created blank block "${cleanName}".`, 2000);
  };

  // Duplicate current block
  const handleDuplicateBlock = () => {
    const copyName = window.prompt('Enter name for duplicate block:', `${currentBlock.name}_COPY`);
    if (!copyName || !copyName.trim()) return;
    const cleanName = copyName.trim().toUpperCase().replace(/\s+/g, '_');

    const copyDef: CadBlockDefinition = {
      ...JSON.parse(JSON.stringify(currentBlock)),
      name: cleanName,
    };

    store.doc.addBlockDefinition(copyDef);
    setSelectedBlockName(cleanName);
    setOriginalName(cleanName);
    setCurrentBlock(copyDef);
    store.markDocChanged();
    store.emit();
    store.showHint(`Duplicated block as "${cleanName}".`, 2000);
  };

  // Delete current block
  const handleDeleteBlock = () => {
    if (!window.confirm(`Are you sure you want to delete block definition "${currentBlock.name}"?`)) {
      return;
    }
    store.doc.removeBlockDefinition(currentBlock.name);
    store.markDocChanged();
    store.requestDraw();
    store.emit();

    const remaining = Array.from(store.doc.blocks.values());
    if (remaining.length > 0) {
      loadBlock(remaining[0].name);
    }
    store.showHint(`Deleted block "${currentBlock.name}".`, 2000);
  };

  // Insert on canvas
  const handleInsertOnSheet = () => {
    store.edit(() => {
      store.doc.addBlockInstance(currentBlock.name, 0, 0, 1, 0, activeLayerId);
      return true;
    });
    store.showHint(`Inserted instance of "${currentBlock.name}" at (0, 0).`, 2500);
  };

  const handleCopyUuid = async (uuidText: string) => {
    try {
      await navigator.clipboard.writeText(uuidText);
      setCopiedUuid(true);
      setTimeout(() => setCopiedUuid(false), 2000);
      store.showHint('Copied Block UUID to clipboard.', 2000);
    } catch {
      // fallback
    }
  };

  const handleRegenerateInstanceUuid = () => {
    if (!selectedInstance) return;
    const newUuid = generateUuid();
    store.history.push(store.doc.snapshot());
    store.edit(() => {
      const inst = store.doc.blockInstances.get(selectedInstance.id);
      if (inst) {
        inst.uuid = newUuid;
      }
      return true;
    });
    setSelectedInstance((prev) => (prev ? { ...prev, uuid: newUuid } : null));
    store.showHint('Regenerated Block UUID.', 2000);
  };

  const handleUpdateInstanceField = (field: keyof CadBlockInstance, value: any) => {
    if (!selectedInstance) return;
    store.history.push(store.doc.snapshot());
    store.edit(() => {
      const inst = store.doc.blockInstances.get(selectedInstance.id);
      if (inst) {
        (inst as any)[field] = value;
      }
      return true;
    });
    setSelectedInstance((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleAddInstanceAttribute = () => {
    if (!selectedInstance || !newAttrKey.trim()) return;
    const k = newAttrKey.trim();
    const v = newAttrVal.trim();
    store.history.push(store.doc.snapshot());
    store.edit(() => {
      const inst = store.doc.blockInstances.get(selectedInstance.id);
      if (inst) {
        inst.attributes = { ...(inst.attributes ?? {}), [k]: v };
      }
      return true;
    });
    setSelectedInstance((prev) =>
      prev ? { ...prev, attributes: { ...(prev.attributes ?? {}), [k]: v } } : null,
    );
    setNewAttrKey('');
    setNewAttrVal('');
    store.showHint(`Added attribute "${k}" = "${v}".`, 2000);
  };

  const handleDeleteInstanceAttribute = (key: string) => {
    if (!selectedInstance) return;
    store.history.push(store.doc.snapshot());
    store.edit(() => {
      const inst = store.doc.blockInstances.get(selectedInstance.id);
      if (inst && inst.attributes) {
        delete inst.attributes[key];
      }
      return true;
    });
    setSelectedInstance((prev) => {
      if (!prev || !prev.attributes) return prev;
      const nextAttrs = { ...prev.attributes };
      delete nextAttrs[key];
      return { ...prev, attributes: nextAttrs };
    });
    store.showHint(`Deleted attribute "${key}".`, 2000);
  };

  const handleApplyToDrawing = () => {
    store.history.push(store.doc.snapshot());
    store.edit(() => {
      store.doc.clear();
      const gId = store.doc.newGroupId();
      for (const l of currentBlock.lines) {
        const v1 = store.doc.addVertex(l.x1, l.y1);
        const v2 = store.doc.addVertex(l.x2, l.y2);
        store.doc.addLineEdge(v1, v2, gId, l.layerId || activeLayerId);
      }
      for (const a of currentBlock.arcs) {
        const rad1 = (a.a1 * Math.PI) / 180;
        const rad2 = (a.a2 * Math.PI) / 180;
        const x1 = a.cx + a.r * Math.cos(rad1);
        const y1 = a.cy + a.r * Math.sin(rad1);
        const x2 = a.cx + a.r * Math.cos(rad2);
        const y2 = a.cy + a.r * Math.sin(rad2);
        const v1 = store.doc.addVertex(x1, y1);
        const v2 = store.doc.addVertex(x2, y2);
        store.doc.addArcEdge(v1, v2, a.cx, a.cy, a.r, gId, a.layerId || activeLayerId);
      }
      for (const c of currentBlock.circles) {
        const v1 = store.doc.addVertex(c.cx + c.r, c.cy);
        const v2 = store.doc.addVertex(c.cx - c.r, c.cy);
        store.doc.addArcEdge(v1, v2, c.cx, c.cy, c.r, gId, c.layerId || activeLayerId);
        store.doc.addArcEdge(v2, v1, c.cx, c.cy, c.r, gId, c.layerId || activeLayerId);
      }
      for (const t of currentBlock.texts ?? []) {
        store.doc.addText(t.text, t.x, t.y, t.height, t.rotation, t.layerId || activeLayerId);
      }
      for (const f of currentBlock.fills ?? []) {
        store.doc.addFill(f.points, 'solid', f.layerId || activeLayerId, f.color, f.opacity);
      }
      return true;
    });
    store.view.zoomToFit(store.doc.bounds());
    store.requestDraw();
    store.emit();
    store.showHint('Applied block changes to drawing canvas.', 3000);
  };

  const handleSaveAsNewBlock = () => {
    const name = window.prompt('Enter name for new block definition:', `${currentBlock.name}_BLOCK`);
    if (!name || !name.trim()) return;
    const cleanName = name.trim().toUpperCase().replace(/\s+/g, '_');
    const newDef: CadBlockDefinition = {
      ...JSON.parse(JSON.stringify(currentBlock)),
      name: cleanName,
    };
    store.doc.addBlockDefinition(newDef);
    setSelectedBlockName(cleanName);
    setOriginalName(cleanName);
    setCurrentBlock(newDef);
    store.markDocChanged();
    store.emit();
    store.showHint(`Saved definition "${cleanName}".`, 2500);
  };

  // Primitives addition helpers
  const handleAddLine = () => {
    const x1 = parseFloat(lineX1) || 0;
    const y1 = parseFloat(lineY1) || 0;
    const x2 = parseFloat(lineX2) || 0;
    const y2 = parseFloat(lineY2) || 0;
    setCurrentBlock((prev) => ({
      ...prev,
      lines: [...prev.lines, { x1, y1, x2, y2 }],
    }));
  };

  const handleAddBox = () => {
    const x = parseFloat(boxX) || 0;
    const y = parseFloat(boxY) || 0;
    const w = parseFloat(boxW) || 1;
    const h = parseFloat(boxH) || 1;
    const newLines = [
      { x1: x, y1: y, x2: x + w, y2: y },
      { x1: x + w, y1: y, x2: x + w, y2: y + h },
      { x1: x + w, y1: y + h, x2: x, y2: y + h },
      { x1: x, y1: y + h, x2: x, y2: y },
    ];
    setCurrentBlock((prev) => ({
      ...prev,
      lines: [...prev.lines, ...newLines],
    }));
  };

  const handleAddCircle = () => {
    const cx = parseFloat(circleCx) || 0;
    const cy = parseFloat(circleCy) || 0;
    const r = parseFloat(circleR) || 0.5;
    setCurrentBlock((prev) => ({
      ...prev,
      circles: [...prev.circles, { cx, cy, r }],
    }));
  };

  const handleAddArc = () => {
    const cx = parseFloat(arcCx) || 0;
    const cy = parseFloat(arcCy) || 0;
    const r = parseFloat(arcR) || 0.5;
    const a1 = parseFloat(arcA1) || 0;
    const a2 = parseFloat(arcA2) || 180;
    setCurrentBlock((prev) => ({
      ...prev,
      arcs: [...prev.arcs, { cx, cy, r, a1, a2 }],
    }));
  };

  const handleAddText = () => {
    const x = parseFloat(textX) || 0;
    const y = parseFloat(textY) || 0;
    const height = parseFloat(textH) || 0.4;
    const rotation = parseFloat(textRot) || 0;
    setCurrentBlock((prev) => ({
      ...prev,
      texts: [...(prev.texts ?? []), { text: textStr, x, y, height, rotation }],
    }));
  };

  const handleAddTerminalPin = () => {
    const px = parseFloat(pinX) || 0;
    const py = parseFloat(pinY) || 0;
    const len = parseFloat(pinLen) || 1;

    let endX = px;
    let endY = py;
    let textOffsetX = 0;
    let textOffsetY = 0;

    if (pinDir === 'left') {
      endX = px - len;
      textOffsetX = -0.2;
    } else if (pinDir === 'right') {
      endX = px + len;
      textOffsetX = 0.2;
    } else if (pinDir === 'up') {
      endY = py + len;
      textOffsetY = 0.2;
    } else if (pinDir === 'down') {
      endY = py - len;
      textOffsetY = -0.2;
    }

    const leadLine = { x1: px, y1: py, x2: endX, y2: endY };
    const terminalDot = { cx: endX, cy: endY, r: 0.1 };
    const labelText = pinLabel
      ? { text: pinLabel, x: endX + textOffsetX, y: endY + textOffsetY, height: 0.3 }
      : null;

    setCurrentBlock((prev) => ({
      ...prev,
      lines: [...prev.lines, leadLine],
      circles: [...prev.circles, terminalDot],
      texts: labelText ? [...(prev.texts ?? []), labelText] : prev.texts,
    }));
  };

  const handleAddFillBox = () => {
    const w = parseFloat(fillW) || 1;
    const h = parseFloat(fillH) || 1;
    const op = parseFloat(fillOpacity) || 0.25;
    const x = -w / 2;
    const y = -h / 2;
    const pts: Point[] = [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ];
    setCurrentBlock((prev) => ({
      ...prev,
      fills: [...(prev.fills ?? []), { points: pts, color: fillColor, opacity: op }],
    }));
  };

  return {
    store, blocksList, initialName, selectedBlockName, setSelectedBlockName, originalName, setOriginalName, selectedItemId,
    setSelectedItemId, categoryFilter, setCategoryFilter, selectedInstance, setSelectedInstance, copiedUuid, setCopiedUuid, newAttrKey,
    setNewAttrKey, newAttrVal, setNewAttrVal, sidebarPage, setSidebarPage, linesPage, setLinesPage, circlesPage,
    setCirclesPage, arcsPage, setArcsPage, textsPage, setTextsPage, currentBlock, setCurrentBlock, activeTab,
    setActiveTab, pickingBasePoint, setPickingBasePoint, search, setSearch, lineX1, setLineX1, lineY1,
    setLineY1, lineX2, setLineX2, lineY2, setLineY2, boxX, setBoxX, boxY,
    setBoxY, boxW, setBoxW, boxH, setBoxH, circleCx, setCircleCx, circleCy,
    setCircleCy, circleR, setCircleR, arcCx, setArcCx, arcCy, setArcCy, arcR,
    setArcR, arcA1, setArcA1, arcA2, setArcA2, textStr, setTextStr, textX,
    setTextX, textY, setTextY, textH, setTextH, textRot, setTextRot, pinX,
    setPinX, pinY, setPinY, pinLen, setPinLen, pinDir, setPinDir, pinLabel,
    setPinLabel, fillW, setFillW, fillH, setFillH, fillColor, setFillColor, fillOpacity,
    setFillOpacity, loadBlock, handleSelectItem, handleSaveBlock, handleNewBlock, handleDuplicateBlock, handleDeleteBlock, handleInsertOnSheet,
    handleCopyUuid, handleRegenerateInstanceUuid, handleUpdateInstanceField, handleAddInstanceAttribute, handleDeleteInstanceAttribute, handleApplyToDrawing, handleSaveAsNewBlock, handleAddLine,
    handleAddBox, handleAddCircle, handleAddArc, handleAddText, handleAddTerminalPin, handleAddFillBox, buildActiveDrawingBlock, buildLayerBlock,
    buildTextBlock, buildFillBlock, buildFlowBlock, allElementsList, filteredElements, categoryCounts, SIDEBAR_PAGE_SIZE, totalSidebarPages,
    currentSidebarPage, pagedSidebarElements, canvasRef, zoom, setZoom, pan, setPan, isPanning,
    setIsPanning, panStart, setPanStart, hoverWorld, setHoverWorld, worldToScreen, screenToWorld, handleZoomToFit,
    handlePointerDown, handlePointerMove, handlePointerUp, handleWheel,
  };
}

/** What the Block Editor's panels are handed. */
export type BlockEditorState = ReturnType<typeof useBlockEditor>;
