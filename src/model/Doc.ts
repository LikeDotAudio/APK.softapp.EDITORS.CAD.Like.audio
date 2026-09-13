// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { ArcEdge, BBox, Edge, GroupPrimitive, Point, Vertex } from '../core/types';
import type { ArcGeom } from '../geometry/arc/arcGeom';
import { arcGeom } from '../geometry/arc/arcGeom';
import { addArc } from './doc/addArc';
import { addArcEdge } from './doc/addArcEdge';
import { addLine } from './doc/addLine';
import { addLineEdge } from './doc/addLineEdge';
import { addVertex } from './doc/addVertex';
import { bounds } from './doc/bounds';
import { boundsOf } from './doc/boundsOf';
import { clearDoc } from './doc/clearDoc';
import { distToEdge } from './doc/distToEdge';
import { divideEdge } from './doc/divideEdge';
import type { DocSnapshot } from './doc/DocSnapshot';
import { edgeBBox } from './doc/edgeBBox';
import { edgeMidpoint } from './doc/edgeMidpoint';
import { explodeSelected } from './doc/explodeSelected';
import { findVertexNear } from './doc/findVertexNear';
import { flipHorizontal } from './doc/flipHorizontal';
import { flipVertical } from './doc/flipVertical';
import { groupSelected } from './doc/groupSelected';
import { hitEdgeAt } from './doc/hitEdgeAt';
import { moveVertex } from './doc/moveVertex';
import { removeEdge } from './doc/removeEdge';
import { resolveAllIntersections } from './doc/resolveAllIntersections';
import { restoreDoc } from './doc/restoreDoc';
import { rotateEdges } from './doc/rotateEdges';
import { scaleAll } from './doc/scaleAll';
import { scaleEdges } from './doc/scaleEdges';
import { snapshotDoc } from './doc/snapshotDoc';
import { splitArcAt } from './doc/splitArcAt';
import { splitLineAt } from './doc/splitLineAt';
import { translateEdges } from './doc/translateEdges';
import { vertexDegree } from './doc/vertexDegree';

export type { DocSnapshot } from './doc/DocSnapshot';

/**
 * The drawing's geometry: a graph of vertices joined by line or true-arc edges.
 *
 * Everything that mutates geometry lives under `doc/`, one operation per file;
 * this class holds the data and forwards to them. Edges carry a `groupId`
 * identifying the draw operation that created them, which drives "select whole
 * shape" and lossless export of untouched circles.
 */
export class Doc {
  vertices = new Map<number, Vertex>();
  edges = new Map<number, Edge>();
  /** Original construction primitive per group, when one exists. */
  groupPrimitives = new Map<number, GroupPrimitive>();
  /** Groups whose primitive has not been cut or split since creation. */
  groupIntact = new Set<number>();

  /** @internal — id counters, public only so the `doc/` operations can bump them. */
  nextVertexId = 1;
  /** @internal */
  nextEdgeId = 1;
  /** @internal */
  nextGroupId = 1;

  // ---------------------------------------------------------------- lookups

  vertex(id: number): Vertex | undefined {
    return this.vertices.get(id);
  }

  /** Vertex lookup that throws on a dangling id — edges always reference live vertices. */
  vertexOf(id: number): Vertex {
    const v = this.vertices.get(id);
    if (!v) throw new Error(`Doc: missing vertex ${id}`);
    return v;
  }

  edge(id: number): Edge | undefined {
    return this.edges.get(id);
  }

  get edgeCount(): number {
    return this.edges.size;
  }

  get isEmpty(): boolean {
    return this.edges.size === 0;
  }

  newGroupId(): number {
    return this.nextGroupId++;
  }

  endpointsOf(e: Edge): [Vertex, Vertex] {
    return [this.vertexOf(e.v1), this.vertexOf(e.v2)];
  }

  arcOf(e: ArcEdge): ArcGeom {
    return arcGeom(e.cx, e.cy, e.r, this.vertexOf(e.v1), this.vertexOf(e.v2));
  }

  // ---------------------------------------------------------------- vertices

  findVertexNear(x: number, y: number, eps?: number): number | null {
    return findVertexNear(this, x, y, eps);
  }

  addVertex(x: number, y: number): number {
    return addVertex(this, x, y);
  }

  vertexDegree(vId: number): number {
    return vertexDegree(this, vId);
  }

  moveVertex(vId: number, x: number, y: number): boolean {
    return moveVertex(this, vId, x, y);
  }

  // ------------------------------------------------------------------- edges

  addLineEdge(v1: number, v2: number, groupId: number, layerId?: string): number | null {
    return addLineEdge(this, v1, v2, groupId, layerId);
  }

  addArcEdge(
    v1: number,
    v2: number,
    cx: number,
    cy: number,
    r: number,
    groupId: number,
    layerId?: string,
  ): number | null {
    return addArcEdge(this, v1, v2, cx, cy, r, groupId, layerId);
  }

  addLine(p1: Point, p2: Point, groupId?: number, layerId?: string): number | null {
    return addLine(this, p1, p2, groupId, layerId);
  }

  addArc(cx: number, cy: number, r: number, p1: Point, p2: Point, groupId?: number, layerId?: string): number | null {
    return addArc(this, cx, cy, r, p1, p2, groupId, layerId);
  }

  removeEdge(id: number): void {
    removeEdge(this, id);
  }

  // -------------------------------------------------------------- edge shape

  edgeMidpoint(e: Edge): Point {
    return edgeMidpoint(this, e);
  }

  edgeBBox(e: Edge): BBox {
    return edgeBBox(this, e);
  }

  bounds(): BBox | null {
    return bounds(this);
  }

  boundsOf(edgeIds: Iterable<number>): BBox | null {
    return boundsOf(this, edgeIds);
  }

  // --------------------------------------------------------------- hit tests

  distToEdge(wx: number, wy: number, e: Edge): number {
    return distToEdge(this, wx, wy, e);
  }

  hitEdgeAt(wx: number, wy: number, zoom: number, maxPx?: number): number | null {
    return hitEdgeAt(this, wx, wy, zoom, maxPx);
  }

  // ----------------------------------------------------------------- cutting

  splitLineAt(edgeId: number, ts: number[]): number[] {
    return splitLineAt(this, edgeId, ts);
  }

  splitArcAt(edgeId: number, ss: number[]): number[] {
    return splitArcAt(this, edgeId, ss);
  }

  resolveAllIntersections(): void {
    resolveAllIntersections(this);
  }

  divideEdge(edgeId: number, px: number, py: number): number | null {
    return divideEdge(this, edgeId, px, py);
  }

  // -------------------------------------------------------------- transforms

  rotateEdges(edgeIds: Iterable<number>, cx: number, cy: number, angleRad: number): boolean {
    return rotateEdges(this, edgeIds, cx, cy, angleRad);
  }

  translateEdges(edgeIds: Iterable<number>, dx: number, dy: number): boolean {
    return translateEdges(this, edgeIds, dx, dy);
  }

  scaleEdges(edgeIds: Iterable<number>, cx: number, cy: number, scaleFactor: number): boolean {
    return scaleEdges(this, edgeIds, cx, cy, scaleFactor);
  }

  flipHorizontal(edgeIds: Iterable<number>): boolean {
    return flipHorizontal(this, edgeIds);
  }

  flipVertical(edgeIds: Iterable<number>): boolean {
    return flipVertical(this, edgeIds);
  }

  scaleAll(f: number): void {
    scaleAll(this, f);
  }

  // -------------------------------------------------------------- grouping

  groupSelected(edgeIds: Iterable<number>): number {
    return groupSelected(this, edgeIds);
  }

  explodeSelected(edgeIds: Iterable<number>): number {
    return explodeSelected(this, edgeIds);
  }

  // ------------------------------------------------------------------- undo

  clear(): void {
    clearDoc(this);
  }

  snapshot(): DocSnapshot {
    return snapshotDoc(this);
  }

  restore(s: DocSnapshot): void {
    restoreDoc(this, s);
  }
}
