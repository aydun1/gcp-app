
import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter, OnDestroy, Optional, Self } from '@angular/core';
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ControlContainer, ControlValueAccessor, FormGroupDirective, NgControl } from '@angular/forms';
import { Observable, Subject } from 'rxjs';

interface Value {
  id: string,
  url: string
}

@Component({
  selector: 'gcp-upload-control',
  templateUrl: './upload-control.component.html',
  styleUrls: ['./upload-control.component.css'],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
  host: {
    '[class.example-floating]': 'shouldLabelFloat',
    '[id]': 'id'
  }
})
export class UploadControlComponent implements ControlValueAccessor, OnDestroy, OnInit {
  static nextId = 0;
  public stateChanges = new Subject<void>();
  public focused = false;
  private id: string;
  private url: string;

  onChange = (_: any) => {};
  onTouched = () => {};

  @Input()
  set file(value: File) {
    this.pc = 0;
    this.preparing = true;
    this.done = false;
    this.processFile(value);
  }

  @Input() type: string;
  @Input() visibility: Array<string>;
  @Input() size: number;
  @Output() complete = new EventEmitter<any>();

  @ViewChild('myCanvas', { static: true }) myCanvas: ElementRef<HTMLCanvasElement>;

  pc = 0;
  preparing = true;
  done = false;
  uploadTask: any;

  @Input('aria-describedby') userAriaDescribedBy: string;

  @Input()
  get placeholder(): string { return this._placeholder; }
  set placeholder(plh: string) {
    this._placeholder = plh;
    this.stateChanges.next();
  }
  private _placeholder: string;

  @Input()
  get required(): boolean { return this._required; }
  set required(req: boolean) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }
  private _required = false;

  @Input()
  get disabled(): boolean { return this._disabled; }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this.stateChanges.next();
  }
  private _disabled = false;

  @Input()
  get value(): Value | null {
    return this.id && this.url ? {id: this.id, url: this.url} : null;
  }
  set value(r: Value | null) {
    this.stateChanges.next();
  }

  constructor(
    private _focusMonitor: FocusMonitor,
    private _elementRef: ElementRef<HTMLElement>,
    public parentForm: FormGroupDirective,
    @Optional() @Self() public ngControl: NgControl,
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit() {
    //if (this.file) this.processPhoto(this.file);
  }

  ngOnDestroy() {
    //this.uploadTask.cancel();
    this.stateChanges.complete();
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  processFile(file: File): Observable<Promise<any>> {
    let uploadFileSubject: Subject<Promise<any>> = new Subject<Promise<any>>();
    const name = file.name;
    const mime = file.type;
    const id = 'RANDOM ID STRING';

    const reader = new FileReader();
    reader.onload = () => {
      const uploadTask = this.uploadFile(id, reader.result, mime);
      this.preparing = false;
      this.uploadTask = uploadTask;
      //this.uploadTask.percentageChanges().subscribe(_ => this.pc = _);
      this.uploadTask.then(_ => this.uploadComplete(id, name, _));
    }


    reader.readAsDataURL(file);
    return uploadFileSubject;
  }

  uploadComplete(id: string, name: string, uploadTask: any) {
    this.done = true;
    //this.mediaService.insertEntry(id, name, url, this.type, this.visibility).then(() => {
    //    this.id = id;
    //    this.url = url;
    //    const res = {id, url}
    //    this.complete.emit(true);
    //    this.stateChanges.next();
    //    this.onChange(res);
    //});
  }

  uploadFile(id: string, name: string | ArrayBuffer, uploadTask: any) {

  }

  writeValue(res: Value | null): void {
    this.value = res;

  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

}
