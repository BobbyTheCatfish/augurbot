"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const path_1 = __importDefault(require("path"));
class CommandManager extends discord_js_1.Collection {
    constructor(client) {
        super();
        this.client = client;
        this.aliases = new discord_js_1.Collection();
        this.commandCount = 0;
    }
    execute(message, parsed) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { command, suffix, params } = parsed;
                let commandGroup;
                if (this.has(command))
                    commandGroup = this;
                else if (this.aliases.has(command))
                    commandGroup = this.aliases;
                else
                    return;
                this.commandCount++;
                let cmd = commandGroup.get(command);
                if (cmd === null || cmd === void 0 ? void 0 : cmd.parseParams)
                    return cmd.execute(message, params);
                else
                    return cmd === null || cmd === void 0 ? void 0 : cmd.execute(message, [suffix]);
            }
            catch (error) {
                return this.client.errorHandler(error, message);
            }
        });
    }
    register(load) {
        for (const command of load.commands) {
            try {
                command.filepath = load.filepath;
                command.client = load.client;
                if (!command.category)
                    command.category = path_1.default.basename(command.filepath, ".js");
                const existing = this.get(command.name.toLowerCase());
                if (existing)
                    this.client.errorHandler(`Duplicate Command Name: ${command.name}`, `Command name ${command.name} already registered in \`${existing.filepath}\`. It is being overwritten.`);
                this.set(command.name.toLowerCase(), command);
                for (let alias of command.aliases) {
                    alias = alias.toLowerCase();
                    const existing = this.aliases.get(alias);
                    if (existing)
                        this.client.errorHandler(`Duplicate Command Alias: ${alias}`, `Command alias ${alias} already registered in \`${existing.filepath}\`. It is being overwritten.`);
                    this.aliases.set(alias, command);
                }
            }
            catch (error) {
                this.client.errorHandler(error, `Register command "${command.name}" in ${load.filepath}`);
            }
        }
        return this;
    }
}
exports.default = CommandManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWFuYWdlcnMvQ29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBd0Q7QUFFeEQsZ0RBQXVCO0FBSXZCLE1BQXFCLGNBQWUsU0FBUSx1QkFBZ0M7SUFJeEUsWUFBWSxNQUFjO1FBQ3RCLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLHVCQUFVLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBQ0ssT0FBTyxDQUFDLE9BQWdCLEVBQUUsTUFBYzs7WUFDMUMsSUFBSSxDQUFDO2dCQUNELElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQztnQkFDekMsSUFBSSxZQUE4QyxDQUFDO2dCQUNuRCxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDO29CQUFFLFlBQVksR0FBRyxJQUFJLENBQUM7cUJBQ3RDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDO29CQUFFLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDOztvQkFDM0QsT0FBTztnQkFFWixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3BCLElBQUksR0FBRyxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3BDLElBQUksR0FBRyxhQUFILEdBQUcsdUJBQUgsR0FBRyxDQUFFLFdBQVc7b0JBQ2hCLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7O29CQUVwQyxPQUFPLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUMvQyxDQUFDO1lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztnQkFDbEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEQsQ0FBQztRQUNMLENBQUM7S0FBQTtJQUVELFFBQVEsQ0FBQyxJQUFpQjtRQUN0QixLQUFLLE1BQU0sT0FBTyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUM7Z0JBQ0QsT0FBTyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUNqQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUTtvQkFBRSxPQUFPLENBQUMsUUFBUSxHQUFHLGNBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFakYsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7Z0JBQ3RELElBQUksUUFBUTtvQkFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQywyQkFBMkIsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLGdCQUFnQixPQUFPLENBQUMsSUFBSSw0QkFBNEIsUUFBUSxDQUFDLFFBQVEsOEJBQThCLENBQUMsQ0FBQTtnQkFDMUwsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUU5QyxLQUFLLElBQUksS0FBSyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDaEMsS0FBSyxHQUFHLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDNUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3pDLElBQUksUUFBUTt3QkFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyw0QkFBNEIsS0FBSyxFQUFFLEVBQUUsaUJBQWlCLEtBQUssNEJBQTRCLFFBQVEsQ0FBQyxRQUFRLDhCQUE4QixDQUFDLENBQUE7b0JBQzlLLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDckMsQ0FBQztZQUNMLENBQUM7WUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO2dCQUNsQixJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUscUJBQXFCLE9BQU8sQ0FBQyxJQUFJLFFBQVEsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDOUYsQ0FBQztRQUNMLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0NBQ0o7QUFwREQsaUNBb0RDIn0=