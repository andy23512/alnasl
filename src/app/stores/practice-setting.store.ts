import {
  withDevtools,
  withStorageSync,
} from '@angular-architects/ngrx-toolkit';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { PracticeMode, PracticeSettings } from '../models/practice.models';

const INITIAL_PRACTICE_SETTINGS: PracticeSettings = {
  mode: PracticeMode.Click,
  targetCount: 9,
  rounds: 3,
  targetWidth: 40,
  amplitude: 360,
  dwellTimeMs: 350,
};

export const PracticeSettingStore = signalStore(
  { providedIn: 'root', protectedState: false },
  withDevtools('practiceSetting'),
  withStorageSync({
    key: 'practiceSetting',
    parse(stateString: string) {
      return { ...INITIAL_PRACTICE_SETTINGS, ...JSON.parse(stateString) };
    },
  }),
  withState(INITIAL_PRACTICE_SETTINGS),
  withMethods((store) => ({
    set<K extends keyof PracticeSettings>(key: K, value: PracticeSettings[K]) {
      patchState(store, (state) => ({
        ...state,
        [key]: value,
      }));
    },
  })),
);
