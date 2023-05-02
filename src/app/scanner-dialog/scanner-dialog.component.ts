import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { BarcodeFormat } from '@zxing/library';
import { BehaviorSubject, tap } from 'rxjs';
import { OrderLinesDialogComponent } from '../runs/shared/order-lines-dialog/order-lines-dialog.component';

@Component({
  selector: 'gcp-scanner-dialog',
  templateUrl: 'scanner-dialog.component.html',
  styleUrls: ['./scanner-dialog.component.css']
})
export class ScannerDialogComponent implements OnInit {
  public availableDevices!: MediaDeviceInfo[];
  public currentDevice: MediaDeviceInfo | undefined;
  public cameraFilter = new FormControl<string | null>(null);
  public hasDevices!: boolean;
  public hasPermission!: boolean;
  public qrResultString!: string | null;
  public torchEnabled = false;
  public torchAvailable$ = new BehaviorSubject<boolean>(false);
  public tryHarder = false;
  private opened = false;

  public formatsEnabled: BarcodeFormat[] = [
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_128,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.EAN_13,
    BarcodeFormat.QR_CODE,
  ];

  constructor(
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.cameraFilter.valueChanges.pipe(
      tap(_ => {
        const device = this.availableDevices.find(x => x.deviceId === _);
        this.currentDevice = device;
      })
    ).subscribe()
  }

  clearResult(): void {
    this.qrResultString = null;
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);
    setTimeout(()=>{
      this.cameraFilter.setValue(this.availableDevices[0].deviceId);
      
    }, 500)
  }

  onCodeResult(resultString: string): void {
    const orderRe = /^QO[0-9]{7}|WEB[0-9]{9}$/ig;

    if (!this.opened && orderRe.test(resultString)) {
      this.openReceipt(resultString,'','')
    }

    this.qrResultString = resultString;
  }

  onHasPermission(has: boolean): void {
    this.hasPermission = has;
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



  openReceipt(orderNumber: string, custNumber: string, custName: string) {
    this.opened = true;
    const data = {
      title: 'Delivery details',
      sopType: 2,
      sopNumber: orderNumber,
      custNumber: custNumber,
      custName: custName
    };
    const recDialog = this.dialog.open(OrderLinesDialogComponent, {width: '800px', data});
    recDialog.afterClosed().subscribe(_ => this.opened = false);

  }


}
