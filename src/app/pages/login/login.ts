import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink, Router } from "@angular/router";
import { finalize } from "rxjs";
import { UserRole } from "../../models/auth.models";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-login",
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: "./login.html",
  styleUrl: "./login.css",
})
export class Login {
  email = "";
  password = "";
  readonly isLoading = signal(false);
  readonly errorMessage = signal("");

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  onLogin() {
    if (!this.email.trim() || !this.password.trim()) {
      this.errorMessage.set("Ingresa tu correo y contrasena.");
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set("");

    this.authService.login({ email: this.email.trim(), password: this.password }).pipe(
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: ({ role }) => this.router.navigate([this.getRedirectByRole(role)]),
      error: () => this.errorMessage.set("No se pudo iniciar sesion. Revisa tus credenciales."),
    });
  }

  private getRedirectByRole(role: UserRole): string {
    const redirects: Record<UserRole, string> = {
      CITIZEN: "/home",
      MUNICIPAL_RECEPTIONIST: "/reportes-recibidos",
      CLEANING_OPERATIONS: "/ordenes-asignadas",
    };

    return redirects[role];
  }
}
