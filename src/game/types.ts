export enum GameResult {
  InProgress = 0,
  RedTeamWon = 1,
  BlueTeamWon = 2,
  BothTeamsLost = 3,
}

export enum CardState {
  BlackOpened = 0,
  BlackClosed = 1,
  WhiteOpened = 2,
  WhiteClosed = 3,
  RedOpened = 4,
  RedClosed = 5,
  BlueOpened = 6,
  BlueClosed = 7,
}

export interface Card {
  idx: number;
  word: string;
  state: CardState;
}

export enum Captain {
  None = 0,
  Red = 1,
  Blue = 2,
}
