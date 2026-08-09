import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLinkActive, RouterLinkWithHref } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map, Observable, shareReplay } from 'rxjs';
import { NAV_LINKS } from 'src/app/data/nav-links';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    MatButton,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatToolbar,
    MatTooltip,
    RouterLinkActive,
    RouterLinkWithHref,
    TranslatePipe,
    RealTitleCasePipe,
  ],
})
export class NavComponent {
  public navLinks = NAV_LINKS;

  private readonly breakpointObserver = inject(BreakpointObserver);

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay(1),
    );
}
