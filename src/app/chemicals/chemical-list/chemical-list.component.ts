import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { distinctUntilChanged, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

import { SharedService } from '../../shared.service';
import { Chemical } from '../shared/chemical';
import { ChemicalManifestDialogComponent } from '../shared/chemical-manifest-dialog/chemical-manifest-dialog.component';
import { ChemicalOthersDialogComponent } from '../shared/chemical-others-dialog/chemical-others-dialog.component';
import { ChemicalService } from '../shared/chemical.service';
import { LetterheadComponent } from '../../shared/letterhead/letterhead.component';
import { LoadingRowComponent } from '../../shared/loading/loading-row/loading-row.component';
import { GroupByPropertyPipe } from '../../shared/pipes/group-by-property';
import { SumPipe } from '../../shared/pipes/sum.pipe';

@Component({
  selector: 'gcp-chemical-list',
  templateUrl: './chemical-list.component.html',
  styleUrls: ['./chemical-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AsyncPipe, DatePipe, DecimalPipe, ReactiveFormsModule, RouterModule, MatButtonModule, MatCardModule, MatIconModule, MatInputModule, MatMenuModule, MatSelectModule, MatSortModule, MatTableModule, MatTooltipModule, GroupByPropertyPipe, SumPipe, LetterheadComponent, LoadingRowComponent]
})
export class ChemicalListComponent implements OnInit {
  private loadList!: boolean;
  private chemicals!: Chemical[];
  private defaultColumns = ['sds', 'bin', 'product', 'issueDate', 'onHand', 'quantity', 'packingGroup', 'class', 'hazardRating'];
  private ownState!: string;

  public textFilter = new FormControl(this.route.snapshot.paramMap.get('search'));
  public groupFilter = new FormControl(this.route.snapshot.paramMap.get('groupby'));
  public categoryFilter = new FormControl(this.route.snapshot.paramMap.get('category'));
  public loading = this.chemicalService.loading;
  public displayedColumns = [...this.defaultColumns];
  public chemicals$!: Observable<Chemical[]>;
  public branchFilter = new FormControl({value: '', disabled: false});
  public states = this.shared.branches;
  public date = new Date();
  public sortSort = this.route.snapshot.queryParamMap.get('sort') || '';
  public sortOrder = this.route.snapshot.queryParamMap.get('order') as SortDirection;
  public groupName!: string;

  get address() {
    return this.shared.getBranchAddress(this.branchFilter.value || '');
  }

  public classes = this.chemicalService.classes;
  public groups = [
    {key: '', value: 'Ungrouped'},
    {key: 'class', value: 'Class'},
    {key: 'packingGroup', value: 'Packing group'},
    {key: 'hazardRating', value: 'Hazard'},
  ];

  public categories = [
    {key: '', value: 'All'},
    {key: 'inventory', value: 'Inventory'},
    {key: 'nonInventory', value: 'Non-inventory'},
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private shared: SharedService,
    private chemicalService: ChemicalService
  ) { }

  ngOnInit(): void {
    const branch$ = this.shared.getBranch();
    this.chemicals$ = this.route.queryParams.pipe(
      startWith({} as Params),
      switchMap(_ => this.router.events.pipe(
        startWith(new NavigationEnd(1, '', '')),
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => _)
      )),
      distinctUntilChanged((prev, curr) => this.compareQueryStrings(prev, curr)),
      switchMap(_ => branch$.pipe(
        tap(branch => this.ownState = branch),
        map(branch => _['branch'] === undefined ? {..._, branch} : _)
      )),
      tap(_ => this.parseParams(_)),
      switchMap(_ => this.loadList ? this.getChemicals(_['search'], _['branch'], _['category'], _['sort'], _['order']) : []),
      tap(_ => this.chemicals = _)
    );

    this.textFilter.valueChanges.pipe(
      map(_ => _ && _.length > 0 ? _ : null),
      tap(_ => this.router.navigate([], { queryParams: {'search': _}, queryParamsHandling: 'merge', replaceUrl: true}))
    ).subscribe();
  }

  parseParams(params: Params): void {
    if (!params) return;
    if ('branch' in params) {
      this.branchFilter.patchValue(params['branch']);
    } else {
      this.branchFilter.patchValue('');
    }
    if ('search' in params) {
      this.textFilter.patchValue(params['search']);
    } else {
      if (this.textFilter.value) this.textFilter.patchValue('');
    }
    if ('sort' in params) {
      this.sortSort = params['sort'];
      this.sortOrder = params['order'];
    } else {
      this.sortSort = '';
      this.sortOrder = '';
    }
    if ('category' in params) {
      this.categoryFilter.patchValue(params['category']);
    } else {
      this.categoryFilter .patchValue('');
    }
    if ('groupby' in params) {
      this.groupFilter.patchValue(params['groupby']);
    } else {
      this.groupFilter.patchValue('');
    }
    this.doGroupLabels(params['groupby']);
  }

  compareQueryStrings(prev: Params, curr: Params): boolean {
    if (!this.loadList && this.route.children.length === 0) {
      this.loadList = true;
      return false;
    }
    if (!prev || !curr) return true;
    if (this.route.firstChild != null) return true;
    const sameBranch = prev['branch'] === curr['branch'];
    const sameCategory = prev['category'] === curr['category'];
    const sameSearch = prev['search'] === curr['search'];
    const sameSort = prev['sort'] === curr['sort'];
    const sameOrder = prev['order'] === curr['order'];
    return this.loadList && sameBranch && sameCategory && sameSearch && sameSort && sameOrder;
  }

  setBranch(branch: MatSelectChange): void {
    this.router.navigate([], { queryParams: {branch: branch.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setCategory(category: MatSelectChange): void {
    this.router.navigate([], { queryParams: {category: category.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  setGroup(view: MatSelectChange): void {
    this.doGroupLabels(view.value);
    this.router.navigate([], { queryParams: {groupby: view.value}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  doGroupLabels(name: string): void {
    this.groupName = this.groups.find(_ => _.key === name)?.value || '';
    this.displayedColumns = this.defaultColumns.filter( _ => _ !==  name);
  }

  getChemicals(search: string, branch: string, category: string, sort: string, order: string): Observable<Chemical[]> {
    search = (search || '').toLowerCase();
    return this.chemicalService.getOnHandChemicals(branch, category, sort, order).pipe(
      map(_ => _.filter(c => c.ItemNmbr?.toLowerCase()?.includes(search) || c.ItemDesc?.toLowerCase()?.includes(search)))
    )
  }

  clearTextFilter(): void {
    this.textFilter.patchValue('');
  }

  exportChemicals(): void {
    if (!this.chemicals || this.chemicals.length === 0) this.snackBar.open('Nothing to export', '', {duration: 3000})
    const now = new Date();
    const branch = this.branchFilter.value;
    const fileName = `GCP_${branch ? branch + '_' : ''}chemicals_${now.toLocaleString( 'sv', { timeZoneName: 'short' } ).split(' ', 2).join('_')}.csv`
    this.chemicalService.exportToCsv(fileName, this.chemicals);
  }

  announceSortChange(e: Sort): void {
    const sort = e.direction ? e.active : null;
    const order = e.direction || null;
    this.router.navigate([], { queryParams: {sort, order}, queryParamsHandling: 'merge', replaceUrl: true});
  }

  openChemicalManifest(): void {
    const data = {branch: this.branchFilter.value};
    this.dialog.open(ChemicalManifestDialogComponent, {panelClass: 'printable', width: '600px', autoFocus: false, data});
  }

  openOtherChemicals(): void {
    const data = {ownBranch: this.ownState};
    this.dialog.open(ChemicalOthersDialogComponent, {width: '600px', autoFocus: false, data});
  }

  trackByFn(index: number, item: Chemical): string {
    return item.ItemNmbr;
  }

}
