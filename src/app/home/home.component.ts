/* eslint-disable space-before-function-paren */
import ForceGraph3D from '3d-force-graph';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';


// https://github.com/vasturiano/3d-force-graph#api-reference


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {

  @ViewChild('container') container: ElementRef;

  public zInterface = 0;

  private graph = ForceGraph3D();

  constructor(private router: Router) { }

  onResize(event) {
    const width  = event.target.innerWidth;
    const height = event.target.innerHeight;
    this.graph
      .width(width)
      .height(height)
    ;
  }

  ngAfterViewInit(): void {

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

    this.graph(this.container.nativeElement)
      .graphData(gData)
      .enableNodeDrag(true)
      .onBackgroundClick(this.onBackgroundClick.bind(this))
      .onNodeClick(this.onNodeClick.bind(this))
    ;


  }

  onClickInterface () {
    this.zInterface = 0;
  }

  onBackgroundClick (e: Event) {
    // console.log(this, e);
    this.graph
      .zoomToFit()
      .d3ReheatSimulation()
    ;
    this.zInterface = 20;
  }

  onNodeClick (e: Event) {
    console.log('onNodeClick', e);
    // this.graph
    //   .zoomToFit()
    //   .d3ReheatSimulation()
    // ;
  }

}
