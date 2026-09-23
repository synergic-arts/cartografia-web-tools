(() => {
  const $ = id => document.getElementById(id);
  const fields = {lon:$('lon'),lat:$('lat'),zone:$('zone'),hemisphere:$('hemisphere'),easting:$('easting'),northing:$('northing')};
  let lastResult = null;
  const rad = deg => deg * Math.PI / 180;
  const deg = r => r * 180 / Math.PI;
  function formatDms(value, isLat) {
    const abs = Math.abs(value), d = Math.floor(abs), minutesFloat = (abs - d) * 60, m = Math.floor(minutesFloat), s = (minutesFloat - m) * 60;
    const hemi = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'O');
    return `${d}° ${String(m).padStart(2,'0')}′ ${s.toFixed(3).padStart(6,'0')}″ ${hemi}`;
  }
  function utmForward(lon, lat) {
    const a=6378137, eccSquared=0.00669438, k0=0.9996, zone=Math.floor((lon+180)/6)+1, longOrigin=(zone-1)*6-180+3;
    const latRad=rad(lat), longRad=rad(lon), longOriginRad=rad(longOrigin), eccPrimeSquared=eccSquared/(1-eccSquared);
    const N=a/Math.sqrt(1-eccSquared*Math.sin(latRad)**2), T=Math.tan(latRad)**2, C=eccPrimeSquared*Math.cos(latRad)**2, A=Math.cos(latRad)*(longRad-longOriginRad);
    const M=a*((1-eccSquared/4-3*eccSquared**2/64-5*eccSquared**3/256)*latRad-(3*eccSquared/8+3*eccSquared**2/32+45*eccSquared**3/1024)*Math.sin(2*latRad)+(15*eccSquared**2/256+45*eccSquared**3/1024)*Math.sin(4*latRad)-(35*eccSquared**3/3072)*Math.sin(6*latRad));
    let easting=k0*N*(A+(1-T+C)*A**3/6+(5-18*T+T**2+72*C-58*eccPrimeSquared)*A**5/120)+500000;
    let northing=k0*(M+N*Math.tan(latRad)*(A**2/2+(5-T+9*C+4*C**2)*A**4/24+(61-58*T+T**2+600*C-330*eccPrimeSquared)*A**6/720));
    if(lat<0) northing+=10000000;
    return {zone,hemisphere:lat>=0?'N':'S',easting,northing};
  }
  function utmInverse(zone, hemisphere, easting, northing) {
    const a=6378137, eccSquared=0.00669438, k0=0.9996, eccPrimeSquared=eccSquared/(1-eccSquared), e1=(1-Math.sqrt(1-eccSquared))/(1+Math.sqrt(1-eccSquared));
    let y=northing; if(hemisphere==='S') y-=10000000; const x=easting-500000, M=y/k0, mu=M/(a*(1-eccSquared/4-3*eccSquared**2/64-5*eccSquared**3/256));
    const phi1=mu+(3*e1/2-27*e1**3/32)*Math.sin(2*mu)+(21*e1**2/16-55*e1**4/32)*Math.sin(4*mu)+(151*e1**3/96)*Math.sin(6*mu)+(1097*e1**4/512)*Math.sin(8*mu);
    const N1=a/Math.sqrt(1-eccSquared*Math.sin(phi1)**2), T1=Math.tan(phi1)**2, C1=eccPrimeSquared*Math.cos(phi1)**2, R1=a*(1-eccSquared)/(1-eccSquared*Math.sin(phi1)**2)**1.5, D=x/(N1*k0), longOrigin=(zone-1)*6-180+3;
    const lat=phi1-(N1*Math.tan(phi1)/R1)*(D**2/2-(5+3*T1+10*C1-4*C1**2-9*eccPrimeSquared)*D**4/24+(61+90*T1+298*C1+45*T1**2-252*eccPrimeSquared-3*C1**2)*D**6/720);
    const lon=rad(longOrigin)+(D-(1+2*T1+C1)*D**3/6+(5-2*C1+28*T1-3*C1**2+8*eccPrimeSquared+24*T1**2)*D**5/120)/Math.cos(phi1);
    return {lon:deg(lon),lat:deg(lat)};
  }
  function setText(id,value){$(id).textContent=value;}
  function convertDecimal() {
    const lon=Number(fields.lon.value), lat=Number(fields.lat.value);
    if(!Number.isFinite(lon)||!Number.isFinite(lat)||lon<-180||lon>180||lat<-90||lat>90){$('decimalStatus').textContent='Introduce una longitud entre −180 y 180 y una latitud entre −90 y 90.';return;}
    const utm=utmForward(lon,lat); lastResult={datum:'WGS84',longitude:lon,latitude:lat,longitudeDms:formatDms(lon,false),latitudeDms:formatDms(lat,true),utm};
    setText('lonDms',lastResult.longitudeDms);setText('latDms',lastResult.latitudeDms);setText('utmZone',String(utm.zone));setText('utmEasting',utm.easting.toFixed(3));setText('utmNorthing',utm.northing.toFixed(3));setText('utmHemisphere',utm.hemisphere==='N'?'Norte':'Sur');$('decimalStatus').textContent='Conversión completada localmente.';$('copyBtn').disabled=false;$('downloadBtn').disabled=false;
  }
  function reverse() {
    const zone=Number(fields.zone.value), hemi=fields.hemisphere.value, e=Number(fields.easting.value), n=Number(fields.northing.value);
    if(!Number.isInteger(zone)||zone<1||zone>60||!Number.isFinite(e)||!Number.isFinite(n)||e<100000||e>900000||n<0||n>10000000){$('utmStatus').textContent='Revisa zona 1–60, este 100000–900000 y norte 0–10000000.';return;}
    const out=utmInverse(zone,hemi,e,n);setText('reverseLon',`${out.lon.toFixed(7)}°`);setText('reverseLat',`${out.lat.toFixed(7)}°`);$('utmStatus').textContent='Conversión UTM completada localmente.';
  }
  $('convertBtn').addEventListener('click',convertDecimal);$('reverseBtn').addEventListener('click',reverse);
  $('copyBtn').addEventListener('click',async()=>{if(!lastResult)return;const t=`WGS84: ${lastResult.longitude}, ${lastResult.latitude}\nDMS: ${lastResult.longitudeDms} · ${lastResult.latitudeDms}\nUTM: zona ${lastResult.utm.zone}${lastResult.utm.hemisphere}, E ${lastResult.utm.easting.toFixed(3)} m, N ${lastResult.utm.northing.toFixed(3)} m`;try{await navigator.clipboard.writeText(t);$('decimalStatus').textContent='Resumen copiado.'}catch{$('decimalStatus').textContent='No se pudo acceder al portapapeles; usa Descargar JSON.'}});
  $('downloadBtn').addEventListener('click',()=>{if(!lastResult)return;const blob=new Blob([JSON.stringify(lastResult,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='coordenada-wgs84.json';a.click();URL.revokeObjectURL(a.href)});
  convertDecimal(); reverse();
})();
