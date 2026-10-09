export type StoryScene = 0 | 1 | 2 | 3 | 4;

export type StoryPointInfo = {
  label: string;
  context: string;
  value: string;
  detail: string;
};

export type StoryDrawing = {
  scene: StoryScene;
  main: number;
  mainStart: number;
  boys: number;
  boysStart: number;
  social: number;
};
