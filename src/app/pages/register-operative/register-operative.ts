import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { RegisterCleaningOperationsStaffRequest, Shift } from '../../models/auth.models';
import { MunicipalityResponse } from '../../models/municipality.models';
import { AuthService } from '../../services/auth.service';
import { MunicipalityService } from '../../services/municipality.service';

@Component({
  selector: 'app-register-operative',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register-operative.html',
  styleUrl: './register-operative.css',
})
export class RegisterOperative implements OnInit {
  firstName = '';
  lastName = '';
  dni = '';
  phone = '';
  email = '';
  selectedMunicipalityId: number | null = null;
  workerCode = '';
  password = '';
  confirmPassword = '';
  shift: Shift | null = null;

  municipalities: MunicipalityResponse[] = [];
  readonly shifts: { label: string; value: Shift }[] = [
    { label: 'Mañana', value: 'MORNING' },
    { label: 'Tarde', value: 'AFTERNOON' },
    { label: 'Noche', value: 'NIGHT' },
  ];
  readonly isLoading = signal(false);
  readonly isLoadingMunicipalities = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  constructor(
    private readonly authService: AuthService,
    private readonly municipalityService: MunicipalityService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadMunicipalities();
  }

  get selectedMunicipality(): MunicipalityResponse | undefined {
    return this.municipalities.find((municipality) => municipality.id === this.selectedMunicipalityId);
  }

  onRegister(): void {
    const validationError = this.getValidationError();

    if (validationError) {
      this.errorMessage.set(validationError);
      this.successMessage.set('');
      return;
    }

    const request: RegisterCleaningOperationsStaffRequest = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      dni: this.dni.trim(),
      phone: this.phone.trim(),
      email: this.email.trim(),
      password: this.password,
      confirmPassword: this.confirmPassword,
      municipalityId: this.selectedMunicipalityId,
      municipalityName: null,
      districtId: null,
      districtName: null,
      province: null,
      workerCode: this.workerCode.trim(),
      shift: this.shift as Shift,
    };

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.registerCleaningStaff(request).pipe(
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: () => {
        this.successMessage.set('Cuenta creada correctamente. Redirigiendo al inicio de sesión...');
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          this.isDuplicateEmailError(error)
            ? 'Este correo ya está registrado.'
            : 'No se pudo crear la cuenta. Intenta nuevamente.',
        );
      },
    });
  }

  private loadMunicipalities(): void {
    this.isLoadingMunicipalities.set(true);

    this.municipalityService.getMunicipalities().pipe(
      finalize(() => this.isLoadingMunicipalities.set(false)),
    ).subscribe({
      next: (municipalities) => this.municipalities = municipalities.filter((municipality) => municipality.active),
      error: () => this.errorMessage.set('No se pudieron cargar las municipalidades. Intenta nuevamente.'),
    });
  }

  private getValidationError(): string | null {
    if (!this.firstName.trim()) return 'Ingresa tus nombres.';
    if (!this.lastName.trim()) return 'Ingresa tus apellidos.';
    if (!/^\d{8}$/.test(this.dni.trim())) return 'El DNI debe tener exactamente 8 dígitos.';
    if (!/^\d{9}$/.test(this.phone.trim())) return 'El teléfono debe tener exactamente 9 dígitos.';
    if (!this.isValidEmail(this.email.trim())) return 'Ingresa un correo válido.';
    if (!this.selectedMunicipalityId) return 'Selecciona una municipalidad.';
    if (!this.workerCode.trim()) return 'Ingresa tu código de trabajador.';
    if (!this.shift) return 'Selecciona un turno.';
    if (this.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (!this.confirmPassword) return 'Confirma tu contraseña.';
    if (this.password !== this.confirmPassword) return 'Las contraseñas no coinciden.';

    return null;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isDuplicateEmailError(error: HttpErrorResponse): boolean {
    const response = error.error as { message?: string; error?: string } | string | null;
    const message = typeof response === 'string'
      ? response
      : `${response?.message ?? ''} ${response?.error ?? ''}`;

    return error.status === 409 || (/correo|email/i.test(message) && /registr/i.test(message));
  }
}
