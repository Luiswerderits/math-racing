# MATH RACING

Jogo de corrida matemática multiplayer para uso em sala de aula.

## Tecnologias
- Vite + JavaScript
- Phaser 3 (motor de jogo, integração em andamento)
- Firebase Realtime Database (multiplayer, integração em andamento)
- GitHub Pages

## Executar localmente
```bash
npm install
npm run dev
```

## Publicação
O workflow do GitHub Actions compila o projeto e publica no GitHub Pages a cada push na branch main. Em Settings > Pages, selecione GitHub Actions como fonte de publicação.

## Estado
A interface inicial e o roteamento de códigos de sala estão preparados. Criação de salas, autenticação, sincronização multiplayer, corrida Phaser e QR Code serão implementados nas próximas etapas. As regras iniciais do Firebase negam leitura e escrita até a configuração segura do banco.
