import { makeChannel, ChannelRef, makeChannelRef } from '../builtin/channel.js'

// Time represents a time instant with nanosecond precision
export class Time {
  private _date: globalThis.Date
  private _nsec: number // nanoseconds within the second
  private _monotonic?: number // high-resolution monotonic timestamp in nanoseconds
  private _location: Location // timezone location

  constructor(_props?: {}) {
    // Default constructor creates a zero time (Unix epoch in UTC)
    this._date = new globalThis.Date(0)
    this._nsec = 0
    this._monotonic = undefined
    this._location = UTC
  }

  // create is a static factory method that creates a Time instance with specific parameters
  public static create(
    date: globalThis.Date,
    nsec: number = 0,
    monotonic?: number,
    location?: Location,
  ): Time {
    const time = new Time()
    time._date = new globalThis.Date(date.getTime())
    time._nsec = nsec
    time._monotonic = monotonic
    time._location = location || UTC
    return time
  }

  // clone returns a copy of this Time instance
  public clone(): Time {
    return Time.create(this._date, this._nsec, this._monotonic, this._location)
  }

  // Unix returns t as a Unix time, the number of seconds elapsed since January 1, 1970 UTC
  public Unix(): number {
    return Math.floor(this._date.getTime() / 1000)
  }

  // UnixMilli returns t as a Unix time, the number of milliseconds elapsed since January 1, 1970 UTC
  public UnixMilli(): number {
    return this._date.getTime()
  }

  // UnixMicro returns t as a Unix time, the number of microseconds elapsed since January 1, 1970 UTC
  public UnixMicro(): number {
    return (
      Math.floor(this._date.getTime() * 1000) + Math.floor(this._nsec / 1000)
    )
  }

  // UnixNano returns t as a Unix time, the number of nanoseconds elapsed since January 1, 1970 UTC
  public UnixNano(): number {
    return this._date.getTime() * 1000000 + this._nsec
  }

  // Weekday returns the day of the week specified by t
  public Weekday(): Weekday {
    if (this._location.offsetSeconds !== undefined) {
      const offsetMs = this._location.offsetSeconds * 1000
      const adjustedTime = new globalThis.Date(this._date.getTime() + offsetMs)
      return adjustedTime.getUTCDay() as Weekday
    }
    return this._date.getDay() as Weekday
  }

  // Day returns the day of the month specified by t
  public Day(): number {
    if (this._location.offsetSeconds !== undefined) {
      const offsetMs = this._location.offsetSeconds * 1000
      const adjustedTime = new globalThis.Date(this._date.getTime() + offsetMs)
      return adjustedTime.getUTCDate()
    }
    return this._date.getDate()
  }

  // Month returns the month of the year specified by t
  public Month(): Month {
    if (this._location.offsetSeconds !== undefined) {
      const offsetMs = this._location.offsetSeconds * 1000
      const adjustedTime = new globalThis.Date(this._date.getTime() + offsetMs)
      return (adjustedTime.getUTCMonth() + 1) as Month
    }
    return (this._date.getMonth() + 1) as Month
  }

  // Year returns the year in which t occurs
  public Year(): number {
    if (this._location.offsetSeconds !== undefined) {
      const offsetMs = this._location.offsetSeconds * 1000
      const adjustedTime = new globalThis.Date(this._date.getTime() + offsetMs)
      return adjustedTime.getUTCFullYear()
    }
    return this._date.getFullYear()
  }

  // Hour returns the hour within the day specified by t, in the range [0, 23]
  public Hour(): number {
    if (this._location.offsetSeconds !== undefined) {
      const offsetMs = this._location.offsetSeconds * 1000
      const adjustedTime = new globalThis.Date(this._date.getTime() + offsetMs)
      return adjustedTime.getUTCHours()
    }
    return this._date.getHours()
  }

  // Minute returns the minute offset within the hour specified by t, in the range [0, 59]
  public Minute(): number {
    if (this._location.offsetSeconds !== undefined) {
      const offsetMs = this._location.offsetSeconds * 1000
      const adjustedTime = new globalThis.Date(this._date.getTime() + offsetMs)
      return adjustedTime.getUTCMinutes()
    }
    return this._date.getMinutes()
  }

  // Second returns the second offset within the minute specified by t, in the range [0, 59]
  public Second(): number {
    if (this._location.offsetSeconds !== undefined) {
      const offsetMs = this._location.offsetSeconds * 1000
      const adjustedTime = new globalThis.Date(this._date.getTime() + offsetMs)
      return adjustedTime.getUTCSeconds()
    }
    return this._date.getSeconds()
  }

  // Nanosecond returns the nanosecond offset within the second specified by t, in the range [0, 999999999]
  public Nanosecond(): number {
    return this._nsec
  }

  // Location returns the time zone information associated with t
  public Location(): Location {
    return this._location
  }

  // Format returns a textual representation of the time value formatted according to the layout
  public Format(layout: string): string {
    // Implementation of Go's time formatting based on reference time:
    // "Mon Jan 2 15:04:05 MST 2006" (Unix time 1136239445)

    // Calculate the time in the timezone of this Time object
    let year: number, month0: number, dayOfMonth: number, dayOfWeek: number
    let hour24: number, minute: number, second: number

    if (this._location.offsetSeconds !== undefined) {
      // For fixed timezone locations, adjust the UTC time by the offset
      const offsetMs = this._location.offsetSeconds * 1000
      const adjustedTime = new globalThis.Date(this._date.getTime() + offsetMs)

      year = adjustedTime.getUTCFullYear()
      month0 = adjustedTime.getUTCMonth() // 0-11 for array indexing
      dayOfMonth = adjustedTime.getUTCDate() // 1-31
      dayOfWeek = adjustedTime.getUTCDay() // 0 (Sun) - 6 (Sat)
      hour24 = adjustedTime.getUTCHours() // 0-23
      minute = adjustedTime.getUTCMinutes() // 0-59
      second = adjustedTime.getUTCSeconds() // 0-59
    } else {
      // For local time, use the local timezone methods
      year = this._date.getFullYear()
      month0 = this._date.getMonth() // 0-11 for array indexing
      dayOfMonth = this._date.getDate() // 1-31
      dayOfWeek = this._date.getDay() // 0 (Sun) - 6 (Sat)
      hour24 = this._date.getHours() // 0-23
      minute = this._date.getMinutes() // 0-59
      second = this._date.getSeconds() // 0-59
    }

    const nsec = this._nsec // Nanoseconds (0-999,999,999)

    const shortMonthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const longMonthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const longDayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]

    const hour12 = hour24 % 12 || 12 // 12 for 0h and 12h
    const ampmUpper = hour24 < 12 ? 'AM' : 'PM'
    const ampmLower = ampmUpper.toLowerCase()

    // Timezone offset calculation - use the location's offset if available
    let tzOffsetSeconds = 0
    let tzName = this._location.name
    let isUTC = false

    if (this._location.offsetSeconds !== undefined) {
      // Use the fixed offset from the location
      tzOffsetSeconds = this._location.offsetSeconds
      isUTC = tzOffsetSeconds === 0 && this._location.name === 'UTC'
    } else {
      // Fall back to JavaScript's timezone offset (for local time)
      const tzOffsetMinutesJS = this._date.getTimezoneOffset()
      tzOffsetSeconds = -tzOffsetMinutesJS * 60 // Convert to seconds, negate because JS offset is opposite
      isUTC = tzOffsetSeconds === 0
    }

    let tzSign = '+'
    if (tzOffsetSeconds < 0) {
      tzSign = '-'
    }
    const absTzOffsetSeconds = Math.abs(tzOffsetSeconds)
    const tzOffsetHours = Math.floor(absTzOffsetSeconds / 3600)
    const tzOffsetMins = Math.floor((absTzOffsetSeconds % 3600) / 60)

    // Helper function to format fractional seconds
    const formatFracSeconds = (n: number, trimZeros: boolean): string => {
      if (n === 0 && trimZeros) return ''
      let str = n.toString().padStart(9, '0')
      if (trimZeros) {
        str = str.replace(/0+$/, '')
      }
      return str.length > 0 ? '.' + str : ''
    }

    let result = ''
    let i = 0

    // Process layout character by character, matching Go's nextStdChunk logic
    while (i < layout.length) {
      let matched = false

      // Check for multi-character patterns first (longest matches first)
      const remaining = layout.slice(i)

      // Fractional seconds with comma/period
      if (remaining.match(/^[.,]999999999/)) {
        result += formatFracSeconds(nsec, true).replace('.', remaining[0])
        i += 10
        matched = true
      } else if (remaining.match(/^[.,]999999/)) {
        const microseconds = Math.floor(nsec / 1000)
        let str = microseconds.toString().padStart(6, '0')
        str = str.replace(/0+$/, '') // trim trailing zeros
        result += str.length > 0 ? remaining[0] + str : ''
        i += 7
        matched = true
      } else if (remaining.match(/^[.,]999/)) {
        const milliseconds = Math.floor(nsec / 1000000)
        let str = milliseconds.toString().padStart(3, '0')
        str = str.replace(/0+$/, '') // trim trailing zeros
        result += str.length > 0 ? remaining[0] + str : ''
        i += 4
        matched = true
      } else if (remaining.match(/^[.,]000000000/)) {
        result += remaining[0] + nsec.toString().padStart(9, '0')
        i += 10
        matched = true
      } else if (remaining.match(/^[.,]000000/)) {
        result +=
          remaining[0] +
          Math.floor(nsec / 1000)
            .toString()
            .padStart(6, '0')
        i += 7
        matched = true
      } else if (remaining.match(/^[.,]000/)) {
        result +=
          remaining[0] +
          Math.floor(nsec / 1000000)
            .toString()
            .padStart(3, '0')
        i += 4
        matched = true
      }
      // Full month/day names
      else if (remaining.startsWith('January')) {
        result += longMonthNames[month0]
        i += 7
        matched = true
      } else if (remaining.startsWith('Monday')) {
        result += longDayNames[dayOfWeek]
        i += 6
        matched = true
      }
      // Year patterns
      else if (remaining.startsWith('2006')) {
        result += year.toString()
        i += 4
        matched = true
      }
      // Timezone patterns (order matters - longer patterns first)
      else if (remaining.startsWith('Z070000')) {
        if (isUTC) {
          result += 'Z'
        } else {
          result += `${tzSign}${tzOffsetHours.toString().padStart(2, '0')}${tzOffsetMins.toString().padStart(2, '0')}00`
        }
        i += 7
        matched = true
      } else if (remaining.startsWith('Z07:00:00')) {
        if (isUTC) {
          result += 'Z'
        } else {
          result += `${tzSign}${tzOffsetHours.toString().padStart(2, '0')}:${tzOffsetMins.toString().padStart(2, '0')}:00`
        }
        i += 9
        matched = true
      } else if (remaining.startsWith('Z0700')) {
        if (isUTC) {
          result += 'Z'
        } else {
          result += `${tzSign}${tzOffsetHours.toString().padStart(2, '0')}${tzOffsetMins.toString().padStart(2, '0')}`
        }
        i += 5
        matched = true
      } else if (remaining.startsWith('Z07:00')) {
        if (isUTC) {
          result += 'Z'
        } else {
          result += `${tzSign}${tzOffsetHours.toString().padStart(2, '0')}:${tzOffsetMins.toString().padStart(2, '0')}`
        }
        i += 6
        matched = true
      } else if (remaining.startsWith('Z07')) {
        if (isUTC) {
          result += 'Z'
        } else {
          result += `${tzSign}${tzOffsetHours.toString().padStart(2, '0')}`
        }
        i += 3
        matched = true
      } else if (remaining.startsWith('-070000')) {
        result += `${tzSign}${tzOffsetHours.toString().padStart(2, '0')}${tzOffsetMins.toString().padStart(2, '0')}00`
        i += 7
        matched = true
      } else if (remaining.startsWith('-07:00:00')) {
        result += `${tzSign}${tzOffsetHours.toString().padStart(2, '0')}:${tzOffsetMins.toString().padStart(2, '0')}:00`
        i += 9
        matched = true
      } else if (remaining.startsWith('-0700')) {
        result += `${tzSign}${tzOffsetHours.toString().padStart(2, '0')}${tzOffsetMins.toString().padStart(2, '0')}`
        i += 5
        matched = true
      } else if (remaining.startsWith('-07:00')) {
        result += `${tzSign}${tzOffsetHours.toString().padStart(2, '0')}:${tzOffsetMins.toString().padStart(2, '0')}`
        i += 6
        matched = true
      } else if (remaining.startsWith('-07')) {
        result += `${tzSign}${tzOffsetHours.toString().padStart(2, '0')}`
        i += 3
        matched = true
      }
      // Hour patterns
      else if (remaining.startsWith('15')) {
        result += hour24.toString().padStart(2, '0')
        i += 2
        matched = true
      }
      // Month patterns
      else if (remaining.startsWith('Jan')) {
        result += shortMonthNames[month0]
        i += 3
        matched = true
      }
      // Day patterns
      else if (remaining.startsWith('Mon')) {
        result += shortDayNames[dayOfWeek]
        i += 3
        matched = true
      } else if (remaining.startsWith('MST')) {
        // Use the actual timezone name instead of literal "MST"
        result += tzName
        i += 3
        matched = true
      }
      // AM/PM patterns
      else if (remaining.startsWith('PM')) {
        result += ampmUpper
        i += 2
        matched = true
      } else if (remaining.startsWith('pm')) {
        result += ampmLower
        i += 2
        matched = true
      }
      // Two-digit patterns
      else if (remaining.startsWith('06')) {
        result += (year % 100).toString().padStart(2, '0')
        i += 2
        matched = true
      } else if (remaining.startsWith('_2')) {
        result +=
          dayOfMonth < 10 ? ' ' + dayOfMonth.toString() : dayOfMonth.toString()
        i += 2
        matched = true
      } else if (remaining.startsWith('03')) {
        result += hour12.toString().padStart(2, '0')
        i += 2
        matched = true
      } else if (remaining.startsWith('01')) {
        result += (month0 + 1).toString().padStart(2, '0')
        i += 2
        matched = true
      } else if (remaining.startsWith('02')) {
        result += dayOfMonth.toString().padStart(2, '0')
        i += 2
        matched = true
      } else if (remaining.startsWith('04')) {
        result += minute.toString().padStart(2, '0')
        i += 2
        matched = true
      } else if (remaining.startsWith('05')) {
        result += second.toString().padStart(2, '0')
        i += 2
        matched = true
      }
      // Single digit patterns (must come after two-digit patterns)
      else if (
        layout[i] === '3' &&
        (i === 0 || !'0123456789'.includes(layout[i - 1]))
      ) {
        result += hour12.toString()
        i += 1
        matched = true
      } else if (
        layout[i] === '2' &&
        (i === 0 || !'0123456789'.includes(layout[i - 1]))
      ) {
        result += dayOfMonth.toString()
        i += 1
        matched = true
      } else if (
        layout[i] === '1' &&
        (i === 0 || !'0123456789'.includes(layout[i - 1]))
      ) {
        result += (month0 + 1).toString()
        i += 1
        matched = true
      }
      // Special Z handling for standalone Z
      else if (layout[i] === 'Z' && !remaining.startsWith('Z0')) {
        result += 'Z'
        i += 1
        matched = true
      }

      // If no pattern matched, copy the character literally
      if (!matched) {
        result += layout[i]
        i += 1
      }
    }

    return result
  }

  // Sub returns the duration t-u
  // If both times have monotonic readings, use them for accurate duration calculation
  public Sub(u: Time): Duration {
    // If both times have monotonic readings, use them for more accurate duration calculation
    if (this._monotonic !== undefined && u._monotonic !== undefined) {
      const diffNs = this._monotonic - u._monotonic
      return diffNs
    }

    // Fallback to Date-based calculation
    const diffMs = this._date.getTime() - u._date.getTime()
    const diffNs = this._nsec - u._nsec
    return diffMs * 1000000 + diffNs
  }

  // Add adds the duration d to t, returning the sum
  // Preserves monotonic reading if present
  public Add(d: Duration): Time {
    const durationNs = d
    const newDate = new globalThis.Date(
      this._date.getTime() + Math.floor(durationNs / 1000000),
    )
    const newNsec = this._nsec + (durationNs % 1000000)
    const newMonotonic =
      this._monotonic !== undefined ? this._monotonic + durationNs : undefined
    return Time.create(newDate, newNsec, newMonotonic, this._location)
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
  public Round(_d: Duration): Time {
    // Implementation would round to nearest duration
    // For now, simplified version that strips monotonic reading
    return Time.create(this._date, this._nsec, undefined, this._location)
  }

  // Truncate returns the result of rounding t down to a multiple of d
  // Strips monotonic reading as per Go specification
  public Truncate(_d: Duration): Time {
    // Implementation would truncate to duration
    // For now, simplified version that strips monotonic reading
    return Time.create(this._date, this._nsec, undefined, this._location)
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

// Duration represents a span of time (nanoseconds)
export type Duration = number

// Duration comparison function
export function Duration_lt(receiver: Duration, other: Duration): boolean {
  return receiver < other
}

// Duration multiplication function
export function Duration_multiply(
  receiver: Duration,
  multiplier: number,
): Duration {
  return receiver * multiplier
}

// Location represents a time zone
export class Location {
  private _name: string
  private _offsetSeconds?: number

  constructor(name: string, offsetSeconds?: number) {
    this._name = name
    this._offsetSeconds = offsetSeconds
  }

  public get name(): string {
    return this._name
  }

  public get offsetSeconds(): number | undefined {
    return this._offsetSeconds
  }

  // String returns a descriptive name for the time zone information
  public String(): string {
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

// Weekday represents a day of the week
export enum Weekday {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

// WeekdayString returns the string representation of a Weekday
export function WeekdayString(w: Weekday): string {
  const names = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  return names[w] || 'Unknown'
}

// Weekday_String returns the string representation of a Weekday (wrapper function naming)
export function Weekday_String(w: Weekday): string {
  return WeekdayString(w)
}

// ParseError describes a problem parsing a time string
export class ParseError extends Error {
  public layout: string
  public value: string
  public layoutElem: string
  public valueElem: string
  public message: string

  constructor(
    layout: string,
    value: string,
    layoutElem: string,
    valueElem: string,
    message: string,
  ) {
    super(message)
    this.layout = layout
    this.value = value
    this.layoutElem = layoutElem
    this.valueElem = valueElem
    this.message = message
    this.name = 'ParseError'
  }
}

// Timer represents a single event timer
export class Timer {
  private _timeout: NodeJS.Timeout | number
  private _duration: Duration
  private _callback?: () => void

  constructor(duration: Duration, callback?: () => void) {
    this._duration = duration
    this._callback = callback
    const ms = duration / 1000000 // Convert nanoseconds to milliseconds

    if (callback) {
      this._timeout = setTimeout(callback, ms)
    } else {
      this._timeout = setTimeout(() => {}, ms)
    }
  }

  // Stop prevents the Timer from firing
  public Stop(): boolean {
    if (typeof this._timeout === 'number') {
      clearTimeout(this._timeout)
    } else {
      clearTimeout(this._timeout)
    }
    return true
  }

  // Reset changes the timer to expire after duration d
  public Reset(d: Duration): boolean {
    this.Stop()
    const ms = d / 1000000
    if (this._callback) {
      this._timeout = setTimeout(this._callback, ms)
    } else {
      this._timeout = setTimeout(() => {}, ms)
    }
    return true
  }
}

// Ticker holds a channel that delivers ticks at intervals
export class Ticker {
  private _interval: NodeJS.Timeout | number
  private _duration: Duration
  private _stopped: boolean = false

  constructor(duration: Duration) {
    this._duration = duration
    const ms = duration / 1000000 // Convert nanoseconds to milliseconds
    this._interval = setInterval(() => {}, ms)
  }

  // Stop turns off a ticker
  public Stop(): void {
    this._stopped = true
    if (typeof this._interval === 'number') {
      clearInterval(this._interval)
    } else {
      clearInterval(this._interval)
    }
  }

  // Reset stops a ticker and resets its period to the specified duration
  public Reset(d: Duration): void {
    this.Stop()
    this._stopped = false
    this._duration = d
    const ms = d / 1000000
    this._interval = setInterval(() => {}, ms)
  }

  // Channel returns an async iterator that yields time values
  public async *Channel(): AsyncIterableIterator<Time> {
    const ms = this._duration / 1000000
    while (!this._stopped) {
      await new Promise((resolve) => setTimeout(resolve, ms))
      if (!this._stopped) {
        yield Now()
      }
    }
  }
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

  return Time.create(date, 0, monotonic)
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

  if (loc.offsetSeconds !== undefined) {
    // For fixed timezone locations, create the date in the local timezone and then convert to UTC
    const localTime = globalThis.Date.UTC(
      year,
      month - 1,
      day,
      hour,
      min,
      sec,
      Math.floor(nsec / 1000000),
    )
    // Subtract the offset to convert local time to UTC
    // (if offset is -7*3600 for PDT, local time - (-7*3600) = local time + 7*3600 = UTC)
    date = new globalThis.Date(localTime - loc.offsetSeconds * 1000)
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
  return Time.create(date, nsec % 1000000000, undefined, loc) // No monotonic reading
}

// Common locations
export const UTC = new Location('UTC', 0)

// FixedZone returns a Location that always uses the given zone name and offset (seconds east of UTC)
export function FixedZone(name: string, offset: number): Location {
  return new Location(name, offset)
}

// Common durations (matching Go's time package constants)
export const Nanosecond = 1
export const Microsecond = 1000
export const Millisecond = 1000000
export const Second = 1000000000
export const Minute = 60000000000
export const Hour = 3600000000000

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
  const ms = d / 1000000 // Convert nanoseconds to milliseconds
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Export month constants
export const May = Month.May

// Time layout constants (matching Go's time package)
export const DateTime = '2006-01-02 15:04:05'
export const Layout = "01/02 03:04:05PM '06 -0700"
export const RFC3339 = '2006-01-02T15:04:05Z07:00'
export const Kitchen = '3:04PM'

// Unix returns the local Time corresponding to the given Unix time,
// sec seconds and nsec nanoseconds since January 1, 1970 UTC
export function Unix(sec: number, nsec: number = 0): Time {
  const ms = sec * 1000 + Math.floor(nsec / 1000000)
  const remainingNsec = nsec % 1000000
  return Time.create(new globalThis.Date(ms), remainingNsec, undefined, UTC)
}

// UnixMilli returns the local Time corresponding to the given Unix time,
// msec milliseconds since January 1, 1970 UTC
export function UnixMilli(msec: number): Time {
  return Time.create(new globalThis.Date(msec), 0, undefined, UTC)
}

// UnixMicro returns the local Time corresponding to the given Unix time,
// usec microseconds since January 1, 1970 UTC
export function UnixMicro(usec: number): Time {
  const ms = Math.floor(usec / 1000)
  const nsec = (usec % 1000) * 1000
  return Time.create(new globalThis.Date(ms), nsec, undefined, UTC)
}

// UnixNano returns the local Time corresponding to the given Unix time,
// nsec nanoseconds since January 1, 1970 UTC
export function UnixNano(nsec: number): Time {
  const ms = Math.floor(nsec / 1000000)
  const remainingNsec = nsec % 1000000
  return Time.create(new globalThis.Date(ms), remainingNsec, undefined, UTC)
}

// ParseDuration parses a duration string
// A duration string is a possibly signed sequence of decimal numbers,
// each with optional fraction and a unit suffix
export function ParseDuration(s: string): Duration {
  const regex = /^([+-]?)(\d+(?:\.\d+)?)(ns|us|µs|ms|s|m|h)$/
  const match = s.match(regex)

  if (!match) {
    throw new Error(`time: invalid duration "${s}"`)
  }

  const [, sign, valueStr, unit] = match
  let value = parseFloat(valueStr)
  if (sign === '-') value = -value

  let nanoseconds: number
  switch (unit) {
    case 'ns':
      nanoseconds = value
      break
    case 'us':
    case 'µs':
      nanoseconds = value * 1000
      break
    case 'ms':
      nanoseconds = value * 1000000
      break
    case 's':
      nanoseconds = value * 1000000000
      break
    case 'm':
      nanoseconds = value * 60000000000
      break
    case 'h':
      nanoseconds = value * 3600000000000
      break
    default:
      throw new Error(`time: unknown unit "${unit}" in duration "${s}"`)
  }

  return nanoseconds
}

// Parse parses a formatted string and returns the time value it represents
export function Parse(layout: string, value: string): Time {
  return ParseInLocation(layout, value, UTC)
}

// ParseInLocation is like Parse but differs in two important ways
export function ParseInLocation(
  layout: string,
  value: string,
  loc: Location,
): Time {
  // This is a simplified implementation
  // A full implementation would need to parse according to the layout format

  // Handle common layouts
  if (layout === RFC3339 || layout === '2006-01-02T15:04:05Z07:00') {
    const date = new globalThis.Date(value)
    if (isNaN(date.getTime())) {
      throw new ParseError(
        layout,
        value,
        '',
        '',
        `parsing time "${value}" as "${layout}": cannot parse`,
      )
    }
    return Time.create(date, 0, undefined, loc)
  }

  if (layout === DateTime || layout === '2006-01-02 15:04:05') {
    const date = new globalThis.Date(value)
    if (isNaN(date.getTime())) {
      throw new ParseError(
        layout,
        value,
        '',
        '',
        `parsing time "${value}" as "${layout}": cannot parse`,
      )
    }
    return Time.create(date, 0, undefined, loc)
  }

  // Fallback to standard Date parsing
  const date = new globalThis.Date(value)
  if (isNaN(date.getTime())) {
    throw new ParseError(
      layout,
      value,
      '',
      '',
      `parsing time "${value}" as "${layout}": cannot parse`,
    )
  }
  return Time.create(date, 0, undefined, loc)
}

// After waits for the duration to elapse and then sends the current time on the returned channel
export function After(d: Duration): ChannelRef<Time> {
  const ms = d / 1000000 // Convert nanoseconds to milliseconds

  // Create a buffered channel with capacity 1
  const channel = makeChannel(1, new Time(), 'both')

  // Start a timer that will send the current time after the duration
  setTimeout(async () => {
    channel.send(Now()).catch(() => {})
  }, ms)

  return makeChannelRef(channel, 'receive')
}

// AfterFunc waits for the duration to elapse and then calls f
export function AfterFunc(d: Duration, f: () => void): Timer {
  return new Timer(d, f)
}

// NewTimer creates a new Timer that will fire after the given duration
export function NewTimer(d: Duration): Timer {
  return new Timer(d)
}

// NewTicker returns a new Ticker containing a channel that will send the current time
export function NewTicker(d: Duration): Ticker {
  return new Ticker(d)
}

// Tick is a convenience wrapper for NewTicker providing access to the ticking channel only
export function Tick(d: Duration): AsyncIterableIterator<Time> {
  return new Ticker(d).Channel()
}

// LoadLocation returns the Location with the given name
// This is a simplified implementation that only supports UTC and Local
export function LoadLocation(name: string): Location {
  switch (name) {
    case 'UTC':
      return UTC
    case 'Local':
      // Return a location that uses local time (no fixed offset)
      return new Location('Local')
    default:
      throw new Error(`time: unknown time zone ${name}`)
  }
}

// LoadLocationFromTZData returns a Location with the given name
// This is a simplified implementation
export function LoadLocationFromTZData(
  name: string,
  _data: Uint8Array,
): Location {
  // TODO: parse the timezone data
  return new Location(name)
}
