import { Pipe, PipeTransform } from '@angular/core';
import { StatusColorService } from './status-color.service';

@Pipe({ name: 'statusColor', standalone: true })
export class StatusColorPipe implements PipeTransform {
  constructor(private svc: StatusColorService) {}

  transform(statusOrItem: any): string {
    return this.svc.getColor(statusOrItem);
  }
}
