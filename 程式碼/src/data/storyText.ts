import type { ChapterTransitionBeat } from "./chapterTransitions";

export type StoryTextOverrides = Record<string, string>;

export function storyText(overrides: StoryTextOverrides, key: string, fallback: string): string {
  return overrides[key] ?? fallback;
}

export function editStoryBeat(overrides: StoryTextOverrides, key: string, beat: ChapterTransitionBeat): ChapterTransitionBeat {
  return {
    ...beat,
    text: storyText(overrides, key, beat.text),
    choice: beat.choice?.map((option) => ({ ...option, label: storyText(overrides, `${key}.option.${option.id}`, option.label) })),
    clue: beat.clue && {
      ...beat.clue,
      title: storyText(overrides, `${key}.clue.title`, beat.clue.title),
      detail: storyText(overrides, `${key}.clue.detail`, beat.clue.detail),
    },
  };
}
