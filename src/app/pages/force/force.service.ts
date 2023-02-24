/* eslint-disable @angular-eslint/component-class-suffix */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-debugger */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable no-bitwise */
/* eslint-disable space-before-function-paren */

import { Injectable } from '@angular/core';

import ForceGraph3D from '3d-force-graph';
import SpriteText from 'three-spritetext';
import * as THREE  from 'three';

import { Coords, ILink, INode } from '../../../../app/interfaces';
import { helper as H } from '../../core/helper.service';

@Injectable({
  providedIn: 'root'
})
export class ForceService {

  public graph = ForceGraph3D();

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

}
