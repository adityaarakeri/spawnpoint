'use strict';
const expect = require('unexpected'),
	dayjs = require('dayjs');

const processVoid = require('process-void');
const spawnpoint = require.resolve('..');

const timeFormat = {
	format: '{date} {type}: {line}',
	time: "HH:mm",
	date: "dddd, MMMM DD YYYY"
};

const datePattern = /\[(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day, (January ([012]\d|3[01])|February [012]\d|Ma(rch|y) ([012]\d|3[01])|April ([012]\d|30)|June ([012]\d|30)|July ([012]\d|3[01])|August ([012]\d|3[01])|(Sept|Nov)ember ([012]\d|30)|(Octo|Decem)ber ([012]\d|3[01])) \d{4}\]/;

// resources for creating tests:
// https://sinonjs.org/
// https://github.com/elliotf/mocha-sinon
// https://github.com/mochajs/mocha/issues/1582

/**
 * Checks time from test to currentTime generated by test
 * @param  {Buffer} data recieved from 'app.stdout.data'
 * @param  {String} time recieved from 'time = currentTime.format(timeFormat.time)'
 */
const reformTimeData = (data, time) => {
	time = '[' + time + ']';
	let dataTime = [...data].slice(0, 7);
	let remains = [...data].slice(7, [...data].length);

	if(Buffer.from(dataTime).toString() !== time){
		let newTime = subtractOneMinute(dataTime);
		let newTimeString = Buffer.from(newTime).toString();
		if(newTimeString !== time){
			return Buffer.from('Check reformTimeData(), result was: ' + Buffer.from(newTime.concat(remains)).toString());
		}else{
			return Buffer.from(newTime.concat(remains));
		}
	}else{
		return data;
	}
};

/**
 * Adds 1 minute to a buffered string (e.g. [13:37]) converted to Array
 * @param  {Array} time buffered string (e.g. [13:37]) converted to Array
 */
const subtractOneMinute = (time) => {
	let t = time;
	console.log('t: ' + t);
	t[5]--;
	/**
	 * The two digit numbers here are hex number references to a Buffer
	 * hexes 48-57 correspond to 0-9 (as string characters)
	 * The first if loop should be read as:
	 * if(time[seconds] < 0){
	 *   time[seconds] = 9;
	 *   time[minutes]--;
	 *   ...
	*/
	if(t[5] < 48){
		t[5] = 57;
		t[4]--;
		if(t[4] < 48){
			t[4] = 53;
			t[2]--;
			if(t[2] < 48){
				t[2] = 57;
				t[1]--;
				if(t[1] < 48){
					t[1] = 50;
					t[2] = 51;
				}
			}
		}
	}

	return t;
};


describe('spawnpoint.debug', () => {
	it('should output Test', (done) => {
		const app = new processVoid(done, spawnpoint, { 'construct': true });
		void app.stdout.once('data', (data) => {
			expect(data, 'when decoded as', 'utf-8', 'to equal', 'Test\n');
			void app.done();
		});
		app.config.debug = true;
		void app.debug("Test");
	});
});

describe('spawnpoint.log', () => {
	it('should output Test', (done) => {
		const app = new processVoid(done, spawnpoint, { 'construct': true });
		app.stdout.once('data', (data) => {
			let currentTime = dayjs();
			if(datePattern.test(data)){
				let date = currentTime.format(timeFormat.date);
				expect(data, 'when decoded as', 'utf-8', 'to equal', `[${date}]\n`);
				app.stdout.once('data', (data) => {
					let time = currentTime.format(timeFormat.time);
					data = reformTimeData(data, time);
					expect(data, 'when decoded as', 'utf-8', 'to equal', `[${time}] [LOG]: Test\n`);
					void app.done();
				});
			}else{
				let time = currentTime.format(timeFormat.time);
				data = reformTimeData(data, time);
				expect(data, 'when decoded as', 'utf-8', 'to equal', `[${time}] [LOG]: Test\n`);
				void app.done();
			}
		});
		//app.send({"set": {'key': 'config.log', 'value': timeFormat}});
		app.config.log = timeFormat;
		//app.send({'command': 'log', args: ["Test"]});
		app.log("Test");
	});
});

describe('spawnpoint.info', () => {
	it('should output Test', (done) => {
		//const app = fork('./autoload-void', [''], { 'silent': true });
		const app = new processVoid(done, spawnpoint, { 'construct': true });
		app.stdout.once('data', (data) => {
			let currentTime = dayjs();
			if(datePattern.test(data)){
				let date = currentTime.format(timeFormat.date);
				expect(data, 'when decoded as', 'utf-8', 'to equal', `[${date}]\n`);
				app.stdout.once('data', (data) => {
					let time = currentTime.format(timeFormat.time);
					data = reformTimeData(data, time);
					expect(data, 'when decoded as', 'utf-8', 'to equal', `[${time}] [INFO]: Test\n`);
					void app.done();
				});
			}else{
				let time = currentTime.format(timeFormat.time);
				data = reformTimeData(data, time);
				expect(data, 'when decoded as', 'utf-8', 'to equal', `[${time}] [INFO]: Test\n`);
				void app.done();
			}
		});
		//app.send({"set": {'key': 'config.log', 'value': timeFormat}});
		app.config.log = timeFormat;
		app.info("Test");
		//app.send({'command': 'info', args: ["Test"]});
	});
});

describe('spawnpoint.warn', () => {
	it('should output Test', (done) => {
		const app = new processVoid(done, spawnpoint, { 'construct': true });
		let currentTime = dayjs();
		app.stdout.once('data', (data) => {
			let date = currentTime.format(timeFormat.date);
			expect(data, 'when decoded as', 'utf-8', 'to equal', `[${date}]\n`);
		});
		app.stderr.once('data', (data) => {
			let time = currentTime.format(timeFormat.time);
			data = reformTimeData(data, time);
			expect(data, 'when decoded as', 'utf-8', 'to equal', `[${time}] [WARN]: Test\n`);
			void app.done();
		});
		app.config.log = timeFormat;
		app.warn("Test");
	});
});

describe('spawnpoint.error', () => {
	it('should output Test', (done) => {
		const app = new processVoid(done, spawnpoint, { 'construct': true });
		let currentTime = dayjs();
		app.stdout.once('data', (data) => {
			let date = currentTime.format(timeFormat.date);
			expect(data, 'when decoded as', 'utf-8', 'to equal', `[${date}]\n`);
		});
		app.stderr.once('data', (data) => {
			let time = currentTime.format(timeFormat.time);
			data = reformTimeData(data, time);
			expect(data, 'when decoded as', 'utf-8', 'to equal', `[${time}] [ERROR]: Test\n`);
			void app.done();
		});
		app.config.log = timeFormat;
		app.error("Test");
	});
});