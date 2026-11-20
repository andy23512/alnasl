import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { computedAsync } from './computed-async.utils';

describe('computedAsync', () => {
  function make<T>(computation: () => import('rxjs').Observable<T>) {
    return TestBed.runInInjectionContext(() => computedAsync(computation));
  }

  it('is null until the observable gives a value', () => {
    const subject = new Subject<number>();
    const s = make(() => subject);
    TestBed.tick();
    expect(s()).toBeNull();
    subject.next(5);
    expect(s()).toBe(5);
    subject.next(6);
    expect(s()).toBe(6);
  });

  it('takes a value that is given at once', () => {
    const s = make(() => of('a'));
    TestBed.tick();
    expect(s()).toBe('a');
  });

  it('starts again when a signal it depends on changes, going back to null first', () => {
    const which = signal(1);
    const subjects = new Map<number, Subject<string>>();
    const s = make(() => {
      const n = which();
      const subject = new Subject<string>();
      subjects.set(n, subject);
      return subject;
    });
    TestBed.tick();
    subjects.get(1)!.next('one');
    expect(s()).toBe('one');
    which.set(2);
    TestBed.tick();
    expect(s()).toBeNull();
    subjects.get(2)!.next('two');
    expect(s()).toBe('two');
  });

  it('stops listening to the old observable once it starts again', () => {
    const which = signal(1);
    const subjects = new Map<number, Subject<string>>();
    const s = make(() => {
      const subject = new Subject<string>();
      subjects.set(which(), subject);
      return subject;
    });
    TestBed.tick();
    which.set(2);
    TestBed.tick();
    subjects.get(1)!.next('late');
    expect(s()).toBeNull();
    expect(subjects.get(1)!.observed).toBeFalse();
    expect(subjects.get(2)!.observed).toBeTrue();
  });

  it('can be started again by hand, with the same result', () => {
    let calls = 0;
    const s = make(() => {
      calls++;
      return of(calls);
    });
    TestBed.tick();
    expect(s()).toBe(1);
    s.recompute();
    expect(s()).toBe(2);
    s.recompute();
    expect(s()).toBe(3);
  });

  it('goes back to null when started again by hand, until the new value comes', () => {
    const subjects: Subject<number>[] = [];
    const s = make(() => {
      const subject = new Subject<number>();
      subjects.push(subject);
      return subject;
    });
    TestBed.tick();
    subjects[0].next(1);
    s.recompute();
    expect(s()).toBeNull();
    subjects[0].next(99);
    expect(s()).toBeNull();
    subjects[1].next(2);
    expect(s()).toBe(2);
  });

  it('works with an injector given from outside', () => {
    expect(TestBed.inject(Injector)).toBeTruthy();
  });
});
