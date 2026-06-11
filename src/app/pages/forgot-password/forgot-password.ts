import { CommonModule } from "@angular/common";
import { Component, signal } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { AuthService } from "../../services/auth.service";

const RECOVERY_ERROR_MESSAGE = "No se pudo recuperar la contraseña. Verifica la información ingresada.";

@Component({
  selector: "app-forgot-password",
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./forgot-password.html",
  styleUrl: "./forgot-password.css",
})
export class ForgotPassword {
  email = "";
  readonly isLoading = signal(false);
  readonly successMessage = signal("");
  readonly errorMessage = signal("");

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.errorMessage.set("Ingresa un correo electrónico válido.");
      this.successMessage.set("");
      return;
    }

    const email = this.email.trim();
    this.isLoading.set(true);
    this.errorMessage.set("");
    this.successMessage.set("");

    this.authService.forgotPassword({ email }).pipe(
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || "Se envió un código de recuperación a tu correo.");
        setTimeout(() => this.router.navigate(["/actualizar-password"], { queryParams: { email } }), 1000);
      },
      error: () => {
        this.errorMessage.set(RECOVERY_ERROR_MESSAGE);
      },
    });
  }
}
