(()=>{
'use strict';
const video=window.VC_VIDEO=window.VC_VIDEO||{};
Object.assign(video,{schemaVersion:1,enabled:false,sourceTypes:['file','camera','stream'],
 createState(existing){return Object.assign({id:null,source:null,sourceType:null,syncOffsetMs:0,delayedLiveMs:10000,createdAt:null,updatedAt:null,clips:[]},existing||{})},
 actionFields:['videoStart','videoAction','videoEnd','clipId'],rallyFields:['videoStart','videoEnd']});
})();
