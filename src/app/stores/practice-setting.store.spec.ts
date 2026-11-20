import { TestBed } from '@angular/core/testing';
import { PracticeMode } from '../models/practice.models';
import { PracticeSettingStore } from './practice-setting.store';

describe('PracticeSettingStore', () => {
  function create(keepStorage = false) {
    TestBed.resetTestingModule();
    if (!keepStorage) {
      localStorage.clear();
    }
    const store = TestBed.inject(PracticeSettingStore);
    TestBed.tick();
    return store;
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('starts with the default settings', () => {
    const s = create();
    expect(s.mode()).toBe(PracticeMode.Click);
    expect(s.targetCount()).toBe(9);
    expect(s.rounds()).toBe(3);
    expect(s.targetWidth()).toBe(40);
    expect(s.amplitude()).toBe(360);
    expect(s.dwellTimeMs()).toBe(350);
  });

  it('changes one setting and leaves the others', () => {
    const s = create();
    s.set('targetWidth', 80);
    expect(s.targetWidth()).toBe(80);
    expect(s.mode()).toBe(PracticeMode.Click);
    expect(s.targetCount()).toBe(9);
    expect(s.rounds()).toBe(3);
    expect(s.amplitude()).toBe(360);
    expect(s.dwellTimeMs()).toBe(350);
    s.set('mode', PracticeMode.Drag);
    expect(s.mode()).toBe(PracticeMode.Drag);
    expect(s.targetWidth()).toBe(80);
  });

  it('saves the settings in local storage', () => {
    const s = create();
    s.set('rounds', 5);
    TestBed.tick();
    expect(JSON.parse(localStorage.getItem('practiceSetting')!)).toEqual({
      mode: 'click',
      targetCount: 9,
      rounds: 5,
      targetWidth: 40,
      amplitude: 360,
      dwellTimeMs: 350,
    });
  });

  it('restores saved settings, filling in any that are missing with the defaults', () => {
    localStorage.setItem(
      'practiceSetting',
      JSON.stringify({ mode: 'drag', amplitude: 500 }),
    );
    const s = create(true);
    expect(s.mode()).toBe(PracticeMode.Drag);
    expect(s.amplitude()).toBe(500);
    expect(s.targetCount()).toBe(9);
    expect(s.targetWidth()).toBe(40);
    expect(s.dwellTimeMs()).toBe(350);
  });

  it('prefers a saved value over the default', () => {
    localStorage.setItem('practiceSetting', JSON.stringify({ rounds: 1 }));
    expect(create(true).rounds()).toBe(1);
  });
});
