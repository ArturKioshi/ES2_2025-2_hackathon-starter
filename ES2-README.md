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
