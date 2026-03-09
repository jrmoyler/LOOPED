export type GameStatus = "draft" | "active" | "paused" | "deprecated";
export type PrimaryGenre = "arcade" | "puzzle" | "learn" | "create" | "tool";
export type InputMode = "tap" | "drag" | "swipe" | "hold" | "tilt";
export type Orientation = "portrait" | "landscape" | "auto";
export type ContentRating = "E" | "E10" | "T" | "M";
export type Lane = "main" | "learn" | "tools" | "creative";

export interface GameCard {
  gameId: string;
  title: string;
  subtitle: string;
  description: string;
  creatorName: string;
  primaryGenre: PrimaryGenre;
  tags: string[];
  sessionLengthSec: number;
  inputModes: InputMode[];
  orientation: Orientation;
  contentRating: ContentRating;
  lanes: Lane[];
  build: {
    buildId: string;
    url: string;
    entry: string;
    allowedOrigin: string;
    features: GameFeatures;
    sandboxOverride?: string;
    allowOverride?: string;
  } | null;
}

export interface GameFeatures {
  supports_pause: boolean;
  supports_resume: boolean;
  audio: boolean;
  haptics: boolean;
  share_snapshot: boolean;
}

// postMessage protocol
export type LoopedMessageType =
  | "LOOPED_INIT"
  | "LOOPED_PAUSE"
  | "LOOPED_RESUME"
  | "LOOPED_DESTROY"
  | "GAME_READY"
  | "GAME_START"
  | "GAME_END"
  | "GAME_ERROR";

export interface LoopedMessage {
  lo: "looped";
  v: 1;
  type: LoopedMessageType;
  session_id: string;
  game_id: string;
  payload?: Record<string, unknown>;
}

export interface GameEndPayload {
  score?: number;
  duration_ms: number;
  completed: boolean;
  rage_quit?: boolean;
}
