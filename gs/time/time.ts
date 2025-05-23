// Time represents a time instant with nanosecond precision
export class Time {
  private _date: globalThis.Date;
  private _nsec: number; // nanoseconds within the second

  constructor(date: globalThis.Date, nsec: number = 0) {
    this._date = new globalThis.Date(date.getTime());
    this._nsec = nsec;
  }

  // Sub returns the duration t-u
  public Sub(u: Time): Duration {
    const diffMs = this._date.getTime() - u._date.getTime();
    const diffNs = (this._nsec - u._nsec);
    return new Duration(diffMs * 1000000 + diffNs); // Convert ms to ns and add ns difference
  }

  // String returns the time formatted as a string
  public String(): string {
    return this._date.toISOString();
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

  public valueOf(): number {
    return this._nanoseconds;
  }
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
  const date = new globalThis.Date(year, month - 1, day, hour, min, sec, Math.floor(nsec / 1000000));
  return new Time(date, nsec % 1000000);
}

// Common locations
export const UTC = new Location("UTC");

// Common durations
export const Hour = new Duration(3600000000000); // 1 hour in nanoseconds

// Export month constants 
export const May = Month.May; 