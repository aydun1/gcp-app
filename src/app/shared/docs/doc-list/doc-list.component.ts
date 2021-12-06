import { Component, Input, OnInit } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Doc } from '../../doc';
import { DocsService } from '../../docs.service';

@Component({
  selector: 'gcp-doc-list',
  templateUrl: './doc-list.component.html',
  styleUrls: ['./doc-list.component.css']
})
export class DocListComponent implements OnInit {
  @Input() id: string;
  public docs$: Observable<Doc[]>;
  
  constructor(
    private docsService: DocsService
  ) { }

  ngOnInit(): void {
    this.docs$ = this.docsService.listFiles(this.id);

  }

}
