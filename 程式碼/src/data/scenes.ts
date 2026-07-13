import {
  CharacterName,
  CharacterMood
} from "./characterImages";

export interface SceneCharacter {
  character: CharacterName;
  mood: CharacterMood;
  position?: "left" | "center" | "right";
}

export interface SceneConfig {
  id: string;
  characters: SceneCharacter[];
  background?: string;
  dialogue?: string;
}

export const scenes: Record<string, SceneConfig> = {
  opening: {
    id: "opening",
    characters: [
      {
        character: "claire",
        mood: "normal",
        position: "center"
      }
    ]
  },

  claireSad: {
    id: "claireSad",
    characters: [
      {
        character: "claire",
        mood: "sad",
        position: "center"
      }
    ]
  },

  teamHappy: {
    id: "teamHappy",
    characters: [
      {
        character: "claire",
        mood: "happy",
        position: "left"
      },
      {
        character: "ethan",
        mood: "happy",
        position: "center"
      },
      {
        character: "leo",
        mood: "happy",
        position: "right"
      }
    ]
  }
};
