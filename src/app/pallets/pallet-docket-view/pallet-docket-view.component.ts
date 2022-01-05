import { Component, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import jsPDF from 'jspdf';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { map, switchMap, tap } from 'rxjs';
import { Pallet } from '../shared/pallet';
import { PalletsService } from '../shared/pallets.service';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

@Component({
  selector: 'gcp-pallet-docket-view',
  host: {class:'app-component'},
  templateUrl: './pallet-docket-view.component.html',
  styleUrls: ['./pallet-docket-view.component.css']
})
export class PalletDocketViewComponent implements OnInit {

  public transfer: Pallet;
  public quantities: {Loscam: number, Chep: number, Plain: number}

  constructor(
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private palletService: PalletsService
  ) {
    (<any>pdfMake).addVirtualFileSystem(pdfFonts);
  }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'print');

    this.route.paramMap.pipe(
      map(params => params.get('id')),
      switchMap(id => this.palletService.getPalletTransfer(id)),
      tap(_ => this.transfer = _),
      switchMap(transfer => this.palletService.getPalletsOwedByCustomer(transfer.fields.CustomerNumber, transfer.fields.Site)),
      tap(_ => this.quantities = _)
    ).subscribe(() => this.makePdf())
  }

  makePdf() {
    const column1 = [
      {text: 'Garden City Plastics', style: 'header'},
      {text: 'Pallet Management System'},

      [
        'Garden City Plastics',
        'Pallet Management System',
        this.transfer.fields.Title,
        'Two'
      ]
    ]
    const column2 = column1;
    const template: TDocumentDefinitions = {
      pageOrientation: 'landscape',
      content: [
        {
          alignment: 'justify',
          columns: [
            column1,
            column2
          ]
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true
        },
        bigger: {
          fontSize: 15,
          italics: true
        }
      },
      defaultStyle: {
        columnGap: 80
      }
    }
    pdfMake.createPdf(template).open();
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'print');
  }
}
