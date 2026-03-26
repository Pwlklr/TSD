import { Routes } from '@angular/router';
import { SprintPlannerComponent } from './sprint-planner/sprint-planner.component';

export const routes: Routes = [
  { path: '', component: SprintPlannerComponent }, 
  { path: '**', redirectTo: '' } 
];