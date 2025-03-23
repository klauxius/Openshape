declare module 'three' {
  export * from 'three';
  // This makes TypeScript treat all imports from 'three' as 'any'
  const _default: any;
  export default _default;
} 