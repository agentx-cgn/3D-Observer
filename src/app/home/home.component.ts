import ForceGraph3D from '3d-force-graph';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {

  @ViewChild('container') container: ElementRef;

  constructor(private router: Router) { }

  ngAfterViewInit(): void {

    console.log('native', this.container);
    console.log('native', this.container.nativeElement);

    const N = 300;
    const gData = {
      nodes: [...Array(N).keys()].map(i => ({ id: i })),
      links: [...Array(N).keys()]
        .filter(id => id)
        .map(id => ({
          source: id,
          target: Math.round(Math.random() * (id-1))
        }))
    };

    const myGraph = ForceGraph3D();

    myGraph(this.container.nativeElement)
      .graphData(gData)
    ;


  }

}
