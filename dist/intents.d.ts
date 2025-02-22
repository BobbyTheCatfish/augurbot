import { ClientEvents } from "discord.js";
declare function calcIntent(clientEvents: (keyof ClientEvents)[], messageContent?: boolean, dms?: boolean): number;
export default calcIntent;
