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
  sprintGoal: string = '';
  stories: UserStory[] = [];
  
  goalForm: FormGroup;
  storyForm: FormGroup;

  constructor(private fb: FormBuilder, private sprintService: SprintService) {
    this.goalForm = this.fb.group({ goal: ['', Validators.required] });
    this.storyForm = this.fb.group({
      title: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    const saved = this.sprintService.getData();
    this.sprintGoal = saved.goal;
    this.stories = saved.stories;
    this.goalForm.patchValue({ goal: this.sprintGoal });
  }

  updateGoal() {
    this.sprintGoal = this.goalForm.value.goal;
    this.persist();
  }

  addStory() {
    if (this.storyForm.valid) {
      const newStory: UserStory = {
        id: Date.now(),
        ...this.storyForm.value
      };
      this.stories.push(newStory);
      this.storyForm.reset();
      this.persist();
    }
  }

  private persist() {
    this.sprintService.saveData({
      goal: this.sprintGoal,
      stories: this.stories
    });
  }
}