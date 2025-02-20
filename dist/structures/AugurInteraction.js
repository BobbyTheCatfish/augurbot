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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AugurInteraction = void 0;
class AugurInteraction {
    constructor(info, client) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        if (!info.id || !info.process) {
            throw new Error("Commands must have the `id` and `process` properties");
        }
        this.id = info.id;
        this.name = (_a = info.name) !== null && _a !== void 0 ? _a : info.id;
        this.guildId = info.guildId;
        this.syntax = (_b = info.syntax) !== null && _b !== void 0 ? _b : "";
        this.description = (_c = info.description) !== null && _c !== void 0 ? _c : "";
        this.info = (_d = info.info) !== null && _d !== void 0 ? _d : this.description;
        this.hidden = (_e = info.hidden) !== null && _e !== void 0 ? _e : false;
        this.category = (_f = info.category) !== null && _f !== void 0 ? _f : "";
        this.enabled = (_g = info.enabled) !== null && _g !== void 0 ? _g : true;
        this.options = (_h = info.options) !== null && _h !== void 0 ? _h : {};
        this.type = (_j = info.type) !== null && _j !== void 0 ? _j : "CommandSlash";
        this.userPermissions = (_k = info.userPermissions) !== null && _k !== void 0 ? _k : [];
        this.permissions = (_l = info.permissions) !== null && _l !== void 0 ? _l : (() => __awaiter(this, void 0, void 0, function* () { return true; }));
        this.process = info.process;
        this.autocomplete = info.autocomplete || (() => { });
        this.onlyOwner = info.onlyOwner || false;
        this.onlyGuild = info.onlyGuild || false;
        this.onlyDm = info.onlyDm || false;
        this.client = client;
    }
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this.client.interactionExecution(this, interaction);
        });
    }
}
exports.AugurInteraction = AugurInteraction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXVndXJJbnRlcmFjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdHJ1Y3R1cmVzL0F1Z3VySW50ZXJhY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBd0JBLE1BQWEsZ0JBQWdCO0lBcUJ6QixZQUFZLElBQXlDLEVBQUUsTUFBc0I7O1FBQ3pFLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0RBQXNELENBQUMsQ0FBQztRQUM1RSxDQUFDO1FBQ0QsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBQSxJQUFJLENBQUMsSUFBSSxtQ0FBSSxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUM1QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQUEsSUFBSSxDQUFDLE1BQU0sbUNBQUksRUFBRSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBQSxJQUFJLENBQUMsV0FBVyxtQ0FBSSxFQUFFLENBQUM7UUFDMUMsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFBLElBQUksQ0FBQyxJQUFJLG1DQUFJLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDMUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFBLElBQUksQ0FBQyxNQUFNLG1DQUFJLEtBQUssQ0FBQztRQUNuQyxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQUEsSUFBSSxDQUFDLFFBQVEsbUNBQUksRUFBRSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBQSxJQUFJLENBQUMsT0FBTyxtQ0FBSSxJQUFJLENBQUM7UUFDcEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFBLElBQUksQ0FBQyxPQUFPLG1DQUFJLEVBQUUsQ0FBQztRQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQUEsSUFBSSxDQUFDLElBQUksbUNBQUksY0FBYyxDQUFBO1FBQ3ZDLElBQUksQ0FBQyxlQUFlLEdBQUcsTUFBQSxJQUFJLENBQUMsZUFBZSxtQ0FBSSxFQUFFLENBQUM7UUFDbEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFBLElBQUksQ0FBQyxXQUFXLG1DQUFJLENBQUMsR0FBUyxFQUFFLGdEQUFDLE9BQUEsSUFBSSxDQUFBLEdBQUEsQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUM1QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUMsQ0FBQTtRQUNuRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUM7UUFDekMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQztRQUNuQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN6QixDQUFDO0lBRUssT0FBTyxDQUFDLFdBQWdDOztZQUMxQyxJQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQTtRQUN2RCxDQUFDO0tBQUE7Q0FDSjtBQWpERCw0Q0FpREMifQ==