import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  isLoggedIn = false;
  
  currentUserRole: string = 'recepcionista';

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkLoginStatus(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkLoginStatus(event.urlAfterRedirects);
    });
  }

  checkLoginStatus(url: string) {
    if (
      url.includes('/perfil') || 
      url.includes('/home') || 
      url.includes('/crear-reporte') || 
      url.includes('/mis-reportes') ||
      url.includes('/reportes-recibidos') ||
      url.includes('/reportes-derivados') ||
      url.includes('/ordenes-asignadas') ||
      url.includes('/ordenes-completadas')
    ) {
      this.isLoggedIn = true;
    } else {
      this.isLoggedIn = false;
    }
  }
}