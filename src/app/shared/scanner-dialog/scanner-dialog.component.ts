import { AfterViewInit, Component, ElementRef, HostListener, Inject, OnInit, ViewChild } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BehaviorSubject, tap } from 'rxjs';

import { OrderLinesDialogComponent } from '../../runs/shared/order-lines-dialog/order-lines-dialog.component';

interface Data {
  camera: boolean;
}

@Component({
  selector: 'gcp-scanner-dialog',
  templateUrl: 'scanner-dialog.component.html',
  styleUrls: ['./scanner-dialog.component.css'],
  standalone: true,
  imports: [AsyncPipe, FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatListModule, MatMenuModule, ZXingScannerModule]
})
export class ScannerDialogComponent implements AfterViewInit, OnInit {
  @ViewChild('search') searchElement!: ElementRef;
  private orderRe = /^(N|Q|V|SA|W|MPA|WEB|MSF)O?[0-9]{6,9}[A-Z]?$/ig;
  public availableDevices!: MediaDeviceInfo[];
  public currentDevice: MediaDeviceInfo | undefined;
  public cameraPicker = new FormControl<string | null>(null);
  public hasDevices!: boolean;
  public hasPermission!: boolean;
  public torchEnabled = false;
  public torchAvailable$ = new BehaviorSubject<boolean>(false);
  public tryHarder = false;
  public enabled = true;
  public scannedText = '';
  public isScanner: Promise<boolean> = navigator['userAgentData'].getHighEntropyValues(['model']).then((ua: {model: string}) => ua['model'] === 'CK65');

  public formatsEnabled: BarcodeFormat[] = [
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_128,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.EAN_13,
    BarcodeFormat.QR_CODE,
  ];

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ScannerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Data
  ) { }

  @HostListener('document:visibilitychange', ['$event'])
  visibilitychange() {
    this.enabled = !document.hidden;
  }

  ngOnInit(): void {
    this.cameraPicker.valueChanges.pipe(
      tap(_ => this.setCamera(_))
    ).subscribe();
  }

  fieldUpdated(newValue: string): void {
    if (newValue === this.scannedText) return;
    const b = newValue || '';
    const a = this.scannedText || '';
    this.scannedText = newValue;
    const l = (a.length + b.length) / 2;
    const diff = l - [...a].reduce((acc, cur, i) => acc += (b ? b[i] : '') === cur ? 1 : 0, 0);
    if (b.length > 0 && diff > 1 && this.orderRe.test(b)) this.processCode(b);
  }

  ngAfterViewInit(): void {
    this.isScanner.then(_ => {
      if (_) this.searchElement.nativeElement.focus();
    });
  }

  setCamera(deviceId: string | null): void {
    if (!deviceId) return;
    const device = this.availableDevices.find(x => x.deviceId === deviceId);
    this.currentDevice = device;
  }

  clearResult(): void {
    this.scannedText = '';
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);
    setTimeout(()=> this.cameraPicker.setValue(this.availableDevices[0].deviceId), 500);
  }

  onCodeResult(resultString: string): void {
    this.scannedText = resultString;
  }

  processCode(code: string | null): void {
    if (!code) return;
    this.openReceipt(code);
  }

  onHasPermission(has: boolean): void {
    this.hasPermission = has;
    if (!has) this.searchElement.nativeElement.focus();
  }

  onTorchCompatible(isCompatible: boolean): void {
    this.torchAvailable$.next(isCompatible || false);
  }

  toggleTorch(): void {
    this.torchEnabled = !this.torchEnabled;
  }

  toggleTryHarder(): void {
    this.tryHarder = !this.tryHarder;
  }

  openReceipt(orderNumber: string): void {
    const data = {
      sopType: 2,
      sopNumber: orderNumber
    };
    this.dialog.open(OrderLinesDialogComponent, {width: '800px', data, autoFocus: false});
  }

  onScanError(event: Error): void {
    console.log(event);
  }

}
