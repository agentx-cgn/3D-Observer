import { Component, Input, OnInit } from '@angular/core';
import { BusService } from '../../core/bus.service';
import { IMSetTab } from '../../../../app/interfaces';

@Component({
  selector: 'app-tab',
  template: `
    <div [hidden]="!active" class="pane">
      <ngx-json-viewer [json]="content" [expanded]="false"></ngx-json-viewer>
    </div>
  `,
  styleUrls: ['./tab.component.scss']
})
export class TabComponent implements OnInit {

  @Input() title: string;
  @Input() topic: 'set:tab:1' | 'set:tab:2';
  @Input() active = false;

  public content: any;

  constructor(
    private readonly bus: BusService
  ) { }

  ngOnInit(): void {

    this.bus.on<IMSetTab>(this.topic, msg => {

      console.log('Tab.on', this.title, msg);

      this.content = msg.payload;
      // this.

    });

  }

}
