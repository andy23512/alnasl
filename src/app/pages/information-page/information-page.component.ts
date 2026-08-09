import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLinkWithHref } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';

@Component({
  selector: 'app-information-page',
  standalone: true,
  imports: [MatIcon, RouterLinkWithHref, TranslatePipe, RealTitleCasePipe],
  templateUrl: './information-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformationPageComponent {}
