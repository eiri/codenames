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

- on subscribe broadcast "who's online"
- wait for the answers for the timeout
- on empty list decide that you the first and enable 'subscribe' flag
- otherwise ask top list for the state.
- the state is current seed and a list of enums for {white black red blue}{opened closed} so far.
- set seed to given value, call newGame and enable 'subscribed' flag.

### ToDo
- uniq userid
- room for game with a route
