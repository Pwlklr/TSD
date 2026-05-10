import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SprintService } from '../services/sprint.service';
import { UserStory, ProductBacklogItem, SessionUser } from '../models/sprint.model';
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

  private pollingSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private sprintService: SprintService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {
    this.goalForm = this.fb.group({ goal: ['', Validators.required] });

    this.storyForm = this.fb.group({
      title: ['', Validators.required],
      description: ['']
    });

    this.joinForm = this.fb.group({
      sessionCode: ['', Validators.required]
    });

    this.currentUser = this.getOrCreateCurrentUser();
  }

  ngOnInit() {
    const sessionIdFromUrl = this.route.snapshot.paramMap.get('id');

    if (sessionIdFromUrl) {
      if (!this.askForDisplayName()) {
        return;
      }

      this.loadSessionFromUrl(sessionIdFromUrl);
      return;
    }

    const saved = this.sprintService.getData();

    this.sessionId = saved.sessionId || null;
    this.sprintGoal = saved.goal || '';
    this.stories = (saved.stories || []).map((story: UserStory) => ({
      ...story,
      status: story.status || 'To Do',
      backlogItems: story.backlogItems || []
    }));
    this.activeUsers = saved.activeUsers || [];

    this.goalForm.patchValue({ goal: this.sprintGoal });

    if (this.sessionId) {
      this.startPolling();
    }
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  leaveSession() {
    const sessionToLeave = this.sessionId;
    const userToRemove = this.currentUser.userId;

    if (sessionToLeave) {
      this.sprintService.removePresence(sessionToLeave, userToRemove).subscribe();
    }

    this.stopPolling();
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
      this.cdr.detectChanges();
      return;
    }

    this.isLoadingSession = true;
    this.sessionNotFound = false;
    this.joinError = '';

    this.sprintService.joinSession(code).subscribe({
      next: (session) => {
        this.sessionId = session.sessionId!;
        this.sprintGoal = session.goal || '';
        this.stories = (session.stories || []).map((story: UserStory) => ({
          ...story,
          backlogItems: story.backlogItems || []
        }));
        this.activeUsers = session.activeUsers || [];

        this.goalForm.patchValue({ goal: this.sprintGoal });

        this.joinError = '';
        this.sessionNotFound = false;
        this.isLoadingSession = false;

        this.persist();
        this.startPolling();
        this.cdr.detectChanges();
      },
      error: () => {
        this.stopPolling();

        this.sessionId = null;
        this.sprintGoal = '';
        this.stories = [];
        this.activeUsers = [];
        this.joinError = 'Session not found. Check the code and try again.';
        this.sessionNotFound = true;
        this.isLoadingSession = false;

        this.cdr.detectChanges();
      }
    });
  }

  createSharedSession() {
    if (!this.askForDisplayName()) {
      return;
    }

    this.sprintService.createSharedSession().subscribe({
      next: (session) => {
        this.sessionId = session.sessionId!;
        this.sprintGoal = session.goal || '';
        this.stories = session.stories || [];
        this.activeUsers = session.activeUsers || [];

        this.goalForm.patchValue({ goal: this.sprintGoal });

        this.persist();
        this.startPolling();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to create session', err)
    });
  }

  joinSharedSession() {
    if (this.joinForm.invalid) {
      return;
    }

    if (!this.askForDisplayName()) {
      return;
    }

    const code = this.joinForm.value.sessionCode.trim().toUpperCase();

    this.sprintService.joinSession(code).subscribe({
      next: (session) => {
        this.sessionId = session.sessionId!;
        this.sprintGoal = session.goal || '';
        this.stories = (session.stories || []).map((story: UserStory) => ({
          ...story,
          backlogItems: story.backlogItems || []
        }));
        this.activeUsers = session.activeUsers || [];

        this.goalForm.patchValue({ goal: this.sprintGoal });
        this.joinError = '';

        this.sessionNotFound = false;
        this.isLoadingSession = false;

        this.persist();
        this.startPolling();
        this.cdr.detectChanges();
      },
      error: () => {
        this.joinError = 'Session not found. Check the code and try again.';
        this.cdr.detectChanges();
      }
    });
  }

  updateGoal() {
    this.sprintGoal = this.goalForm.value.goal;
    this.goalForm.markAsPristine();
    this.persist();
    this.cdr.detectChanges();
  }

  addStory() {
    if (this.storyForm.valid) {
      const newStory: UserStory = {
        id: Date.now(),
        status: 'To Do',
        backlogItems: [],
        ...this.storyForm.value
      };

      this.stories.push(newStory);
      this.storyForm.reset();
      this.persist();
      this.cdr.detectChanges();
    }
  }

  changeStatus(storyId: number, status: any) {
    const story = this.stories.find(s => s.id === storyId);

    if (story) {
      story.status = status;
      this.persist();
      this.cdr.detectChanges();
    }
  }

  addBacklogItemToStory(storyId: number, itemTitle: string) {
    if (!itemTitle || !itemTitle.trim()) {
      return;
    }

    const story = this.stories.find(s => s.id === storyId);

    if (story) {
      if (!story.backlogItems) {
        story.backlogItems = [];
      }

      story.backlogItems.push({
        id: Date.now(),
        title: itemTitle.trim(),
        status: 'To Do'
      });

      this.persist();
      this.cdr.detectChanges();
    }
  }

  changeBacklogItemStatus(storyId: number, itemId: number, status: any) {
    const story = this.stories.find(s => s.id === storyId);

    if (story && story.backlogItems) {
      const item = story.backlogItems.find(i => i.id === itemId);

      if (item) {
        item.status = status;
        this.persist();
        this.cdr.detectChanges();
      }
    }
  }

  get progressPercentage(): number {
    if (this.stories.length === 0) {
      return 0;
    }

    const done = this.stories.filter(story => story.status === 'Done').length;
    return Math.round((done / this.stories.length) * 100);
  }

  trackByStory(index: number, story: UserStory) {
    return story.id;
  }

  trackByItem(index: number, item: ProductBacklogItem) {
    return item.id;
  }

  private getOrCreateCurrentUser(): SessionUser {
    let userId = localStorage.getItem('sprint_user_id');

    if (!userId || userId === 'undefined' || userId === 'null') {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        userId = crypto.randomUUID();
      } else {
        userId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      }

      localStorage.setItem('sprint_user_id', userId);
    }

    let displayName = localStorage.getItem('sprint_user_name');

    if (!displayName || displayName === 'undefined' || displayName === 'null') {
      displayName = `Anonymous ${userId.substring(0, 4).toUpperCase()}`;
      localStorage.setItem('sprint_user_name', displayName);
    }

    return {
      userId,
      displayName
    };
  }

  private askForDisplayName(): boolean {
    const currentName = this.currentUser.displayName || '';
    const enteredName = window.prompt('Enter your display name:', currentName);

    if (enteredName === null) {
      return false;
    }

    const trimmedName = enteredName.trim();

    if (!trimmedName) {
      this.joinError = 'Display name is required.';
      this.cdr.detectChanges();
      return false;
    }

    this.currentUser.displayName = trimmedName;
    localStorage.setItem('sprint_user_name', trimmedName);

    return true;
  }

  private sendPresence() {
    if (!this.sessionId) {
      return;
    }

    if (!this.currentUser.userId) {
      this.currentUser = this.getOrCreateCurrentUser();
    }

    const userToSend: SessionUser = {
      userId: this.currentUser.userId,
      displayName: this.currentUser.displayName || 'Anonymous'
    };

    console.log('Sending presence:', this.sessionId, userToSend);

    this.sprintService.updatePresence(this.sessionId, userToSend).subscribe({
      next: () => {
        console.log('Presence updated');
      },
      error: (err) => {
        console.error('Presence update failed', err);
      }
    });
  }

  private startPolling() {
    this.stopPolling();

    this.pollSession();

    this.pollingSubscription = interval(3000).subscribe(() => {
      this.pollSession();
    });
  }

  private pollSession() {
    if (!this.sessionId) {
      return;
    }

    this.sendPresence();

    this.sprintService.getSharedSession(this.sessionId).subscribe({
      next: (session) => {
        if (session) {
          let hasChanged = false;

          const incomingStories = JSON.stringify(session.stories || []);
          const localStories = JSON.stringify(this.stories || []);

          if (incomingStories !== localStories) {
            this.stories = (session.stories || []).map((story: UserStory) => ({
              ...story,
              backlogItems: story.backlogItems || []
            }));
            hasChanged = true;
          }

          const incomingGoal = session.goal || '';

          if (this.sprintGoal !== incomingGoal) {
            this.sprintGoal = incomingGoal;
            hasChanged = true;

            const goalCtrl = this.goalForm.get('goal');

            if (goalCtrl && goalCtrl.pristine) {
              this.goalForm.patchValue({ goal: this.sprintGoal }, { emitEvent: false });
            }
          }

          const incomingActiveUsers = JSON.stringify(session.activeUsers || []);
          const localActiveUsers = JSON.stringify(this.activeUsers || []);

          if (incomingActiveUsers !== localActiveUsers) {
            this.activeUsers = session.activeUsers || [];
            hasChanged = true;
          }

          if (hasChanged) {
            this.cdr.detectChanges();
          }
        }
      },
      error: (err) => {
        console.error('Failed to poll session', err);
      }
    });
  }

  private persist() {
    const dataToSave = {
      sessionId: this.sessionId || undefined,
      goal: this.sprintGoal,
      stories: this.stories,
      activeUsers: this.activeUsers
    };

    this.sprintService.saveData(dataToSave);

    if (this.sessionId) {
      this.sprintService.updateSharedSession(this.sessionId, dataToSave).subscribe({
        next: () => {
          console.log('Sukces: zaktualizowano dane na serwerze');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('CRITICAL: Zapis na serwerze nie powiódł się!', err);
        }
      });
    }
  }
}
