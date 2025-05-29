import * as $ from '@goscript/builtin/index.js'

import * as errors from '@goscript/errors/index.js'

export let ErrInvalid: $.GoError = errors.New('invalid argument')

export let ErrPermission: $.GoError = errors.New('permission denied')

export let ErrExist: $.GoError = errors.New('file already exists')

export let ErrNotExist: $.GoError = errors.New('file does not exist')

export let ErrClosed: $.GoError = errors.New('file already closed')
