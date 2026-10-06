# Simulador de viagem

Site para uma pessoa, com passagens SerpApi/Google Voos, orçamento local, configurações protegidas e termômetro da cota real da conta (Account API). Chaves não são devolvidas ao navegador. Não inclui sincronização ao vivo: use compartilhamento de tela na reunião.

## Executar no Windows (Node.js 22 ou superior)

```powershell
$env:ADMIN_PASSWORD="defina-uma-senha-forte-aqui"
npm start
```

Abra http://localhost:3000, entre com a senha e cadastre uma **nova** chave na aba Configurações. Não use uma chave que tenha sido compartilhada em chat ou publicada. O orçamento fica neste navegador; a chave fica em `data/settings.json`, em texto simples e com permissões restritas quando suportadas. Proteja o disco e os backups. Não publique a pasta `data`.

## Publicar online

Use hospedagem que execute Node.js, como um serviço web com disco persistente. Comando de início: `npm start`. Defina `ADMIN_PASSWORD` (mínimo 12 caracteres), `NODE_ENV=production` e, opcionalmente, `DATA_DIR` apontando para o disco persistente. O serviço deve oferecer HTTPS e encaminhar `X-Forwarded-Proto: https`. A porta é lida de `PORT`. Sem disco persistente, a chave salva pela interface pode desaparecer em reinicializações; alternativamente configure `SERPAPI_KEY` no painel da hospedagem.

O site inteiro exige a senha para consultar a API, evitando consumo público da cota. Participantes com a senha também podem trocar a chave. Para acesso público ou equipes maiores, adicione usuários, papéis administrativos e limitação de consultas por usuário antes de publicar.

## Limitações

- A cota é consultada no servidor com cache de 60 segundos; atualizada após pesquisas. O termômetro mede consumo mensal, não consumo horário. Créditos extras podem fazer o saldo diferir da cota mensal.
- Não há troca automática de contas para contornar limites. Trocar a chave da mesma conta não renova a cota.
- Busca de só ida ou ida e volta; na ida e volta, a seleção detalhada da volta e o preço final devem ser confirmados no Google Voos. Bagagem e outras condições podem alterar o valor.
- Sugestões locais de cidades e aeroportos: principais destinos brasileiros e alguns internacionais. Não é um catálogo mundial; códigos IATA podem ser digitados manualmente. A digitação não consome consultas. Em viagens só de ida, ajuste manualmente a duração da estadia no orçamento.
- Fornecedor único: SerpApi. Não é uma API oficial do Google. Uma busca pode retornar várias opções, e consultas adicionais podem consumir mais créditos.
- O sistema nunca faz reservas nem compras.

Verificação sintática: `npm run check`.
