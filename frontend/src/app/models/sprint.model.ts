// sprint.model.ts
export type StoryStatus = 'To Do' | 'In Progress' | 'Done';

export interface ProductBacklogItem {
  id: number;
  title: string;
  status: StoryStatus;
}

export interface UserStory {
  id: number;
  title: string;
  description?: string;
  status: StoryStatus;
  backlogItems?: ProductBacklogItem[];
}

export interface SprintData {
  sessionId?: string; 
  goal: string;
  stories: UserStory[];
}