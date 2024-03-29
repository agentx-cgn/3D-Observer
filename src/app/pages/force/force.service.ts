/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import ForceGraph3D from '3d-force-graph';
// import SpriteText from 'three-spritetext';
import * as THREE  from 'three';

import { Coords, ILink, IMGraphData, INode } from '../../../../app/interfaces';
// import { helper as H } from '../../core/helper.service';
import { BusService } from '../../core/bus.service';
import { ForceMeshes } from './force.meshes';


interface IBoundingBox { x: [number, number]; y: [number, number]; z: [number, number]; }

@Injectable({
  providedIn: 'root'
})
export class ForceService {

  public graph = ForceGraph3D();
  public v3Camera: THREE.Vector3;
  public scene: THREE.Scene;

  public state$   = new BehaviorSubject<any>(null);

  public camera$   = new BehaviorSubject<THREE.Vector3 | null>(null);
  public bounding$ = new BehaviorSubject<IBoundingBox | null>(null);

  public selectNode: INode | undefined;
  public hoverNode: INode | undefined;

  public cfg = {
    background_color: 'black',
    nodeResolution: 32,
    nodeOpacity: 0.9,
    chargeStrength: -2,
    chargeDistanceMin: 10,
    alphaDecay: 0.0228,     // def: 0.0228
    server: {
      size: 10,
      opacity: 1,
      value: 10
    },
    satellite: {
      size: 3,
      opacity: 0.9,
      value: 5,
      links: { value: 10, width: 1 }
    },
    zoomToNode: {
      duration: 3000,
      distance: 200
    },
    zoomToFit: {
      duration: 300,
      padding: 20,
    }
  };

  private boxHelper: THREE.BoxHelper;
  private box3Helper: THREE.Box3Helper;
  private box3: THREE.Box3;

  constructor (
    private readonly bus: BusService,
    public readonly meshes: ForceMeshes
  ) {
    this.listen();
  }

  public init () {

    const scene = this.graph.scene();
    scene.add( new THREE.BoxHelper( scene ) );

    // scene.fog = new THREE.Fog( 0x000000, -50, 2000 );

    // const box = new THREE.BoxHelper( scene, 0xffff00 );
    // scene.add( box );

    // this.boxHelper = new THREE.BoxHelper(scene, 0xffff00);
    // scene.add(this.boxHelper);
    // this.boxHelper.update();

    const axesHelper = new THREE.AxesHelper( 50 );
    scene.add( axesHelper );

    this.box3 = new THREE.Box3();
    this.box3.setFromCenterAndSize( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 50, 50, 50 ) );
    // this.boxHelper.setFromObject(this.box3);
    // scene.add(this.boxHelper);

    this.box3Helper = new THREE.Box3Helper( this.box3, new THREE.Color('green') );
    scene.add( this.box3Helper );

  }

  public clear () {
    this.import({ nodes: [], links: [] });
  }

  public import (payload) {

    const { nodes, links } = payload;
    this.selectNode = undefined;
    this.graph.graphData({ nodes, links });

  }

  public export () {

    const { nodes, links } = this.graph.graphData();
    const payload = { nodes: [], links: [] };

    payload.nodes = nodes.map( (node: INode) => {
      const  { id, domain, size, type, value, x, y, z } = node;
      return { id, domain, size, type, value, x, y, z };
    });

    payload.links = links.map( (link: any) => {
      const  { target, source, value, width } = link;
      return { target: target.id, source: source.id, value, width };
    });

    return payload;

  }

  public zoomToFit () {
    this.graph.zoomToFit(this.cfg.zoomToFit.duration, this.cfg.zoomToFit.padding);
  }

  public zoomToNode (node: INode) {

    // Aim at node from outside it
    const distance  = this.cfg.zoomToNode.distance;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

    const newPos = node.x || node.y || node.z
      ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
      : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

    this.graph.cameraPosition (
      newPos,                 // new position
      node as Coords,         // lookAt ({ x, y, z })
      this.cfg.zoomToNode.duration  // ms transition duration
    );

  }

  private listen () {

    this.bus.on<IMGraphData>('get:graphdata', (msg: IMGraphData) => {
      const { links, nodes } = msg.payload;
      this.graph.graphData({ nodes, links });
    });

  }

  public onEngineStop () {
    this.graph.d3ReheatSimulation();
    console.log('Force.engine', 'restarted');
  }

  public onEngineTick () {

    const state: any = {};

    if (this.graph) {

      const scene = this.graph.scene();
      const cam = this.graph.camera();
      const v3  = cam.position.clone();
      const box = this.graph.getGraphBbox();

      scene.traverse(function(obj){

        if(obj.type === 'Mesh'){
          console.log();
        }

      });

      v3.applyMatrix4( cam.matrixWorld );

      const distance = v3.length();

      state.cam = { x: Math.floor(v3.x), y: Math.floor(v3.y), z: Math.floor(v3.z)} ;
      state.len = ~~distance;

      if (box) {

        this.bounding$.next(box);

        const max = Math.max.apply(null, [ ...box.x, ...box.y, ...box.z ].map(Math.abs));
        // scene.fog = new THREE.Fog( 0x000000, distance - max, distance + max );
        // scene.fog = new THREE.Fog( 0x000000, distance -500 , distance + max );
        // scene.fog = new THREE.Fog( 0x000000, 500   , max * 2 );

        this.box3.setFromCenterAndSize( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( max, max, max ) );

        state.max = ~~max;

      }


      if (this.selectNode) {
        const scale = 0.3 * Math.sin(Date.now() / 300) + 1 ;
        this.selectNode.__threeObj.scale.set(scale, scale, scale);
      }

    }

    this.state$.next(state);

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

    const candidates = nodes.filter( (n: INode) => n.domain === node.domain && n.type === 'server');
    const link = candidates.length
      ? { target: candidates[~~(Math.random() * candidates.length)].id, source: node.id, value: 100, width: 1 }
      : undefined
    ;

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

}
