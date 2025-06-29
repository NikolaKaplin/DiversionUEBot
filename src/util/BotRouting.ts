import fs from "fs";
import path from "path";
import { Context } from "telegraf";
import { InlineKeyboardButton } from "telegraf/types";
import readdirp, { EntryInfo } from "readdirp";

import bot from "..";

const unwindowsPath = (path: string): string => path.replace(/\\/g, "/");

async function routeTreeFromDir(
  dirpath: string,
  rootdir: string,
  route: Route
): Promise<Route> {
  const dir: AsyncIterableIterator<EntryInfo> = readdirp(dirpath, {
    depth: 0,
    type: "files_directories",
    alwaysStat: true,
  }).iterator();
  for await (const file of dir) {
    const file_path = file.fullPath;
    const path_to = file.fullPath
      .split("/")
      .filter((_, i, a) => i + 1 < a.length)
      .join("/");

    let route_name = file.basename.split(".")[0];

    let indexRoute = false;
    if (route_name == "route") indexRoute = true;

    if (indexRoute) route_name = path_to.split("/").pop()!;

    const route_path = unwindowsPath(
      path.join("/", path_to.replace(rootdir, ""), indexRoute ? "" : route_name)
    );

    const parameter = route_name.match(/^\[(.*)\]$/)?.[1];

    if (file.stats!.isFile()) {
      try {
        const startTime = Date.now();

        const routeCode = require(file_path);
        const routeConfig: RouteConfig<any> = routeCode.default;
        if (!(routeConfig instanceof RouteConfig)) continue;

        if (indexRoute)
          route = {
            route: route_name,
            file_path,
            path: route_path,
            config: routeConfig,
            children: route.children,
            empty: false,
            parameter,
          };
        else
          route.children.push({
            route: route_name,
            file_path,
            path: route_path,
            config: routeConfig,
            children: [],
            parameter,
          });

        const newroute = indexRoute
          ? route
          : route.children.find((r) => r.route == route_name)!;
        routeConfig.route = newroute;

        console.log(
          `Found route ${route_path} at ${file_path}, processed in ${
            Date.now() - startTime
          }ms`
        );
      } catch {}
    } else if (file.stats!.isDirectory()) {
      route.children.push(
        await routeTreeFromDir(file_path, rootdir, {
          route: route_name,
          file_path,
          path: route_path,
          config: new RouteConfig(),
          children: [],
          empty: true,
          parameter,
        })
      );
    }
  }
  return route;
}

export default class BotRouting {
  protected routeTree: Route;
  public get route_tree(): Route {
    return this.routeTree;
  }

  findRoute(path: string) {
    const pa = path.split("?")[0].split("/");
    let currentRoute = this.route_tree;
    let params = new Map<string, string>();

    for (let i = 1; i < pa.length; i++) {
      if (pa[i] == "") continue;

      let newroute = currentRoute.children.find((r) => r.route == pa[i]);
      if (!newroute)
        newroute = currentRoute.children.find((r) => !!r.parameter);
      if (!newroute) return undefined;
      currentRoute = newroute;

      if (currentRoute.parameter) params.set(currentRoute.parameter, pa[i]);
    }

    return {
      route: currentRoute,
      params: Object.fromEntries(params.entries()),
    };
  }

  matchPath(pathTemplate: string, actualPath: string) {
    const pt = pathTemplate.split("/");
    const ap = actualPath.split("?")[0].split("/");

    if (pt.length != ap.length) return false;

    for (let i = 0; i < pt.length; i++)
      if (!pt[i].match(/^\[(.*)\]$/) && pt[i] != ap[i]) return false;
    return true;
  }

  constructor() {
    this.routeTree = {
      route: "",
      file_path: "",
      path: "/",
      config: new RouteConfig(),
      children: [],
      empty: true,
    };
  }

  async initialize(directory: string) {
    console.log(`Looking for bot routes in \`${directory}\`...`);
    const startTime = Date.now();
    this.routeTree = await routeTreeFromDir(
      directory,
      directory,
      this.route_tree
    );
    console.log(
      `These are all the routes found in ${Date.now() - startTime}ms`
    );
    if (this.route_tree.empty)
      console.warn("The root route (`/`, `/route.js`) was not found!");
    const notfoundroute = this.route_tree.children.find(
      (r) => r.route == "not-found"
    );
    if (!notfoundroute || notfoundroute.empty)
      console.warn(
        "The not-found route (`/not-found`, `/not-found.js`) was not found!"
      );
    function routeToString(route: Route, prefix: string = ""): string {
      let result =
        prefix +
        "- " +
        (route.route == "" ? "root (/)" : route.route) +
        (route.parameter
          ? ` (template route, \`${route.parameter}\` parameter)`
          : "") +
        (route.empty ? " (empty)" : "");
      route.children.forEach(
        (r) => (result += "\n" + routeToString(r, prefix + "  "))
      );
      return result;
    }
    console.log("\nBot route tree:\n" + routeToString(this.route_tree));
  }
}

export class UnvalidatedRouterError extends Error {
  name: string = "UnvalidatedRouterError";
  constructor(
    message: string = "Unable to run this method in an unvalidated BotRouter"
  ) {
    super(message);
  }
}
export class UninitializedRouteError extends Error {
  name: string = "UninitializedRouteError";
  constructor(message: string = "Route is not yet initialized") {
    super(message);
  }
}
export class BotRouter<C extends Context> {
  public not_found: boolean = false;
  public params: { [key: string]: string };
  constructor(
    protected ctx: C | undefined,
    public routing: BotRouting,
    protected current_path: string,
    protected setPath?: (path: string) => any
  ) {
    this.params = this.routing.findRoute(current_path)?.params || {};
  }

  public get path(): string {
    return this.current_path;
  }
  public set path(v: string) {
    this.current_path = v;
    this.setPath?.(v);
  }

  public validate(routeConfig: RouteConfig<any>) {
    if (!routeConfig.route) throw new UninitializedRouteError();
    this.route = routeConfig.route;
    if (this.not_found && this.route.path == "/not-found") return this;
    if (this.routing.matchPath(this.route.path, this.path)) return this;
  }
  protected route?: Route;

  public redirect(newpath: string, process?: any) {
    this.path = newpath.startsWith("/")
      ? newpath
      : unwindowsPath(path.join(this.path, newpath));
    this.not_found = false;
    let newroute = this.routing.findRoute(newpath);
    if (!newroute) {
      newroute = this.routing.findRoute("/not-found")!;
      this.not_found = true;
    }
    this.params = newroute.params;
    if (process) this.setProcess(process);
    newroute.route.config.greeting?.(this.ctx!);
  }

  public up(levels: number = 1) {
    this.redirect(new Array(levels).fill("..").join("/"));
  }

  public getProcess(): unknown {
    const queries = this.path.split("?")[1];
    try {
      const processQuery = queries.replace("process=", "");
      const process = processQuery ? JSON.parse(atob(processQuery)) : undefined;
      return process;
    } catch {
      return {};
    }
  }
  public setProcess(process: any) {
    const path =
      this.path.split("?")[0] + "?process=" + btoa(JSON.stringify(process));
    this.path = path;
  }
}

export class RouteConfig<C extends Context> {
  greeting?: (ctx: C) => any;

  constructor(conf?: { greeting?: (ctx: C) => any }) {
    this.greeting = conf?.greeting;
  }

  buttons = new ButtonTemplates(this);

  route?: Route;
}

export type Route = {
  route: string;
  path: string;
  file_path: string;
  config: RouteConfig<any>;
  children: Route[];
  parameter?: string;
  empty?: boolean;
};

function hashCode(str: string) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
}

const buttonTemplateHandlers: string[] = [];
type ButtonTemplate = (routeConfig: RouteConfig<any>) => InlineKeyboardButton;
function buttonTemplateBuilder(
  name: string,
  buttonText: string,
  callbackHandler: Parameters<(typeof bot)["action"]>[1]
): ButtonTemplate {
  return (rc) => {
    const handlerId = hashCode(rc.route!.file_path) + "-" + name;
    if (!buttonTemplateHandlers.find((h) => h == handlerId)) {
      buttonTemplateHandlers.push(handlerId);
      bot.action(handlerId, (ctx, next) => {
        const { router } = ctx;
        if (!router.validate(rc)) return next();
        if (typeof callbackHandler == "function") callbackHandler(ctx, next);
        ctx.answerCbQuery();
      });
    }
    return {
      text: buttonText,
      callback_data: handlerId,
    };
  };
}

class ButtonTemplates {
  constructor(protected route: RouteConfig<any>) {}
  public rowsOf(columns: number, buttons: InlineKeyboardButton[]) {
    let layout: InlineKeyboardButton[][] = [];
    for (let i = 0; i < Math.ceil(buttons.length / columns); i++) {
      layout.push(
        buttons.slice(
          i * columns,
          Math.min((i + 1) * columns, buttons.length - 1)
        )
      );
    }
    return layout;
  }
  public get home() {
    return buttonTemplateBuilder("home", "⏺ Домой", (ctx) =>
      ctx.router.redirect("/")
    )(this.route);
  }
  public get cancel() {
    return buttonTemplateBuilder("cancel", "↩️ Отмена", (ctx) =>
      ctx.router.up()
    )(this.route);
  }
  public get up() {
    return buttonTemplateBuilder("up", "↩️ Назад", (ctx) => ctx.router.up())(
      this.route
    );
  }
  public forward(text: string, path: string) {
    return buttonTemplateBuilder("f" + hashCode(path), text, (ctx) => {
      ctx.router.redirect(path);
    })(this.route);
  }
}

async function generateRoutesFile(relpath: string, routesFile?: string) {
  const directory = relpath.startsWith("/")
    ? relpath
    : path.join(process.cwd(), relpath);

  let routeTree: Route = {
    route: "",
    file_path: "",
    path: "/",
    config: new RouteConfig(),
    children: [],
    empty: true,
  };
  routeTree = await routeTreeFromDir(directory, directory, routeTree);

  function removeConfig(route) {
    route.config = undefined;
    route.children.forEach(removeConfig);
  }
  const saveableRouteTree = { ...routeTree };
  removeConfig(saveableRouteTree);

  const routesFilePath = routesFile || path.join(__dirname, "routes.json");

  fs.writeFileSync(routesFilePath, JSON.stringify(saveableRouteTree));

  console.log(`Generated and saved routes file to ${routesFilePath}`);
}
