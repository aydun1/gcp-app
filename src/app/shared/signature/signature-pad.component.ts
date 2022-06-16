import { ViewportRuler } from '@angular/cdk/scrolling';
import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { Subscription } from 'rxjs';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'gcp-signature-pad',
  templateUrl: './signature-pad.component.html',
  styleUrls: ['./signature-pad.component.css']
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild('sPad', {static: true}) signaturePadElement!: ElementRef<HTMLCanvasElement>;
  private signaturePad!: SignaturePad;
  private viewportChange!: Subscription;


  constructor(
    private viewportRuler: ViewportRuler,
  ) { }

  ngOnInit(): void {
    this.viewportChange = this.viewportRuler.change(200).subscribe(
      () => this.initCanvas()
    );
  }

  ngAfterViewInit(): void {
    this.initCanvas();
  }

  ngOnDestroy(): void {
    this.viewportChange.unsubscribe();
  }

  initCanvas(): void {
    const ratio = Math.max(devicePixelRatio || 1, 1);
    this.signaturePadElement.nativeElement.width = this.signaturePadElement.nativeElement.offsetWidth * ratio;
    this.signaturePadElement.nativeElement.height = this.signaturePadElement.nativeElement.width * 0.51;
    this.signaturePadElement.nativeElement.getContext('2d')?.scale(ratio, ratio);
    this.signaturePad = new SignaturePad(this.signaturePadElement.nativeElement, {backgroundColor: 'rgb(255, 255, 255)'});
    this.clear();
  }

  clear(): void {
    this.signaturePad.clear();
  }

  undo(): void {
    const data = this.signaturePad.toData();
    if (!data) return;
    data.pop();
    this.signaturePad.fromData(data);
  }

  download(dataURL: string, filename: string): void {
    if (navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') === -1) {
      window.open(dataURL);
    } else {
      const blob = this.dataURLToBlob(dataURL);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  dataURLToBlob(dataURL: string): Blob {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    [...raw].forEach((c, i) => uInt8Array[i] = c.charCodeAt(0));
    return new Blob([uInt8Array], { type: contentType });
  }

  savePNG(): void {
    if (this.signaturePad.isEmpty()) {
      alert('Please provide a signature first.');
    } else {
      const dataURL = this.signaturePad.toDataURL();
      this.download(dataURL, 'signature.png');
    }
  }
}
