import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SprintService } from '../services/sprint.service';
import { UserStory } from '../models/sprint.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sprint-planner',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './sprint-planner.component.html',
  styleUrls: ['./sprint-planner.component.css']
})
export class SprintPlannerComponent implements OnInit {
  sessionId: string | null = null;
  sprintGoal: string = '';
  stories: UserStory[] = [];

  goalForm: FormGroup;
  storyForm: FormGroup;
  joinForm: FormGroup;

  joinError: string = '';

  constructor(private fb: FormBuilder, private sprintService: SprintService) {
    this.goalForm = this.fb.group({ goal: ['', Validators.required] });
    this.storyForm = this.fb.group({
      title: ['', Validators.required],
      description: ['']
    });
    this.joinForm = this.fb.group({
      sessionCode: ['', Validators.required]
    });
  }

  ngOnInit() {
    const saved = this.sprintService.getData();
    this.sessionId = saved.sessionId || null;
    this.sprintGoal = saved.goal;
    this.stories = saved.stories.map(story => ({
      ...story,
      status: story.status || 'To Do'
    }));
    this.goalForm.patchValue({ goal: this.sprintGoal });
  }

  createSharedSession() {
    this.sprintService.createSharedSession().subscribe({
      next: (session) => {
        this.sessionId = session.sessionId!;
        this.sprintGoal = session.goal;
        this.stories = session.stories;
        this.goalForm.patchValue({ goal: this.sprintGoal });
        this.joinError = '';
        this.persist();
      },
      error: (err) => console.error('Failed to create session', err)
    });
  }

  joinSharedSession() {
    if (this.joinForm.invalid) {
      return;
    }

    const code = this.joinForm.value.sessionCode.trim().toUpperCase();

    this.sprintService.joinSession(code).subscribe({
      next: (session) => {
        this.sessionId = session.sessionId!;
        this.sprintGoal = session.goal;
        this.stories = session.stories;
        this.goalForm.patchValue({ goal: this.sprintGoal });
        this.joinError = '';
        this.persist();
      },
      error: (err) => {
        console.error('Failed to join session', err);
        this.joinError = 'Session not found. Check the code and try again.';
      }
    });
  }

  updateGoal() {
    this.sprintGoal = this.goalForm.value.goal;
    this.persist();
  }

  addStory() {
    if (this.storyForm.valid) {
      const newStory: UserStory = {
        id: Date.now(),
        status: 'To Do',
        ...this.storyForm.value
      };
      this.stories.push(newStory);
      this.storyForm.reset();
      this.persist();
    }
  }

  private persist() {
    this.sprintService.saveData({
      sessionId: this.sessionId || undefined,
      goal: this.sprintGoal,
      stories: this.stories
    });
  }

  changeStatus(storyId: number, status: 'To Do' | 'In Progress' | 'Done') {
    const story = this.stories.find(s => s.id === storyId);
    if (story) {
      story.status = status;
      this.persist();
    }
  }

  get progressPercentage(): number {
    if (this.stories.length === 0) {
      return 0;
    }
    const doneStories = this.stories.filter(story => story.status === 'Done').length;
    return Math.round((doneStories / this.stories.length) * 100);
  }
}
