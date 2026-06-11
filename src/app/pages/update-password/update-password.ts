import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { AuthService } from "../../services/auth.service";

const RECOVERY_ERROR_MESSAGE = "No se pudo recuperar la contraseña. Verifica la información ingresada.";

@Component({
  selector: "app-update-password",
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./update-password.html",
  styleUrl: "./update-password.css",
})
export class UpdatePassword implements OnInit {
  email = "";
  code = "";
  newPassword = "";
  confirmPassword = "";
  readonly isLoading = signal(false);
  readonly successMessage = signal("");
  readonly errorMessage = signal("");

  constructor(
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get("email") ?? "";
  }

  onSubmit(form: NgForm): void {
    if (form.invalid || this.newPassword !== this.confirmPassword) {
      form.control.markAllAsTouched();
      this.errorMessage.set(this.newPassword !== this.confirmPassword ? "Las contraseñas no coinciden." : "Completa los campos requeridos correctamente.");
      this.successMessage.set("");
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set("");
    this.successMessage.set("");

    this.authService.resetPassword({
      email: this.email.trim(),
      code: this.code.trim(),
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword,
    }).pipe(
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || "Tu contraseña se actualizó correctamente.");
        setTimeout(() => this.router.navigate(["/login"]), 1200);
      },
      error: () => {
        this.errorMessage.set(RECOVERY_ERROR_MESSAGE);
      },
    });
  }
}
