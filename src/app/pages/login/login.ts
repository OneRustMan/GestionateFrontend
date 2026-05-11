import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router'; 

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  
  constructor(private router: Router) {}

  onLogin() {
    localStorage.setItem('isLoggedIn', 'true');
    this.router.navigate(['/home']);
  }
}