"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class EventManager extends discord_js_1.Collection {
    constructor(client) {
        super();
        this.client = client;
    }
    register(load) {
        for (const [event, handler] of load.events) {
            this.ensure(event, () => new discord_js_1.Collection())
                .set(load.filepath, handler);
        }
        return this;
    }
}
exports.default = EventManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21hbmFnZXJzL0V2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUErQztBQUcvQyxNQUFxQixZQUFhLFNBQVEsdUJBQWdEO0lBRXRGLFlBQVksTUFBYztRQUN0QixLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxRQUFRLENBQUMsSUFBaUI7UUFDdEIsS0FBSyxNQUFNLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN6QyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLHVCQUFVLEVBQUUsQ0FBQztpQkFDckMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDcEMsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7Q0FDSjtBQWRELCtCQWNDIn0=