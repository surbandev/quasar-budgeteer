const _ = require('lodash');

function mmssToDecimal(ts) {
    ts = String(ts);
    let mins = 0;
    let secs = 0;
    let pos = ts.indexOf(':');
    if (pos > -1) {
        mins = Number(ts.substring(0, pos));
        secs = Number(ts.substring(pos + 1));
    } else {
        mins = ts;
    }
    //45 secs = 75%
    let secFraction = Number(secs / 60).toFixed(2);
    return Number(mins) + Number(secFraction);
}

function shortDate(d) {
    if (!d) {
        d = new Date();
    }
    if (_.isString(d)) {
        d = new Date(d);
    }
    return d.toLocaleDateString()
}

function prettyDateTime(d, hideDate) {
    if (!d) {
        d = new Date();
    }
    if (_.isString(d)) {
        d = new Date(d);
    }
    let date = d.toDateString();
    let hour = d.getHours();
    let min = d.getMinutes();
    let secs = d.getSeconds();

    if (hour < 10) {
        hour = "0" + hour;
    }
    if (min < 10) {
        min = "0" + min;
    }
    if (secs < 10) {
        secs = "0" + secs;
    }
    if (!hideDate) {
        return `${date}, ${hour}:${min}:${secs}`;
    } else {
        return `${hour}:${min}:${secs}`;
    }
}

function isoUTCDate(d){
    if (!d) {
        return undefined;
    }
    if (_.isString(d)) {
        d = new Date(d);
    }
    return d.toISOString().split('T')[0];
}

function isoUTC(d) {
    if (!d) {
        return undefined;
    }
    if (_.isString(d)) {
        d = new Date(d);
    }
    return d.toISOString();
}

function isoLocal(d) {
    if (!d) {
        return undefined;
    }
    if (_.isString(d)) {
        d = new Date(d);
    }
    const offsetMs = d.getTimezoneOffset() * 60 * 1000;
    const msLocal = d.getTime() - offsetMs;
    const dateLocal = new Date(msLocal);
    const iso = dateLocal.toISOString();
    return iso.slice(0, 19);
}

function isoUTCNow() {
    return new Date().toISOString();
}

function isoLocalNow() {
    return isoLocal(new Date());
}

function getElapsedTime(timestampA, timestampB) {
    if (!timestampB || !timestampA) {
        return "00:00";
    }
    timestampA = new Date(timestampA);
    timestampB = new Date(isoUTC(timestampB));

    let diffMillisecs = timestampB - timestampA;

    let elapsedMinutes = Math.floor(diffMillisecs / 1000 / 60);
    let remainder = diffMillisecs - elapsedMinutes * 1000 * 60;
    let elapsedSeconds = remainder / 1000;

    let inPast = elapsedMinutes < 0;
    elapsedMinutes = Math.abs(elapsedMinutes);

    if (elapsedMinutes < 10) {
        elapsedMinutes = "0" + elapsedMinutes;
    }
    if (elapsedSeconds < 10) {
        elapsedSeconds = "0" + elapsedSeconds;
    }
    if (inPast){
        elapsedMinutes = "-"+elapsedMinutes;
    }
    return elapsedMinutes + ":" + elapsedSeconds;
}

function isBetween(date,start,end){
    return date >= start && date <= end;
}

function getNormalizedLocalDate(dateString){
    let split = dateString.split('-');
    let year = split[0];
    let month = Number(split[1]) -1;
    let day = split[2];
    // Create date in UTC to avoid timezone issues
    return new Date(Date.UTC(year, month, day));
}


module.exports = {
    shortDate,
    prettyDateTime,
    isoUTC,
    isoUTCNow,
    isoLocalNow,
    isoLocal,
    mmssToDecimal,
    getElapsedTime,
    isoUTCDate,
    isBetween,
    getNormalizedLocalDate
}