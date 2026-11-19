# MagicDreams independente

Projeto separado do Emocionário Amigo em `beta/magicdreams`, criado para iniciar a migração do site público MagicDreams para uma aplicação local sem dependência do Base44.

## Executar

Requer Node.js 18 ou superior. Não há dependências npm externas.

```bash
npm start
```

Abra `http://127.0.0.1:4173`.

## Dados reconstruídos e limites

O conteúdo foi conferido na interface pública de `https://magicdreams.base44.app/`. A página inicial expõe as áreas Tocar, Compor, Piano, Biblioteca, Partituras, Galeria e Natal; as coleções visíveis são Canções de Ninar (6), Músicas de Natal (6), Clássicas (7), Músicas Celtas (6), Católicas (3) e Páscoa (2). Também estavam visíveis seis títulos e créditos na fila de Canções de Ninar.

As demais rotas não carregaram de forma confiável durante a consulta, e a área Admin não foi acessada. Portanto, esta versão não afirma conter a biblioteca completa, contas, gravações, partituras, imagens ou dados privados. Ela não consulta APIs privadas, não contorna autenticação e não reutiliza mídia do site original. O áudio é uma demonstração sintetizada localmente.

Para uma migração completa, exporte seus dados pela ferramenta oficial da conta Base44 e coloque apenas os arquivos autorizados neste projeto. Não compartilhe senhas ou tokens no código. Um agente de migração acompanha o projeto em `.github/agents`.

Composições criadas na página Compor são guardadas em `localStorage` deste navegador e não são enviadas a um servidor.

## Agentes do projeto

- `MagicDreams Product Engineer`: implementação de produto independente do Base44.
- `MagicDreams QA e Acessibilidade`: validação de fluxos, acessibilidade e armazenamento local.
- `MagicDreams Migração de Dados`: importação controlada de conteúdo autorizado.

## Verificações

```bash
node --check public/app.js
node --check server.js
npm start
```
