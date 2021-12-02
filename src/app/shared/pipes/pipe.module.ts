import { NgModule } from "@angular/core";
import { GroupByPipe } from "./group-by.pipe";

@NgModule({
    declarations: [GroupByPipe],
    exports: [GroupByPipe],
  })
  export class PipeModule {}