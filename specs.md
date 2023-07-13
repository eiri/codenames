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
- Source Sans Pro (Source Sans 3 actually)

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

- animation on card flip is blinking on iOS Safari
- try to make captainKey into player property, marshal it on presense member data, show it to others and restrict it to two, one on each team
- better story on auth, it really should use tokens...
- better story for global error handeling

## Alternative message bus

### Server

- https://nchan.io/
- https://github.com/slact/nchan

### Hosting

- https://www.hetzner.com/cloud
- https://evoxt.com/pricing/
