import { Routes } from '@angular/router';
import { SprintPlannerComponent } from './sprint-planner/sprint-planner.component';
import { AuthComponent } from './auth/auth.component';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: '', component: SprintPlannerComponent },
  { path: 'session/:id', component: SprintPlannerComponent },
  { path: '**', redirectTo: '' }
];
