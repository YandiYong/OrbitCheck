import { Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';

export type GlobalSnack = {
  message: string;
  visible: boolean;
  duration?: number;
};

@Injectable({ providedIn: 'root' })
export class GlobalSnackbarService {
  private _message = signal<string | null>(null);
  private _visible = signal<boolean>(false);
  private _timer: any = null;

  get message() { return this._message; }
  get visible() { return this._visible; }

  show(message: string, duration = 6000) {
    try { if (this._timer) clearTimeout(this._timer); } catch (e) {}
    this._message.set(message);
    this._visible.set(true);
    this._timer = setTimeout(() => {
      this._visible.set(false);
      this._message.set(null);
      this._timer = null;
    }, duration);
  }

  hide() {
    try { if (this._timer) clearTimeout(this._timer); } catch (e) {}
    this._visible.set(false);
    this._message.set(null);
    this._timer = null;
  }
}
