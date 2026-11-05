# Referências de integração

- **BrasilAPI oficial:** https://brasilapi.com.br/ — projeto público com endpoints como CEP, CNPJ e FIPE; a página oficial não oferece consulta de histórico veicular por placa.
- **Documentação BrasilAPI:** https://brasilapi.com.br/docs — referência dos endpoints públicos.
- **Repositório BrasilAPI:** https://github.com/BrasilAPI/BrasilAPI — projeto open source da BrasilAPI.
- **APIBrasil:** https://www.apibrasil.io/ — serviço comercial que informa suporte a consultas veiculares por placa e autenticação via Bearer Token.
- **APIBrasil / Postman — débitos veiculares:** https://www.postman.com/docs-apibrasil/ambiente-apibrasil/request/us8hra2/dbitos-veiculares — a coleção mostra a Base 001, mas o fluxo adotado pelo sistema é a rota por crédito documentada no SDK: `POST https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits`.

A aplicação usa `brasilapi-sdk` para FIPE/CEP/CNPJ e `apigratis-sdk-nodejs` para a consulta veicular por placa. O método usado é `api.consulta.veiculos({ tipo: 'veiculos-total', placa, homolog })`, autenticado somente com Bearer Token. Tokens devem permanecer em variáveis de ambiente do servidor.
