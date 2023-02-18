import { Subject, Subscription, merge } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { IMessage, TPayload, TSender } from './interfaces';
import { ChildProcess } from 'node:child_process';

class Bus {

  private messagesExpress$ = new Subject<IMessage<TPayload>>();
  private messagesBrowser$ = new Subject<IMessage<TPayload>>();
  private messagesElectron$ = new Subject<IMessage<TPayload>>();

  private childexpress: ChildProcess;

  // static fromProcess (process: NodeJS.Process) {

  //   const bus = new Bus();
  // }

  private name: TSender;
  private messages$ = new Subject<IMessage<any>>();

  private connector: NodeJS.Process | Window | MessagePort;
  private type: 'mainport' | 'process' | 'child';
  private send: (msg: any) => any;
  private listen: (msg: any) => any;

  constructor (name: TSender, type, connector) {

    console.log('Bus.constructor', name, type);

    // this.messagesExpress$.subscribe( (msg: IMessage<TPayload>) => {
    //   this.childexpress.send(msg);
    // })

    this.name = name;
    this.type = type;
    this.connector = connector;

    this.send = (
      type === 'mainport' ? connector.postMessage :
      type === 'child'    ? connector.send :
      type === 'process'  ? connector.send :
        null

    );

    if (type === 'mainport') {
      connector.onmessage = (msg:IMessage<any>) => {
        this.messages$.next(msg);
      }
    } else if (type === 'child' || type === 'process') {
      connector.on('message', (msg) => {
        this.messages$.next(msg);
      });
    }

  }

  // electron <=> express
  initExpressChannnel (child: ChildProcess) {

    this.childexpress = child;

    // incoming from express
    child.on('message', (msg: IMessage<TPayload>) => {

      if (msg.receiver === 'browser') {
        this.messages$.next(msg);
      }

      if (msg.receiver === 'express') {
        this.messagesExpress$.next(msg);
      }

    });

    // child.on('error', (err) => {
    //   console.log('EC.Bus.Express.onError', Object.keys(err));
    // });

    // child.on('close', (code) => {
    //   console.log('EC.Bus.Express.onClose', Object.keys(code));
    // });

  }


  // electron <=> browser
  initBrowserChannnel () {}



  // express <=> electron
  initElectronChannnel () {}


  emit (msg: IMessage<TPayload>) {

    console.log('Bus.emit', msg.topic, this.name, '=>', msg.receiver);

    msg.sender = this.name;

    if (this.name === 'browser') {
      if (msg.receiver === 'browser') {
        this.messages$.next(msg);
      } else {
        console.log(this.connector);
        (this.connector as NodeJS.Process).send(msg);
        // this.send(msg);
      }

    } else if (this.name === 'electron') {
      if (msg.receiver === 'browser') {
        // this.messages$.next(msg);
      } else {
        // console.log(this.connector);
        (this.connector as NodeJS.Process).send(msg);
        // this.send(msg);
      }


    }





    if (msg.receiver === 'browser') {
      this.messages$.next(msg);
    }

    if (msg.receiver === 'express') {
      this.messagesExpress$.next(msg);
    }

  }

  on(topic: string, action: any): Subscription {

    return merge(
        this.messagesBrowser$,
        this.messagesExpress$,
      )
      .pipe(
        filter( (msg: IMessage<TPayload>) => msg.topic === topic ),
        map<IMessage<TPayload>, TPayload>( (msg) => msg.payload),
        tap( (msg: any) => {
          console.log('Bus.on', msg.topic, this.name, '=>', msg.receiver);
        })
      )
      .subscribe( action );

  }




}

export default Bus;
