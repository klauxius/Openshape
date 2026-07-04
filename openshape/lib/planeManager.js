// Datum plane manager for OpenShape.
//
// Lets you rigorously define new reference planes - either offset from a base
// plane by a distance, or from an arbitrary origin + normal - register them,
// visualize them, and later sketch on them (see sketchManager.createSketch,
// which accepts a planeId).

import * as jscad from '@jscad/modeling';
const { colorize } = jscad.colors;

import { modelStore, notifyModelChanged } from './mcpTools';
import { basePlaneFrame, frameFromNormal, offsetFrame, frameMatrix } from './planeFrame';

class PlaneManager {
  constructor() {
    this.planes = {};
    this.nextId = 1;
  }

  // Offset datum plane: parallel to a base plane, shifted along its normal.
  createOffsetPlane({ basePlane = 'xy', offset = 0, name } = {}) {
    if (!['xy', 'yz', 'xz'].includes(basePlane)) {
      throw new Error(`Invalid base plane: ${basePlane}`);
    }
    const frame = offsetFrame(basePlaneFrame(basePlane, 0), offset);
    return this.#register({
      definition: { type: 'offset', basePlane, offset },
      frame,
      name
    });
  }

  // General datum plane defined by an origin point and a normal direction.
  createPlaneFromNormal({ origin = [0, 0, 0], normal = [0, 0, 1], name } = {}) {
    if (!Array.isArray(normal) || normal.length < 3) {
      throw new Error('normal must be a [x, y, z] vector');
    }
    const frame = frameFromNormal(origin, normal);
    return this.#register({
      definition: { type: 'normal', origin, normal },
      frame,
      name
    });
  }

  #register({ definition, frame, name }) {
    const id = `datumplane_${this.nextId++}`;
    const plane = {
      id,
      name: name || `Plane ${this.nextId - 1}`,
      definition,
      frame,
      createdAt: new Date()
    };
    this.planes[id] = plane;

    // Add a translucent visualization so the plane is visible before sketching.
    try {
      const size = 12;
      let viz = jscad.primitives.cuboid({ size: [size * 2, size * 2, 0.02] });
      viz = jscad.transforms.transform(frameMatrix(frame), viz);
      const modelId = modelStore.addModel(colorize([0.4, 0.7, 1, 0.25], viz), `datumplane_viz_${id}`);
      plane.vizModelId = modelId;
      notifyModelChanged({ id: modelId, geometry: modelStore.getModel(modelId).geometry, isVisible: true });
    } catch (error) {
      console.warn('[PlaneManager] Could not create plane visualization:', error);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openshape:planeCreated', { detail: { plane } }));
    }

    return plane;
  }

  getPlane(id) {
    return this.planes[id];
  }

  list() {
    return Object.values(this.planes).map(p => ({
      id: p.id,
      name: p.name,
      definition: p.definition
    }));
  }
}

const planeManager = new PlaneManager();
export default planeManager;
