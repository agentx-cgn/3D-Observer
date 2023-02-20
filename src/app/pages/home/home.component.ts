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


type TNodeType = 'server' | 'peers' | 'activities' | 'rules' | 'info';
interface INode {
  id: string
  domain: string
  size: number
  type: TNodeType
  x?: number
  y?: number
  z?: number
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

  insertDataNode (node: INode, linkList: ILink[] ) {

    const { nodes, links } = this.graph.graphData();

    this.graph.graphData({
      nodes: [ ...nodes, node ],
      links: linkList.length ? [ ...links, ...linkList ] : [ ...links ]
    });

  }

  insertServerNode (node: INode) {

    const { nodes, links } = this.graph.graphData();

    const value = ~~(Math.random() * 10) +2;
    const candidates = nodes.filter( (n: INode) => n.domain === node.domain && n.type === 'server');
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
      .graphData(this.initData)
      .onBackgroundClick(this.onBackgroundClick.bind(this))
      .backgroundColor('#0000')

      .enableNodeDrag(true)
      .onNodeClick(this.onNodeClick.bind(this))
      // .nodeAutoColorBy('domain')
      .nodeColor(this.randomColor)
      .nodeResolution(32)  // 8
      .nodeOpacity(90) // .75
      .nodeLabel('id')
      .nodeVal('size')
      .onNodeHover(node => this.hoverNode = node)

      .linkWidth('value')
      .linkDirectionalParticles('value')
      .linkDirectionalParticleSpeed( (d: ILink) => d.value * 0.001)

      .nodeThreeObject((node: INode) => (
          node.type === 'peers' ? this.spriteText(node) :
          node.type === 'rules' ? this.spriteImage(node) :
          false
        ))
    ;

    this.graph.d3Force('charge').strength(-0.1); // the smaller, the more stick balls together
    this.graph.d3AlphaDecay(0.0000001);  // def: 0.0228

    interval(100)
      .pipe(
        take(servers.length),
        map(i => servers.sort()[i])
      )
      .subscribe(id => {

        const domain = id.split('.').slice(-1)[0];
        const size   = ~~(Math.random()*10) +2;
        const node   = { id, size, domain, type: 'server' as TNodeType};

        // console.log('subscribe', node);

        this.insertServerNode(node);

      })
    ;


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
    sprite.scale.set(12, 12, 1);
    return sprite;
  }

  randomColor(node: INode) {
    return (
      node.type === 'server' ? H.colorFromString(node.domain, 70, 50) :
      node.type === 'peers'  ? H.colorFromString(node.domain, 40, 40) :
        H.colorFromString(node.domain, 40, 40)
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

    node.type === 'server' && this.pokeNode(node);

  }

  pokeNode (parent: INode) {

    console.log('pokeNode', parent);

    ['info', 'peers', 'activity', 'rules'].forEach( item => {

      const xyz = (
        item === 'info'     ? { x: parent.x +1, y: parent.y +0, z: parent.z +1 } :
        item === 'peers'    ? { x: parent.x -1, y: parent.y +0, z: parent.z +1 } :
        item === 'activity' ? { x: parent.x +1, y: parent.y +0, z: parent.z -1 } :
        item === 'rules'    ? { x: parent.x -1, y: parent.y +0, z: parent.z -1 } :
                              { x: parent.x +3, y: parent.y +3, z: parent.z +3 }
      );

      const id    = parent.id + '/' + item;
      const node  = { id, domain: parent.domain, size: 1, type: item as TNodeType, ...xyz };
      const links = [ { target: parent.id, source: id, value: 1 } ];

      this.insertDataNode(node, links);

    });

  }


}
