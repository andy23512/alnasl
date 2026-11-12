import { ChangeDetectionStrategy, Component, computed, HostBinding, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { liveQuery } from 'dexie';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts/highstock';
import theme from 'highcharts/themes/high-contrast-dark';
import { Observable } from 'rxjs';
import { db } from 'src/app/db';
import { PracticeMode, SessionSummary } from 'src/app/models/practice.models';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { computedAsync } from 'src/app/utils/computed-async.utils';
theme(Highcharts);

enum Metric {
  Throughput = 'Throughput',
  MovementTime = 'MovementTime',
  ErrorRate = 'ErrorRate',
}

const MODES = [PracticeMode.Move, PracticeMode.Click, PracticeMode.Drag];

const TRANSLATION_KEYS = [
  'general.throughput-unit',
  'general.movement-time-unit',
  ...MODES.map((mode) => 'practice-setting.mode.' + mode),
];

@Component({
  selector: 'app-statistics-page',
  standalone: true,
  imports: [HighchartsChartModule, MatButtonToggleModule, FormsModule, TranslatePipe, RealTitleCasePipe],
  templateUrl: './statistics-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsPageComponent {
  @HostBinding('class') classes = 'flex flex-col gap-2 h-full';
  private translateService = inject(TranslateService);

  Highcharts: typeof Highcharts = Highcharts;
  Metric = Metric;
  currentMetric = signal(Metric.Throughput);
  chartConstructor = 'stockChart';
  updateFlag = false;

  // stream() emits once the translation file has loaded and again on every
  // language change, so the chart is rebuilt with real labels instead of keys.
  private translations = toSignal(
    this.translateService.stream(TRANSLATION_KEYS) as Observable<Record<string, string>>,
  );

  sessions = computedAsync(() => {
    return liveQuery(() =>
      db.sessions.orderBy('timestamp').toArray(),
    ) as unknown as Observable<SessionSummary[]>;
  });

  chartOptions = computed<Highcharts.Options | null>(() => {
    const sessions = this.sessions();
    const translations = this.translations();
    if (!sessions || !translations) {
      return null;
    }
    const currentMetric = this.currentMetric();
    const { unit, extract } = this.metricConfig(currentMetric, translations);
    const series: Highcharts.SeriesOptionsType[] = MODES.map((mode) => ({
      type: 'line' as const,
      data: sessions
        .filter((s) => s.mode === mode)
        .map((s) => [s.timestamp, extract(s)]),
      name: translations['practice-setting.mode.' + mode],
      dataGrouping: { groupPixelWidth: 20 },
      marker: { enabled: true, radius: 5 },
    })).filter((s) => s.data.length > 0);

    return {
      legend: { enabled: true },
      scrollbar: { enabled: false },
      series,
      time: { useUTC: false },
      tooltip: {
        formatter: function () {
          return `${this.series.name}: ${this.y?.toFixed(2)} ${unit}`;
        },
      },
      yAxis: { title: { text: unit } },
      xAxis: { type: 'datetime', ordinal: false, breaks: undefined },
    };
  });

  private metricConfig(
    metric: Metric,
    translations: Record<string, string>,
  ): {
    unit: string;
    extract: (s: SessionSummary) => number;
  } {
    switch (metric) {
      case Metric.Throughput:
        return {
          unit: translations['general.throughput-unit'],
          extract: (s) => s.throughputBitsPerSecond,
        };
      case Metric.MovementTime:
        return {
          unit: translations['general.movement-time-unit'],
          extract: (s) => s.meanMovementTimeMs,
        };
      case Metric.ErrorRate:
        return {
          unit: '%',
          extract: (s) => s.errorRate * 100,
        };
      default: {
        const _: never = metric;
        throw new Error(`Unhandled metric case: ${metric}`);
      }
    }
  }
}
