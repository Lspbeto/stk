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
