/* V20.5.26 · Canonical, read-only CSV exporter for the historical Data Engine.
 * Every separator, column, spreadsheet formula guard and BOM matches V19.3.8.
 */
import type {NormalizedAnalysis} from './analysis-normalizer';

const val=(value:unknown):string=>String(value??'').trim();

/** Prevent spreadsheet formula injection without changing ordinary numeric cells. */
export function escapeAnalysisCSVCell(value:unknown):string{
 let raw=val(value);
 if(/^[\s\u0000-\u001f]*[=+\-@]/.test(raw)&&
  !/^[-+]?\d+(?:[.,]\d+)?$/.test(raw.trim()))raw="'"+raw;
 return '"'+raw.replace(/"/g,'""')+'"';
}

export type AnalysisCSVData=Pick<NormalizedAnalysis,'matchId'|'rallies'|'contacts'>;

/** Byte-for-byte V19.3.8 CSV export. Accepts a filtered contacts selection. */
export function exportAnalysisCSV(data:AnalysisCSVData):string{
 const header=['Partido','Set','Rally','ID rally estable','Posesión','Acción',
  'ID acción estable','Equipo','Fundamento','Jugador','Evaluación','Zona origen',
  'Zona destino','Zona contacto','Destino E','Tempo E','Combinación','Referencia vídeo'];
 const rByKey=new Map(data.rallies.map(r=>[r.key,r]));
 const rows=data.contacts.map(c=>{
  const r=rByKey.get(c.rallyKey);
  return [data.matchId,c.set,c.rallyIndex,r?.nativeId||'',c.possessionKey||'',
   c.actionIndex+1,c.nativeId||'',c.team||'',c.skill||c.skillRaw,c.player||'',
   c.evaluation||'',c.fields.startZone?.code||'',c.fields.endZone?.code||'',
   c.fields.contactZone?.code||'',c.fields.setTarget?.code||'',
   c.fields.tempo,c.fields.combo,c.video?'Sí':'No'];
 });
 return '\ufeff'+[header,...rows].map(row=>row.map(escapeAnalysisCSVCell).join(';')).join('\r\n');
}
