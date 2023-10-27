import { ClientEvents } from "discord.js";
declare function calcIntent(clientEvents: (keyof ClientEvents)[], dms?: boolean): number[];
export default calcIntent;
