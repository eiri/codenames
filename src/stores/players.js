import { ref } from "vue";
import { defineStore } from "pinia";

export const usePlayersStore = defineStore("players", () => {
  // https://colorkit.co/palette/ffadad-ffd6a5-fdffb6-caffbf-9bf6ff-a0c4ff-bdb2ff-ffc6ff/
  const palette = [
    "#ffadad",
    "#ffd6a5",
    "#fdffb6",
    "#caffbf",
    "#9bf6ff",
    "#a0c4ff",
    "#bdb2ff",
    "#ffc6ff",
  ];
  // from https://stackoverflow.com/a/50579690
  const crc32 = function (r) {
    for (var a, o = [], c = 0; c < 256; c++) {
      a = c;
      for (var f = 0; f < 8; f++) a = 1 & a ? 3988292384 ^ (a >>> 1) : a >>> 1;
      o[c] = a;
    }
    for (var n = -1, t = 0; t < r.length; t++)
      n = (n >>> 8) ^ o[255 & (n ^ r.charCodeAt(t))];
    return (-1 ^ n) >>> 0;
  };

  const players = ref({});

  const addPlayer = (player) => {
    players.value[player] = {
      name: player,
      short: player[0],
      color: palette[crc32(player) % palette.length],
      captain: false,
      team: "white",
    };
  };

  const removePlayer = (player) => {
    delete players.value[player];
  };

  const $reset = () => {
    players.value = {};
  };

  return {
    players,
    addPlayer,
    removePlayer,
    $reset,
  };
});
