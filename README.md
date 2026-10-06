# Simulador de viagem

Site para uma pessoa, com passagens SerpApi/Google Voos, lista local de múltiplas passagens e soma de seus preços, configurações protegidas e termômetro da cota real da conta (Account API). Pesquise cada trecho separadamente e adicione opções à viagem (8 ou mais passagens, sem limite fixo). Uma passagem ida e volta conta como uma opção com preço total; conexões não são somadas novamente. É possível remover opções e a lista permanece no navegador ao recarregar. Não inclui hospedagem ou outros gastos. Chaves não são devolvidas ao navegador. Não inclui sincronização ao vivo: use compartilhamento de tela na reunião.

## Executar no Windows (Node.js 22 ou superior)

```powershell
$env:ADMIN_PASSWORD="defina-uma-senha-forte-aqui"
npm start
```

Abra http://localhost:3000, entre com a senha e cadastre uma **nova** chave na aba Configurações. Não use uma chave que tenha sido compartilhada em chat ou publicada. O orçamento fica neste navegador; a chave fica em `data/settings.json`, em texto simples e com permissões restritas quando suportadas. Proteja o disco e os backups. Não publique a pasta `data`.

## Publicar online

Use hospedagem que execute Node.js, como um serviço web com disco persistente. Comando de início: `npm start`. Defina `ADMIN_PASSWORD`, `NODE_ENV=production` e, opcionalmente, `DATA_DIR` apontando para o disco persistente. Senhas simples como `senha123` são permitidas, mas não recomendadas: alguém que descobrir a senha pode consumir a cota e trocar a chave. No Render, altere `ADMIN_PASSWORD` em Environment e salve para republicar. O serviço deve oferecer HTTPS e encaminhar `X-Forwarded-Proto: https`. A porta é lida de `PORT`. Sem disco persistente, a chave salva pela interface pode desaparecer em reinicializações; alternativamente configure `SERPAPI_KEY` no painel da hospedagem.

O botão de tema alterna entre claro e escuro. No primeiro acesso, o site inicia no tema claro (branco), independentemente do tema do sistema. A escolha manual fica salva neste navegador.

A senha pode ser alterada em **Configurações → Alterar senha de acesso**, mediante a senha atual. É armazenada com scrypt e salt em `data/auth.json`, nunca em texto simples, e todas as sessões são encerradas após a troca. O arquivo prevalece sobre `ADMIN_PASSWORD` enquanto existir. No Render gratuito, esse arquivo pode desaparecer em reinicializações; para persistir nesse plano, altere também `ADMIN_PASSWORD` no painel. Use disco persistente para manter alterações feitas pelo site. Proteja os backups da pasta `data`.

O site inteiro exige a senha para consultar a API, evitando consumo público da cota. Participantes com a senha também podem trocar a chave. Para acesso público ou equipes maiores, adicione usuários, papéis administrativos e limitação de consultas por usuário antes de publicar.

## Limitações

- A cota é consultada no servidor com cache de 60 segundos; atualizada após pesquisas. O termômetro mede consumo mensal, não consumo horário. Créditos extras podem fazer o saldo diferir da cota mensal.
- Não há troca automática de contas para contornar limites. Trocar a chave da mesma conta não renova a cota.
- Busca de só ida ou ida e volta; na ida e volta, a seleção detalhada da volta e o preço final devem ser confirmados no Google Voos. Bagagem e outras condições podem alterar o valor.
- Sugestões locais de cidades e aeroportos: todos os registros não fechados com código IATA de Brasil, Argentina e Chile na base OurAirports, via datasets/airport-codes (domínio público), além de destinos internacionais selecionados. Não é um catálogo mundial nem garantia de operação comercial. Códigos IATA podem ser digitados manualmente. A digitação não consome consultas. Atualize a base com `node scripts/update-airports.cjs`; o arquivo gerado `public/airports-data.js` deve ser incluído no Git. Busca por cidade, país, nome ou código, ignorando acentos.
- Fornecedor único: SerpApi. Não é uma API oficial do Google. Uma busca pode retornar várias opções, e consultas adicionais podem consumir mais créditos.
- O sistema nunca faz reservas nem compras.

Verificação sintática: `npm run check`.
