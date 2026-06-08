import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {
  mode: 'login' | 'register' = 'login';
  error = '';

  loginForm: FormGroup;
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50)
      ]]
    });
  }

  switchMode(mode: 'login' | 'register') {
    this.mode = mode;
    this.error = '';
    this.loginForm.reset();
    this.registerForm.reset();
  }

  login() {
    this.error = '';
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) return;

    const data = {
      email: this.loginForm.value.email || '',
      password: this.loginForm.value.password || ''
    };

    this.authService.login(data).subscribe({
      next: response => {
        this.authService.saveAuth(response);
        window.location.href = '/';
      },
      error: err => {
        this.error = this.getBackendErrorMessage(err, 'Login failed. Check your email and password.');
      }
    });
  }

  register() {
    this.error = '';
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) return;

    const data = {
      username: this.registerForm.value.username || '',
      email: this.registerForm.value.email || '',
      password: this.registerForm.value.password || ''
    };

    this.authService.register(data).subscribe({
      next: response => {
        this.authService.saveAuth(response);
        window.location.href = '/';
      },
      error: err => {
        this.error = this.getBackendErrorMessage(err, 'Registration failed. Try again.');
      }
    });
  }

  hasError(form: FormGroup, controlName: string, errorName: string): boolean {
    const control = form.get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }

  isInvalid(form: FormGroup, controlName: string): boolean {
    const control = form.get(controlName);
    return !!control && control.touched && control.invalid;
  }

  private getBackendErrorMessage(err: any, fallback: string): string {
    if (err?.error?.message) {
      return err.error.message;
    }

    if (err?.error?.error) {
      return err.error.error;
    }

    if (typeof err?.error === 'string') {
      return err.error;
    }

    return fallback;
  }
}
