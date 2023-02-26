import { Injectable } from '@angular/core';
import SpriteText from 'three-spritetext';
import * as THREE  from 'three';

import { INode } from '../../../../app/interfaces';
import { helper as H } from '../../core/helper.service';
import { ForceService } from './force.service';

@Injectable({
  providedIn: 'root'
})
export class ForceMeshes {

  constructor ( ) {}

  randomColor(node: INode) {
    return (
      node.type === 'server' ? H.colorFromString(node.domain, 70, 50) :
      node.type === 'peers'  ? H.colorFromString(node.domain, 40, 40) :
        H.colorFromString(node.domain, 40, 40)
    );
  }

  simpleSphere (node: INode) {

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(node.size),
      new THREE.MeshLambertMaterial({
        color: this.randomColor(node),
        transparent: true,
        opacity: 0.8
      })
    );

    mesh.userData = { ...node };

    return mesh;

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

  cloud () {
    // https://github.com/mrdoob/three.js/blob/master/examples/webgl2_volume_cloud.html
  }

  shadertoy () {
    // https://stackoverflow.com/questions/24820004/how-to-implement-a-shadertoy-shader-in-three-js
  }

}
