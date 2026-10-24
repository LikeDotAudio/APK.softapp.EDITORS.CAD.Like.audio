// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { ToolId } from '../../core/types';

/**
 * Tools that share one toolbar cell. The cell shows the member last used and
 * opens a fly-out of the rest; every member keeps its own shortcut key. A
 * toolbar grouping only — the registry still lists each tool on its own.
 */
export const TOOL_FAMILIES: ToolId[][] = [['circle', 'circle2p', 'circle3p', 'ellipse']];
