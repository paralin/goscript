// Time represents a time instant with nanosecond precision
export class Time {
  private _date: globalThis.Date;
  private _nsec: number; // nanoseconds within the second

  constructor(date: globalThis.Date, nsec: number = 0) {
    this._date = new globalThis.Date(date.getTime());
    this._nsec = nsec;
  }

  // clone returns a copy of this Time instance
  public clone(): Time {
    return new Time(this._date, this._nsec);
  }

  // Sub returns the duration t-u
  public Sub(u: Time): Duration {
    const diffMs = this._date.getTime() - u._date.getTime();
    const diffNs = (this._nsec - u._nsec);
    return new Duration(diffMs * 1000000 + diffNs); // Convert ms to ns and add ns difference
  }

  // String returns the time formatted as a string
  public String(): string {
    // Format as "YYYY-MM-DD HH:MM:SS +0000 UTC" to match Go's format
    const year = this._date.getUTCFullYear();
    const month = String(this._date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(this._date.getUTCDate()).padStart(2, '0');
    const hour = String(this._date.getUTCHours()).padStart(2, '0');
    const minute = String(this._date.getUTCMinutes()).padStart(2, '0');
    const second = String(this._date.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}:${second} +0000 UTC`;
  }
}

// Duration represents a span of time
export class Duration {
  private _nanoseconds: number;

  constructor(nanoseconds: number) {
    this._nanoseconds = nanoseconds;
  }

  // Compare this duration with another
  public lt(other: Duration): boolean {
    return this._nanoseconds < other._nanoseconds;
  }

  // Multiply duration by a number (for expressions like Hour * 24)
  public static multiply(duration: Duration, multiplier: number): Duration {
    return new Duration(duration._nanoseconds * multiplier);
  }

  // Add support for * operator
  public multiply(multiplier: number): Duration {
    return Duration.multiply(this, multiplier);
  }

  // valueOf returns the primitive number value, allowing direct comparison with < > etc
  public valueOf(): number {
    return this._nanoseconds;
  }

  // toString for string representation
  public toString(): string {
    return this._nanoseconds.toString() + "ns";
  }
}

// Override multiplication operator for Duration * number
export function multiplyDuration(duration: Duration, multiplier: number): Duration {
  return Duration.multiply(duration, multiplier);
}

// Location represents a time zone
export class Location {
  private _name: string;

  constructor(name: string) {
    this._name = name;
  }

  public get name(): string {
    return this._name;
  }
}

// Month represents a month of the year
export enum Month {
  January = 1,
  February = 2,
  March = 3,
  April = 4,
  May = 5,
  June = 6,
  July = 7,
  August = 8,
  September = 9,
  October = 10,
  November = 11,
  December = 12,
}

// Now returns the current local time
export function Now(): Time {
  return new Time(new globalThis.Date());
}

// Date returns the Time corresponding to
// yyyy-mm-dd hh:mm:ss + nsec nanoseconds
// in the appropriate zone for that time in the given location
export function Date(year: number, month: Month, day: number, hour: number, min: number, sec: number, nsec: number, loc: Location): Time {
  let date: globalThis.Date;
  if (loc.name === "UTC") {
    // Use Date.UTC for proper UTC handling
    const utcTime = globalThis.Date.UTC(year, month - 1, day, hour, min, sec, Math.floor(nsec / 1000000));
    date = new globalThis.Date(utcTime);
  } else {
    // For local time or other timezones, use regular Date constructor
    date = new globalThis.Date(year, month - 1, day, hour, min, sec, Math.floor(nsec / 1000000));
  }
  return new Time(date, nsec % 1000000);
}

// Common locations
export const UTC = new Location("UTC");

// Common durations
export const Hour = new Duration(3600000000000); // 1 hour in nanoseconds

// Export month constants 
export const May = Month.May; 