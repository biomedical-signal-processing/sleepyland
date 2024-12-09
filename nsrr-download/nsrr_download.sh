#!/usr/bin/expect -f

# Get the token from the environment variable
set token [lindex $argv 0]
set dataset_path [lindex $argv 1]

puts "Token: $token"
puts "Dataset Path: $dataset_path"

# Start the nsrr download command
spawn nsrr download "$dataset_path"

# Send the token to the prompt
send "$token\r"

# Disable the timeout
set timeout -1

# Allow the process to complete
expect eof