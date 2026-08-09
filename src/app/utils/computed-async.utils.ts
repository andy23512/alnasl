import { Signal, effect, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

export function computedAsync<T>(
  computation: () => Observable<T>,
): Signal<T | null> & { recompute: () => void } {
  const sig = signal<T | null>(null);

  let subscription: Subscription;

  const recompute = () => {
    sig.set(null);
    if (subscription && !subscription.closed) {
      subscription.unsubscribe();
    }
    const observable = computation();
    subscription = observable.subscribe((result) => sig.set(result));
  };

  effect(recompute, { allowSignalWrites: true });

  return Object.assign(sig, { recompute });
}
