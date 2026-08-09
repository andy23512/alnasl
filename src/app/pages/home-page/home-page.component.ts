import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLinkWithHref } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [MatButton, MatIcon, RouterLinkWithHref, TranslatePipe, RealTitleCasePipe],
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  @HostBinding('class') classes = 'block relative h-full';
}
