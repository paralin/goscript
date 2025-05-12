#!/bin/bash
set -e

# Create a temporary directory for the test
TEMP_DIR=$(mktemp -d)
mkdir -p $TEMP_DIR/output/@goscript/tempmod

# Copy our custom TypeScript file to the temp directory
cp fmt_override.gs.ts $TEMP_DIR/output/@goscript/tempmod/

# Create a custom runner.ts file
cat > $TEMP_DIR/runner.ts << 'RUNNER'
import * as main from './output/@goscript/tempmod/fmt_override.gs';
main.main();
RUNNER

# Run the test
cd $TEMP_DIR
tsx runner.ts > actual.log

# Compare with expected output
cat actual.log
