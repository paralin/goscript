// Time represents a time instant with nanosecond precision
export class Time {
  private _date: globalThis.Date
  private _nsec: number // nanoseconds within the second
  private _monotonic?: number // high-resolution monotonic timestamp in nanoseconds
  private _location: Location // timezone location

  constructor(date: globalThis.Date, nsec: number = 0, monotonic?: number, location?: Location) {
    this._date = new globalThis.Date(date.getTime())
    this._nsec = nsec
    this._monotonic = monotonic
    this._location = location || UTC
  }

  // clone returns a copy of this Time instance
  public clone(): Time {
    return new Time(this._date, this._nsec, this._monotonic, this._location)
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

    const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const longMonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const longDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

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
      isUTC = tzOffsetSeconds === 0 && this._location.name === "UTC"
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
        result += remaining[0] + Math.floor(nsec / 1000).toString().padStart(6, '0')
        i += 7
        matched = true
      } else if (remaining.match(/^[.,]000/)) {
        result += remaining[0] + Math.floor(nsec / 1000000).toString().padStart(3, '0')
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
        result += dayOfMonth < 10 ? ' ' + dayOfMonth.toString() : dayOfMonth.toString()
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
      else if (layout[i] === '3' && (i === 0 || !'0123456789'.includes(layout[i-1]))) {
        result += hour12.toString()
        i += 1
        matched = true
      } else if (layout[i] === '2' && (i === 0 || !'0123456789'.includes(layout[i-1]))) {
        result += dayOfMonth.toString()
        i += 1
        matched = true
      } else if (layout[i] === '1' && (i === 0 || !'0123456789'.includes(layout[i-1]))) {
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
    return new Time(newDate, newNsec, newMonotonic, this._location)
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
    return new Time(this._date, this._nsec, undefined, this._location)
  }

  // Truncate returns the result of rounding t down to a multiple of d
  // Strips monotonic reading as per Go specification
  public Truncate(d: Duration): Time {
    // Implementation would truncate to duration
    // For now, simplified version that strips monotonic reading
    return new Time(this._date, this._nsec, undefined, this._location)
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
  return new Time(date, nsec % 1000000000, undefined, loc) // No monotonic reading
}

// Common locations
export const UTC = new Location('UTC', 0)

// FixedZone returns a Location that always uses the given zone name and offset (seconds east of UTC)
export function FixedZone(name: string, offset: number): Location {
  return new Location(name, offset)
}

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

// Time layout constants (matching Go's time package)
export const DateTime = "2006-01-02 15:04:05"
export const Layout = "01/02 03:04:05PM '06 -0700"
export const RFC3339 = "2006-01-02T15:04:05Z07:00"
export const Kitchen = "3:04PM"
