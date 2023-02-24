/* eslint-disable @angular-eslint/component-class-suffix */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-debugger */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable no-bitwise */
/* eslint-disable space-before-function-paren */

import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { interval } from 'rxjs';
import { map, take } from 'rxjs/operators';

import ForceGraph3D from '3d-force-graph';

import servers from '../../../assets/json/servers.json';
import { INode, ILink, TNodeType, Coords } from '../../../../app/interfaces';

import { ForceService } from './force.service';

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

  private cfg = {
    background_color: 'black',
    nodeResolution: 32,
    nodeOpacity: 0.9
  };

  private graph = ForceGraph3D();

  private hoverNode: INode | undefined;
  private selectNode: INode | undefined;

  private initData = {
    nodes: [
      { id: 'start.social', size: 0 }
    ],
    links: []
  };

  // private source$;

  constructor(
    private readonly svc: ForceService
  ) {
    console.log('Force.constructor', (window as any).__THREE__);
  }

  onResize(event) {

    const width  = event.target.innerWidth;
    const height = event.target.innerHeight;

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
      .nodeResolution(this.cfg.nodeResolution)  // 8
      .nodeOpacity(this.cfg.nodeOpacity) // .75
      .nodeLabel('id')
      .nodeVal('value')
      .onNodeHover((node: INode) => this.hoverNode = node)
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

      .onEngineStop( () => {
        // this.graph.numDimensions(3); // Re-heat simulation)
        this.graph.d3ReheatSimulation();
        console.log('Home.engine', 'restarted');
      })
      .onEngineTick( () => {
        if (this.selectNode) {
          const scale = 0.3 * Math.sin(Date.now() / 300) + 1 ;
          this.selectNode.__threeObj.scale.set(scale, scale, scale);
        }
      })
    ;

    this.graph.d3Force('charge').strength(-2); // the smaller, the more stick balls together
    this.graph.d3Force('charge').distanceMin(10); // the smaller, the more stick balls together
    this.graph.d3AlphaDecay(0.0228);  // def: 0.0228
    this.graph.d3Force('link').distance((link: ILink) => link.value);

    // add some nodes
    const testServers = servers.slice(0, 10);
    interval(100)
      .pipe(
        take(testServers.length),
        map(i => testServers.sort()[i])
      )
      .subscribe(id => {

        const domain = id.split('.').slice(-1)[0];
        const size   = 10; //~~(Math.random()*10) +2;
        const node   = { id, size, domain, type: 'server' as TNodeType, value: 10 };

        // console.log('subscribe', node);

        this.svc.insertServerNode(node);

      })
    ;


  }

  zoomToNode (node: INode) {

    // Aim at node from outside it
    const distance = 100;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

    const newPos = node.x || node.y || node.z
      ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
      : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

    this.graph.cameraPosition(
      newPos, // new position
      node as Coords, // lookAt ({ x, y, z })
      3000  // ms transition duration
    );

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

  onNodeClick (node: INode, e: Event) {

    this.selectNode = node;
    node.type === 'server' && this.pokeNode(node);
    this.zoomToNode(node);

  }

  pokeNode (parent: INode) {

    console.log('pokeNode', parent);

    const links = [];

    const nodes: INode[] = ['info', 'peers', 'activity', 'rules'].map( item => {

      // const xyz = (
      //   item === 'info'     ? { x: parent.x +1, y: parent.y +0, z: parent.z +1 } :
      //   item === 'peers'    ? { x: parent.x -1, y: parent.y +0, z: parent.z +1 } :
      //   item === 'activity' ? { x: parent.x +1, y: parent.y +0, z: parent.z -1 } :
      //   item === 'rules'    ? { x: parent.x -1, y: parent.y +0, z: parent.z -1 } :
      //                         { x: parent.x +3, y: parent.y +3, z: parent.z +3 }
      // );

      const id    = parent.id + '/' + item;
      const node  = { id, domain: parent.domain, size: 3, type: item as TNodeType, ...{ x: parent.x, y: parent.y, z: parent.z }, value: 5 };
      links.push( { target: parent.id, source: id, value: 10 } );
      return node;

    });

    links.push( { target: parent.id + '/info',     source: parent.id + '/peers',    width: 0, value: 40 } );
    links.push( { target: parent.id + '/peers',    source: parent.id + '/activity', width: 0, value: 40 } );
    links.push( { target: parent.id + '/activity', source: parent.id + '/rules',    width: 0, value: 40 } );
    links.push( { target: parent.id + '/rules',    source: parent.id + '/info',     width: 0, value: 40 } );
    links.push( { target: parent.id + '/rules',    source: parent.id + '/peers',    width: 0, value: 40 } );
    links.push( { target: parent.id + '/activity', source: parent.id + '/info',     width: 0, value: 40 } );

    this.svc.insertDataNodes(nodes, links);

  }


}
