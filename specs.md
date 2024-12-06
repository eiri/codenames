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

### Icons

Game Icons: https://icon-sets.iconify.design/game-icons

### Colors

https://www.hsluv.org/

- Red: hue 4
- Green: hue 157
- Blue: hue 228
- White: hue 56

## Sync algo

Use stable random with shared seed for board generation. Use Ably broadcast to sync seed and card open events.

### Initial sync:

- on subscribe all members online with "presence" API
- on empty list decide that you the first and enable 'subscribe' flag
- otherwise ask top list memebr the state.
- the state is current key (seed) and state/words
- populate pinia board from state and enable 'subscribed' flag.

### ToDo

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
