"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class Bus {
    constructor(name, type, connector) {
        this.messagesExpress$ = new rxjs_1.Subject();
        this.messagesBrowser$ = new rxjs_1.Subject();
        this.messagesElectron$ = new rxjs_1.Subject();
        this.messages$ = new rxjs_1.Subject();
        console.log('Bus.constructor', name, type);
        // this.messagesExpress$.subscribe( (msg: IMessage<TPayload>) => {
        //   this.childexpress.send(msg);
        // })
        this.name = name;
        this.type = type;
        this.connector = connector;
        this.send = (type === 'mainport' ? connector.postMessage :
            type === 'child' ? connector.send :
                type === 'process' ? connector.send :
                    null);
        if (type === 'mainport') {
            connector.onmessage = (msg) => {
                this.messages$.next(msg);
            };
        }
        else if (type === 'child' || type === 'process') {
            connector.on('message', (msg) => {
                this.messages$.next(msg);
            });
        }
    }
    // electron <=> express
    initExpressChannnel(child) {
        this.childexpress = child;
        // incoming from express
        child.on('message', (msg) => {
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
    initBrowserChannnel() { }
    // express <=> electron
    initElectronChannnel() { }
    emit(msg) {
        console.log('Bus.emit', msg.topic, this.name, '=>', msg.receiver);
        msg.sender = this.name;
        if (this.name === 'browser') {
            if (msg.receiver === 'browser') {
                this.messages$.next(msg);
            }
            else {
                console.log(this.connector);
                this.connector.send(msg);
                // this.send(msg);
            }
        }
        else if (this.name === 'electron') {
            if (msg.receiver === 'browser') {
                // this.messages$.next(msg);
            }
            else {
                // console.log(this.connector);
                this.connector.send(msg);
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
    on(topic, action) {
        return (0, rxjs_1.merge)(this.messagesBrowser$, this.messagesExpress$)
            .pipe((0, operators_1.filter)((msg) => msg.topic === topic), (0, operators_1.map)((msg) => msg.payload), (0, operators_1.tap)((msg) => {
            console.log('Bus.on', msg.topic, this.name, '=>', msg.receiver);
        }))
            .subscribe(action);
    }
}
exports.default = Bus;
//# sourceMappingURL=bus.js.map