import { Component, Input, OnInit } from '@angular/core';
import { BusService } from '../../core/bus.service';
import { IMessage, TTopic } from '../../../../app/interfaces';

@Component({
  selector: 'app-tab',
  template: `
    <div [hidden]="!active" class="pane">
      {{ content | json }}
    </div>
  `
  ,
  styleUrls: ['./tab.component.scss']
})
export class TabComponent implements OnInit {

  @Input() title: string;
  @Input() topic: TTopic;
  @Input() active = false;

  public content: any;

  constructor(
    private readonly bus: BusService
  ) { }

  ngOnInit(): void {

    this.bus.on(this.topic, (msg: IMessage<any>) => {

      console.log('Tab.on', this.title, msg)

      this.content = msg.payload;
      // this.

    });

  }

}
