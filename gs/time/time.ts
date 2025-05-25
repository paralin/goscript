// Time represents a time instant with nanosecond precision
export class Time {
  private _date: globalThis.Date
  private _nsec: number // nanoseconds within the second
  private _monotonic?: number // high-resolution monotonic timestamp in nanoseconds

  constructor(date: globalThis.Date, nsec: number = 0, monotonic?: number) {
    this._date = new globalThis.Date(date.getTime())
    this._nsec = nsec
    this._monotonic = monotonic
  }

  // clone returns a copy of this Time instance
  public clone(): Time {
    return new Time(this._date, this._nsec, this._monotonic)
  }

  // Sub returns the duration t-u
  // If both times have monotonic readings, use them for accurate duration calculation
  public Sub(u: Time): Duration {
    // If both times have monotonic readings, use them for more accurate duration calculation
    if (this._monotonic !== undefined && u._monotonic !== undefined) {
      const diffNs = this._monotonic - u._monotonic
      return new Duration(diffNs)
    }

    // Fallback to Date-based calculation
    const diffMs = this._date.getTime() - u._date.getTime()
    const diffNs = this._nsec - u._nsec
    return new Duration(diffMs * 1000000 + diffNs) // Convert ms to ns and add ns difference
  }

  // Add adds the duration d to t, returning the sum
  // Preserves monotonic reading if present
  public Add(d: Duration): Time {
    const durationNs = d.valueOf()
    const newDate = new globalThis.Date(
      this._date.getTime() + Math.floor(durationNs / 1000000),
    )
    const newNsec = this._nsec + (durationNs % 1000000)
    const newMonotonic =
      this._monotonic !== undefined ? this._monotonic + durationNs : undefined
    return new Time(newDate, newNsec, newMonotonic)
  }

  // Equal reports whether t and u represent the same time instant
  // Uses monotonic clock if both times have it
  public Equal(u: Time): boolean {
    if (this._monotonic !== undefined && u._monotonic !== undefined) {
      return this._monotonic === u._monotonic
    }
    return this._date.getTime() === u._date.getTime() && this._nsec === u._nsec
  }

  // Before reports whether the time instant t is before u
  // Uses monotonic clock if both times have it
  public Before(u: Time): boolean {
    if (this._monotonic !== undefined && u._monotonic !== undefined) {
      return this._monotonic < u._monotonic
    }
    const thisMs = this._date.getTime()
    const uMs = u._date.getTime()
    return thisMs < uMs || (thisMs === uMs && this._nsec < u._nsec)
  }

  // After reports whether the time instant t is after u
  // Uses monotonic clock if both times have it
  public After(u: Time): boolean {
    if (this._monotonic !== undefined && u._monotonic !== undefined) {
      return this._monotonic > u._monotonic
    }
    const thisMs = this._date.getTime()
    const uMs = u._date.getTime()
    return thisMs > uMs || (thisMs === uMs && this._nsec > u._nsec)
  }

  // Round returns the result of rounding t to the nearest multiple of d
  // Strips monotonic reading as per Go specification
  public Round(d: Duration): Time {
    // Implementation would round to nearest duration
    // For now, simplified version that strips monotonic reading
    return new Time(this._date, this._nsec)
  }

  // Truncate returns the result of rounding t down to a multiple of d
  // Strips monotonic reading as per Go specification
  public Truncate(d: Duration): Time {
    // Implementation would truncate to duration
    // For now, simplified version that strips monotonic reading
    return new Time(this._date, this._nsec)
  }

  // String returns the time formatted as a string
  public String(): string {
    // Format as "YYYY-MM-DD HH:MM:SS +0000 UTC" to match Go's format
    const year = this._date.getUTCFullYear()
    const month = String(this._date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(this._date.getUTCDate()).padStart(2, '0')
    const hour = String(this._date.getUTCHours()).padStart(2, '0')
    const minute = String(this._date.getUTCMinutes()).padStart(2, '0')
    const second = String(this._date.getUTCSeconds()).padStart(2, '0')

    let result = `${year}-${month}-${day} ${hour}:${minute}:${second} +0000 UTC`

    // Include monotonic reading in debug output as per Go specification
    if (this._monotonic !== undefined) {
      result += ` m=${this._monotonic}`
    }

    return result
  }
}

// Duration represents a span of time
export class Duration {
  private _nanoseconds: number

  constructor(nanoseconds: number) {
    this._nanoseconds = nanoseconds
  }

  // Compare this duration with another
  public lt(other: Duration): boolean {
    return this._nanoseconds < other._nanoseconds
  }

  // Multiply duration by a number (for expressions like Hour * 24)
  public static multiply(duration: Duration, multiplier: number): Duration {
    return new Duration(duration._nanoseconds * multiplier)
  }

  // Add support for * operator
  public multiply(multiplier: number): Duration {
    return Duration.multiply(this, multiplier)
  }

  // valueOf returns the primitive number value, allowing direct comparison with < > etc
  public valueOf(): number {
    return this._nanoseconds
  }

  // toString for string representation
  public toString(): string {
    return this._nanoseconds.toString() + 'ns'
  }
}

// Override multiplication operator for Duration * number
export function multiplyDuration(
  duration: Duration,
  multiplier: number,
): Duration {
  return Duration.multiply(duration, multiplier)
}

// Location represents a time zone
export class Location {
  private _name: string

  constructor(name: string) {
    this._name = name
  }

  public get name(): string {
    return this._name
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

// Now returns the current local time with monotonic clock reading
export function Now(): Time {
  const date = new globalThis.Date()
  let monotonic: number | undefined

  // Use performance.now() for high-resolution monotonic timing if available
  if (typeof performance !== 'undefined' && performance.now) {
    // performance.now() returns milliseconds with sub-millisecond precision
    // Convert to nanoseconds for consistency with Go's time package
    monotonic = performance.now() * 1000000
  }

  return new Time(date, 0, monotonic)
}

// Date returns the Time corresponding to
// yyyy-mm-dd hh:mm:ss + nsec nanoseconds
// in the appropriate zone for that time in the given location
// Does not include monotonic reading as per Go specification
export function Date(
  year: number,
  month: Month,
  day: number,
  hour: number,
  min: number,
  sec: number,
  nsec: number,
  loc: Location,
): Time {
  let date: globalThis.Date
  if (loc.name === 'UTC') {
    // Use Date.UTC for proper UTC handling
    const utcTime = globalThis.Date.UTC(
      year,
      month - 1,
      day,
      hour,
      min,
      sec,
      Math.floor(nsec / 1000000),
    )
    date = new globalThis.Date(utcTime)
  } else {
    // For local time or other timezones, use regular Date constructor
    date = new globalThis.Date(
      year,
      month - 1,
      day,
      hour,
      min,
      sec,
      Math.floor(nsec / 1000000),
    )
  }
  return new Time(date, nsec % 1000000) // No monotonic reading
}

// Common locations
export const UTC = new Location('UTC')

// Common durations (matching Go's time package constants)
export const Nanosecond = new Duration(1)
export const Microsecond = new Duration(1000)
export const Millisecond = new Duration(1000000)
export const Second = new Duration(1000000000)
export const Minute = new Duration(60000000000)
export const Hour = new Duration(3600000000000)

// Since returns the time elapsed since t
// Uses monotonic clock if available for accurate measurement
export function Since(t: Time): Duration {
  return Now().Sub(t)
}

// Until returns the duration until t
// Uses monotonic clock if available for accurate measurement
export function Until(t: Time): Duration {
  return t.Sub(Now())
}

// Sleep pauses the current execution for at least the duration d
export async function Sleep(d: Duration): Promise<void> {
  const ms = d.valueOf() / 1000000 // Convert nanoseconds to milliseconds
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Export month constants
export const May = Month.May
