# Specs

A multiplayer online board game.

## Tech stack

### Frontend

- Vue3
- Netlify

### Backend

- Ably broker

## Design

### Fonts

- Playfair
- Source Sans Pro

Source: https://inkbotdesign.com/font-combinations/

### Colors

- Baby Blue: #cee6f2
- Beryl Blue: #6fa1bb
- Lilac: #f6ede3
- Peach: #e3867d
- Strawberry: #d2385a;
- Dark Sage: #507b6a;

Source: https://looka.com/blog/color-combinations/

## Sync algo

Use stable random with shared seed for board generation. Use Ably broadcast to sync seed and card open events.

### Initial sync:

- on subscribe all members online with "presence" API
- on empty list decide that you the first and enable 'subscribe' flag
- otherwise ask top list memebr the state.
- the state is current key (seed) and state/words
- populate pinia board from state and enable 'subscribed' flag.

### ToDo

- users list/presence
- changes history
- encrypt broker init and use a room pass as a key for decryption
  so there will be no need to use lambdas to secure api key

## Alternative message bus

### Server

- https://nchan.io/
- https://github.com/slact/nchan

### Hosting

- https://www.hetzner.com/cloud
- https://evoxt.com/pricing/
