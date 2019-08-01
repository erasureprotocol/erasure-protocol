output=$(yarn run coverage)
echo "$output"
echo "$output" | grep fail && exit 1
