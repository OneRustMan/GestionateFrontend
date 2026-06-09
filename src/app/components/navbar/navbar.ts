import { Component } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../services/auth.service";
import { UserRole } from "../../models/auth.models";

@Component({
  selector: "app-navbar",
  imports: [RouterLink, CommonModule],
  templateUrl: "./navbar.html",
  styleUrl: "./navbar.css",
})
export class Navbar {
  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  get currentUserRole(): string {
    const role = this.authService.role();
    const roleMap: Record<UserRole, string> = {
      CITIZEN: "ciudadano",
      MUNICIPAL_RECEPTIONIST: "recepcionista",
      CLEANING_OPERATIONS: "operativo",
    };

    return role ? roleMap[role] : "ciudadano";
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(["/login"]),
      error: () => {
        this.authService.clearSession();
        this.router.navigate(["/login"]);
      },
    });
  }
}
