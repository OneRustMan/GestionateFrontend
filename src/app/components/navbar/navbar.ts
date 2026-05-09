import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  @Input() isLoggedIn = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // Escuchar cambios de ruta para simular estado de sesión
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isLoggedIn = event.urlAfterRedirects.includes('/perfil');
    });
  }
}
