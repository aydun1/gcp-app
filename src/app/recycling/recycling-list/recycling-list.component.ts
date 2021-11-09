import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';
import { Cage } from '../shared/cage';
import { Column } from '../shared/columns';
import { RecyclingService } from '../shared/recycling.service';

@Component({
  selector: 'app-recycling-list',
  templateUrl: './recycling-list.component.html',
  styleUrls: ['./recycling-list.component.css']
})
export class RecyclingListComponent implements OnInit {
  public cages$: Observable<Cage[]>;
  public nameFilter = new FormControl('');
  public statusFilter = new FormControl('');
  public customers$: Observable<any[]>;
  private _loadList: boolean;

  public choices: any;
  public Status: Column;

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
    private recyclingService: RecyclingService
  ) { }

  @HostListener('scroll', ['$event'])
  onScroll(e: any) {
    const bottomPosition = this.el.nativeElement.offsetHeight + this.el.nativeElement.scrollTop - this.el.nativeElement.scrollHeight;
    if (bottomPosition >= -250) this.getNextPage();
  }

  ngOnInit(): void {
    this.getOptions();
    this.cages$ = this.route.queryParams.pipe(
      startWith({}),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, null, null)),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      ).pipe(map(s => _))),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      tap(_ => this.parseParams(_)),
      switchMap(_ => this._loadList ? this.getFirstPage(_) : [])
    )
  }

  getOptions(): void {
    this.recyclingService.getColumns().pipe(
      map((_: any) => _.value),
      map(_ => _.reduce((a, v) => ({ ...a, [v.name]: v}), {})),
      tap(_ => this.choices = _)
    ).subscribe(_ => console.log(_));
  }

  getFirstPage(_: any) {
    return this.recyclingService.getFirstPage(_);
  }

  getNextPage() {
    return this.recyclingService.getNextPage();
  }

  parseParams(params: Params) {
    if (!params) return;
    const filters: any = {};
    if ('status' in params) {
      this.statusFilter.patchValue(params['status']);
      filters['status'] = params['status'];
    } else {
      this.statusFilter.patchValue('');
    }

    if ('name' in params) {
      this.nameFilter.patchValue(params['name']);
      filters['name'] = params['name'];
    } else {
      if (this.nameFilter.value) this.nameFilter.patchValue('');
    }
  }

  compareQueryStrings(prev: Params, curr: Params) {
    if (!this._loadList && this.route.children.length === 0) {
      this._loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameName = prev['name'] === curr['name'];
    const sameStatus = prev['status'] === curr['status'];
    return sameName && sameStatus && this._loadList;
  }

  setStatus(status: MatSelectChange ) {
    this.router.navigate(['recycling'], { queryParams: {status: status.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  clearNameFilter() {

  }
}
