import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize } from 'rxjs';
import { ContactMessageService } from '../../services/contact-message.service';

@Component({
  selector: 'app-contact',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  name = '';
  email = '';
  subject = '';
  message = '';

  loading = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';

  constructor(private readonly contactMessageService: ContactMessageService) {}

  onSubmit(form: NgForm): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (form.invalid) {
      return;
    }

    this.loading = true;

    this.contactMessageService.sendMessage({
      name: this.name.trim(),
      email: this.email.trim(),
      subject: this.subject.trim(),
      message: this.message.trim(),
    }).pipe(
      finalize(() => this.loading = false),
    ).subscribe({
      next: () => {
        this.successMessage = 'Tu mensaje fue enviado correctamente. Nos pondremos en contacto contigo pronto.';
        form.resetForm();
        this.submitted = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo enviar tu mensaje. Revisa los datos e intenta nuevamente.';
      },
    });
  }
}
