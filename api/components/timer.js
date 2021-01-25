const zeroPad = (num, places) => {
  if (num === undefined) num = 0;
  return String(num).padStart(places, "0");
};

class Timepoint {
  static Invalid = -1;
  static Time = 0;
  static RelStart = 1;
  static RelEnd = 2;

  constructor(props) {
    const defaults = {
      hours: 0,
      minutes: 0,
      seconds: 0,
      type: Timepoint.RelStart,
    };
    props = Object.assign(defaults, props);
    this.hours = Number(Math.min(props.hours, 24));
    this.minutes = Number(Math.min(props.minutes, 59));
    this.seconds = Number(Math.min(props.seconds, 59));
    this.type = props.type;
  }

  static parse(string) {
    if (string === "--:--:--") return new Timer({ type: Timepoint.Invalid });
    let type = string.charAt(0) === "-" ? 2 : string.charAt(0) === "+" ? 1 : 0;
    if (type !== 0) string = string.slice(1);
    let values = string.split(":");
    let timepoint;
    switch (values.length) {
      case 2:
        timepoint = new Timepoint({
          minutes: Number(values[0]),
          seconds: Number(values[1]),
          type: type,
        });
        break;
      case 3:
        timepoint = new Timepoint({
          hours: Number(values[0]),
          minutes: Number(values[1]),
          seconds: Number(values[2]),
          type: type,
        });
        break;
      default:
        console.error("Invalid Time format");
        return new Timepoint({ type: Timepoint.Invalid });
    }
    return timepoint;
  }

  static stringify(time) {
    return time.type === Timepoint.Invalid
      ? "--:--:--"
      : `${
          time.type === Timepoint.RelStart
            ? "+"
            : time.type === Timepoint.RelEnd
            ? "-"
            : ""
        }${zeroPad(time.hours, 2)}:${zeroPad(time.minutes, 2)}:${zeroPad(
          time.seconds,
          2
        )}`;
  }

  _greaterThan(other) {
    return this.hours > other.hours
      ? true
      : this.minutes > other.minutes
      ? true
      : this.seconds > other.seconds
      ? true
      : false;
  }

  _lessThan(other) {
    if (this.hours < other.hours) return true;
    if (this.hours === other.hours) {
      if (this.minutes < other.minutes) return true;
      if (this.minutes === other.minutes)
        if (this.seconds < other.seconds) return true;
    }
    return false;
  }

  _equals(other) {
    return this.hours === other.hours
      ? this.minutes === other.minutes
        ? this.seconds === other.seconds
          ? true
          : false
        : false
      : false;
  }

  _subtract(other) {
    let tis = (this.hours * 60 + this.minutes) * 60 + this.seconds;
    let otis = (other.hours * 60 + other.minutes) * 60 + other.seconds;
    let res = tis - otis;
    let seconds = res % 60;
    res = Math.abs(Math.floor(res / 60));
    let minutes = res % 60;
    let hours = Math.abs(Math.floor(res / 60));
    return new Timepoint({ hours: hours, minutes: minutes, seconds: seconds });
  }

  _add(other) {
    let tis = (this.hours * 60 + this.minutes) * 60 + this.seconds;
    let otis = (other.hours * 60 + other.minutes) * 60 + other.seconds;
    let res = tis + otis;
    let seconds = res % 60;
    res = Math.abs(Math.floor(res / 60));
    let minutes = res % 60;
    let hours = Math.abs(Math.floor(res / 60));
    return new Timepoint({ hours: hours, minutes: minutes, seconds: seconds });
  }

  static _addHelper(lhs, rhs) {
    if (lhs._equals(rhs))
      return new Timepoint({ hours: 0, minutes: 0, seconds: 0 });
    else if (lhs._lessThan(rhs)) {
      return rhs._subtract(lhs);
    } else if (lhs._greaterThan(rhs)) {
      let res = lhs._subtract(rhs);
      res.type = Timepoint.RelEnd;
      return res;
    }
  }

  lessThan(other) {
    if (this.type === Timepoint.RelEnd && other.type === Timepoint.RelEnd)
      return _greaterthan(other);
    else if (this.type === Timepoint.RelEnd && this.type === Timepoint.RelStart)
      return true;
    else if (
      this.type === Timepoint.RelStart &&
      other.type === Timepoint.RelEnd
    )
      return false;
    else return this.type === other.type ? this._lessthan(other) : false;
  }

  greaterThan(other) {
    if (this.type === Timepoint.RelEnd && other.type === Timepoint.RelEnd)
      return this._lessthan(other);
    else if (this.type === Timepoint.RelEnd && this.type === Timepoint.RelStart)
      return false;
    else if (
      this.type === Timepoint.RelStart &&
      other.type === Timepoint.RelEnd
    )
      return true;
    else return this.type === other.type ? this._greaterthan(other) : false;
  }

  equals(other) {
    if (
      (this.type === Timepoint.RelStart || this.type === Timepoint.RelEnd) &&
      this._equals(Timepoint.zeroTime) &&
      other._equals(Timepoint.zeroTime)
    )
      return true; //short-circuit -0:00:00 == 0:00:00
    return this.type === other.type ? this._equals(other) : false;
  }

  subtract(other) {
    if (this.type === Timepoint.RelEnd && other.type === Timepoint.RelEnd) {
      if (this._equals(other))
        return new Timepoint({ hours: 0, minutes: 0, seconds: 0 });
      let res = Timepoint._addHelper(this, other);
      res.type = Timepoint.RelEnd;
      return res;
    } else if (
      this.type === Timepoint.RelEnd &&
      other.type === Timepoint.RelStart
    ) {
      let res = this._add(other);
      res.type = Timepoint.RelEnd;
      return res;
    } else if (
      this.type === Timepoint.RelStart &&
      other.type === Timepoint.RelEnd
    )
      return this._add(other);
    else {
      if (this._lessThan(other)) {
        let res = other._subtract(this);
        res.type = Timepoint.RelEnd;
        return res;
      } else return this._subtract(other);
    }
  }

  add(other) {
    if (this.type === Timepoint.RelEnd && other.type === Timepoint.RelEnd) {
      let res = this._add(other);
      res.type = Timepoint.RelEnd;
      return res;
    } else if (
      this.type === Timepoint.RelEnd &&
      other.type === Timepoint.RelStart
    )
      return Timepoint._addHelper(this, other);
    else if (
      this.type === Timepoint.RelStart &&
      other.type === Timepoint.RelEnd
    )
      return Timepoint._addHelper(other, this);
    else return this._add(other);
  }

  static now() {
    let now = new Date();
    return new Timepoint({
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
      type: Timepoint.Time,
    });
  }

  static zeroTime = new Timepoint();
  static maxTime = new Timepoint({ hours: 23, minutes: 59, seconds: 59 });
  static minTime = new Timepoint({
    hours: 23,
    minutes: 59,
    seconds: 59,
    type: 2,
  });
  static idTime = new Timepoint({ seconds: 1 });
}

class Timer {
  constructor(props) {
    const defaults = {
      startpoint: new Timepoint({ type: Timepoint.Invalid }),
      endpoint: new Timepoint({ type: Timepoint.Invalid }),
      type: Timepoint.Countdown,
      overrun: false,
    };
    props = Object.assign(defaults, props);
    this.startpoint = props.startpoint;
    this.endpoint = props.endpoint;
    this.runningTimepoint = new Timepoint();
    this.type = props.type;
    this.overrun = props.overrun;
  }

  start() {
    this.interval = setInterval(() => {this.update()},1000);
    return this;
  }

  stop() {
    clearInterval(this.interval);
    return this;
  }

  create() {
    this.restart();
    this.start();
    return this;
  }
  restart() {
    Object.assign(this.runningTimepoint, this.startpoint);
    return this;
  }

  isAtTimepoint(timepoint) {
    if (this.isCountdown) {
      if (timepoint.type) return this.runningTimepoint._equals(timepoint);
      else {
        let ac = this.timepoint.subtract(this.runningTimepoint);
        return ac._equals(timepoint);
      }
    } else return this.runningTimepoint._equals(timepoint);
  }

  update() {
      switch (this.type) {
        case Timer.Countdown:
          this.runningTimepoint = this.runningTimepoint.subtract(
            Timepoint.idTime
          );
          if (this.runningTimepoint.equals(Timepoint.minTime) || this.runningTimepoint.equals(this.endpoint) && !this.overrun)
            this.stop();
          break;
        case Timer.Countdown_to_Time: //todo more work to make this work properly
          this.runningTimepoint = Timer.endpoint._subtract(Timer.now());
          if (this.runningTimepoint.equals(Timepoint.zeroTime) && !this.overrun)
            this.stop();
          break;
        case Timer.Elapsed:
          this.runningTimepoint = this.runningTimepoint.add(Timepoint.idTime);
          if (this.runningTimepoint.equals(Timepoint.maxTime) || this.runningTimepoint.equals(this.endpoint) && !this.overrun)
            this.stop();
          break;
        default:
          console.error(`Unknown Timer type: ${this.type}`);
          break;
      }
      console.log(this.stringify());
  }

  stringify() {
    return Timepoint.stringify(this.runningTimepoint);
  }

  static Countdown = "countdown";
  static Countdown_to_Time = "countdown_to_time";
  static Elapsed = "elapsed";
}

const timer_message_example = {
  message_type: "timer",
  timer: "example timer",
  command: "create",
  type: "countdown",
  overrun: false,
  startpoint: "+00:00:30",
  endpoint: "+00:00:00",
};

let timers = new Map();
const handleTimerMessage = (message) => {
  if (!timers.has(message.timer)) timers.set(message.timer, new Timer());
  let timer = timers.get(message.timer);
  switch (message.command) {
    case "create":
      timer.type = message.type;
      timer.overrun = message.overrun;
      timer.startpoint = Timepoint.parse(message.startpoint);
      timer.endpoint = Timepoint.parse(message.endpoint);
      timer.create();
      break;
    case "start":
      timer.start();
      break;
    case "stop":
      timer.stop();
    case "restart":
    default:
      timer.restart();
      break;
  }
};

module.exports = {
  Timer: Timer,
  Timepoint: Timepoint,
};
handleTimerMessage(timer_message_example);