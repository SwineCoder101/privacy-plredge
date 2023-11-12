import { fetchAccount, PublicKey, Field } from "o1js";

import type {
  ZkappWorkerRequest,
  ZkappWorkerReponse,
  WorkerFunctions,
} from "./zkappWorker";

export default class ZkappWorkerClient {
  // ---------------------------------------------------------------------------------------

  setActiveInstanceToBerkeley() {
    return this._call("setActiveInstanceToBerkeley", {});
  }

  loadContract() {
    return this._call("loadContract", {});
  }

  compileContract() {
    return this._call("compileContract", {});
  }

  fetchAccount({
    publicKey,
  }: {
    publicKey: PublicKey;
  }): ReturnType<typeof fetchAccount> {
    const result = this._call("fetchAccount", {
      publicKey58: publicKey.toBase58(),
    });
    return result as ReturnType<typeof fetchAccount>;
  }

  initZkappInstance(publicKey: PublicKey) {
    return this._call("initZkappInstance", {
      publicKey58: publicKey.toBase58(),
    });
  }

  // *********************************************
  // Setup Vote Contract
  // *********************************************
  loadVoteContract() {
    return this._call("loadVoteContract", {});
  }

  compileVoteContract() {
    return this._call("compileVoteContract", {});
  }

  initVoteInstance(publicKey: PublicKey) {
    return this._call("initVoteInstance", {
      publicKey58: publicKey.toBase58(),
    });
  }

  // *********************************************
  // Start of Custom Calls
  // *********************************************
  async getNum(): Promise<Field> {
    const result = await this._call("getNum", {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  async getReputation(): Promise<Field> {
    const result = await this._call("getReputation", {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  createUpdateTransaction() {
    return this._call("createUpdateTransaction", { amount: 30 });
  }

  setReputation({ amount }: { amount: Field }) {
    return this._call("setReputation", { amount });
  }

  // Events from my Custom Vote App
  async fetchEvents() {
    const result = await this._call("fetchEvents", {});
    return result;
  }
  // End of Custom Calls

  proveUpdateTransaction() {
    return this._call("proveUpdateTransaction", {});
  }

  async getTransactionJSON() {
    const result = await this._call("getTransactionJSON", {});
    return result;
  }

  // ---------------------------------------------------------------------------------------

  worker: Worker;

  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };

  nextId: number;

  constructor() {
    this.worker = new Worker(new URL("./zkappWorker.ts", import.meta.url));
    this.promises = {};
    this.nextId = 0;

    this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
      this.promises[event.data.id].resolve(event.data.data);
      delete this.promises[event.data.id];
    };
  }

  _call(fn: WorkerFunctions, args: any) {
    return new Promise((resolve, reject) => {
      this.promises[this.nextId] = { resolve, reject };

      const message: ZkappWorkerRequest = {
        id: this.nextId,
        fn,
        args,
      };

      this.worker.postMessage(message);

      this.nextId++;
    });
  }
}
