// Global declarations for Three.js
declare module 'three' {
  export class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    clone(): Vector3;
    set(x: number, y: number, z: number): this;
    copy(v: Vector3): this;
    applyQuaternion(q: Quaternion): this;
    distanceTo(v: Vector3): number;
    multiplyScalar(s: number): this;
    normalize(): this;
  }

  export class Euler {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number, order?: string);
    setFromQuaternion(q: Quaternion, order?: string): this;
  }

  export class Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
    constructor(x?: number, y?: number, z?: number, w?: number);
    clone(): Quaternion;
  }

  export class MathUtils {
    static radToDeg(radians: number): number;
    static degToRad(degrees: number): number;
  }

  export class Camera extends Object3D {
    matrixWorldInverse: Matrix4;
    projectionMatrix: Matrix4;
    projectionMatrixInverse: Matrix4;
    isCamera: true;
    updateProjectionMatrix(): void;
  }

  export class Object3D {
    position: Vector3;
    quaternion: Quaternion;
    up: Vector3;
    userData: any;
    matrix: Matrix4;
    matrixWorld: Matrix4;
    updateMatrix(): void;
    updateMatrixWorld(force?: boolean): void;
    lookAt(vector: Vector3 | number, y?: number, z?: number): void;
  }

  export class Matrix4 {
    elements: Float32Array;
    constructor();
  }
} 