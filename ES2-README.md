# ES2 - Integrantes do Grupo

Este repositório pertence à disciplina **Engenharia de Software 2 (ES2)**.  
Abaixo estão listados os integrantes do grupo e seus respectivos perfis no GitHub.

## Integrantes

- [Artur Kioshi de Almeida Nacafucasaco](https://github.com/ArturKioshi)
- [Breno Dias Arantes dos Santos](https://github.com/breninhoinho)
- [Pedro Marchi Nunes](https://github.com/PedroMarchiN)
- [Leonardo Ryuiti Miasiro](https://github.com/LeonardoMiasiro)

## I - Relatório de Cobertura de Código dos Testes Automatizados Existentes

Esta seção documenta a geração dos relatórios de cobertura de código dos testes automatizados existentes, utilizando a biblioteca **c8** integrada ao **Mocha** que já estava no projeto.

### Como Gerar o Relatório

Basta utilizar o comando abaixo:

```bash
npm test
```

O relatório HTML detalhado será gerado automaticamente no diretório:
`tmp/coverage/index.html`

### Resultados Atuais

Abaixo estão os resultados da execução atual, evidenciando as métricas Branches, Functions e Lines.

**1. Visão Geral do Projeto**
A cobertura global atual é de aproximadamente **36%** nas instruções.

![Visão Geral da Cobertura](images-readme/geral.png)

**2. Detalhamento: Controllers**
A pasta `controllers` apresenta baixa cobertura em arquivos críticos como `api.js` e `user.js`, indicando áreas prioritárias para novos testes.

![Cobertura Controllers](images-readme/controllers.png)

**3. Detalhamento: Config**
Na pasta `config`, o arquivo `passport.js` representa a maior oportunidade de melhoria na cobertura de testes.

![Cobertura Config](images-readme/config.png)

## H - Testes Manuais (GUI)

Esta seção documenta a execução de testes manuais exploratórios e funcionais na interface gráfica (GUI) da aplicação Hackathon Starter. O objetivo foi validar a usabilidade, a navegação e o comportamento dos principais, utilizando critérios de validade de links, renderização de layout e resposta de formulários.

### Metodologia e Cenários Testados

Os testes foram conduzidos em ambiente local (`localhost:8080`), como não há de fato um "usuário final", visto que o projeto se trata de um template para hackathons, foram conduzidos testes exploratórios, verificando as funcionalidades oferecidas.

1.  **Navegação Geral:** Verificação da responsividade da Home Page, funcionamento da barra de navegação (Navbar) e rodapé.
2.  **Autenticação:** Telas de Login e Cadastro.
3.  **Funcionalidades de API:** Navegação pelo catálogo de APIs, acesso às telas de detalhe e verificação da validade dos links externos (ex: redirecionamento para documentação oficial).
4.  **Funcionalidades de IA:** Acesso ao painel de exemplos e testes de interface no módulo RAG (Retrieval-Augmented Generation).
5.  **Formulários:** Submissão do formulário de contato para validar o comportamento dos campos obrigatórios e feedback visual.

### Evidências de Teste

#### 1. Navegação e Home Page

A página inicial carregou corretamente, com todos os elementos de cabeçalho, rodapé e botões de ação ("View details") funcionais.
![Home Page](images-readme/home.png)

#### 2. Fluxo de Autenticação

As telas de Login e Cadastro (Sign Up) apresentaram layout sem muita complexidade. As validações de campo não checavam respostas vazias ou senhas diferentes automaticamente. Todavia, todos os botões de "Sign in" utilizando outra plataforma funcionaram.

|                   Login                    |              Cadastro (Sign Up)               |
| :----------------------------------------: | :-------------------------------------------: |
| ![Tela de Login](images-readme/signin.png) | ![Tela de Cadastro](images-readme/signup.png) |

#### 3. Catálogo de APIs

A listagem de APIs foi exibida corretamente. Ao acessar detalhes (ex: GitHub), os links de documentação e "Getting Started" estavam funcionais.

|              Lista de APIs              |          Detalhe API (GitHub)           |
| :-------------------------------------: | :-------------------------------------: |
| ![Lista de APIs](images-readme/api.png) | ![Github API](images-readme/gitapi.png) |

#### 4. Integrações de IA e RAG

Os exemplos de IA carregaram sem erros. Cada uma das páginas explicava como utilizar as inteligências artificiais para tarefas reais de um projeto, com links para documentação funcionais.

|               Menu IA                |              Interface RAG              |
| :----------------------------------: | :-------------------------------------: |
| ![Exemplos IA](images-readme/ai.png) | ![Interface RAG](images-readme/rag.png) |

#### 5. Formulário de Contato

O formulário de contato exibiu corretamente os campos e verificou ao tentar enviar o email o campo, garantindo que era válido.
![Contato](images-readme/contact.png)

### Conclusão

O template comportou-se de maneira fluida na maior parte dos fluxos. A navegação entre as rotas ocorreu conforme o esperado.

Pontos de Atenção:

- A validação de formulários de autenticação (vazios/senhas divergentes) poderia ser aprimorada para oferecer feedback imediato ao usuário, visto que atualmente permite a tentativa de submissão.

- As integrações externas (OAuth) e links de documentação estão plenamente funcionais.


## L - Implementar casos de teste relevantes que melhorem a cobertura de código do projeto original

Foram adicionados dois novos arquivos de teste ao projeto: **`ai.test.js`** e **`api.test.js`**.
Eles utilizam uma combinação de **Mocha**, **Chai**, **Sinon** e **Proxyquire** para construir testes unitários robustos e isolados para os controllers do sistema.

## 1. Bibliotecas Utilizadas

- **Mocha (`describe`, `it`)**
  Estrutura base dos testes, organiza blocos lógicos e casos de teste individuais.

- **Chai (`expect`)**
  Biblioteca de asserções usada para validar retornos, verificação de tipos e igualdade profunda de objetos.

- **Sinon (`stub`, `spy`, `restore`)**
  Fundamental para:
  - Criar *stubs* de funções globais (como `fetch`).
  - Espionar chamadas de métodos.
  - Simular comportamentos de APIs externas sem realizar requisições reais.

- **Proxyquire**
  Utilizada no controller de IA para injetar *mocks* em dependências importadas via `require`, permitindo testar o código isolando módulos como `fs`, `mongodb` e pacotes do `@langchain`.

## 2. `ai.test.js` — Testes do Controller de IA

Este arquivo testa as rotas do controller **AI**, com foco pesado na simulação de serviços de Inteligência Artificial e Banco de Dados.

### Principais funcionalidades testadas:

1. **Rotas de Interface**
   - Renderização das páginas: `getAi`, `getOpenAIModeration`, `getTogetherAICamera`, `getTogetherAIClassifier`.

2. **Integrações com LLMs e LangChain (RAG)**
   - **Ingestão (PostRagIngest):** Simula a leitura de arquivos PDF, *splitting* de texto e salvamento em vetor.
   - **Busca e Resposta (PostRagAsk):** Testa o fluxo completo de *Retrieval Augmented Generation*:
     - Simula conexão com MongoDB Atlas.
     - Simula busca de similaridade vetorial (`vectorSearchMock`).
     - Simula geração de resposta via `ChatTogetherAI`.

3. **Validação de Erros e Fluxos Alternativos**
   - **Banco de Dados:** Tratamento de erro na falha de conexão com o MongoDB (`getRag`).
   - **Uploads:** Validação de ausência de imagem para análise (`postTogetherAICamera`).
   - **API Keys:** Tratamento de erro quando `OPENAI_API_KEY` ou `TOGETHERAI_API_KEY` não estão configuradas.
   - **Input:** Redirecionamento correto ao enviar perguntas vazias no RAG.

### Técnicas de Mocking:
O teste utiliza `proxyquire` para substituir inteiramente a implementação real do `MongoClient` e das classes do `LangChain`, garantindo que nenhum custo de API ou conexão de banco real ocorra durante os testes.

## 3. `api.test.js` — Testes do Controller de APIs

Este arquivo cobre um amplo espectro de integrações externas, manipulando principalmente o `global.fetch` e injeções de cache de módulos.

### Principais funcionalidades testadas:

1. **Pagamentos e Serviços (Stripe, PayPal, Twilio)**
   - **Stripe:** Uso de injeção no `require.cache` para simular a criação de cobranças.
   - **PayPal:** Teste do fluxo de cancelamento (`getPayPalCancel`), garantindo a limpeza da sessão (`orderId`).
   - **Twilio:** Renderização da página de configuração.

2. **Integração Steam (Complexa)**
   Usa `sinon.stub(global, 'fetch')` sequencial (`onCall`) para simular múltiplos endpoints em uma única rota:
   - Jogos possuídos, Conquistas, Resumo do perfil e Jogos recentes.
   - **Cenários de borda:** Jogador sem jogos recentes, perfil com conquistas privadas (Erro 403) e falhas de rede.

3. **Dados Externos (Scraping, Foursquare, NYT, Chart)**
   - **Scraping:** Simula retorno de HTML cru e verifica extração de links.
   - **Foursquare:** Valida o fluxo de busca de locais e tratamento de erros da API.
   - **New York Times:** Testa o parsing de JSON e o tratamento de respostas inesperadas (ex: HTML em vez de JSON).
   - **Chart:** Verifica o comportamento de *fallback* quando a API de dados financeiros retorna vazio.

4. **Upload de Arquivos**
   - Valida o fluxo de `postFileUpload`, garantindo que mensagens de *flash* (sucesso) sejam acionadas tanto para uploads reais quanto vazios (comportamento do framework).

## 4. Novos Resultados

Abaixo estão os resultados da nova execução, evidenciando as métricas de Branches, Functions e Lines após a inclusão destes cenários.

**1. Visão Geral do Projeto**
A cobertura global foi ampliada significativamente com a inclusão de cenários de erro e fluxos completos de APIs.

![Visão Geral da Cobertura](images-readme/ger_new.png)

**2. Detalhamento: Controllers**

![Cobertura Controllers](images-readme/controller_new.png)

**3. Detalhamento: Config**

![Cobertura Config](images-readme/config_new.png)

## 5. Resumo Geral

- Aumentamos a cobertura de testes do projeto.
- Garantimos que as rotas dos controllers continuam funcionando mesmo com mudanças internas.
- Simulamos chamadas a APIs externas (OpenAI, TogetherAI, Steam, Stripe, etc).
- Validamos corretamente erros, fluxos normais e cenários inesperados.
- Usamos _stubs_, _mocks_, e inspeção de chamadas para assegurar que a aplicação responde como esperado.
