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
exports.AugurCommand = void 0;
class AugurCommand {
    constructor(info, client) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        if (!info.name || !info.process) {
            throw new Error("Commands must have the `name` and `process` properties");
        }
        this.name = info.name;
        this.aliases = (_a = info.aliases) !== null && _a !== void 0 ? _a : [];
        this.syntax = (_b = info.syntax) !== null && _b !== void 0 ? _b : "";
        this.description = (_c = info.description) !== null && _c !== void 0 ? _c : "";
        this.info = (_d = info.info) !== null && _d !== void 0 ? _d : this.description;
        this.hidden = (_e = info.hidden) !== null && _e !== void 0 ? _e : false;
        this.category = (_f = info.category) !== null && _f !== void 0 ? _f : "General";
        this.enabled = (_g = info.enabled) !== null && _g !== void 0 ? _g : true;
        this.permissions = info.permissions || (() => true);
        this.userPermissions = (_h = info.userPermissions) !== null && _h !== void 0 ? _h : [];
        this.parseParams = (_j = info.parseParams) !== null && _j !== void 0 ? _j : false;
        this.options = (_k = info.options) !== null && _k !== void 0 ? _k : {};
        this.process = info.process;
        this.onlyOwner = info.onlyOwner || false;
        this.onlyGuild = info.onlyGuild || false;
        this.onlyDm = info.onlyDm || false;
        this.client = client;
    }
    execute(message, args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.client.commandExecution(this, message, args);
        });
    }
}
exports.AugurCommand = AugurCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXVndXJDb21tYW5kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3N0cnVjdHVyZXMvQXVndXJDb21tYW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQXNCQSxNQUFhLFlBQVk7SUFvQnJCLFlBQVksSUFBZ0MsRUFBRSxNQUFzQjs7UUFDaEUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDOUIsTUFBTSxJQUFJLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO1FBQzlFLENBQUM7UUFDRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDdEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFBLElBQUksQ0FBQyxPQUFPLG1DQUFJLEVBQUUsQ0FBQztRQUNsQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQUEsSUFBSSxDQUFDLE1BQU0sbUNBQUksRUFBRSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBQSxJQUFJLENBQUMsV0FBVyxtQ0FBSSxFQUFFLENBQUM7UUFDMUMsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFBLElBQUksQ0FBQyxJQUFJLG1DQUFJLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDMUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFBLElBQUksQ0FBQyxNQUFNLG1DQUFJLEtBQUssQ0FBQztRQUNuQyxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQUEsSUFBSSxDQUFDLFFBQVEsbUNBQUksU0FBUyxDQUFDO1FBQzNDLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBQSxJQUFJLENBQUMsT0FBTyxtQ0FBSSxJQUFJLENBQUM7UUFDcEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLGVBQWUsR0FBRyxNQUFBLElBQUksQ0FBQyxlQUFlLG1DQUFJLEVBQUUsQ0FBQztRQUNsRCxJQUFJLENBQUMsV0FBVyxHQUFHLE1BQUEsSUFBSSxDQUFDLFdBQVcsbUNBQUksS0FBSyxDQUFDO1FBQzdDLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBQSxJQUFJLENBQUMsT0FBTyxtQ0FBSSxFQUFFLENBQUM7UUFDbEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQzVCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUM7UUFDekMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQztRQUN6QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDO1FBQ25DLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3pCLENBQUM7SUFFSyxPQUFPLENBQUMsT0FBd0IsRUFBRSxJQUFjOztZQUNsRCxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFDckQsQ0FBQztLQUFBO0NBQ0o7QUE5Q0Qsb0NBOENDIn0=