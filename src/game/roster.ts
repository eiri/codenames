export interface RosterEntry {
  name: string;
  lj: string;
  avatar: string;
}

// Insertion order defines the captain rotation input.
export const roster: Record<string, RosterEntry> = {
  Akari: {
    name: "Akari",
    lj: "akari_chan",
    avatar: "https://l-userpic.livejournal.com/120407741/755293",
  },
  Eiri: {
    name: "Eiri",
    lj: "eiri",
    avatar: "https://l-userpic.livejournal.com/38941189/689880",
  },
  Ikadell: {
    name: "Ikadell",
    lj: "ikadell",
    avatar: "https://l-userpic.livejournal.com/11807164/1840678",
  },
  Friday: {
    name: "Friday",
    lj: "next_friday",
    avatar: "https://l-userpic.livejournal.com/57379634/818233",
  },
  Vitaliy: {
    name: "Vitaliy",
    lj: "seminarist",
    avatar: "https://l-userpic.livejournal.com/45172718/788486",
  },
};
