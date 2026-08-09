import { Route } from '@angular/router';

export const APP_ROUTES: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/home-page/home-page.component').then(
        (m) => m.HomePageComponent,
      ),
  },
  {
    path: 'practice',
    loadComponent: () =>
      import('./pages/practice-page/practice-page.component').then(
        (m) => m.PracticePageComponent,
      ),
  },
  {
    path: 'statistics',
    loadComponent: () =>
      import('./pages/statistics-page/statistics-page.component').then(
        (m) => m.StatisticsPageComponent,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings-page/settings-page.component').then(
        (m) => m.SettingsPageComponent,
      ),
  },
  {
    path: 'information',
    loadComponent: () =>
      import('./pages/information-page/information-page.component').then(
        (m) => m.InformationPageComponent,
      ),
  },
];
