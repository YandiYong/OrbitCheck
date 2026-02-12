import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalSnackbarComponent } from './shared/global-snackbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalSnackbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('checkListApp');
}
