
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { interval } from 'rxjs';
import { map, take } from 'rxjs/operators';

import ForceGraph3D from '3d-force-graph';

import servers from '../../../assets/json/servers.json';
import { INode, ILink, TNodeType, Coords } from '../../../../app/interfaces';

import { ForceService } from './force.service';
import * as THREE  from 'three';

// https://github.com/vasturiano/3d-force-graph#api-reference
// https://docs.joinmastodon.org/methods/instance/
// Three Objs: https://github.com/trails-game/relation-graph-3d-force/blob/master/src/index.js
// https://threejs.org/docs/#api/en/core/Object3D.scale


@Component({
  selector: 'app-home',
  templateUrl: './force.page.html',
  styleUrls: ['./force.page.scss']
})
export class ForcePage implements AfterViewInit {

  @ViewChild('container') container: ElementRef;

  public zInterface = 0;

  private cfg: any;

  private graph = ForceGraph3D();

  private initData = {
    nodes: [],
    links: []
  };

  constructor(
    private readonly svc: ForceService
  ) {
    console.log('Force.constructor', (window as any).__THREE__);
    this.cfg = this.svc.cfg;
  }

  onResize(event) {

    const width: number  = event.target.innerWidth;
    const height: number = event.target.innerHeight;

    this.graph
      .width(width)
      .height(height)
    ;

  }

  ngAfterViewInit(): void {

    this.svc.graph = this.graph(this.container.nativeElement)

      .graphData(this.initData)
      .onBackgroundClick(this.onBackgroundClick.bind(this))
      .backgroundColor(this.cfg.background_color)

      .enableNodeDrag(true)
      .onNodeClick(this.onNodeClick.bind(this))
      .nodeColor(this.svc.randomColor)
      .nodeResolution(this.cfg.nodeResolution)
      .nodeOpacity(this.cfg.nodeOpacity)
      .nodeLabel('id')
      .nodeVal('value')
      .onNodeHover((node: INode) => this.svc.hoverNode = node)
      .nodeThreeObject((node: INode) => (
        this.svc.sphereGeometry(node)
        // node.type === 'server' ? this.sphereGeometry(node) :
        // node.type === 'peers'  ? this.spriteText(node) :
        // node.type === 'rules'  ? this.spriteImage(node) :
        // false
      ))

      .linkWidth('width')
      .linkVisibility( (link: ILink) => !!link.width )
      .linkDirectionalParticles('value')
      .linkDirectionalParticleSpeed( (d: ILink) => d.value * 0.001)

      .onEngineStop(this.svc.onEngineStop.bind(this.svc))
      .onEngineTick(this.svc.onEngineTick.bind(this.svc))
    ;

    this.graph.d3Force('charge').strength(this.cfg.chargeStrength); // the smaller, the more stick balls together
    this.graph.d3Force('charge').distanceMin(this.cfg.chargeDistanceMin); // the smaller, the more stick balls together
    this.graph.d3AlphaDecay(this.cfg.alphaDecay);
    this.graph.d3Force('link').distance((link: ILink) => link.value);

    this.initGraph();
    this.svc.init();

  }

  initGraph () {

    // add some nodes
    const testServers = servers.slice(0, 30);

    interval(100)
      .pipe(
        take(testServers.length),
        map(i => testServers.sort()[i])
      )
      .subscribe(id => {

        const domain = id.split('.').slice(-1)[0];
        const size   = this.cfg.server.size;
        const node   = { id, size, domain, type: 'server' as TNodeType, value: this.cfg.server.value};

        this.svc.insertServerNode(node);

      })
    ;

  }

  // zoomToNode (node: INode) {

  //   // Aim at node from outside it
  //   const distance = 100;
  //   const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

  //   const newPos = node.x || node.y || node.z
  //     ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
  //     : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

  //   this.graph.cameraPosition(
  //     newPos,                 // new position
  //     node as Coords,         // lookAt ({ x, y, z })
  //     this.cfg.zoom.duration  // ms transition duration
  //   );

  // }

  onClickInterface () {
    this.zInterface = 0;
  }

  onBackgroundClick (e: Event) {
    this.graph
      .zoomToFit()
      .d3ReheatSimulation()
    ;
    this.zInterface = 20;
  }

  onNodeClick (node: INode, e: Event) {

    this.svc.selectNode = node;
    node.type === 'server' && this.pokeNode(node);
    this.svc.zoomToNode(node);

  }

  pokeNode (parent: INode) {

    console.log('pokeNode', parent);

    const links = [];

    const nodes: INode[] = ['info', 'peers', 'activity', 'rules'].map( item => {

      const id    = parent.id + '/' + item;
      const node  = {
        id,
        domain: parent.domain,
        size:   this.cfg.satellite.size,
        value:  this.cfg.satellite.value,
        type:   item as TNodeType,
        ...{ x: parent.x, y: parent.y, z: parent.z },
      };

      links.push( { target: parent.id, source: id, ...this.cfg.satellite.links } );

      return node;

    });

    const props = { width: 0, value: 40 };

    links.push( { target: parent.id + '/info',     source: parent.id + '/peers',    ...props } );
    links.push( { target: parent.id + '/peers',    source: parent.id + '/activity', ...props } );
    links.push( { target: parent.id + '/activity', source: parent.id + '/rules',    ...props } );
    links.push( { target: parent.id + '/rules',    source: parent.id + '/info',     ...props } );
    links.push( { target: parent.id + '/rules',    source: parent.id + '/peers',    ...props } );
    links.push( { target: parent.id + '/activity', source: parent.id + '/info',     ...props } );

    this.svc.insertDataNodes(nodes, links);

  }

}
