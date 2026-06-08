import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { Landing } from './pages/landing/landing';
import { Contact } from './pages/contact/contact';
import { Unete } from './pages/unete/unete';
import { Login } from './pages/login/login';
import { RolSelection } from './pages/rol-selection/rol-selection';
import { RegisterCitizen } from './pages/register-citizen/register-citizen';
import { RegisterReceptionist } from './pages/register-receptionist/register-receptionist';
import { RegisterOperative } from './pages/register-operative/register-operative';
import { Profile } from './pages/profile/profile';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { UpdatePassword } from './pages/update-password/update-password';
import { HomeComponent } from './pages/home/home';
import { CreateReportComponent } from './pages/create-report/create-report';
import { ReportsComponent } from './pages/reports-list/reports'; 

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: Landing },
      { path: 'contacto', component: Contact },
      { path: 'perfil', component: Profile },
      { path: 'home', component: HomeComponent },
      { path: 'crear-reporte', component: CreateReportComponent },
      { path: 'mis-reportes', component: ReportsComponent } 
    ]
  },
  {
    path: '',
    component: AuthLayout,
    children: [
      { path: 'unete', component: Unete },
      { path: 'login', component: Login },
      { path: 'registro', component: RolSelection },
      { path: 'registro/ciudadano', component: RegisterCitizen },
      { path: 'registro/recepcionista', component: RegisterReceptionist },
      { path: 'registro/operativo', component: RegisterOperative },
      { path: 'recuperar-password', component: ForgotPassword },
      { path: 'actualizar-password', component: UpdatePassword }
    ]
  },
  { path: '**', redirectTo: '' }
];
