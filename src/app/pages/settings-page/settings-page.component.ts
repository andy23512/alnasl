import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { PracticeSettingFormComponent } from 'src/app/components/practice-setting-form/practice-setting-form.component';
import { db } from 'src/app/db';
import { SUPPORTED_LANGUAGES, UiLanguage } from 'src/app/models/language-setting.models';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { LanguageSettingStore } from 'src/app/stores/language-setting.store';

const LANGUAGE_NAMES: Record<UiLanguage, string> = {
  [UiLanguage.EN]: 'English',
  [UiLanguage.ZH_TW]: '繁體中文',
};

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    FormsModule,
    MatButton,
    MatButtonToggleModule,
    MatExpansionModule,
    MatIcon,
    PracticeSettingFormComponent,
    TranslatePipe,
    RealTitleCasePipe,
  ],
  templateUrl: './settings-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  readonly languageSettingStore = inject(LanguageSettingStore);

  readonly supportedLanguages = SUPPORTED_LANGUAGES.map((id) => ({
    id,
    name: LANGUAGE_NAMES[id],
  }));

  setLanguage(uiLanguage: UiLanguage): void {
    this.languageSettingStore.set('uiLanguage', uiLanguage);
  }

  async clearHistory(): Promise<void> {
    await db.sessions.clear();
  }
}
