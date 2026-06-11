import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { finalize } from "rxjs";
import { RegisterCitizenRequest } from "../../models/auth.models";
import { District } from "../../models/district.models";
import { AuthService } from "../../services/auth.service";
import { DistrictService } from "../../services/district.service";

@Component({
  selector: "app-register-citizen",
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./register-citizen.html",
  styleUrl: "./register-citizen.css",
})
export class RegisterCitizen implements OnInit {
  firstName = "";
  lastName = "";
  dni = "";
  phone = "";
  email = "";
  selectedDistrictId: number | null = null;
  homeAddress = "";
  password = "";
  confirmPassword = "";

  districts: District[] = [];
  readonly isLoading = signal(false);
  readonly isLoadingDistricts = signal(false);
  readonly errorMessage = signal("");
  readonly successMessage = signal("");

  constructor(
    private readonly authService: AuthService,
    private readonly districtService: DistrictService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadDistricts();
  }

  onRegister(): void {
    const validationError = this.getValidationError();

    if (validationError) {
      this.errorMessage.set(validationError);
      this.successMessage.set("");
      return;
    }

    const request: RegisterCitizenRequest = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      dni: this.dni.trim(),
      phone: this.phone.trim(),
      email: this.email.trim(),
      password: this.password,
      confirmPassword: this.confirmPassword,
      districtId: this.selectedDistrictId,
      districtName: null,
      province: null,
      homeAddress: this.homeAddress.trim(),
    };

    this.isLoading.set(true);
    this.errorMessage.set("");
    this.successMessage.set("");

    this.authService.registerCitizen(request).pipe(
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: () => {
        this.successMessage.set("Cuenta creada correctamente. Redirigiendo al inicio de sesión...");
        setTimeout(() => this.router.navigate(["/login"]), 1200);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          this.isDuplicateEmailError(error)
            ? "Este correo ya está registrado."
            : "No se pudo crear la cuenta. Intenta nuevamente.",
        );
      },
    });
  }

  private loadDistricts(): void {
    this.isLoadingDistricts.set(true);

    this.districtService.getActiveDistricts().pipe(
      finalize(() => this.isLoadingDistricts.set(false)),
    ).subscribe({
      next: (districts) => this.districts = districts.filter((district) => district.active),
      error: () => this.errorMessage.set("No se pudieron cargar los distritos. Intenta nuevamente."),
    });
  }

  private getValidationError(): string | null {
    if (!this.firstName.trim()) return "Ingresa tus nombres.";
    if (!this.lastName.trim()) return "Ingresa tus apellidos.";
    if (!/^\d{8}$/.test(this.dni.trim())) return "El DNI debe tener exactamente 8 dígitos.";
    if (!/^\d{9}$/.test(this.phone.trim())) return "El teléfono debe tener exactamente 9 dígitos.";
    if (!this.isValidEmail(this.email.trim())) return "Ingresa un correo válido.";
    if (!this.selectedDistrictId) return "Selecciona un distrito / provincia.";
    if (!this.homeAddress.trim()) return "Ingresa tu dirección de domicilio.";
    if (this.password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    if (!this.confirmPassword) return "Confirma tu contraseña.";
    if (this.password !== this.confirmPassword) return "Las contraseñas no coinciden.";

    return null;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isDuplicateEmailError(error: HttpErrorResponse): boolean {
    const response = error.error as { message?: string; error?: string } | string | null;
    const message = typeof response === "string"
      ? response
      : `${response?.message ?? ""} ${response?.error ?? ""}`;

    return error.status === 409 || (/correo|email/i.test(message) && /registr/i.test(message));
  }
}
