
export class LiveSession {
  constructor(private onStatusChange: (status: boolean) => void) {}
  async start() { console.log("Live Start"); this.onStatusChange(true); }
  async stop() { console.log("Live Stop"); this.onStatusChange(false); }
}
