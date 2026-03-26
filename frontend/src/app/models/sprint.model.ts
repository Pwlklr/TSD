// sprint.model.ts
export interface UserStory {
  id: number;
  title: string;
  description?: string;
}

export interface SprintData {
  goal: string;
  stories: UserStory[];
}