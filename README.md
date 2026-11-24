<h1 align="center">Presence · Front-end</h1>

<p align="center">
  Painel administrativo e página de confirmação de presença do sistema <b>Presence</b>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white" alt="Next.js 16">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-shadcn%2Fui-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind + shadcn/ui">
  <img src="https://img.shields.io/badge/Turborepo-pnpm-EF4444?logo=turborepo&logoColor=white" alt="Turborepo + pnpm">
</p>

---

## Sobre

Interface web do **Presence**, sistema de controle de presença universitária com geolocalização e
reconhecimento facial. Consome a API [presence](https://github.com/CarHSMig/presence) (Rails), que por
sua vez valida o rosto do aluno no [Presence-face-recognition](https://github.com/CarHSMig/Presence-face-recognition).

Arquitetura completa e regras de presença: veja o [README da API](https://github.com/CarHSMig/presence#sobre).

## Telas

**Área administrativa** (login com JWT):

| Rota | O que faz |
|---|---|
| `/login` | Autenticação |
| `/` | Visão geral dos eventos |
| `/cursos` | Lista, criação e detalhe de cursos |
| `/turmas` | Turmas e seus alunos |
| `/alunos` | Cadastro de alunos em lote, com até 10 fotos por aluno para a biometria |
| `/eventos` | Criação de eventos por curso/turma, com local, horário e QR Code |
| `/usuarios` | Usuários do painel |

**Área pública:**

| Rota | O que faz |
|---|---|
| `/participantes/[event_id]` | O aluno informa o RA, libera a localização e a câmera e confirma a presença |

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Radix)
- **TanStack Query** e **TanStack Form** + **zod**
- **react-qr-code** para o link de cada evento
- **Turborepo + pnpm** (monorepo)

## Estrutura

```
apps/
  web/      # aplicação Next.js (painel + confirmação de presença)
  native/   # app Expo/React Native — em fase inicial, ainda no template
```

## Como rodar

Pré-requisitos: Node 20+, pnpm 10 e a [API presence](https://github.com/CarHSMig/presence) rodando.

```bash
git clone https://github.com/CarHSMig/Presence-FRONT.git
cd Presence-FRONT
pnpm install
cp apps/web/.env.example apps/web/.env   # ajuste NEXT_PUBLIC_SERVER_URL
pnpm dev:web
```

A aplicação sobe em `http://localhost:3001`.

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SERVER_URL` | URL da API Rails |
| `EXPO_PUBLIC_SERVER_URL` | URL da API para o app mobile |

## Roadmap

- [ ] App mobile (Expo) para o aluno
- [ ] Extrair as chamadas de API das páginas para hooks do TanStack Query
- [ ] Testes de componentes

## Autor

**Carlos Henrique dos Santos Migon** · [LinkedIn](https://www.linkedin.com/in/carlos-henrique-dos-santos-migon-46387b336/) · [GitHub](https://github.com/CarHSMig)
