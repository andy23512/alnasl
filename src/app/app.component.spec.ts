import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import en from '../assets/i18n/en.json';
import { AppComponent } from './app.component';

@Component({ standalone: true, template: '<p id="page">a page</p>' })
class PageStub {}

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'x', component: PageStub }]),
        provideTranslateService(),
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', en);
    translate.use('en');
  });

  it('puts the navigation above the page, and the page in the rest of the space', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await TestBed.inject(Router).navigateByUrl('/x');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const children = Array.from(el.querySelector('div')!.children).map((c) =>
      c.tagName.toLowerCase(),
    );
    expect(children).toEqual(['app-nav', 'main']);
    const main = el.querySelector('main')!;
    expect(main.classList).toContain('flex-1');
    expect(main.classList).toContain('overflow-auto');
    expect(main.querySelector('#page')).not.toBeNull();
  });
});
