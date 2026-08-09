import { Pipe, PipeTransform } from '@angular/core';
import { toTitleCase } from '../utils/case.utils';

@Pipe({
  name: 'realTitleCase',
  standalone: true,
})
export class RealTitleCasePipe implements PipeTransform {
  transform(value: string): string {
    return toTitleCase(value);
  }
}
