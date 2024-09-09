import { Component, OnInit, AfterViewInit, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { LoginService } from 'app/login/login.service';
import { AccountService } from 'app/core/auth/account.service';

@Component({
  standalone: true,
  selector: 'jhi-login',
  imports: [SharedModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
})
export default class LoginComponent implements OnInit, AfterViewInit {
  username = viewChild.required<ElementRef>('username');

  authenticationError = signal(false);

  loginForm = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    rememberMe: new FormControl(false, { nonNullable: true, validators: [Validators.required] }),
  });

  private accountService = inject(AccountService);
  private loginService = inject(LoginService);
  private router = inject(Router);

  ngOnInit(): void {
    // Capture the last URL the user visited before login
    const lastVisitedUrl = this.router.routerState.snapshot.url;
    if (lastVisitedUrl && lastVisitedUrl !== '/login') {
      sessionStorage.setItem('lastVisitedUrl', lastVisitedUrl);
    }

    // If already authenticated then navigate to home page
    this.accountService.identity().subscribe(() => {
      if (this.accountService.isAuthenticated()) {
        this.router.navigate(['']);
      }
    });
  }

  ngAfterViewInit(): void {
    this.username().nativeElement.focus();
  }

  login(): void {
    this.loginService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.authenticationError.set(false);

        // Get the last visited URL from session storage
        const lastVisitedUrl = sessionStorage.getItem('lastVisitedUrl');

        if (lastVisitedUrl) {
          // Navigate to the last visited page
          this.router.navigate([lastVisitedUrl]);
          sessionStorage.removeItem('lastVisitedUrl'); // Clean up after use
        } else if (!this.router.getCurrentNavigation()) {
          // Default to home if no last visited URL or no navigation
          this.router.navigate(['']);
        }
      },
      error: () => this.authenticationError.set(true),
    });
  }
}
