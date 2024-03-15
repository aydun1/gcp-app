import { Component, HostBinding, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { catchError, Observable, of, retry, switchMap } from 'rxjs';

import { InventoryService } from '../shared/inventory.service';
import { NavigationService } from '../../navigation.service';
import { InTransitTransfer } from '../shared/inventory-transfer';
import { LetterheadComponent } from '../../shared/letterhead/letterhead.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LoadingPageComponent } from '../../shared/loading/loading-page/loading-page.component';

@Component({
  selector: 'gcp-interstate-transfer-view',
  templateUrl: './interstate-transfer-view.component.html',
  styleUrls: ['./interstate-transfer-view.component.css'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, DecimalPipe, MatDividerModule, MatButtonModule, MatIconModule, MatToolbarModule, FooterComponent, LetterheadComponent, LoadingPageComponent]
})
export class InterstateTransferViewComponent implements OnDestroy, OnInit {
  @HostBinding('class') class = 'app-component mat-app-background';
  public interstateTransfer$!: Observable<InTransitTransfer>;
  public loading = false;
  public error!: string;

  constructor(
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private navService: NavigationService,
    private inventoryService: InventoryService
  ) { }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'print');
    this.interstateTransfer$ = this.route.paramMap.pipe(
      switchMap(params => this.getInterstateTransfer(params.get('ittId')))
    )
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'print');
  }

  getInterstateTransfer(id: string | null): Observable<InTransitTransfer> {
    if (!id) return of();
    return this.inventoryService.getInTransitTransfer(id).pipe(
      retry({count: 10, delay: 2000}),
      catchError(_ => {
        console.log(_);
        this.error = `Unable to load ${id} from GP right now. It is likely still importing. Please check again later.`;
        return of();
      })
    );
  }

  goBack(): void {
    this.navService.back();
  }

  print(): void {
    window.print();
  }

}
