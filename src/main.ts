import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';
import { LanguageSettingStore } from './app/stores/language-setting.store';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    provideRouter(APP_ROUTES, withComponentInputBinding()),
    provideHttpClient(withInterceptorsFromDi()),
    provideTranslateService({
      lang: 'en',
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
      }),
    }),
    provideAppInitializer(() => {
      const _languageSettingStore = inject(LanguageSettingStore);
      const _translateService = inject(TranslateService);
    }),
    {
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
      useValue: { disableTooltipInteractivity: true },
    },
  ],
}).catch((err) => console.error(err));
