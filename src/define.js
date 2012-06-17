/*
 * define.js
 * 
 * Dependencies:
 *     jQuery >= v1.5
 *     
 * Defining a module:
 *     define(name, module) - defines a named module without dependencies. 
 *     define(name, require, module) - defines a named module with dependencies. 
 *     define(require, module) - defines an anonymous module. 
 *     define(name, path) - defines path(s) to load for an async module.
 *     define(object) - sets config options and module definitions.
 *     - all methods return a module object except for the last one.
 *
 *     Parameter descriptions:
 *         name - The name of the module.
 *         module - An object or a function that returns an object or function to be used as the module.
 *         require - An array of strings which can be either a module name or a path to load the module.
 *         object - See full description below for define({...})
 *
 * Configuration options:
 *     baseUrl: A string to prepend all non absolute paths (starting with /, http, or https).
 *     alias: A hash where the key is the alias name and the value is a path which is used to.
 *     load: A function to be defined if loading resources asynchronously.
 * 
 * Setting config options:
 *     define.config({
 *         baseUrl: "/path/to/base/",
 *         alias: {
 *             app: "/path/to/app/",
 *             scripts: "path/to/scripts/",
 *             css : "path/to/css/"
 *         },
 *         load: function (resources, resolve, reject) {
 *             // implement a load resolver
 *         }
 *     });
 *
 * Note on alias:
 *     If the path requested is not absolute, the first part of the path will be tested as an alias and replaced if found.
 *     If the replacement path is not absolute, the baseUrl will be prepended. Given the config options above,
 *     see the example below for how the paths are parsed:
 *
 *     define(["app/appscript.js", "scripts/myScript.js", "css/mycss.css", "/some/other/file.htm", "another/file.js"], function () {
 *        // module definition 
 *     });
 *     
 *     Resources requested:
 *         "/path/to/app/appscripts.js"
 *         "/path/to/base/path/to/scripts/myscript.js"
 *         "/path/to/base/path/to/css/mycss.css"
 *         "/some/other/file.htm"
 *         "/path/to/base/another/file.js"
 *
 *
 * Another way to set config options which also allows module definitions:
 *     define({
 *         config: {
 *             // passed to define.config
 *         },
 *         "jQuery": $.noConflict(),      // can be a function too
 *         "Underscore": _.noConflict(),
 *         "Backbone": {                  // if an object with require/define properties, this will be used to define the module.
 *              require: ["Underscore"],
 *              define: Backbone.noConflict()
 *	       }
 *     });
 *
 * If the define symbol is already defined call define.noConflict() to re-assign it and return this define.
 */
 (function ($, undefined) {

 	var define, _, Module, _define;
	
	define = function (name, require, module) {
		/// <summary>
		///     define(name, module) - defines a named module without dependencies. 
		///     define(name, require, module) - defines a named module with dependencies. 
		///     define(require, module) - defines an anonymous module. 
		///     define(name, path) - defines path(s) to load for an async module.
		///     define(object) - sets config options and module definitions.
		/// </summary>
		var defineObj, moduleDefinition;
		
		// define(object)
		if ($.isPlainObject(arguments[0])) {
			defineObj = arguments[0];
			if (defineObj.config) {
				define.config(defineObj.config);
				delete defineObj.config;
			}

			$.each(defineObj, function (name, module) {
				// test if mod is a plain object with require/define properties
				if (module && module.require && module.define) {
					define(name, module.require, module.define);
				} else {
					define(name, module);
				}
			});

			return undefined;
		}

		if ($.isArray(arguments[0])) {
			
			// define(require, module) - anonymous module
			return new Module({ require: arguments[0], module: arguments[1] });
		}

		moduleDefinition = { };
		moduleDefinition.name = name.toLowerCase();
			
		if ($.isArray(arguments[1])) {
				
			// define(name, require, module)
			// define(name, require) - module is async
			moduleDefinition.require = arguments[1];
			moduleDefinition.module = arguments[2];
			
		} else {
				
			// define(name, module);
			moduleDefinition.module = arguments[1];
		}
		

		// undocumented way to delete a module
		if (moduleDefinition.module === null) {
			delete _.modules[moduleDefinition.name];
			return undefined;
		}

		// guard against module duplication
		if (_.modules[moduleDefinition.name] && _.modules[moduleDefinition.name].module) {
			throw ("Duplicate module definition. Module name: " + moduleDefinition.name);
		}

		_.modules[moduleDefinition.name] = new Module(moduleDefinition);
		return _.modules[moduleDefinition.name];
	};
	
	// add static methods
	$.extend(define, {
		version: "1.0",
		
		noConflict: function () {
			window.define = _define;
			return define;
		},
		
		config: function (options) {
			/// <summary>
			/// Options:
			///     baseUrl - path of a base url to prepend to relative paths.
			///     alias - hash of aliases.
			///     load - a function to use for loading resources. jch* - alias to load.resolver
			/// </summary>	
			$.extend(_.config, options);
		}
	});


	_ = {
		modules: {},
		
		pathTestPattern: /(\.js|\.css|\.htm|\.html)$/i,
		
		config: {
			baseUrl: "",
			alias: {},
			load:  function (resources, resolve, reject) {
				throw ("load must be set in the config options. Resources to load: " + resources);
			}
		},
		
		load: function (resources) {
			/// <summary>Parses the resource paths and calls to the load resolver.</summary>
			var dfd, parsedPaths = [];
			
			resources = $.isArray(resources) ? resources : [resources];
			
			$.each(resources, function (i, path) {
				parsedPaths.push(_.parseLoadAlias(path));
			});		

			dfd = new $.Deferred();
			_.config.load(parsedPaths, function () {
				dfd.resolve.apply(this, arguments);
			}, function () {
				dfd.reject.apply(this, arguments);
			});

			return dfd;
		},
		
		parseLoadAlias: function (path) {
			/// <summary>Replaces aliases and adds the baseUrl.</summary>
			var parts, alias;
			
			if (_.isAbsolutePath(path)) {
				return path;
			}

			parts = path.split("/");
			alias = _.config.alias[parts[0]];
			if (alias) {
				parts[0] = alias;
				path = parts.join("/").replace("//", "/");
				return _.parseLoadAlias(path);
			}
			
			return _.config.baseUrl + path;
		},
		
		isAbsolutePath: function (path) {
			/// <summary>Returns true if the path begins with /, http, or https.</summary>
			if (path.indexOf("/") === 0 || path.indexOf("http") === 0) {
				return true;
			}
		},

		isModuleName: function (name) {
			/// <summary>Returns true if a valid module name. If false, it is a path to load.</summary>
			return !_.pathTestPattern.test(name);
		}
	};



 	Module = function (module) {
 		
 		$.extend(this, module);
 		
		if (!this.name) { // load anonymous modules during creation
			this.load();
		}
  	};

 	Module.prototype = {
 		name: null,			// the module name
 		require: [],		// the array of dependencies (module names or load paths).
 		module: null,		// the module object or function to be called to retrieve the module instance
 		instance: false,	// the module instance (result of the module property) - false means we need to load the require dependencies.
 		
		load: function () {
 			var loadDfd,			// the deferred that this method returns - the then/done callback passes this module as an argument.
 			    requiredInstances,	// a hash of modules used to pass back to the module that is being created
 			    toLoad,				// scripts to load async
 			    dfds,				// an array of deferreds used to load the dependencies
				self;

			self = this;
 			loadDfd = new $.Deferred();

			// check if we are already loaded
			if (this.instance !== false) {
				loadDfd.resolve(self);
				return loadDfd;
			}
 			

			toLoad = [];
			dfds = [];
			requiredInstances = { };
			this.require = $.isArray(this.require) ? this.require : [this.require];
			

			// load all dependencies
			$.each(this.require, function (index, dependency) {
				var module, dfd;

				dependency = dependency.toLowerCase();

				// if not a script file, load the module
				if (_.isModuleName(dependency)) {
					
					module = _.modules[dependency];
					if (!module) {
						throw ("A required module is not registered - module name: " + dependency);
					}

					dfd = new $.Deferred();
					module.load().then(function (loadedModule) {
						requiredInstances[loadedModule.name] = loadedModule.instance;
						dfd.resolve();
					});
					dfds.push(dfd); 
			
				} else {
					
					toLoad.push(dependency);
				}
			});

			// load any scripts to load then call the callback with the loaded modules
			toLoad.length > 0 && dfds.push(_.load(toLoad));

			$.when.apply($, dfds).then(function () {
				var asyncModule, orderedModules;
					
				orderedModules = [];
				
				$.each(self.require, function (index, dependency) {
					dependency = dependency.toLowerCase();
					requiredInstances[dependency] && orderedModules.push(requiredInstances[dependency]);
				});

				self.instance = $.isFunction(self.module) ?
					self.module.apply(self.module, orderedModules) :
					self.module;
				
				if (self.module === null && toLoad.length > 0) {
					asyncModule = _.modules[self.name];
					asyncModule.load().then(function () {
						loadDfd.resolve(asyncModule);
					});
				} else {
					loadDfd.resolve(self);
				}
			
			}).fail(function (msg) {
				throw msg || "Definition failed.";
			});
			

 			return loadDfd;
 		}
 	};

	_define = window.define;
	window.define = define;

})(jQuery);