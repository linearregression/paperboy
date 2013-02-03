var paperboy;
try {
	paperboy = require('../paperboy');
	var test = require('tape');
} catch(e) {
	paperboy = window.paperboy;
}

test('emitter', function(t) {
	t = t || window;
	
	var mixedin = {"a": 1};
	paperboy.mixin(mixedin);

	t.ok(mixedin.a === 1, 'Passing an object into paperboy.mixin(object) should return the same object augmented with the emitter methods.');
	
	t.end && t.end();
});

test('emitter.on', function(t) {
	t = t || window;
	var emitter = paperboy.emitter(), fired = false, args = [], starWorks = false;

	t.equal(typeof emitter.on, 'function', 'emitter.on should be a function.');

	emitter.on('exec', function() { fired = true; });
	emitter.on('exec', function(){ 
		args = Array.prototype.slice.apply(arguments);
	});
	emitter.on('*', function( type ) {
		starWorks = type === 'exec';
	})
	emitter.trigger('exec', 1, 2, 3);

	t.ok(fired, 'emitter.on should fire its callback(s) when the event bound is fired.');
	t.ok(args[0] === 1 && args[1] === 2 && args[2] === 3, 'Any arguments passed into trigger should be passed into the callback(s).');
	t.ok( starWorks, '* events are working.');
	
	t.end && t.end();
});

test('emitter.one', function(t) {
	t = t || window;
	var emitter = paperboy.emitter(), fired;

	t.equal(typeof emitter.one, 'function', 'emitter.one should be a function.');

	emitter.one('exec', function() { fired = true; });
	emitter.trigger('exec');
	if(fired) { fired = 2; }
	emitter.trigger('exec');

	t.ok(fired === 2, 'emitter.once should only fire once. It should delete itself after fired.');
	t.end && t.end();
});

test('emitter.off', function(t) {
	t = t || window;
	var emitter = paperboy.emitter(), fired;

	t.equal(typeof emitter.off, 'function', 'emitter.off should be a function.');
	var listener = function() { fired = true; }
	emitter.on('exec', listener);
	emitter.trigger('exec');
	emitter.off('exec', listener);
	if(fired) { fired = 2; }
	emitter.trigger('exec');

	t.ok(fired === 2, 'events should not be triggered after being removed.');
	t.end && t.end();
});

test('emitter.on.enter', function(t) {
	t = t || window;
	var emitter = paperboy.emitter(), fired = false, args = [], addedAfterExited = false, starWorks = false;

	t.equal(typeof emitter.on.enter, 'function', 'emitter.on.enter should be a function.');

	emitter.on.enter('exec', function() { fired = true; });
	emitter.on.enter('*', function( type ) {
		starWorks = type === 'exec';
	})
	emitter.trigger.enter('exec', 1, 2, 3);
	
	emitter.on.enter('exec', function(){ 
		args = Array.prototype.slice.apply(arguments);
	});

	emitter.trigger.exit('exec', 1, 2, 3);

	emitter.on.enter('exec', function(){ 
		addedAfterExited = false;
	});

	t.ok(fired, 'emitter.on should fire its callback(s) when the event bound is fired.');
	t.ok(args[0] === 1 && args[1] === 2 && args[2] === 3, 'Arguments should be preserved and used for future enter callbacks');
	t.ok( starWorks, '* events are working.');
	t.equal( addedAfterExited, false, 'enter events added after exiting do not fire.');
	
	t.end && t.end();
});

test('emitter.on.exit', function(t) {
	t = t || window;
	var emitter = paperboy.emitter(), firedInitially = false, addedWhileEnteredFired = false, args = [], starWorks = false;

	t.equal(typeof emitter.on.exit, 'function', 'emitter.on.exit should be a function.');

	
	emitter.on.exit('exec', function() { firedInitially = true; });
	
	emitter.trigger.enter('exec', 3, 4, 5);

	emitter.on.exit('exec', function() {
		addedWhileEnteredFired = true; 
	});
	emitter.on.exit('*', function( type ) {
		starWorks = type === 'exec';
	})
	
	t.equal( firedInitially, true, 'default state is exited');
	t.equal( addedWhileEnteredFired, false, 'exit does not get fired while the state is entered');

	emitter.on.exit('exec', function(){ 
		args = Array.prototype.slice.apply(arguments);
	});
	
	emitter.trigger.exit('exec', 1, 2, 3);

	t.equal( addedWhileEnteredFired, true, 'exit listeners are called on exit');
	t.ok(args[0] === 1 && args[1] === 2 && args[2] === 3, 'Arguments should be preserved and used for future exit callbacks');
	t.ok( starWorks, '* events are working.');
	
	t.end && t.end();
});

test('emitter.trigger', function(t) {
	t = t || window;
	var emitter = paperboy.emitter(), results = [];

	t.equal(typeof emitter.trigger, 'function', 'emitter.trigger should be a function.');

	emitter.on('red', function(red) {
		results.push(red);
	});
	emitter.on('blue', function(red, blue) {
		results.push(blue);
	});
	emitter.on('green', function(red, blue, green) {
		results.push(green);
	});
	emitter.on('green', function() {
		results.pop();
	})

	emitter.trigger('red', 'red', 'blue', 'green');
	emitter.trigger('blue', 'red', 'blue', 'green');
	emitter.trigger('green', 'red', 'blue', 'green');

	t.equal(results.toString(), ['red', 'blue'].toString(), "When multiple events are triggered, they should be fired in the correct order.");
	t.end && t.end();
});

test('trigger.repeat', function(t) {
	t = t || window;
	var emitterA = paperboy.emitter(), emitterB = paperboy.emitter(), emitterC = paperboy.emitter(), results = [], stateEnterWorks = false, stateExitWorks = false;

	t.equal(typeof emitterA.trigger.repeat, 'function', 'emitter.repeat should be a function.');

	emitterA.trigger.repeat(emitterB, ['one', 'two', 'three']);
	emitterA.trigger.repeat(emitterC);
	emitterA.trigger.repeatStates(emitterB);
		
	emitterA.on('one', function() {
		results.push('one');
	});
	emitterA.on('two', function() {
		results.push('two');
	});
	emitterA.on('three', function() {
		results.push('three');
	});
	emitterA.on('event', function() {
		results.push('event');
	});

	emitterA.on.enter('state', function(){
		stateEnterWorks = true;
	});
	t.equal( stateEnterWorks, false, 'enter was not called early' );
	emitterB.trigger.enter('state');
	t.equal( stateEnterWorks, true, 'enter was called on time' );

	emitterA.on.exit('state', function(){
		stateExitWorks = true;
	});
	t.equal( stateExitWorks, false, 'exit is not called early' );
	emitterB.trigger.exit('state');
	t.equal( stateExitWorks, true, 'exit is called on time' );

	emitterB.trigger('one');
	emitterB.trigger('two');
	emitterB.trigger('three');
	emitterB.trigger('event');
	emitterC.trigger('event');
	emitterC.trigger('dontrepeat');
	
	t.equal(results.toString(), ['one', 'two', 'three', 'event'].toString(), "Repeat should echo the events emitted by any emitters passed into it.");
	t.end && t.end();
});

// test('emitter.set', function() {
// 	var emitter = paperboy.emitter(), result = '';
// 
// 	equal(typeof emitter.set, 'function', 'emitter.set should be a function.');
// 	equal(typeof emitter.set.clear, 'function', 'emitter.set.clear should be a function.');
// 
// 	emitter.on('event', function() { result += 'Black'; });
// 	emitter.set('event');
// 	emitter.on('event', function() { result += 'White'; });
// 
// 	equal(result, 'BlackWhite', "When multiple events are triggered, they should be fired in the correct order.");
// 
// });
