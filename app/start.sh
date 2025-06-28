#!/usr/bin/env bash
#
# start.sh — launch Claude, your dev server, and your local worker all at once

# 1) open Claude REPL
claude chat &

# 2) start your frontend dev server
npm run dev &

# 3) fire up your Python worker
python py/local_worker.py &

# wait for them all (so this script doesn't immediately exit)
wait
