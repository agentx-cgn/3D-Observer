/* eslint-disable @typescript-eslint/no-shadow */
import { Component, OnInit, AfterContentInit } from '@angular/core';
import { TabComponent } from './../tab/tab.component';
import { ContentChildren, QueryList } from '@angular/core';


@Component({
  selector: 'app-tabs',
  template: `
    <ul class="nav nav-tabs">
      <li *ngFor=" let tab of tabs" (click)="selectTab(tab)" [class.active]="tab.active">
        <span>{{ tab.title }}</span>
      </li>
    </ul>
    <ng-content></ng-content>
  `,
  styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements OnInit, AfterContentInit {

  @ContentChildren(TabComponent) tabs: QueryList<TabComponent>;

  constructor() { }

  ngOnInit(): void {
  }

  public ngAfterContentInit() {

    // get all active tabs
    const activeTabs = this.tabs.filter( (tab) => tab.active );

    // if there is no active tab set, activate the first
    // if(activeTabs.length === 0) {
    //   this.selectTab(this.tabs.first);
    // }

  }

  public selectTab (tab: TabComponent) {

    console.log('Tabs.selectTab', tab)

    if (tab.active) {
      tab.active = false;

    } else {
    // deactivate all tabs
    this.tabs.toArray().forEach(tab => tab.active = false);

    // activate the tab the user has clicked on.
    tab.active = true;


    }


  }

}
