const Discord = require('discord.js')
const axios = require('axios');
const moment = require('moment');
const { Webhook, MessageBuilder } = require('discord-webhook-node');

const Hook = new Webhook("")

var client = new Discord.Client();
var prefix = "wb!"
var prevSignupNumber = 0;
const DAYS = 24 * 3600 * 1000;
const countdowns = [
	{
	    id: "mcReset",
	    name: "Molten Core",
		helper: "mcHelper",
	    timestamp: new Date("Dec 10, 2019 11:00:00 GMT-05:00").getTime(),
	    interval: 7 * DAYS
  	},
  	{
	    id: "onyReset",
	    name: "Onyxia's Lair",
		helper: "onyHelper",
	    timestamp: new Date("Dec 6, 2019 11:00:00 GMT-05:00").getTime(),
	    interval: 5 * DAYS
  	},
  	{
		id: "zgReset",
		name: "Zul'Gurub",
		helper: "zgHelper",
		timestamp: new Date("Apr 16, 2020 11:00:00 GMT-5:00").getTime(),
		interval: 3 * DAYS
	}
];

moment().format();

client.on('ready', () => {
	console.log(`Buff Worldbuffer is ready.`)
})

client.on('message', (msg) => {
	if(msg.content.substring(0, prefix.length) != prefix && !msg.mentions.users.has(client.user.id)) {return};

	msg.delete();

	axios.get('https://classicworldbuffs.com/api/?room=fairbanks:h')
	.then((res) => {
		var embed = worldbuffEmbed(res.data.data)
		msg.channel.send({embed})

		embed = resetEmbed(calculateResets())
		msg.channel.send({embed})
	})
	.catch((err) => {
		console.log(err);
	});
})

function formatSignup(buff) {
	if(buff == undefined || buff.signups == undefined || buff.signups.length == 0) {
		return("**No Signups!**") 
	}

	var signups = buff.signups;

	var time = moment(signups[0].time)
	return(`**${time.format("hh:mma")} EST**\n~${moment().to(time)}.`)
}

function worldbuffEmbed(data) {

	var localTimes = {
		nef: formatSignup(data.nef),
		ony: formatSignup(data.ony),
		wcb: formatSignup(data.wcb),
	}

	var embed = {
		title: "<:horde:700840588928352276> World Buff Signups on Fairbanks, US East.",
		url: "https://classicworldbuffs.com/Fairbanks/Horde",
		color: 15164230,
		timestamp: Date(),
		fields: [
			{
				name: "<:nef:700840393398419496> Nefarian",
				value: `${localTimes.nef}`,
				inline: true,
			},
			{
				name: "<:ony:700840430576861261> Onyxia",
				value: `${localTimes.ony}`,
				inline: true,
			}, 
			{
				name: "<:wcb:700840460939427911> Warchief's Blessing",
				value: `${localTimes.wcb}`,
				inline: true,
			}
		]

	}

	return(embed)
}

function worldbuffWebhook(data) {
	console.log(data);
	var localTimes = {
		nef: formatSignup(data.nef),
		ony: formatSignup(data.ony),
		wcb: formatSignup(data.wcb),
	}

	var msg = new MessageBuilder()
	.setTitle("World Buff Signups on Fairbanks, US East.")
	.setURL('https://classicworldbuffs.com/Fairbanks/Horde')
	.addField("Nefarian", `${localTimes.nef}`, true)
	.addField("Onyxia", `${localTimes.ony}`, true)
	.addField("Warchief's Blessing", `${localTimes.wcb}`, true)

	.setColor(15164230)
	.setTimestamp();

	Hook.send(msg);
}

function resetEmbed(data) {
	console.log(data);
	var embed = {
		title: "<:horde:700840588928352276> Raid Resets, US East.",
		url: "https://raidreset.com",
		color: 15164230,
		timestamp: Date(),
		fields: [
			{
				name: "<:rag:710672648136556595> Molten Core",
				value: `Resets ${moment().to(data[0].time)}.\n ${data[0].time.format('dddd, [at] hh:mm a')}`,
				inline: true,
			},
			{
				name: "<:ony:700840430576861261> Onyxia",
				value: `Resets ${moment().to(data[1].time)}.\n ${data[1].time.format('dddd, [at] hh:mm a')}`,
				inline: true,
			}, 
			{
				name: "<:zul:710672274222481438> Zul'Gurub",
				value: `Reset ${moment().to(data[2].time)}.\n ${data[2].time.format('dddd, [at] hh:mm a')}`,
				inline: true,
			}
		]
	}

	return(embed)
}



function resetWebhook(data) {
	console.log(data);

	var msg = new MessageBuilder()
	.setTitle("Reset Alarm!")
	.setDescription(`${data.name} is going to reset!`)
	.setURL('https://raidreset.com')
	.addField(`${data.name}`, `${data.time}`, true)
	.setColor(15164230)
	.setTimestamp();

	Hook.send(msg);
}



function signupNumber(data) {
	var acc = 0;
	var toArr = Object.entries(data);

	for(const [buff, properties] of toArr) {
		console.log(buff, properties)
		if(properties.signups) {
			var time = moment(properties.signups[0].time);
			var minsUntil = time.diff(moment(), 'minutes');

			if(minsUntil < 20) {
				console.log(`${minsUntil} until drop! Changing signup number.`)
				// this number is arbitrary! just makes the signup number different so
				// the webhook will send a new message.
				acc += 30
			}

			acc += properties.signups[0].time
		}
	}

	return(acc);
}


function calculateResets() {
	const moments = [];
	const now = new Date().getTime();
	countdowns.forEach(c => {
		while (c.timestamp < now) c.timestamp += c.interval;
		const tSecs = Math.floor((c.timestamp - now) / 1000);
		const secs = tSecs % 60;
		const tMins = (tSecs - secs) / 60;
		const mins = tMins % 60;
		const tHours = (tMins - mins) / 60;
		const hours = tHours % 24;
		const days = (tHours - hours) / 24;
		const reset = new Date(c.timestamp);
		var resetMoment = moment(reset);

		moments.push({name: c.name, time: resetMoment});
	})

	return moments;
}

setInterval(() => {
	console.log("Pinging CWB Api...")
	axios.get('https://classicworldbuffs.com/api/?room=fairbanks:h')
	.then((res) => {
		var snum  = signupNumber(res.data.data);
		console.log(`Success! Signup # is ${snum}.`)
		if(snum != prevSignupNumber) {
			console.log(`Sending to the webhook.`)
			worldbuffWebhook(res.data.data);
			prevSignupNumber = snum
		}
	})
	.catch((err) => {
		console.log(err);
	});

}, 1000 * 60 * 1)



setInterval(() => {
	console.log('Calculating the Raid Reset.');

	var moments = calculateResets();

	moments.forEach(m => {
		var minsUntil = m.time.diff(moment(), 'minutes');
		if(minsUntil == 20 || minsUntil == 1) {
			resetWebhook({name: m.name, time: `**${m.time.format("hh:mma")} EST**\n~${moment().to(m.time)}.`})
		}

		console.log(m.name, m.time)
		console.log(m);
	})

}, 1000 * 60);


client.login('');