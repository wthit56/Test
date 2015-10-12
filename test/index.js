var expect = require("./expect.js"), xexpect = { group: function() {} }, equal = require("./equal.js"), similar = require("./similar.js"), shape = require("./shape.js");

var inline_test = require("../index.js");

expect.results.reset();
expect.group("Callback used if supplied", function() {
	var initialResult, callbackResult;
	var src = function() { /* test */ }, expected = { src: " /* test */ " };
	
	expect.group("with callback", function() {
		similar.partial("initial result (returned by inline-test)", (initialResult = inline_test(src)(function callback(result) { callbackResult = result; })), expected);
		similar.partial("callback result (as argument to callback)", callbackResult, expected);
		equal.strict("callback result is the same object", callbackResult, initialResult);
	});
	
	expect.group("without callback", function() {
		similar.partial("initial result (returned by inline-test)", inline_test(src)(), expected);
	});
});
expect.group("result", function() {
	shape("has the right shape", inline_test(function() {})(), { src: "", stdout: "", tests: [] });

	expect.group(".src", function() {
		var findBody = /^function\s*[^\s(]*\s*\([^(]*\)\s*\{([\W\w]*)\}$/;
		function src_test(message, src) {
			similar.partial(message, inline_test(src)(), { src: src.toString().replace(findBody, "$1") });
		}
		
		src_test("Empty", function() {});
		src_test("Whitespace", function() {
			
		});
		src_test("Code Preserved", function() {
			if (true) { "code".substr(0, -1); }
		});
		src_test("Comments Preserved", function() {
			// normal comment
			/* multi
			line
			comment */
			true /// test comment
		});
	});

	expect.group(".stdout", function() {
		similar.partial("1,2,3 4", inline_test(function() {
			console.log(1); console.log("2"); console.log(3, '4');
		})(), { stdout: "1\n2\n3 '4'\n" });
		
		similar.partial("Nothing logged", inline_test(function() {})(), { stdout: "" });
	});
	
	expect.group(".tests", function() {
		function src() {
			true /// is truthy
			false /// (should fail) is falsy
			for (var i = 0; i < 2; i++) {
				!i /// 1 pass, 1 fail
			}
			if (false) {
				true /// never reached
			}
			"with semicolon"; /// truthy string
			"/// ignored test";
		}
		var expectedShape = { from: 1, to: 1, passed: 1, failed: 1 };
		var result = inline_test(src)();
		expect("result produced", result);
		function test_test(index, message, expected) {
			expect.group("result.test[" + index + "] (" + message + ")", function() {
				var test = result.tests[index];
				shape("has the right shape", test, expectedShape);
				similar.partial("has correct values", test, expected);
			});
		}
		
		test_test(0, "passed", { from: 10, to: 23, passed: 1, failed: 0 });
		test_test(1, "failed", { from:34, to: 60, passed: 0, failed: 1 });
		test_test(2, "1 passed, 1 failed", { from:103, to: 121, passed: 1, failed: 1 });
		test_test(3, "never run", { from: 155, to: 172, passed: 0, failed: 0 });
		test_test(4, "with semicolon", { from: 201, to: 218, passed: 1, failed: 0 });
		expect.group("strings ignored", function() {
			expect("double-quoted string", inline_test(function() { string = "/// ignored" })().tests.length === 0);
			expect("single-quoted string", inline_test(function() { string = '/// ignored' })().tests.length === 0);
		});
	});
});

var frac = (expect.results.passed / expect.results.total);
console.log("\n" + [
	"(" + (frac === 1 ? expect.style.pass : expect.style.fail) + (frac * 100).toPrecision(3) + "%" + expect.style.reset + ")",
	"Pass: " + expect.style.pass + expect.results.passed + expect.style.reset,
	"Fail: " + (expect.results.failed ? expect.style.fail : "") + expect.results.failed + expect.style.reset
].join(" "));