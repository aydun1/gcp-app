import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BarcodeFormat } from '@zxing/library';
import { BehaviorSubject, distinctUntilChanged, startWith, tap } from 'rxjs';

import { OrderLinesDialogComponent } from '../runs/shared/order-lines-dialog/order-lines-dialog.component';
import { SharedService } from '../shared.service';

@Component({
  selector: 'gcp-scanner-dialog',
  templateUrl: 'scanner-dialog.component.html',
  styleUrls: ['./scanner-dialog.component.css']
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
  public scannedText = new FormControl('');
  public isScanner = /CK65/.test(navigator.userAgent);

  public formatsEnabled: BarcodeFormat[] = [
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_128,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.EAN_13,
    BarcodeFormat.QR_CODE,
  ];

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private shared: SharedService,
    private dialogRef: MatDialogRef<ScannerDialogComponent>
  ) { }

  @HostListener('document:visibilitychange', ['$event'])
  visibilitychange() {
    this.enabled = !document.hidden;
  }
  
  ngOnInit(): void {
    this.cameraPicker.valueChanges.pipe(
      tap(_ => this.setCamera(_))
    ).subscribe();

    this.scannedText.valueChanges.pipe(
      startWith(''),
      distinctUntilChanged((a, b) => {
        a = a || '';
        b = b || '';
        const l = (a.length + b.length) / 2;
        const diff = l - [...a].reduce((acc, cur, i) => acc += (b ? b[i] : '') === cur ? 1 : 0, 0);
        if (b.length > 0 && diff > 1) this.processCode(b);
        return false;
      })
    ).subscribe()
  }

  ngAfterViewInit(): void {
    if (this.isScanner) this.searchElement.nativeElement.focus();
  }

  setCamera(deviceId: string | null): void {
    if (!deviceId) return;
    const device = this.availableDevices.find(x => x.deviceId === deviceId);
    this.currentDevice = device;
  }

  clearResult(): void {
    this.scannedText.patchValue('');
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);
    setTimeout(()=> this.cameraPicker.setValue(this.availableDevices[0].deviceId), 500);
  }

  onCodeResult(resultString: string): void {
    this.scannedText.patchValue(resultString);
  }

  processCode(code: string | null): void {
    if (!code) return;
    if (this.orderRe.test(code)) {
      this.openReceipt(code);
    } else {
      this.snackBar.open('Did not recognise code', '', {duration: 3000});
    }
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
    this.dialogRef.close();
    const data = {
      sopType: 2,
      sopNumber: orderNumber
    };
    this.dialog.open(OrderLinesDialogComponent, {width: '800px', data});
  }

  onScanError(event: any): void {
    console.log(event);
  }

}
