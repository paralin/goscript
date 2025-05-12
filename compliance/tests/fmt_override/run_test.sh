#!/bin/bash
set -e

# Run the custom runner
node --experimental-modules custom_runner.js > actual.log

# Compare with expected output
diff expected.log actual.log
