/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable no-bitwise */
/* eslint-disable space-before-function-paren */
import ForceGraph3D from '3d-force-graph';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, interval } from 'rxjs';
import { switchMap, map, take } from 'rxjs/operators';
// import SpriteText from 'three-spritetext';

import servers from '../../../assets/json/servers.json';


// https://github.com/vasturiano/3d-force-graph#api-reference

interface INode {
  id: string
  domain: string
  size: number
}

interface ILink {
  target: string
  source: string
  value: number
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {

  @ViewChild('container') container: ElementRef;

  public zInterface = 0;

  private graph = ForceGraph3D();

  private hoverNode = undefined;
  private initData = {
    nodes: [
      { id: 'start.social', size: 0 }
    ],
    links: []
  };

  private source$;

  constructor(private router: Router) {

    console.log('Home.three', (window as any).__THREE__);

  }

  onResize(event) {
    const width  = event.target.innerWidth;
    const height = event.target.innerHeight;
    this.graph
      .width(width)
      .height(height)
    ;
  }

  insertNode (node) {

    const { nodes, links } = this.graph.graphData();

    const value = ~~(Math.random() * 10) +2;
    const candidates = nodes.filter( (n: INode) => n.domain === node.domain);
    const link = candidates.length
      ? { target: candidates[~~(Math.random() * candidates.length)].id, source: node.id, value }
      : undefined
    ;

    // console.log('insert', node, link);

    this.graph.graphData({
      nodes: [ ...nodes, node ],
      links: link ? [ ...links, link ] : [ ...links ]
    });

  }

  removeNode(node) {

    const { nodes, links } = this.graph.graphData();

    const newlinks = links.filter(l => l.source !== node && l.target !== node); // Remove links attached to node
    nodes.splice(node.id, 1); // Remove node
    nodes.forEach((n, idx) => { n.id = idx; }); // Reset node ids to array index

    this.graph.graphData({ nodes, links: newlinks });

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
      // .graphData(gData)
      .graphData(this.initData)
      .onBackgroundClick(this.onBackgroundClick.bind(this))
      .enableNodeDrag(true)
      .onNodeClick(this.onNodeClick.bind(this))
      .nodeAutoColorBy('domain')
      .nodeLabel('id')
      .nodeVal('size')
      .onNodeHover(node => this.hoverNode = node)
      .linkWidth('value')
      .linkDirectionalParticles('value')
      .linkDirectionalParticleSpeed( (d: ILink) => d.value * 0.001)

      // .nodeThreeObject(node => {
        //   const sprite = new SpriteText(node.id);
        //   // sprite.material.depthWrite = false; // make sprite background transparent
      //   sprite.color = node.color;
      //   sprite.textHeight = 8;
      //   return sprite;
      // });
    ;

    this.graph.d3Force('charge').strength(-0.1); // the smaller, the more stick balls together
    this.graph.d3AlphaDecay(0.0000001);  // def: 0.0228

    interval(500)
      .pipe(
        take(servers.length),
        map(i => servers.sort()[i])
      )
      .subscribe(id => {

        const domain = id.split('.').slice(-1)[0];
        const size   = ~~(Math.random()*10);
        const node = { id, size, domain };

        // console.log('subscribe', node);

        this.insertNode(node);

      })
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
