#!/bin/bash
set -e
# Ensure ec2-user owns everything so downstream hooks can write files
chown -R ec2-user:ec2-user /home/ec2-user/DFO-stats
