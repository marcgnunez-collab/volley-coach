/** Type-checked pilot for the new build boundary; contains no match mutations. */
export type BuildEnvironment='vite-production'|'vite-development';

export interface BuildIdentity{
 readonly version:'20.5.4';
 readonly toolchain:'Vite';
 readonly environment:BuildEnvironment;
 readonly safety:'legacy-writers-preserved';
}

export function buildIdentity(environment:BuildEnvironment):Readonly<BuildIdentity>{
 return Object.freeze({
  version:'20.5.4',
  toolchain:'Vite',
  environment,
  safety:'legacy-writers-preserved'
 });
}
