(function(){
  function vcExtraMatchData(m){
    return {
      kit:String(m?.kit||''),
      pavilion:String(m?.pavilion||''),
      warmupShirt:String(m?.warmupShirt||'')
    };
  }

  const previousNormalizer=normalizarPartidos;
  normalizarPartidos=function(list){
    const rawById=new Map((Array.isArray(list)?list:[]).filter(Boolean).map(m=>[Number(m.id),m]));
    return previousNormalizer(list).map(m=>{
      const raw=rawById.get(Number(m.id))||m||{};
      const extra=vcExtraMatchData(raw);
      return {...m,...extra};
    });
  };

  const previousOpenMatch=abrirPartidoModal;
  abrirPartidoModal=function(id=null){
    const result=previousOpenMatch(id);
    const m=id?partidosEquipo.find(x=>Number(x.id)===Number(id)):null;
    if($('match-kit'))$('match-kit').value=m?.kit||'';
    if($('match-pavilion'))$('match-pavilion').value=m?.pavilion||'';
    if($('match-warmup-shirt'))$('match-warmup-shirt').value=m?.warmupShirt||'';
    return result;
  };

  const previousBuildMatch=vcBuildMatchRecord;
  vcBuildMatchRecord=function(existing=null){
    const rec=previousBuildMatch(existing);
    rec.kit=String($('match-kit')?.value||'').trim();
    rec.pavilion=String($('match-pavilion')?.value||'').trim();
    rec.warmupShirt=String($('match-warmup-shirt')?.value||'').trim();
    return rec;
  };

  /* Normaliza también los partidos ya cargados para que los nuevos campos entren en nube/copia. */
  try{
    ['infantil','cadete'].forEach(team=>{
      if(equiposData?.[team]){
        equiposData[team].partidos=normalizarPartidos(equiposData[team].partidos||[]);
      }
    });
    partidosEquipo=normalizarPartidos(equiposData?.[equipoActivo]?.partidos||partidosEquipo||[]);
    if(equiposData?.[equipoActivo])equiposData[equipoActivo].partidos=partidosEquipo;
    guardarEstadoLocalSinCloud();
  }catch(err){
    console.warn('No se pudieron normalizar los nuevos datos de partido',err);
  }
})();
