import { Injectable, effect, signal } from '@angular/core';

// Shape of a stored signature record used by the app and export
export interface StoredSignature {
  id: number;
  image: string; // data URL or inline SVG
  user: string;
  signedFor: string;
  purpose: string;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class DsvStore {
  // User/session + form state
  readonly currentUser = signal<string>('User');
  readonly signatureFor = signal<string>('');
  readonly purpose = signal<string>('');
  // Drawing tools state
  readonly penColor = signal<string>('#000000');
  readonly lineWidth = signal<number>(2);
  // In-memory list of saved signatures
  readonly signatures = signal<StoredSignature[]>([]);

  constructor() {
    // Load previously saved signatures from localStorage (if any)
    const raw = localStorage.getItem('dsv.signatures');
    if (raw) {
      try {
        this.signatures.set(JSON.parse(raw));
      } catch {}
    }
    // Persist signatures to localStorage whenever they change
    effect(() => {
      try {
        localStorage.setItem('dsv.signatures', JSON.stringify(this.signatures()));
      } catch {}
    });
  }

  setSignatureFor(value: string) {
    this.signatureFor.set(value);
  }
  setPurpose(value: string) {
    this.purpose.set(value);
  }
  setPenColor(hex: string) {
    this.penColor.set(hex);
  }
  setLineWidth(w: number) {
    this.lineWidth.set(w);
  }

  addSignature(imageDataUrl: string) {
    // Create a new signature entry and prepend to the list
    const id = this.signatures().length + 1;
    const date = new Date().toISOString();
    const entry: StoredSignature = {
      id,
      image: imageDataUrl,
      user: this.currentUser(),
      signedFor: this.signatureFor(),
      purpose: this.purpose(),
      date,
    };
    this.signatures.update((arr) => [entry, ...arr]);
  }

  exportAsJson(): Blob {
    // Export into signatures.json schema: array of records with image type and data
    const records = this.signatures().map((s) => {
      const img = s.image ?? '';
      let type = 'unknown';
      if (img.startsWith('data:')) {
        const semi = img.indexOf(';');
        type = semi > 5 ? img.substring(5, semi) : 'unknown';
      } else if (img.trim().toLowerCase().startsWith('<svg')) {
        type = 'svg';
      }
      return {
        // Align to assets/signatures.json fields
        userName: s.user,
        signedFor: s.signedFor,
        purpose: s.purpose,
        date: s.date,
        image: {
          type,
          data: img,
        },
      };
    });
    const json = JSON.stringify(records, null, 2);
    return new Blob([json], { type: 'application/json' });
  }
}
