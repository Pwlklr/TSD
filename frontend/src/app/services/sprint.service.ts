import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { SessionUser, SprintData } from '../models/sprint.model';
import { Client, Message } from '@stomp/stompjs';

@Injectable({ providedIn: 'root' })
export class SprintService {
  private STORAGE_KEY = 'sprint_planner_data';
  private apiUrl = 'http://localhost:8080/api/sprints';
  private stompClient: Client | null = null;

  // This subject handles real-time WebSocket updates
  public sessionUpdates$ = new Subject<SprintData>();

  constructor(private http: HttpClient) {}

  connectWebSocket(sessionId: string): void {
    if (this.stompClient) {
      this.disconnectWebSocket();
    }

    this.stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws-sprint',
      reconnectDelay: 5000,
    });

    this.stompClient.onConnect = () => {
      this.stompClient?.subscribe(`/topic/sprints/${sessionId}`, (message: Message) => {
        if (message.body) {
          this.sessionUpdates$.next(JSON.parse(message.body) as SprintData);
        }
      });
    };
    this.stompClient.activate();
  }

  disconnectWebSocket(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }

  createSharedSession(): Observable<SprintData> {
    return this.http.post<SprintData>(this.apiUrl, {});
  }

  saveData(data: SprintData): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  getData(): SprintData {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{"goal":"","stories":[]}');
  }

  clearData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getSprintHistory(): Observable<SprintData[]> {
    return this.http.get<SprintData[]>(`${this.apiUrl}/history`);
  }

  completeSprintSession(sessionId: string): Observable<SprintData> {
    return this.http.post<SprintData>(`${this.apiUrl}/${sessionId}/complete`, {});
  }

  joinSession(sessionId: string): Observable<SprintData> {
    return this.http.get<SprintData>(`${this.apiUrl}/${sessionId}?t=${new Date().getTime()}`);
  }

  updateSharedSession(sessionId: string, data: SprintData): Observable<SprintData> {
    return this.http.put<SprintData>(`${this.apiUrl}/${sessionId}`, data);
  }

  updatePresence(sessionId: string): Observable<SprintData> {
    return this.http.post<SprintData>(`${this.apiUrl}/${sessionId}/presence`, {});
  }

  removePresence(sessionId: string, userId: string): Observable<SprintData> {
    return this.http.delete<SprintData>(`${this.apiUrl}/${sessionId}/presence/${userId}`);
  }
}
