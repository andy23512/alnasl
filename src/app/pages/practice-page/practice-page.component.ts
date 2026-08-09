import { DecimalPipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { PracticeSettingFormComponent } from 'src/app/components/practice-setting-form/practice-setting-form.component';
import {
  TargetArenaComponent,
  TrialProgress,
} from 'src/app/components/target-arena/target-arena.component';
import { db } from 'src/app/db';
import { PracticeSettings, SessionSummary, TrialResult } from 'src/app/models/practice.models';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { PracticeSettingStore } from 'src/app/stores/practice-setting.store';
import { summarizeTrials } from 'src/app/utils/practice-stats.utils';

@Component({
  selector: 'app-practice-page',
  standalone: true,
  imports: [
    DecimalPipe,
    PercentPipe,
    MatExpansionModule,
    MatIcon,
    PracticeSettingFormComponent,
    TargetArenaComponent,
    TranslatePipe,
    RealTitleCasePipe,
  ],
  templateUrl: './practice-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticePageComponent {
  private readonly settingStore = inject(PracticeSettingStore);

  readonly settings = computed<PracticeSettings>(() => ({
    mode: this.settingStore.mode(),
    targetCount: this.settingStore.targetCount(),
    rounds: this.settingStore.rounds(),
    targetWidth: this.settingStore.targetWidth(),
    amplitude: this.settingStore.amplitude(),
    dwellTimeMs: this.settingStore.dwellTimeMs(),
  }));

  readonly trialNumber = signal(0);
  readonly totalTrials = signal(0);
  readonly errorCount = signal(0);
  readonly inProgress = signal(false);
  readonly lastSummary = signal<SessionSummary | null>(null);

  onSessionStarted(event: { totalTrials: number }): void {
    this.inProgress.set(true);
    this.trialNumber.set(0);
    this.totalTrials.set(event.totalTrials);
    this.errorCount.set(0);
    this.lastSummary.set(null);
  }

  onTrialCompleted(progress: TrialProgress): void {
    this.trialNumber.set(progress.trialNumber);
    this.totalTrials.set(progress.totalTrials);
    this.errorCount.set(progress.errorCount);
  }

  async onSessionCompleted(results: TrialResult[]): Promise<void> {
    this.inProgress.set(false);
    const summary: SessionSummary = {
      ...summarizeTrials(results, this.settings()),
      timestamp: Date.now(),
    };
    this.lastSummary.set(summary);
    await db.sessions.add(summary);
  }
}
