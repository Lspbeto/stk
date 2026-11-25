# STK Academy

Plataforma pública e gamificada para aprender programação em português. Qualquer pessoa pode criar uma conta de aluno; professores são criados por um comando administrativo e podem abrir turmas e acompanhar os alunos que ingressarem com código.

## Funcionalidades

- Cadastro e login com senha protegida por bcrypt e sessão JWT.
- Trilhas de HTML, CSS, JavaScript, Node.js, JSON, SQL/MySQL, MongoDB e APIs.
- Desafios de múltipla escolha e preenchimento de código, dicas e explicações.
- XP, níveis, progresso persistente por aluno e ranking público.
- Certificado liberado após concluir todos os desafios.
- Área de professor: criação de turmas, códigos de entrada e visão de progresso dos participantes.
- Interface responsiva para celular e computador.

## Executar localmente

Requer Node.js 20 ou superior.

```bash
npm install
cp .env.example .env
# Edite JWT_SECRET com uma chave longa e aleatória
npm start
```

Acesse http://localhost:3000.

## Criar o primeiro professor

Depois de instalar dependências e configurar o ambiente:

```bash
npm run create-teacher -- "Nome do Professor" professor@exemplo.com "Senha-forte-com-10"
```

O cadastro público cria somente alunos. Não existe botão público para elevar privilégios.

## Publicar no Render

O arquivo `render.yaml` configura um serviço Node e disco persistente em `/var/data`. No Render, crie um novo Blueprint a partir deste repositório e branch, confirme o serviço e aguarde o deploy. O `JWT_SECRET` é gerado pelo Render. O disco persistente exige plano que ofereça discos; confirme o custo antes de publicar.

## Arquitetura

- Node.js + Express
- SQLite com better-sqlite3
- Front-end em HTML, CSS e JavaScript sem etapa de build
- API REST em `/api`

## Importante antes de uso público em produção

Este é um MVP funcional e educacional, não uma plataforma institucional auditada. Antes de abrir inscrições em larga escala, configure HTTPS/domínio, política de privacidade e termos, rotina de backup do disco, monitoramento e revisão de segurança. O ranking usa nome público informado no cadastro; oriente os participantes a não usar dados pessoais desnecessários. Não há recuperação de senha por e-mail nem verificação de e-mail nesta primeira versão.

## Rotas principais

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/courses`, `GET /api/progress`
- `POST /api/lessons/:id/submit`
- `GET /api/leaderboard`, `GET /api/certificate`
- `POST /api/classrooms`, `POST /api/classrooms/join`
- `GET /api/teacher/dashboard`


## Trilha especial: aprenda a construir o STOK

O Academy inclui uma trilha baseada no código-fonte e no README da branch reorganizacao-back-front do repositório [Lspbeto/stok](https://github.com/Lspbeto/stok/tree/reorganizacao-back-front). Ela ensina os comandos documentados para preparar, executar, testar e publicar o projeto, além dos principais comandos e padrões de código presentes no STOK.

Conteúdos: terminal e PowerShell; npm; Git e branches; Node.js e JavaScript; Express e rotas HTTP; autenticação JWT e bcrypt; MongoDB/Mongoose; validação de CNPJ; regras de estoque, setores, patrimônio e prestação de contas; auditoria; CSV e SMTP; backup Extended JSON; DOM, localStorage, integração front/back e publicação no Render.

Fidelidade ao projeto: exemplos de terminal reproduzem comandos documentados no README do STOK. Aulas de código explicam operações encontradas nos arquivos da branch de referência. Recursos discutidos mas que não aparecem nessa versão do código não são apresentados como implementados.


## Ambientes da plataforma

- **Administrador geral:** o primeiro acesso apresenta o cadastro do administrador principal. Depois de criado, o cadastro inicial é bloqueado. O administrador cadastra processos e responsáveis, consulta todos os alunos e abre a visão individual de cada processo.
- **Responsável do processo:** recebe usuário e senha quando o administrador cria o processo. Acessa somente o próprio processo e cadastra/acompanha os alunos vinculados.
- **Aluno:** pode ser cadastrado pelo responsável ou criar sua conta informando o código do processo. Acessa com usuário e senha e tem o progresso vinculado ao processo.

Senhas são armazenadas com bcrypt e as sessões usam JWT. O servidor valida o perfil em todas as rotas protegidas.

### Execução local

```bash
npm install
JWT_SECRET="uma-chave-aleatoria-com-mais-de-32-caracteres" npm start
```

Abra http://localhost:3000. No primeiro acesso, crie o administrador geral.

### Hospedagem ligada ao GitHub

O GitHub armazena o código e pode disparar deploy automático, mas GitHub Pages não executa o servidor Node.js nem fornece banco persistente. Publique o Node.js em Render ou serviço equivalente, conectando este repositório. Configure JWT_SECRET e um disco persistente para DB_PATH (ou migre para banco gerenciado). Não guarde contas e progresso no armazenamento efêmero de uma hospedagem.
