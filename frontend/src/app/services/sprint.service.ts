import { Injectable } from '@angular/core';
import { SprintData, UserStory } from '../models/sprint.model';
@Injectable({ providedIn: 'root' })
export class SprintService {
  private STORAGE_KEY = 'sprint_planner_data';

  saveData(data: SprintData) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  getData(): SprintData {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : { goal: '', stories: [] };
  }
}