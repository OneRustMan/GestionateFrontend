import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MunicipalUnit, Shift, UserRole } from '../../models/auth.models';
import { District } from '../../models/district.models';
import { MunicipalityResponse } from '../../models/municipality.models';
import { UpdateProfileRequest, UserProfileResponse } from '../../models/profile.models';
import { AuthService } from '../../services/auth.service';
import { DistrictService } from '../../services/district.service';
import { MunicipalityService } from '../../services/municipality.service';
import { ProfileService } from '../../services/profile.service';

interface MunicipalUnitOption {
  label: string;
  value: MunicipalUnit;
}

interface ShiftOption {
  label: string;
  value: Shift;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  firstName = '';
  lastName = '';
  dni = '';
  phone = '';
  email = '';

  selectedDistrictId: number | null = null;
  homeAddress = '';

  selectedMunicipalityId: number | null = null;
  selectedMunicipalUnit: MunicipalUnit | null = null;
  selectedShift: Shift | null = null;
  workerCode = '';

  profileRole: UserRole | null = null;
  districts: District[] = [];
  municipalities: MunicipalityResponse[] = [];
  submitted = false;
  canEditProfile = false;

  readonly municipalUnitOptions: MunicipalUnitOption[] = [
    { label: 'Atención al ciudadano', value: 'CITIZEN_SERVICE' },
    { label: 'Mesa de partes', value: 'DOCUMENTARY_PROCESSING' },
    { label: 'Plataforma vecinal', value: 'NEIGHBORHOOD_PLATFORM' },
  ];

  readonly shiftOptions: ShiftOption[] = [
    { label: 'Mañana', value: 'MORNING' },
    { label: 'Tarde', value: 'AFTERNOON' },
    { label: 'Noche', value: 'NIGHT' },
  ];

  readonly isLoadingProfile = signal(false);
  readonly isLoadingDistricts = signal(false);
  readonly isLoadingMunicipalities = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  private originalProfile: UserProfileResponse | null = null;

  constructor(
    private readonly profileService: ProfileService,
    private readonly districtService: DistrictService,
    private readonly municipalityService: MunicipalityService,
    private readonly authService: AuthService,
    private readonly location: Location,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  onSave(): void {
    this.submitted = true;
    this.successMessage.set('');

    if (!this.canEditProfile) {
      this.errorMessage.set('El perfil no está disponible para este rol.');
      return;
    }

    if (this.getValidationError()) {
      this.errorMessage.set('Completa los campos obligatorios.');
      return;
    }

    const request = this.buildUpdateRequest();

    if (!request) {
      this.errorMessage.set('El perfil no está disponible para este rol.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    this.profileService.updateMyProfile(request).pipe(
      finalize(() => this.isSaving.set(false)),
    ).subscribe({
      next: (profile) => {
        this.originalProfile = profile;
        this.fillForm(profile);
        this.authService.updateStoredProfile(
          `${profile.firstName} ${profile.lastName}`.trim(),
          profile.email,
        );
        this.submitted = false;
        this.successMessage.set('Perfil actualizado correctamente.');
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.getSaveErrorMessage(error));
      },
    });
  }

  onBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate([this.getDashboardRoute()]);
  }

  get isCitizenProfile(): boolean {
    return this.profileRole === 'CITIZEN';
  }

  get isReceptionistProfile(): boolean {
    return this.profileRole === 'MUNICIPAL_RECEPTIONIST';
  }

  get isCleaningOperationsProfile(): boolean {
    return this.profileRole === 'CLEANING_OPERATIONS';
  }

  get usesMunicipalityProfile(): boolean {
    return this.isReceptionistProfile || this.isCleaningOperationsProfile;
  }

  get selectedMunicipality(): MunicipalityResponse | null {
    return this.municipalities.find((municipality) => municipality.id === this.selectedMunicipalityId) ?? null;
  }

  get selectedMunicipalityDistrictLabel(): string {
    const municipality = this.selectedMunicipality;
    return municipality ? `${municipality.districtName} - ${municipality.province}` : '';
  }

  get isBusy(): boolean {
    return this.isLoadingProfile()
      || this.isLoadingDistricts()
      || this.isLoadingMunicipalities()
      || this.isSaving();
  }

  get isFormDisabled(): boolean {
    return !this.canEditProfile || this.isBusy;
  }

  private loadRoleOptions(role: UserRole): void {
    if (role === 'CITIZEN') {
      this.loadDistricts();
      return;
    }

    if (role === 'MUNICIPAL_RECEPTIONIST' || role === 'CLEANING_OPERATIONS') {
      this.loadMunicipalities();
    }
  }

  private loadProfile(): void {
    this.isLoadingProfile.set(true);
    this.errorMessage.set('');

    this.profileService.getMyProfile().pipe(
      finalize(() => this.isLoadingProfile.set(false)),
    ).subscribe({
      next: (profile) => {
        this.canEditProfile = true;
        this.originalProfile = profile;
        this.fillForm(profile);
        this.loadRoleOptions(profile.role);
      },
      error: () => this.errorMessage.set('No se pudo cargar tu perfil. Intenta nuevamente.'),
    });
  }

  private loadDistricts(): void {
    this.isLoadingDistricts.set(true);

    this.districtService.getActiveDistricts().pipe(
      finalize(() => this.isLoadingDistricts.set(false)),
    ).subscribe({
      next: (districts) => this.districts = districts.filter((district) => district.active),
      error: () => this.errorMessage.set('No se pudieron cargar los distritos. Intenta nuevamente.'),
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

  private fillForm(profile: UserProfileResponse): void {
    this.profileRole = profile.role;
    this.firstName = profile.firstName ?? '';
    this.lastName = profile.lastName ?? '';
    this.dni = profile.dni ?? '';
    this.phone = profile.phone ?? '';
    this.email = profile.email ?? '';

    this.selectedDistrictId = profile.districtId;
    this.homeAddress = profile.homeAddress ?? '';

    this.selectedMunicipalityId = profile.municipalityId;
    this.selectedMunicipalUnit = profile.municipalUnit;
    this.selectedShift = profile.shift;
    this.workerCode = profile.workerCode ?? '';
  }

  private getValidationError(): string | null {
    if (!this.firstName.trim()) return 'firstName';
    if (!this.lastName.trim()) return 'lastName';
    if (!/^\d{9}$/.test(this.phone.trim())) return 'phone';
    if (!this.isValidEmail(this.email.trim())) return 'email';

    if (this.isCitizenProfile) {
      if (!this.selectedDistrictId) return 'districtId';
      if (!this.homeAddress.trim()) return 'homeAddress';
      return null;
    }

    if (this.isReceptionistProfile) {
      if (!this.selectedMunicipalityId) return 'municipalityId';
      if (!this.selectedMunicipalUnit) return 'municipalUnit';
      return null;
    }

    if (this.isCleaningOperationsProfile) {
      if (!this.selectedMunicipalityId) return 'municipalityId';
      if (!this.selectedShift) return 'shift';
      return null;
    }

    return 'role';
  }

  private buildUpdateRequest(): UpdateProfileRequest | null {
    const baseRequest = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      phone: this.phone.trim(),
      email: this.email.trim(),
      districtName: null,
      province: null,
      municipalityName: null,
    };

    if (this.isCitizenProfile) {
      return {
        ...baseRequest,
        districtId: this.selectedDistrictId,
        homeAddress: this.homeAddress.trim(),
        municipalityId: null,
        municipalUnit: null,
        shift: null,
      };
    }

    if (this.isReceptionistProfile) {
      return {
        ...baseRequest,
        districtId: null,
        homeAddress: null,
        municipalityId: this.selectedMunicipalityId,
        municipalUnit: this.selectedMunicipalUnit,
        shift: null,
      };
    }

    if (this.isCleaningOperationsProfile) {
      return {
        ...baseRequest,
        districtId: null,
        homeAddress: null,
        municipalityId: this.selectedMunicipalityId,
        municipalUnit: null,
        shift: this.selectedShift,
      };
    }

    return null;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private getDashboardRoute(): string {
    const role = this.originalProfile?.role ?? this.authService.getRole();

    if (role === 'MUNICIPAL_RECEPTIONIST') return '/reportes-recibidos';
    if (role === 'CLEANING_OPERATIONS') return '/ordenes-asignadas';

    return '/home';
  }

  private getSaveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      return 'Completa los campos obligatorios.';
    }

    return 'No se pudo actualizar el perfil. Intenta nuevamente.';
  }
}
