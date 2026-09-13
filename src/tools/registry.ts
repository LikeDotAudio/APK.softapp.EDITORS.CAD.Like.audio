// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { ToolId } from '../core/types';
import { breakTool } from './breakTool';
import { circle2pTool } from './circle2pTool';
import { circle3pTool } from './circle3pTool';
import { circleTool } from './circleTool';
import { ellipseTool } from './ellipseTool';
import { flowTool } from './flowTool';
import { groupTool } from './groupTool';
import { lineAngleTool } from './lineAngleTool';
import { lineOrthogonalTool } from './lineOrthogonalTool';
import { lineTool } from './lineTool';
import { measureTool } from './measureTool';
import { parallelTool } from './parallelTool';
import { polylineTool } from './polylineTool';
import { rectTool } from './rectTool';
import { rotateTool } from './rotateTool';
import { selectTool } from './selectTool';
import { splineTool } from './splineTool';
import { tangentTool } from './tangentTool';
import { wireTool } from './wireTool';
import type { AnyTool } from './types';

/** Toolbar order. */
export const TOOLS: AnyTool[] = [
  selectTool,
  lineTool,
  parallelTool,
  lineAngleTool,
  lineOrthogonalTool,
  tangentTool,
  rotateTool,
  polylineTool,
  splineTool,
  rectTool,
  circleTool,
  circle2pTool,
  circle3pTool,
  ellipseTool,
  breakTool,
  measureTool,
  flowTool,
  wireTool,
  groupTool,
];

const BY_ID = new Map<ToolId, AnyTool>(TOOLS.map((t) => [t.id, t]));

export function getTool(id: ToolId): AnyTool {
  const tool = BY_ID.get(id);
  if (!tool) throw new Error(`Unknown tool: ${id}`);
  return tool;
}

/** Lower-case key → tool id, for the single-letter shortcuts. */
export const SHORTCUTS: Record<string, ToolId> = Object.fromEntries(
  TOOLS.map((t) => [t.shortcut, t.id]),
);
