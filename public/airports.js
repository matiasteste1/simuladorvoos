// Local search: regional dataset plus curated destinations and Portuguese aliases.
const curatedAirports = [
 ['GRU','São Paulo','Guarulhos'],['CGH','São Paulo','Congonhas'],['VCP','Campinas','Viracopos'],
 ['GIG','Rio de Janeiro','Galeão'],['SDU','Rio de Janeiro','Santos Dumont'],['BSB','Brasília','Juscelino Kubitschek'],
 ['CNF','Belo Horizonte','Confins'],['PLU','Belo Horizonte','Pampulha'],['REC','Recife','Guararapes'],
 ['SSA','Salvador','Deputado Luís Eduardo Magalhães'],['FOR','Fortaleza','Pinto Martins'],['NAT','Natal','São Gonçalo do Amarante'],
 ['JPA','João Pessoa','Presidente Castro Pinto'],['MCZ','Maceió','Zumbi dos Palmares'],['AJU','Aracaju','Santa Maria'],
 ['SLZ','São Luís','Marechal Cunha Machado'],['THE','Teresina','Senador Petrônio Portella'],['BPS','Porto Seguro','Porto Seguro'],
 ['IOS','Ilhéus','Jorge Amado'],['VDC','Vitória da Conquista','Glauber Rocha'],['PNZ','Petrolina','Senador Nilo Coelho'],
 ['JDO','Juazeiro do Norte','Orlando Bezerra'],['JJD','Jericoacoara','Comandante Ariston Pessoa'],['FEN','Fernando de Noronha','Fernando de Noronha'],
 ['POA','Porto Alegre','Salgado Filho'],['FLN','Florianópolis','Hercílio Luz'],['CWB','Curitiba','Afonso Pena'],
 ['NVT','Navegantes','Ministro Victor Konder'],['JOI','Joinville','Lauro Carneiro'],['IGU','Foz do Iguaçu','Cataratas'],
 ['LDB','Londrina','Governador José Richa'],['MGF','Maringá','Sílvio Name Júnior'],['CXJ','Caxias do Sul','Hugo Cantergiani'],
 ['VIX','Vitória','Eurico de Aguiar Salles'],['GYN','Goiânia','Santa Genoveva'],['CGB','Cuiabá','Marechal Rondon'],
 ['CGR','Campo Grande','Campo Grande'],['PMW','Palmas','Brigadeiro Lysias Rodrigues'],['BEL','Belém','Val-de-Cans'],
 ['MAO','Manaus','Eduardo Gomes'],['STM','Santarém','Maestro Wilson Fonseca'],['MCP','Macapá','Alberto Alcolumbre'],
 ['BVB','Boa Vista','Atlas Brasil Cantanhede'],['RBR','Rio Branco','Plácido de Castro'],['PVH','Porto Velho','Governador Jorge Teixeira'],
 ['UDI','Uberlândia','César Bombonato'],['RAO','Ribeirão Preto','Leite Lopes'],['SJP','São José do Rio Preto','Eribelto Manoel Reino'],
 ['LIS','Lisboa','Humberto Delgado'],['OPO','Porto','Francisco Sá Carneiro'],['EZE','Buenos Aires','Ezeiza'],['AEP','Buenos Aires','Aeroparque'],
 ['SCL','Santiago','Arturo Merino Benítez'],['MVD','Montevidéu','Carrasco'],['LIM','Lima','Jorge Chávez'],['BOG','Bogotá','El Dorado'],
 ['MIA','Miami','Miami International'],['MCO','Orlando','Orlando International'],['JFK','Nova York','John F. Kennedy'],
 ['LAX','Los Angeles','Los Angeles International'],['CDG','Paris','Charles de Gaulle'],['ORY','Paris','Orly'],
 ['MAD','Madri','Barajas'],['BCN','Barcelona','El Prat'],['LHR','Londres','Heathrow'],['FCO','Roma','Fiumicino'],
 ['AMS','Amsterdã','Schiphol'],['FRA','Frankfurt','Frankfurt'],['DXB','Dubai','Dubai International'],['CUN','Cancún','Cancún International']
];
const mergedAirports=new Map(regionalAirports.map(a=>[a[0],a]));
for(const a of curatedAirports){const regional=mergedAirports.get(a[0]);mergedAirports.set(a[0],[...a,regional?.[3]||'Internacional']);}
const airports=[...mergedAirports.values()];
const normalizeAirport = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const airportLabel = a => `${a[1]} — ${a[2]} (${a[0]}) · ${a[3]}`;
function airportCode(text) {
 const exact=airports.find(a=>normalizeAirport(airportLabel(a))===normalizeAirport(text.trim()));
 if(exact) return exact[0];
 return /^[a-z]{3}$/i.test(text.trim())?text.trim().toUpperCase():null;
}
for(const id of ['origin','destination']) {
 const input=document.getElementById(id),list=document.getElementById(id+'Options');
 function suggest(){const query=normalizeAirport(input.value.trim());list.replaceChildren();const filtered=airports.filter(a=>!query || normalizeAirport(airportLabel(a)).includes(query)).slice(0,20);for(const a of filtered){const option=document.createElement('option');option.value=airportLabel(a);list.append(option);}}
 input.addEventListener('input',()=>{input.setCustomValidity('');suggest();});input.addEventListener('focus',suggest);suggest();
}
