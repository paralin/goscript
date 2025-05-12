#!/bin/bash
set -e

# Run the custom test file
node test_fmt_override.js > actual.log

# Compare with expected output
diff expected.log actual.log
