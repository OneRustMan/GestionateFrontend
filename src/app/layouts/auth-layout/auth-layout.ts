import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, CommonModule, Navbar],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
})
export class AuthLayout implements OnInit {
  currentImage = '/images/truck-city.png';

  constructor(private router: Router) {}

  ngOnInit() {
    this.updateImage(this.router.url);
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateImage(event.urlAfterRedirects);
    });
  }

  updateImage(url: string) {
    if (url.includes('/registro/ciudadano')) {
      this.currentImage = '/images/register-citizen-bg.png';
    } else if (url.includes('/registro/recepcionista')) {
      this.currentImage = '/images/register-municipal-bg.png';
    } else if (url.includes('/registro/operativo')) {
      this.currentImage = '/images/truck-city.png';
    } else {
      // Imagen por defecto para login, unete, etc.
      this.currentImage = '/images/truck-city.png';
    }
  }
}
