/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-debugger */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable no-bitwise */
/* eslint-disable space-before-function-paren */
import ForceGraph3D from '3d-force-graph';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { switchMap, map, take } from 'rxjs/operators';
import SpriteText from 'three-spritetext';
import * as THREE  from 'three';

import servers from '../../../assets/json/servers.json';

import { helper as H } from './../../core/helper.service';

// https://github.com/vasturiano/3d-force-graph#api-reference
// https://docs.joinmastodon.org/methods/instance/
// Three Objs: https://github.com/trails-game/relation-graph-3d-force/blob/master/src/index.js
// https://threejs.org/docs/#api/en/core/Object3D.scale


type Coords = { x: number; y: number; z: number; };
type TNodeType = 'server' | 'peers' | 'activities' | 'rules' | 'info';

interface INode {
  id: string
  domain: string
  size: number
  type: TNodeType
  value: number
  x?: number
  y?: number
  z?: number
  __threeObj?: THREE.Object3D

}

interface ILink {
  target: string
  source: string
  value: number
  width: number
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

  private hoverNode: INode | undefined;
  private selectNode: INode | undefined;

  private initData = {
    nodes: [
      { id: 'start.social', size: 0 }
    ],
    links: []
  };

  // private source$;

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

  insertDataNodes (dataNodes: INode[], linkList: ILink[] ) {

    const { nodes, links } = this.graph.graphData();

    this.graph.graphData({
      nodes: [ ...nodes, ...dataNodes ],
      links: linkList.length ? [ ...links, ...linkList ] : [ ...links ]
    });

  }

  insertServerNode (node: INode) {

    const { nodes, links } = this.graph.graphData();

    // const value = ~~(Math.random() * 10) +2;
    const candidates = nodes.filter( (n: INode) => n.domain === node.domain && n.type === 'server');
    const link = candidates.length
      ? { target: candidates[~~(Math.random() * candidates.length)].id, source: node.id, value: 100, width: 1 }
      : undefined
    ;

    // console.log('insert', node, link);

    this.graph.graphData({
      nodes: [ ...nodes, node ],
      links: link ? [ ...links, link ] : [ ...links ]
    });

  }

  removeNode(node: INode) {

    const { nodes, links } = this.graph.graphData();
    const newlinks = links.filter(l => l.source !== node && l.target !== node); // Remove links attached to node
    const index = nodes.findIndex( n => n.id === node.id);

    nodes.splice(index, 1); // Remove node
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
      // .nodeAutoColorBy('domain')

      .graphData(this.initData)
      .onBackgroundClick(this.onBackgroundClick.bind(this))
      .backgroundColor('#0000')

      .enableNodeDrag(true)
      .onNodeClick(this.onNodeClick.bind(this))
      .nodeColor(this.randomColor)
      .nodeResolution(32)  // 8
      .nodeOpacity(90) // .75
      .nodeLabel('id')
      .nodeVal('value')
      .onNodeHover((node: INode) => this.hoverNode = node)
      .nodeThreeObject((node: INode) => (
        this.sphereGeometry(node)
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

        this.insertServerNode(node);

      })
    ;


  }

  sphereGeometry (node: INode) {

    return new THREE.Mesh(
      new THREE.SphereGeometry(node.size),
      new THREE.MeshLambertMaterial({
        color: this.randomColor(node),
        transparent: true,
        opacity: 0.8
      })
    );

  }

  spriteText (node: INode) {
    const sprite: any = new SpriteText(node.id);
    sprite.material.depthWrite = false; // make sprite background transparent
    sprite.color = this.randomColor(node);
    sprite.textHeight = 4;
    return sprite;
  }

  spriteImage ({ type }) {
    const imgTexture = new THREE.TextureLoader().load(`./assets/sprites/${type}.png`);
    const material   = new THREE.SpriteMaterial({ map: imgTexture });
    const sprite     = new THREE.Sprite(material);
    sprite.scale.set(4, 4, 1);
    return sprite;
  }

  randomColor(node: INode) {
    return (
      node.type === 'server' ? H.colorFromString(node.domain, 70, 50) :
      node.type === 'peers'  ? H.colorFromString(node.domain, 40, 40) :
        H.colorFromString(node.domain, 40, 40)
    );
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

    this.insertDataNodes(nodes, links);

  }


}
