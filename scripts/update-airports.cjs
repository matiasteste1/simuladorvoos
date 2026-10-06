// Generates a local search asset from OurAirports public-domain data.
const fs = require('node:fs/promises');
const path = require('node:path');
function parseCSV(text) {
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){if(quoted && text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
  else if(c===',' && !quoted){row.push(field);field='';}
  else if(c==='\n' && !quoted){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field='';}
  else field+=c;
 }
 if(field || row.length){row.push(field.replace(/\r$/,''));rows.push(row);}
 return rows;
}
(async()=>{
 const url='https://raw.githubusercontent.com/datasets/airport-codes/master/data/airport-codes.csv';
 const response=await fetch(url,{signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw Error('Não foi possível baixar a base: '+response.status);
 const rows=parseCSV(await response.text()),header=rows.shift();
 const countries={BR:'Brasil',AR:'Argentina',CL:'Chile'},byCode=new Map();
 for(const row of rows){const a=Object.fromEntries(header.map((name,index)=>[name,row[index]]));if(!countries[a.iso_country] || a.type==='closed' || !/^[A-Z]{3}$/.test(a.iata_code||''))continue;
  byCode.set(a.iata_code,[a.iata_code,a.municipality||a.name,a.name,countries[a.iso_country]]);
 }
 const airports=[...byCode.values()].sort((a,b)=>a[1].localeCompare(b[1],'pt-BR'));
 if(!airports.some(a=>a[0]==='USH') || airports.length<200)throw Error('Base incompleta; arquivo anterior preservado.');
 const output='// Generated from OurAirports (public domain), via datasets/airport-codes.\n// Source: '+url+'\n// Updated: '+new Date().toISOString().slice(0,10)+'; non-closed airports with IATA codes.\nconst regionalAirports = '+JSON.stringify(airports,null,2)+';\n';
 await fs.writeFile(path.join(__dirname,'..','public','airports-data.js'),output);
 for(const country of Object.values(countries))console.log(country+': '+airports.filter(a=>a[3]===country).length);
 console.log('Ushuaia:',airports.find(a=>a[0]==='USH').join(' · '));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
