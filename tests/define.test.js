(function () {

	QUnit.module("define.js", {
		setup: function () {
			// alert(can.$("#testPage").length);
		},

		teardown: function () {
			define("testmodule", null);
			define("testmodule2", null);			
		}
	});


	QUnit.test("Registering modules with the same name fail regardless of case.", function () {

		QUnit.expect(2);
		define("testmodule", { testProp: "testVal" });

		QUnit.raises(function () {
			define("testModule", { testProp: "testVal" });
		}, "Must throw error to pass.");

		QUnit.raises(function () {
			define("testmodule", { testProp: "testVal" });
		}, "Must throw error to pass.");
	});


	QUnit.test("Require without dependencies passes the correct module regardless of case.", function () {

		QUnit.expect(1);
		define("TestModule", { testProp: "testVal" });

		define(["testmodule"], function (tm) {

			QUnit.equal(tm.testProp, "testVal");
		});
	});


	QUnit.test("Module definition by path calls load with that path.", function () {
		var resourcePath = "/some/path.js";

		QUnit.expect(2);

		define.config({
			load: function (resources, resolve, reject) {
				QUnit.equal(resources[0], resourcePath);
				
				define("testmodule", { prop1: "val1" });
				resolve();
			}
		});

		define("testModule", [resourcePath]);
		define(["testmodule"], function () {
			QUnit.ok(true);
		});
	});
	

	QUnit.test("Module definition requiring a path and module load correctly.", function () {
		var resourcePath = "/some/path.js";

		QUnit.expect(2);

		define.config({
			load: function (resources, resolve, reject) {
				QUnit.equal(resources[0], resourcePath);
				
				define("testmodule", { prop1: "val1" });
				resolve();
			}
		});

		define("testModule", [resourcePath]);
		define("testModule2", ["testModule"], function (tm) {
			return {
				tm2Prop: tm.prop1
			};
		});
		
		define(["testmodule2"], function (tm2) {
			QUnit.equal(tm2.tm2Prop, "val1");
		});
	});


	QUnit.test("Base url is applied when loading a script.", function () {
		var expectedPath = "/baseUrl/testurl.js";

		QUnit.expect(2);

		define.config({
			baseUrl: "/baseUrl/",
			load: function (resources, resolve, reject) {
				
				QUnit.equal(resources[0], expectedPath);
				resolve();
			}
		});

		define(["testurl.js"], function () {

			QUnit.ok(true);

		});
	});
	

	QUnit.test("Base url is not applied when loading a script with an absolute path.", function () {
		var expectedPath = "/testurl.js";

		QUnit.expect(2);

		define.config({
			baseUrl: "/baseUrl/",
			load: function (resources, resolve, reject) {
				
				QUnit.equal(resources[0], expectedPath);
				resolve();
			}
		});

		define(["/testurl.js"], function () {

			QUnit.ok(true);

		});
	});
	

	QUnit.test("Alias is applied to load path with base url.", function () {
		var expectedPath = "/baseUrl/path/to/scripts/testurl.js";

		QUnit.expect(2);

		define.config({
			baseUrl: "/baseUrl/",
			alias: { scripts: "path/to/scripts/"},
			load: function (resources, resolve, reject) {
				
				QUnit.equal(resources[0], expectedPath);
				resolve();
			}
		});

		define(["scripts/testurl.js"], function () {

			QUnit.ok(true);

		});
	});


	QUnit.test("Defining modules with an object.", function () {

		define({
			"testModule": { testProp: "testVal" }			
		});

		define(["testModule"], function (tm) {
		
			QUnit.equal(tm.testProp, "testVal");
		});

	});
	

	QUnit.test("Defining modules with an object including a load path.", function () {
		
		QUnit.expect(2);

		define({
			config: {
				baseUrl: "/baseurl/",
				load: function (resources, resolve, reject) {
					QUnit.equal(resources[0], "/baseurl/testscript.js");
					define("testModule", { testProp: "testVal" });
					resolve();
				}
			},
			"testModule": ["testscript.js"]			
		});

		define(["testModule"], function (tm) {
		
			QUnit.equal(tm.testProp, "testVal");
		});

	});


	QUnit.test("Alias with absolute path does not prepend the baseUrl.", function () {
		var expectedPath = "/path/to/scripts/testurl.js";

		QUnit.expect(2);

		define.config({
			baseUrl: "/baseUrl/",
			alias: { scripts: "/path/to/scripts/"},
			load: function (resources, resolve, reject) {
				
				QUnit.equal(resources[0], expectedPath);
				resolve();
			}
		});

		define(["scripts/testurl.js"], function () {

			QUnit.ok(true);

		});
	});


	QUnit.test("Test of various paths in the documentation", function () {

		QUnit.expect(5);
		
		define.config({
			baseUrl: "/path/to/base/",
			alias: {
				app: "/path/to/app/",
				scripts: "path/to/scripts/",
				css : "path/to/css/"
			},
			load: function (resources, resolve, reject) {
				QUnit.equal(resources[0], "/path/to/app/appscript.js");
				QUnit.equal(resources[1], "/path/to/base/path/to/scripts/myscript.js");
				QUnit.equal(resources[2], "/path/to/base/path/to/css/mycss.css");
				QUnit.equal(resources[3], "/some/other/file.htm");
				QUnit.equal(resources[4], "/path/to/base/another/file.js");
			}
		});
 
		define(["app/appscript.js", "scripts/myScript.js", "css/mycss.css", "/some/other/file.htm", "another/file.js"], function () {
			// module definition 
		});  
	});
})();