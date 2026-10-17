/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 42613:
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ 20181:
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ 35317:
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),

/***/ 76982:
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ 24434:
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ 79896:
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ 58611:
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ 65692:
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ 73339:
/***/ ((module) => {

module.exports = require("module");

/***/ }),

/***/ 69278:
/***/ ((module) => {

module.exports = require("net");

/***/ }),

/***/ 34589:
/***/ ((module) => {

module.exports = require("node:assert");

/***/ }),

/***/ 16698:
/***/ ((module) => {

module.exports = require("node:async_hooks");

/***/ }),

/***/ 4573:
/***/ ((module) => {

module.exports = require("node:buffer");

/***/ }),

/***/ 31421:
/***/ ((module) => {

module.exports = require("node:child_process");

/***/ }),

/***/ 77598:
/***/ ((module) => {

module.exports = require("node:crypto");

/***/ }),

/***/ 53053:
/***/ ((module) => {

module.exports = require("node:diagnostics_channel");

/***/ }),

/***/ 40610:
/***/ ((module) => {

module.exports = require("node:dns");

/***/ }),

/***/ 78474:
/***/ ((module) => {

module.exports = require("node:events");

/***/ }),

/***/ 73024:
/***/ ((module) => {

module.exports = require("node:fs");

/***/ }),

/***/ 51455:
/***/ ((module) => {

module.exports = require("node:fs/promises");

/***/ }),

/***/ 37067:
/***/ ((module) => {

module.exports = require("node:http");

/***/ }),

/***/ 32467:
/***/ ((module) => {

module.exports = require("node:http2");

/***/ }),

/***/ 44708:
/***/ ((module) => {

module.exports = require("node:https");

/***/ }),

/***/ 48161:
/***/ ((module) => {

module.exports = require("node:os");

/***/ }),

/***/ 76760:
/***/ ((module) => {

module.exports = require("node:path");

/***/ }),

/***/ 643:
/***/ ((module) => {

module.exports = require("node:perf_hooks");

/***/ }),

/***/ 1708:
/***/ ((module) => {

module.exports = require("node:process");

/***/ }),

/***/ 57075:
/***/ ((module) => {

module.exports = require("node:stream");

/***/ }),

/***/ 7066:
/***/ ((module) => {

module.exports = require("node:tty");

/***/ }),

/***/ 73136:
/***/ ((module) => {

module.exports = require("node:url");

/***/ }),

/***/ 57975:
/***/ ((module) => {

module.exports = require("node:util");

/***/ }),

/***/ 38522:
/***/ ((module) => {

module.exports = require("node:zlib");

/***/ }),

/***/ 70857:
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ 16928:
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ 24876:
/***/ ((module) => {

module.exports = require("punycode");

/***/ }),

/***/ 83480:
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ 2203:
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ 64756:
/***/ ((module) => {

module.exports = require("tls");

/***/ }),

/***/ 52018:
/***/ ((module) => {

module.exports = require("tty");

/***/ }),

/***/ 87016:
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ 39023:
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ 28167:
/***/ ((module) => {

module.exports = require("worker_threads");

/***/ }),

/***/ 43106:
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ 27076:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/* module decorator */ module = __nccwpck_require__.nmd(module);

const fs = __nccwpck_require__(73024);
const path = __nccwpck_require__(76760);

async function serve(configPath) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const {createApp} = await __nccwpck_require__.e(/* import() */ 791).then(__nccwpck_require__.bind(__nccwpck_require__, 33791));
  const app = createApp({logger: false, bodyLimit: 1024 * 1024 * 1024});
  let closing = false;
  async function close() {
    if (closing) return;
    closing = true;
    await app.close();
    fs.writeFileSync(path.join(config.directory, 'stopped'), '');
  }
  process.on('SIGTERM', () => close().catch(() => { process.exitCode = 1; }));
  app.post('/_composal/shutdown', (request, reply) => {
    if (request.headers.authorization !== `Bearer ${config.token}`) return reply.code(401).send();
    reply.code(202).send();
    setImmediate(() => close().catch(() => { process.exitCode = 1; }));
  });
  const api = await app.listen({host: '127.0.0.1', port: 0});
  fs.writeFileSync(path.join(config.directory, 'ready.json'), JSON.stringify({api}));
}

if (__nccwpck_require__.c[__nccwpck_require__.s] === module) serve(process.argv[2]).catch(error => { console.error(error.message); process.exitCode = 1; });


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__nccwpck_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// expose the module cache
/******/ 	__nccwpck_require__.c = __webpack_module_cache__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/asset-relocator-loader */
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__nccwpck_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__nccwpck_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__nccwpck_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__nccwpck_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__nccwpck_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__nccwpck_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__nccwpck_require__.f).reduce((promises, key) => {
/******/ 				__nccwpck_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__nccwpck_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".index.cjs.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__nccwpck_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/require chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "loaded", otherwise not loaded yet
/******/ 		var installedChunks = {
/******/ 			792: 1
/******/ 		};
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		var installChunk = (chunk) => {
/******/ 			var moreModules = chunk.modules, chunkIds = chunk.ids, runtime = chunk.runtime;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__nccwpck_require__.o(moreModules, moduleId)) {
/******/ 					__nccwpck_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__nccwpck_require__);
/******/ 			for(var i = 0; i < chunkIds.length; i++)
/******/ 				installedChunks[chunkIds[i]] = 1;
/******/ 		
/******/ 		};
/******/ 		
/******/ 		// require() chunk loading for javascript
/******/ 		__nccwpck_require__.f.require = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					installChunk(require("./" + __nccwpck_require__.u(chunkId)));
/******/ 				} else installedChunks[chunkId] = 1;
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		// no external install chunk
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// module cache are used so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	var __webpack_exports__ = __nccwpck_require__(__nccwpck_require__.s = 27076);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;