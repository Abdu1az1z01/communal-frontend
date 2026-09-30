import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SERVICES } from './services';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.css'
})
export class AppComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  services = SERVICES;

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
