import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { FormsModule, NgForm } from "@angular/forms";
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

  onLogin(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.errorMessage.set("Completa los campos requeridos correctamente.");
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set("");

    this.authService.login({ email: this.email.trim(), password: this.password }).pipe(
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: ({ role }) => this.router.navigate([this.getRedirectByRole(role)]),
      error: (error: unknown) => this.errorMessage.set(this.getLoginErrorMessage(error)),
    });
  }

  private getLoginErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return "No se pudo conectar con el servidor. Inténtalo nuevamente.";
    }

    return "Usuario o contraseña incorrectos.";
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
