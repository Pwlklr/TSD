export type StoryStatus = 'To Do' | 'In Progress' | 'Done';

export interface Task {
  id: number;
  title: string;
  status: StoryStatus;
}

export interface UserStory {
  id: number;
  title: string;
  description?: string;
  status: StoryStatus;
  tasks?: Task[];
}

export interface SessionUser {
  userId: string;
  displayName: string;
  lastSeen?: number;
}

export interface SprintData {
  sessionId?: string;
  goal: string;
  stories: UserStory[];
  completed?: boolean;
  activeUsers?: SessionUser[];
  participantUserIds?: string[];
}
