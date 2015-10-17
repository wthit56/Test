try { var fs = require("fs"); } catch(e) {}

var parse = /("(?:[^"\r\n]*(?:\\[\W\w])?)*"|'(?:[^'\r\n]*(?:\\[\W\w])?)*')|(;?[ \t]*)\/\/\/[ \t]*[^\r\n]*/g,
	parseFunction = /^(function\s*[^\s(]*\([^)]*\)\s*\{)([\W\w]*)(\})$/,
	cleanup = /\/\/[^\r\n]*|[\r\n]/g;

var inline_test = module.exports = function(source) {
	var parsedF = source.toString().match(parseFunction);
	var body = parsedF[2];
	var id;
	while(body.indexOf("result" + (id = Math.random().toString().substr(2))) !== -1);

	var tests = "", i = 0;
	
	//fs ? fs.writeFileSync("test-source.js", body) : console.log("source: " + body);
	
	var rendered = body.replace(parse, function(match, string, pre, index) {
		if (string) { return match; }
		else {
			tests += ", { from:" + (index + (pre ? pre.length : 0)) + ", to:" + (index + match.length) + ", passed: 0, failed: 0 }";
			var result = (
				" ? result" + id + ".tests[" + i + "].passed++" +
				" : result" + id + ".tests[" + i + "].failed++" +
				";"
			);
			i++;
			return result;
		}
	});

	var pre = function(result) {
		if (typeof process !== "undefined") {
			var original = process.stdout.write;
			process.stdout.write = function(data) {
				result.out.push({ type: "stdout", data: data });
			};
			process.stdout.write.original = original;
		}
		else {
			var slice = Array.prototype.slice;
			"log,info,warn,error".split(",").forEach(function(name) {
				var o = console[name];
				console[name] = function() {
					result.out.push({ type: name, data: slice.call(arguments) });
				}; console[name].original = o;
			});
		}
	}
	var post = function(result) {
		if (typeof process !== "undefined") {
			process.stdout.write = process.stdout.write.original;
		}
		else {
			"log,info,warn,error".split(",").forEach(function(name) {
				console[name] = console[name].original;
			});
		}
		return result;
	}

	rendered = parsedF[1] + (
		"var result" + id + " = { src: " + JSON.stringify(body) + ", out: [], tests: [" + tests.substr(1) + "] };" +
		"(" + pre.toString().replace(cleanup, "") + ")(result" + id + "); " +
		rendered +
		"; var result = (" + post.toString().replace(cleanup, "") + ")(result" + id + "); return result;"
	) + parsedF[3];

	//fs ? fs.writeFileSync("rendered.js", rendered) : console.log("rendered: " + rendered);
	
	return rendered;
};
