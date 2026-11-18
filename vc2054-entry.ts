/** Vite-only metadata entry. The classic script order and data flows are intact. */
import {buildIdentity} from './vc2054-build-contract';

const identity=buildIdentity(import.meta.env.PROD?'vite-production':'vite-development');

// A DOM metadata marker allows the build to be distinguished from the
// compatible source deployment without touching scoring, scouting or storage.
if(typeof document!=='undefined'){
 const marker=document.createElement('meta');
 marker.name='vc-build-identity';
 marker.content=`${identity.version}:${identity.environment}`;
 document.head.appendChild(marker);
}
