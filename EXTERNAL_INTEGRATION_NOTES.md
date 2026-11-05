# Referências de integração

- **BrasilAPI oficial:** https://brasilapi.com.br/ — projeto público com endpoints como CEP, CNPJ e FIPE; a página oficial não oferece consulta de histórico veicular por placa.
- **Documentação BrasilAPI:** https://brasilapi.com.br/docs — referência dos endpoints públicos.
- **Repositório BrasilAPI:** https://github.com/BrasilAPI/BrasilAPI — projeto open source da BrasilAPI.
- **APIBrasil:** https://www.apibrasil.io/ — serviço comercial que informa suporte a consultas veiculares por placa e autenticação via Bearer Token.
- **APIBrasil / Postman — débitos veiculares:** https://www.postman.com/docs-apibrasil/ambiente-apibrasil/request/us8hra2/dbitos-veiculares — exemplo público usa `POST https://gateway.apibrasil.io/api/v2/vehicles/base/001/consulta`.

A aplicação usa o SDK `brasilapi-sdk` para FIPE/CEP/CNPJ e mantém a consulta por placa no provedor APIBrasil, pois são contratos diferentes. Tokens devem permanecer em variáveis de ambiente do servidor.
