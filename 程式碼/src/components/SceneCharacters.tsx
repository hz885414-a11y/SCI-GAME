import React from "react";
import { scenes } from "../data/scenes";
import { CharacterImage } from "./CharacterImage";

interface SceneCharactersProps {
  sceneId: string;
}

export function SceneCharacters({
  sceneId
}: SceneCharactersProps) {
  const scene = scenes[sceneId];

  if (!scene) {
    return null;
  }

  return (
    <div className="scene-characters">
      {scene.characters.map((item, index) => (
        <CharacterImage
          key={`${item.character}-${item.mood}-${index}`}
          character={item.character}
          mood={item.mood}
          className={`character-image character-${item.position ?? "center"}`}
          priority
        />
      ))}
    </div>
  );
}
