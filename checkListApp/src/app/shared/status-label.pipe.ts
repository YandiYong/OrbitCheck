import { Pipe, PipeTransform } from '@angular/core';
import { StatusLabelService } from './status-label.service';

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  constructor(private svc: StatusLabelService) {}

  transform(item: any): string {
    return this.svc.getLabel(item);
  }
}
