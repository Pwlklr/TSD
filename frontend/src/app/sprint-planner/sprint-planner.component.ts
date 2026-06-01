import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SprintService } from '../services/sprint.service';
import { UserStory, Task, SessionUser, SprintData } from '../models/sprint.model';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-sprint-planner',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './sprint-planner.component.html',
  styleUrls: ['./sprint-planner.component.css']
})
export class SprintPlannerComponent implements OnInit, OnDestroy {
  sessionId: string | null = null;
  sprintGoal: string = '';
  stories: UserStory[] = [];

  goalForm: FormGroup;
  storyForm: FormGroup;
  joinForm: FormGroup;
  joinError: string = '';

  sessionNotFound: boolean = false;
  isLoadingSession: boolean = false;

  activeUsers: SessionUser[] = [];
  currentUser: SessionUser;

  sprintHistory: SprintData[] = [];
  showHistory: boolean = false;

  private presenceSubscription?: Subscription;
  private wsSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private sprintService: SprintService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {
    this.goalForm = this.fb.group({ goal: ['', Validators.required] });
    this.storyForm = this.fb.group({ title: ['', Validators.required], description: [''] });
    this.joinForm = this.fb.group({ sessionCode: ['', Validators.required] });
    this.currentUser = this.getOrCreateCurrentUser();
  }

  ngOnInit() {
    this.wsSubscription = this.sprintService.sessionUpdates$.subscribe((session: SprintData) => {
      this.handleIncomingSession(session);
    });

    const sessionIdFromUrl = this.route.snapshot.paramMap.get('id');
    if (sessionIdFromUrl) {
      if (!this.askForDisplayName()) return;
      this.loadSessionFromUrl(sessionIdFromUrl);
      return;
    }

    const saved = this.sprintService.getData();
    this.sessionId = saved.sessionId || null;
    this.sprintGoal = saved.goal || '';
    this.stories = (saved.stories || []).map((story: UserStory) => ({
      ...story,
      status: story.status || 'To Do',
      tasks: story.tasks || []
    }));
    this.activeUsers = saved.activeUsers || [];

    this.goalForm.patchValue({ goal: this.sprintGoal });

    if (this.sessionId) {
      this.startCollaboration(this.sessionId);
    }
  }

  ngOnDestroy() {
    this.stopCollaboration();
    if (this.wsSubscription) this.wsSubscription.unsubscribe();
  }

  private startCollaboration(sessionId: string) {
    this.sprintService.connectWebSocket(sessionId);
    this.sendPresence();
    if (this.presenceSubscription) this.presenceSubscription.unsubscribe();
    this.presenceSubscription = interval(10000).subscribe(() => this.sendPresence());
  }

  private stopCollaboration() {
    this.sprintService.disconnectWebSocket();
    if (this.presenceSubscription) this.presenceSubscription.unsubscribe();
  }

  leaveSession() {
    if (this.sessionId) {
      this.sprintService.removePresence(this.sessionId, this.currentUser.userId).subscribe();
    }
    this.stopCollaboration();
    this.sprintService.clearData();
    
    this.sessionId = null;
    this.sprintGoal = '';
    this.stories = [];
    this.activeUsers = [];
    this.goalForm.reset();
    this.joinError = '';
    this.sessionNotFound = false;
    this.isLoadingSession = false;
    this.cdr.detectChanges();
  }

  private loadSessionFromUrl(sessionIdFromUrl: string) {
    const code = sessionIdFromUrl.trim().toUpperCase();
    if (!/^[A-Za-z0-9]{6}$/.test(code)) {
      this.sessionNotFound = true;
      this.joinError = 'Invalid session code format.';
      return;
    }
    
    this.isLoadingSession = true;
    this.sprintService.joinSession(code).subscribe({
      next: (session) => {
        this.handleIncomingSession(session);
        this.joinError = '';
        this.sessionNotFound = false;
        this.isLoadingSession = false;
        this.startCollaboration(this.sessionId!);
      },
      error: () => {
        this.stopCollaboration();
        this.sessionId = null;
        this.joinError = 'Session not found.';
        this.sessionNotFound = true;
        this.isLoadingSession = false;
        this.cdr.detectChanges();
      }
    });
  }

  createSharedSession() {
    if (!this.askForDisplayName()) return;
    this.sprintService.createSharedSession().subscribe({
      next: (session) => {
        this.handleIncomingSession(session);
        this.startCollaboration(this.sessionId!);
      }
    });
  }

  joinSharedSession() {
    if (this.joinForm.invalid || !this.askForDisplayName()) return;
    const code = this.joinForm.value.sessionCode.trim().toUpperCase();
    this.sprintService.joinSession(code).subscribe({
      next: (session) => {
        this.handleIncomingSession(session);
        this.joinError = '';
        this.sessionNotFound = false;
        this.isLoadingSession = false;
        this.startCollaboration(this.sessionId!);
      },
      error: () => {
        this.joinError = 'Session not found. Check the code and try again.';
        this.cdr.detectChanges();
      }
    });
  }

  updateGoal() {
    if (this.goalForm.valid) {
      this.sprintGoal = this.goalForm.value.goal;
      this.goalForm.markAsPristine();
      this.persist();
    }
  }

  addStory() {
    if (this.storyForm.valid) {
      this.stories.push({ id: Date.now(), status: 'To Do', tasks: [], ...this.storyForm.value });
      this.storyForm.reset();
      this.persist();
    }
  }

  changeStatus(storyId: number, status: any) {
    const story = this.stories.find(s => s.id === storyId);
    if (story) { story.status = status; this.persist(); }
  }

  addTaskToStory(storyId: number, taskTitle: string) {
    if (!taskTitle || !taskTitle.trim()) return;
    const story = this.stories.find(s => s.id === storyId);
    if (story) {
      if (!story.tasks) story.tasks = [];
      story.tasks.push({ id: Date.now(), title: taskTitle.trim(), status: 'To Do' });
      this.persist();
    }
  }

  changeTaskStatus(storyId: number, taskId: number, status: any) {
    const story = this.stories.find(s => s.id === storyId);
    if (story && story.tasks) {
      const task = story.tasks.find(t => t.id === taskId);
      if (task) { task.status = status; this.persist(); }
    }
  }

  get progressPercentage(): number {
    if (this.stories.length === 0) return 0;
    return Math.round((this.stories.filter(s => s.status === 'Done').length / this.stories.length) * 100);
  }

  trackByStory(index: number, story: UserStory) { return story.id; }
  trackByTask(index: number, task: Task) { return task.id; }

  private handleIncomingSession(session: SprintData) {
    this.sessionId = session.sessionId || this.sessionId;
    
    const incomingStories = JSON.stringify(session.stories || []);
    if (incomingStories !== JSON.stringify(this.stories || [])) {
      this.stories = (session.stories || []).map((story: UserStory) => ({ ...story, tasks: story.tasks || [] }));
    }

    const incomingGoal = session.goal || '';
    if (this.sprintGoal !== incomingGoal) {
      this.sprintGoal = incomingGoal;
      const goalCtrl = this.goalForm.get('goal');
      if (goalCtrl && goalCtrl.pristine) {
        this.goalForm.patchValue({ goal: this.sprintGoal }, { emitEvent: false });
      }
    }

    const incomingUsers = JSON.stringify(session.activeUsers || []);
    if (incomingUsers !== JSON.stringify(this.activeUsers || [])) {
      this.activeUsers = session.activeUsers || [];
    }

    this.sprintService.saveData({ sessionId: this.sessionId!, goal: this.sprintGoal, stories: this.stories, activeUsers: this.activeUsers });
    this.cdr.detectChanges();
  }

  private persist() {
    if (!this.sessionId) return;
    const dataToSave = { sessionId: this.sessionId, goal: this.sprintGoal, stories: this.stories, activeUsers: this.activeUsers };
    this.sprintService.saveData(dataToSave);
    this.sprintService.updateSharedSession(this.sessionId, dataToSave).subscribe();
  }

  private getOrCreateCurrentUser(): SessionUser {
    let userId = localStorage.getItem('sprint_user_id');
    if (!userId || userId === 'undefined' || userId === 'null') {
      userId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem('sprint_user_id', userId);
    }
    let displayName = localStorage.getItem('sprint_user_name');
    if (!displayName || displayName === 'undefined' || displayName === 'null') {
      displayName = `Anonymous ${userId.substring(0, 4).toUpperCase()}`;
      localStorage.setItem('sprint_user_name', displayName);
    }
    return { userId, displayName };
  }

  private askForDisplayName(): boolean {
    const currentName = this.currentUser.displayName || '';
    const enteredName = window.prompt('Enter your display name:', currentName);
    if (enteredName === null) return false;
    const trimmedName = enteredName.trim();
    if (!trimmedName) { this.joinError = 'Display name is required.'; return false; }
    this.currentUser.displayName = trimmedName;
    localStorage.setItem('sprint_user_name', trimmedName);
    return true;
  }

  private sendPresence() {
    if (!this.sessionId) return;
    const userToSend: SessionUser = { userId: this.currentUser.userId, displayName: this.currentUser.displayName || 'Anonymous' };
    this.sprintService.updatePresence(this.sessionId, userToSend).subscribe();
  }

  loadHistory() {
    this.sprintService.getSprintHistory().subscribe((history: SprintData[]) => { 
        this.sprintHistory = history; 
        this.cdr.detectChanges(); 
    });
  }

  toggleHistory() {
    this.showHistory = !this.showHistory;
    if (this.showHistory) this.loadHistory();
  }

  completeSprint() {
    if (!this.sessionId) return;
    if (confirm('Are you sure you want to complete this sprint? It will be moved to the history.')) {
      this.sprintService.completeSprintSession(this.sessionId).subscribe(() => {
        alert('Sprint marked as complete!');
        this.leaveSession();
      });
    }
  }
}