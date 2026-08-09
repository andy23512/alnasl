import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import {
  PracticeMode,
  PracticeSettings,
  TargetPoint,
  TrialResult,
} from '../../models/practice.models';
import { PracticeEngine } from '../../practice/practice-engine';

export interface TrialProgress {
  result: TrialResult;
  trialNumber: number;
  totalTrials: number;
  errorCount: number;
}

type ArenaPhase = 'idle' | 'running' | 'finished';

@Component({
  selector: 'app-target-arena',
  standalone: true,
  imports: [MatButton, MatIcon, TranslatePipe, RealTitleCasePipe],
  templateUrl: './target-arena.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetArenaComponent {
  readonly settings = input.required<PracticeSettings>();

  readonly sessionStarted = output<{ totalTrials: number }>();
  readonly trialCompleted = output<TrialProgress>();
  readonly sessionCompleted = output<TrialResult[]>();

  readonly PracticeMode = PracticeMode;

  private readonly arenaRef =
    viewChild.required<ElementRef<HTMLDivElement>>('arena');

  readonly phase = signal<ArenaPhase>('idle');
  readonly sourcePoint = signal<TargetPoint | null>(null);
  readonly targetPoint = signal<TargetPoint | null>(null);
  readonly dwelling = signal(false);
  readonly dwellProgress = signal(0);
  readonly feedback = signal<{ x: number; y: number; isError: boolean } | null>(
    null,
  );

  private engine: PracticeEngine | null = null;
  private isDragging = false;
  private dwellStart: number | null = null;
  private trialNumber = 0;
  private totalTrials = 0;
  private errorCount = 0;

  startSession(): void {
    const settings = this.settings();
    const rect = this.arenaRef().nativeElement.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const maxAmplitude = Math.max(80, size - settings.targetWidth - 32);
    const effectiveAmplitude = Math.min(settings.amplitude, maxAmplitude);
    const center = { x: rect.width / 2, y: rect.height / 2 };

    this.engine = new PracticeEngine(
      { ...settings, amplitude: effectiveAmplitude },
      center,
    );
    this.isDragging = false;
    this.dwellStart = null;
    this.errorCount = 0;
    this.trialNumber = 1;
    this.totalTrials = this.engine.totalTrials;
    this.dwellProgress.set(0);
    this.dwelling.set(false);
    this.feedback.set(null);
    this.phase.set('running');
    this.refreshPoints();
    if (settings.mode !== PracticeMode.Drag) {
      this.engine.startTrial(performance.now());
    }
    this.sessionStarted.emit({ totalTrials: this.totalTrials });
  }

  onPointerMove(event: PointerEvent): void {
    if (this.phase() !== 'running' || !this.engine) {
      return;
    }
    const point = this.relativePoint(event);
    const mode = this.settings().mode;

    if (mode === PracticeMode.Move) {
      this.handleMoveDwell(point);
    } else if (mode === PracticeMode.Drag && this.isDragging) {
      this.engine.trackPathPoint(point.x, point.y);
    }
  }

  onPointerDown(event: PointerEvent): void {
    if (
      this.phase() !== 'running' ||
      !this.engine ||
      this.settings().mode !== PracticeMode.Drag
    ) {
      return;
    }
    const point = this.relativePoint(event);
    const source = this.sourcePoint();
    if (!source) {
      return;
    }
    const distance = Math.hypot(point.x - source.x, point.y - source.y);
    if (distance <= this.settings().targetWidth / 2) {
      this.isDragging = true;
      this.engine.startTrial(performance.now());
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (
      !this.isDragging ||
      this.settings().mode !== PracticeMode.Drag ||
      !this.engine
    ) {
      return;
    }
    this.isDragging = false;
    const point = this.relativePoint(event);
    this.completeCurrentTrial(performance.now(), point.x, point.y);
  }

  onClick(event: MouseEvent): void {
    if (
      this.phase() !== 'running' ||
      !this.engine ||
      this.settings().mode !== PracticeMode.Click
    ) {
      return;
    }
    const point = this.relativePoint(event);
    this.completeCurrentTrial(performance.now(), point.x, point.y);
  }

  private handleMoveDwell(point: { x: number; y: number }): void {
    const target = this.targetPoint();
    if (!target || !this.engine) {
      return;
    }
    const distance = Math.hypot(point.x - target.x, point.y - target.y);
    const now = performance.now();
    if (distance <= this.settings().targetWidth / 2) {
      if (this.dwellStart === null) {
        this.dwellStart = now;
      }
      const progress = Math.min(
        1,
        (now - this.dwellStart) / this.settings().dwellTimeMs,
      );
      this.dwellProgress.set(progress);
      this.dwelling.set(true);
      if (progress >= 1) {
        this.dwellStart = null;
        this.dwellProgress.set(0);
        this.dwelling.set(false);
        this.completeCurrentTrial(now, point.x, point.y);
      }
    } else {
      this.dwellStart = null;
      this.dwellProgress.set(0);
      this.dwelling.set(false);
    }
  }

  private completeCurrentTrial(now: number, x: number, y: number): void {
    if (!this.engine) {
      return;
    }
    const result = this.engine.completeTrial(now, x, y);
    if (result.isError) {
      this.errorCount++;
    }
    this.feedback.set({ x, y, isError: result.isError });
    setTimeout(() => this.feedback.set(null), 220);

    if (this.engine.isFinished) {
      this.phase.set('finished');
      this.trialCompleted.emit({
        result,
        trialNumber: this.totalTrials,
        totalTrials: this.totalTrials,
        errorCount: this.errorCount,
      });
      this.sessionCompleted.emit(this.engine.results);
      return;
    }

    this.trialNumber = this.engine.currentTrialNumber;
    this.refreshPoints();
    if (this.settings().mode !== PracticeMode.Drag) {
      this.engine.startTrial(performance.now());
    }
    this.trialCompleted.emit({
      result,
      trialNumber: this.trialNumber,
      totalTrials: this.totalTrials,
      errorCount: this.errorCount,
    });
  }

  private refreshPoints(): void {
    if (!this.engine) {
      return;
    }
    this.sourcePoint.set(this.engine.sourcePoint);
    this.targetPoint.set(this.engine.targetPoint);
  }

  private relativePoint(event: PointerEvent | MouseEvent): {
    x: number;
    y: number;
  } {
    const rect = this.arenaRef().nativeElement.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
}
