import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { PracticeMode } from '../../models/practice.models';
import { PracticeSettingStore } from '../../stores/practice-setting.store';

const TARGET_COUNT_OPTIONS = [5, 7, 9, 11, 13];
const ROUND_OPTIONS = [1, 2, 3, 4, 5];

@Component({
  selector: 'app-practice-setting-form',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonToggleModule,
    MatFormField,
    MatLabel,
    MatSuffix,
    MatIcon,
    MatInput,
    MatOption,
    MatSelect,
    TranslatePipe,
    RealTitleCasePipe,
  ],
  templateUrl: './practice-setting-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticeSettingFormComponent {
  readonly store = inject(PracticeSettingStore);

  readonly PracticeMode = PracticeMode;
  readonly targetCountOptions = TARGET_COUNT_OPTIONS;
  readonly roundOptions = ROUND_OPTIONS;

  setMode(mode: PracticeMode): void {
    this.store.set('mode', mode);
  }

  setTargetCount(value: number): void {
    this.store.set('targetCount', value);
  }

  setRounds(value: number): void {
    this.store.set('rounds', value);
  }

  setTargetWidth(value: number): void {
    this.store.set('targetWidth', clamp(value, 16, 160));
  }

  setAmplitude(value: number): void {
    this.store.set('amplitude', clamp(value, 100, 900));
  }

  setDwellTimeMs(value: number): void {
    this.store.set('dwellTimeMs', clamp(value, 100, 1500));
  }
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}
