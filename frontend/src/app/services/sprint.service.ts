import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SessionUser, SprintData } from '../models/sprint.model';

@Injectable({ providedIn: 'root' })
export class SprintService {
  private STORAGE_KEY = 'sprint_planner_data';
  private apiUrl = 'http://localhost:8080/api/sprints';

  constructor(private http: HttpClient) {}

  createSharedSession(): Observable<SprintData> {
    return this.http.post<SprintData>(this.apiUrl, {});
  }

  saveData(data: SprintData) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  getData(): SprintData {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : { goal: '', stories: [] };
  }

  clearData() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  joinSession(sessionId: string): Observable<SprintData> {
    return this.http.get<SprintData>(`${this.apiUrl}/${sessionId}?t=${new Date().getTime()}`);
  }

  getSharedSession(sessionId: string): Observable<SprintData> {
    return this.http.get<SprintData>(`${this.apiUrl}/${sessionId}?t=${new Date().getTime()}`);
  }

  updateSharedSession(sessionId: string, data: SprintData): Observable<SprintData> {
    return this.http.put<SprintData>(`${this.apiUrl}/${sessionId}`, data);
  }

  updatePresence(sessionId: string, user: SessionUser): Observable<SprintData> {
    return this.http.post<SprintData>(`${this.apiUrl}/${sessionId}/presence`, user);
  }

  removePresence(sessionId: string, userId: string): Observable<SprintData> {
    return this.http.delete<SprintData>(`${this.apiUrl}/${sessionId}/presence/${userId}`);
  }
}
