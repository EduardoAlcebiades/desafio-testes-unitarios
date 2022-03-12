# Conceitos Testes Unitários

Neste projeto é abordado os principais fundamentos dos testes unitários e testes de integração no [NodeJS](https://nodejs.org/en/), com utilização do [Jest](https://jestjs.io).

## Descrição

O projeto consiste em uma aplicação que realiza depósitos e saques para uma conta bancária dos usuários. Os testes unitários foram implementados abordando os casos de uso (useCase) e os controllers para os testes de integração.

# Antes de começar

Antes de iniciar o servidor é necessário instalar as dependências do NodeJS com o segunte comando:

-- Utilizando NPM:

```
npm install
```

-- Ou YARN:

```
yarn
```

Além disso será necessário ter um banco de dados relacional postgres ou similar que armazenará os dados. As configurações de conexão poderão ser alteradas no arquivo "ormconfig.json". Caso esteja utilizando o docker, basta executar o comando para estar criando um container para o teste:

```
docker run --name database-tests -e POSTGRES_DB=fin_api -e POSTGRES_PASSWORD=docker -p 5432:5432 -d postgres
```

## Iniciando o Servidor

Para iniciar o servidor, será necessário executar o seguinte comando:

-- Utilizando NPM:

```
npm run dev
```

-- Ou YARN:

```
yarn dev
```

O servidor será inciado em http://localhost:3333.

## Executando os testes

Os testes estão disponíveis em "\*_/_.spec.ts", ou dentro de cada useCase na pasta modules, e poderão ser executados executando o seguinte comando:

-- Utilizando NPM:

```
npm run test
```

-- Ou YARN:

```
yarn test
```

# Prints do projeto

![Coding tests](https://github.com/EduardoAlcebiades/desafio-testes-unitarios/blob/main/assets/images/coding-tests.jpg?raw=true)
![Coding integration tests](https://github.com/EduardoAlcebiades/desafio-testes-unitarios/blob/main/assets/images/coding-integration-tests.jpg?raw=true)
![Tests running](https://github.com/EduardoAlcebiades/desafio-testes-unitarios/blob/main/assets/images/tests.jpg?raw=true)
